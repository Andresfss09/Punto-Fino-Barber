const crypto = require('crypto');
const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');
const emailQueue = require('../services/emailQueue');

// Helper para generar código de reserva legible (ej. PF-7429)
const generateBookingCode = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PF-${randomNum}`;
};

// @desc    Bloqueo atómico temporal de cupo por 8 minutos (Anti-Doble Reserva)
// @route   POST /api/appointments/hold
// @access  Public
exports.holdSlot = async (req, res) => {
  try {
    const { barberId, startTime, durationMinutes = 40, sessionId } = req.body;

    if (!barberId || !startTime) {
      return sendError(res, 400, 'Se requieren barberId y startTime.');
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + parseInt(durationMinutes, 10) * 60 * 1000);
    const now = new Date();

    // Validar que la hora no sea en el pasado
    if (start <= now) {
      return sendError(res, 400, 'No es posible apartar un horario en el pasado.');
    }

    // Ejecutar verificación atómica en transacción
    const hold = await prisma.$transaction(async (tx) => {
      // 1. Verificar si ya existe una cita confirmada en ese intervalo
      const existingApt = await tx.appointment.findFirst({
        where: {
          barberId,
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      if (existingApt) {
        throw new Error('SLOT_OCCUPIED_APPOINTMENT');
      }

      // 2. Verificar si existe otro hold activo no expirado de otra sesión
      const existingHold = await tx.slotHold.findFirst({
        where: {
          barberId,
          expiresAt: { gt: now },
          ...(sessionId ? { sessionId: { not: sessionId } } : {}),
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      if (existingHold) {
        throw new Error('SLOT_HELD_BY_ANOTHER_CLIENT');
      }

      // 3. Crear el nuevo hold con TTL de 8 minutos
      const expiresAt = new Date(now.getTime() + 8 * 60 * 1000);
      return tx.slotHold.create({
        data: {
          barberId,
          startTime: start,
          endTime: end,
          sessionId: sessionId || crypto.randomUUID(),
          expiresAt,
        },
      });
    });

    return sendSuccess(res, 201, 'Cupo reservado temporalmente por 8 minutos.', {
      holdId: hold.id,
      sessionId: hold.sessionId,
      expiresAt: hold.expiresAt,
      startTime: hold.startTime,
      endTime: hold.endTime,
    });
  } catch (error) {
    if (error.message === 'SLOT_OCCUPIED_APPOINTMENT') {
      return sendError(res, 409, 'Este horario ya fue reservado por otro cliente. Por favor elegí otra hora.');
    }
    if (error.message === 'SLOT_HELD_BY_ANOTHER_CLIENT') {
      return sendError(res, 409, 'Alguien está completando la reserva en este mismo turno. Te sugerimos el siguiente horario libre.');
    }
    console.error('Error en holdSlot:', error);
    return sendError(res, 500, 'Error al proteger el cupo.');
  }
};

// @desc    Crear cita confirmada (Checkout Público sin cuenta o Staff)
// @route   POST /api/appointments
// @access  Public (Enriquece con protectOptional)
exports.createAppointment = async (req, res) => {
  try {
    const {
      serviceIds,
      barberId,
      startTime,
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      acceptHabeasData,
      acceptMarketing,
      holdId,
    } = req.body;

    if (!barberId || !startTime || !serviceIds || !serviceIds.length) {
      return sendError(res, 400, 'Faltan campos obligatorios para agendar la cita.');
    }

    if (!clientName || !clientPhone) {
      return sendError(res, 400, 'Nombre completo y número de WhatsApp son obligatorios.');
    }

    // Validación obligatoria de Ley 1581 (Habeas Data)
    if (!acceptHabeasData) {
      return sendError(res, 400, 'Debes autorizar el tratamiento de datos personales (Ley 1581 de 2012) para agendar.');
    }

    // 1. Consultar servicios solicitados y calcular duración y total COP
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, isActive: true },
    });

    if (services.length !== serviceIds.length) {
      return sendError(res, 400, 'Uno o varios de los servicios seleccionados no están disponibles.');
    }

    const totalDurationMin = services.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalPriceCOP = services.reduce((acc, s) => acc + s.priceCOP, 0);

    const start = new Date(startTime);
    const end = new Date(start.getTime() + totalDurationMin * 60 * 1000);

    // Formatear teléfono colombiano (+57)
    let cleanPhone = clientPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `+57${cleanPhone}`;
    else if (!cleanPhone.startsWith('+')) cleanPhone = `+${cleanPhone}`;

    // 2. Transacción de alta concurrencia
    const appointment = await prisma.$transaction(async (tx) => {
      // Upsert usuario cliente por teléfono
      let clientUser = await tx.user.findUnique({
        where: { phone: cleanPhone },
      });

      if (!clientUser) {
        clientUser = await tx.user.create({
          data: {
            phone: cleanPhone,
            name: clientName,
            email: clientEmail ? clientEmail.toLowerCase().trim() : null,
            role: 'CLIENT',
            clientProfile: {
              create: {
                preferredBarberId: barberId,
              },
            },
          },
        });
      } else {
        // Actualizar nombre o email si vienen nuevos
        await tx.user.update({
          where: { id: clientUser.id },
          data: {
            name: clientName,
            ...(clientEmail ? { email: clientEmail.toLowerCase().trim() } : {}),
          },
        });
      }

      // Registrar consentimiento de Habeas Data (auditoría Ley 1581)
      await tx.habeasDataConsent.create({
        data: {
          userId: clientUser.id,
          policyVersion: 'v1.0-2026-10',
          acceptedTerms: true,
          acceptedMarketing: Boolean(acceptMarketing),
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Desconocido',
        },
      });

      // Validar si el slot sigue disponible
      const conflict = await tx.appointment.findFirst({
        where: {
          barberId,
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      if (conflict) {
        throw new Error('CONCURRENCY_SLOT_TAKEN');
      }

      // Generar código de reserva y token de autogestión firmado
      const bookingCode = generateBookingCode();
      const actionToken = crypto.randomBytes(24).toString('hex');
      const actionTokenExpiry = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 días

      // Crear la cita
      const newApt = await tx.appointment.create({
        data: {
          bookingCode,
          clientId: clientUser.id,
          barberId,
          startTime: start,
          endTime: end,
          totalDurationMin,
          totalPriceCOP,
          status: 'CONFIRMED',
          clientNotes: clientNotes || null,
          actionToken,
          actionTokenExpiry,
          items: {
            create: services.map((s) => ({
              serviceId: s.id,
              priceCOP: s.priceCOP,
              durationMinutes: s.durationMinutes,
            })),
          },
          emailLogs: {
            create: [
              {
                recipientType: 'CLIENT',
                toEmail: clientEmail || `${cleanPhone}@sms.local`,
                subject: `Tu cita en Punto Fino está confirmada — [${bookingCode}]`,
                status: 'QUEUED',
              },
            ],
          },
        },
        include: {
          barber: {
            include: { user: true },
          },
          items: {
            include: { service: true },
          },
          client: true,
        },
      });

      // Liberar o asociar el hold si venía holdId
      if (holdId) {
        await tx.slotHold.updateMany({
          where: { id: holdId },
          data: { appointmentId: newApt.id },
        });
      }

      return newApt;
    });

    // Disparar de forma asíncrona la terna de correos (Cliente, Barbero, Admin)
    const io = req.app?.get?.('io');
    if (io) emailQueue.setSocketIO(io);
    emailQueue.enqueueBookingEmails(appointment.id);

    return sendSuccess(res, 201, '¡Tu cita en Punto Fino está confirmada!', {
      bookingCode: appointment.bookingCode,
      actionToken: appointment.actionToken,
      appointment: {
        id: appointment.id,
        bookingCode: appointment.bookingCode,
        barberName: appointment.barber.user.name,
        barberNickname: appointment.barber.nickname,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        totalDurationMin: appointment.totalDurationMin,
        totalPriceCOP: appointment.totalPriceCOP,
        items: appointment.items.map((i) => ({
          name: i.service.name,
          priceCOP: i.priceCOP,
          duration: i.durationMinutes,
        })),
      },
    });
  } catch (error) {
    if (error.message === 'CONCURRENCY_SLOT_TAKEN') {
      return sendError(res, 409, 'El horario acaba de ser ocupado. Por favor seleccioná otra hora.');
    }
    console.error('Error al crear cita:', error);
    return sendError(res, 500, 'Error al procesar la reserva.');
  }
};

// @desc    Consultar cita por código de reserva (Público)
// @route   GET /api/appointments/code/:code
// @access  Public
exports.getAppointmentByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { bookingCode: code.toUpperCase() },
      include: {
        barber: {
          include: { user: { select: { name: true, phone: true } } },
        },
        client: {
          select: { name: true, phone: true, email: true },
        },
        items: {
          include: { service: true },
        },
      },
    });

    if (!appointment) {
      return sendError(res, 404, 'No encontramos ninguna cita con ese código de reserva.');
    }

    return sendSuccess(res, 200, 'Cita encontrada.', { appointment });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al consultar la cita.');
  }
};

// @desc    Reprogramar o cancelar cita mediante enlace seguro con token (Sin login)
// @route   POST /api/appointments/token/:token/:action
// @access  Public (Token HMAC firmado)
exports.manageAppointmentByToken = async (req, res) => {
  try {
    const { token, action } = req.params; // action: 'cancel' | 'reschedule'
    const { newStartTime } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { actionToken: token },
      include: { barber: true },
    });

    if (!appointment) {
      return sendError(res, 404, 'Enlace no válido o expirado.');
    }

    if (appointment.actionTokenExpiry < new Date()) {
      return sendError(res, 400, 'Este enlace de autogestión ha caducado.');
    }

    if (action === 'cancel') {
      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'CANCELLED',
          actionToken: null, // De un solo uso
        },
      });

      const io = req.app?.get?.('io');
      if (io) emailQueue.setSocketIO(io);
      emailQueue.enqueueCancellationEmails(appointment.id);

      return sendSuccess(res, 200, 'Tu cita ha sido cancelada exitosamente.', { appointment: updated });
    }

    if (action === 'reschedule') {
      if (!newStartTime) {
        return sendError(res, 400, 'Debes enviar la nueva fecha y hora (newStartTime).');
      }

      const start = new Date(newStartTime);
      const end = new Date(start.getTime() + appointment.totalDurationMin * 60 * 1000);

      // Validar colisión en la nueva hora
      const conflict = await prisma.appointment.findFirst({
        where: {
          barberId: appointment.barberId,
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          id: { not: appointment.id },
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      if (conflict) {
        return sendError(res, 409, 'El nuevo horario ya no está disponible. Elegí otra hora.');
      }

      // Renovar token de acción para futuras modificaciones
      const newActionToken = crypto.randomBytes(24).toString('hex');
      const newActionTokenExpiry = new Date(Date.now() + 30 * 24 * 3600 * 1000);

      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          startTime: start,
          endTime: end,
          actionToken: newActionToken,
          actionTokenExpiry: newActionTokenExpiry,
        },
      });

      const io = req.app?.get?.('io');
      if (io) emailQueue.setSocketIO(io);
      emailQueue.enqueueRescheduleEmails(appointment.id);

      return sendSuccess(res, 200, 'Tu cita ha sido reprogramada exitosamente.', {
        appointment: updated,
        actionToken: newActionToken,
      });
    }

    return sendError(res, 400, 'Acción no soportada.');
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al gestionar la cita.');
  }
};

// @desc    Listar citas para el staff y administración
// @route   GET /api/appointments
// @access  Private (Staff)
exports.getAppointments = async (req, res) => {
  try {
    const { barberId, date, status } = req.query;
    const where = {};

    if (barberId) where.barberId = barberId;
    if (status) where.status = status;

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000-05:00`);
      const endOfDay = new Date(`${date}T23:59:59.999-05:00`);
      where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    // Si el usuario es BARBER, solo ve sus propias citas salvo que sea ADMIN
    if (req.user.role === 'BARBER' && req.user.barberProfile) {
      where.barberId = req.user.barberProfile.id;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'asc' },
      include: {
        client: { select: { name: true, phone: true } },
        barber: { select: { nickname: true } },
        items: { include: { service: true } },
      },
    });

    return sendSuccess(res, 200, 'Citas obtenidas.', {
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al consultar las citas.');
  }
};

