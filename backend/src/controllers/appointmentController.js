const crypto = require('crypto');
const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');

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

      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          startTime: start,
          endTime: end,
          actionToken: null, // De un solo uso
        },
      });

      return sendSuccess(res, 200, 'Tu cita ha sido reprogramada exitosamente.', { appointment: updated });
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

    return sendSuccess(res, 200, `Estado actualizado a ${status}.`, { appointment: updated });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al actualizar el estado de la cita.');
  }
};