// @desc    Actualizar estado de la cita (En Silla, Finalizado, No-Show)
// @route   PUT /api/appointments/:id/status
// @access  Private (Staff)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    const io = req.app?.get?.('io');
    if (io) {
      io.emit('appointment:status_changed', { appointmentId: id, status });
    }

    return sendSuccess(res, 200, `Estado actualizado a ${status}.`, { appointment: updated });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al actualizar el estado de la cita.');
  }
};

// @desc    Registro rápido de cliente sin cita en la app móvil (Walk-in en 2 toques)
// @route   POST /api/appointments/walk-in
// @access  Private (Staff: ADMIN, BARBER, RECEPTIONIST)
exports.createWalkInAppointment = async (req, res) => {
  try {
    const {
      clientName,
      clientPhone,
      serviceIds,
      barberId: paramBarberId,
      barberNotes,
    } = req.body;

    if (!clientName || !serviceIds || !serviceIds.length) {
      return sendError(res, 400, 'Nombre del cliente y al menos un servicio son requeridos.');
    }

    // Si quien llama es barbero, asignar automáticamente a su silla
    let barberId = paramBarberId;
    if (req.user.role === 'BARBER') {
      if (!req.user.barberProfile) {
        return sendError(res, 403, 'Perfil de barbero no encontrado.');
      }
      barberId = req.user.barberProfile.id;
    }

    if (!barberId) {
      return sendError(res, 400, 'Debe especificar el barbero que atiende.');
    }

    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });

    if (services.length !== serviceIds.length) {
      return sendError(res, 400, 'Uno o varios servicios no fueron encontrados.');
    }

    const totalDurationMin = services.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalPriceCOP = services.reduce((acc, s) => acc + s.priceCOP, 0);

    const start = new Date();
    const end = new Date(start.getTime() + totalDurationMin * 60 * 1000);

    // Formatear teléfono o crear usuario walk-in
    let cleanPhone = clientPhone ? clientPhone.replace(/\D/g, '') : '';
    if (cleanPhone.length === 10) cleanPhone = `+57${cleanPhone}`;
    else if (!cleanPhone) cleanPhone = `+57300${Math.floor(1000000 + Math.random() * 9000000)}`;

    const bookingCode = generateBookingCode();

    const appointment = await prisma.$transaction(async (tx) => {
      let clientUser = await tx.user.findUnique({ where: { phone: cleanPhone } });
      if (!clientUser) {
        clientUser = await tx.user.create({
          data: {
            phone: cleanPhone,
            name: clientName,
            role: 'CLIENT',
            clientProfile: {
              create: {
                preferredBarberId: barberId,
                technicalNotes: barberNotes || null,
              },
            },
          },
        });
      } else if (barberNotes) {
        await tx.clientProfile.updateMany({
          where: { userId: clientUser.id },
          data: { technicalNotes: barberNotes },
        });
      }

      return tx.appointment.create({
        data: {
          bookingCode,
          clientId: clientUser.id,
          barberId,
          startTime: start,
          endTime: end,
          totalDurationMin,
          totalPriceCOP,
          status: 'IN_PROGRESS', // Entra directo a la silla
          isWalkIn: true,
          barberNotes: barberNotes || null,
          items: {
            create: services.map((s) => ({
              serviceId: s.id,
              priceCOP: s.priceCOP,
              durationMinutes: s.durationMinutes,
            })),
          },
        },
        include: {
          client: { select: { id: true, name: true, phone: true } },
          barber: { select: { id: true, nickname: true, user: { select: { name: true } } } },
          items: { include: { service: true } },
        },
      });
    });

    const io = req.app?.get?.('io');
    if (io) {
      io.emit('appointment:walk_in_created', appointment);
    }

    return sendSuccess(res, 201, 'Cliente walk-in sentado en silla con éxito.', { appointment });
  } catch (error) {
    console.error('Error en walk-in:', error);
    return sendError(res, 500, 'Error al registrar cliente sin cita.');
  }
};

// @desc    Cobro y liquidación de servicio en silla (POS Móvil)
// @route   POST /api/appointments/:id/checkout
// @access  Private (Staff: ADMIN, BARBER)
exports.checkoutAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentMethod = 'EFECTIVO',
      tipsCOP = 0,
      barberNotes,
    } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        barber: true,
        client: { include: { clientProfile: true } },
      },
    });

    if (!appointment) {
      return sendError(res, 404, 'Cita no encontrada.');
    }

    const tip = Math.max(0, parseInt(tipsCOP, 10) || 0);
    const totalCollectedCOP = appointment.totalPriceCOP + tip;

    // Calcular comisión del barbero (50% de servicios + 100% propinas)
    // NOTA: REVISAR CON CONTADOR / ABOGADO LABORAL
    const commissionRate = Number(appointment.barber.commissionRate) || 0.5;
    const commissionCOP = Math.round(appointment.totalPriceCOP * commissionRate);

    // Actualizar cita y notas técnicas del cliente en transacción
    const updated = await prisma.$transaction(async (tx) => {
      if (barberNotes && appointment.client.clientProfile) {
        await tx.clientProfile.update({
          where: { id: appointment.client.clientProfile.id },
          data: {
            technicalNotes: barberNotes,
            totalVisits: { increment: 1 },
            totalSpentCOP: { increment: appointment.totalPriceCOP },
            loyaltyStamps: { increment: 1 },
          },
        });
      }

      // Buscar sesión de caja activa hoy
      const activeSession = await tx.cashSession.findFirst({
        where: { closedAt: null },
        orderBy: { openedAt: 'desc' },
      });

      if (activeSession) {
        await tx.cashTransaction.create({
          data: {
            cashSessionId: activeSession.id,
            appointmentId: appointment.id,
            type: 'INGRESO_SERVICIO',
            paymentMethod: paymentMethod,
            amountCOP: totalCollectedCOP,
            description: `Cobro en silla - Cita [${appointment.bookingCode}] (${paymentMethod})`,
          },
        });
      }

      return tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'COMPLETED',
          barberNotes: barberNotes || appointment.barberNotes,
        },
        include: {
          client: true,
          barber: true,
          items: { include: { service: true } },
        },
      });
    });

    const io = req.app?.get?.('io');
    if (io) {
      io.emit('appointment:checkout_completed', {
        appointmentId: updated.id,
        bookingCode: updated.bookingCode,
        totalCollectedCOP,
        paymentMethod,
        commissionCOP,
      });
    }

    return sendSuccess(res, 200, 'Servicio cobrado exitosamente.', {
      appointment: updated,
      receipt: {
        bookingCode: updated.bookingCode,
        clientName: updated.client.name,
        servicesTotalCOP: updated.totalPriceCOP,
        tipsCOP: tip,
        totalCollectedCOP,
        paymentMethod,
        commissionEarnedCOP: commissionCOP,
        paidAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error en checkout:', error);
    return sendError(res, 500, 'Error al procesar el cobro en silla.');
  }
};