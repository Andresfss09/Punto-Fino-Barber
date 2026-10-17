const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');
const emailQueue = require('../services/emailQueue');
const { sendEmail } = require('../services/emailService');
const { buildOtpVerificationEmail } = require('./../services/emailTemplates');
const {
  calculateDailySlots,
  resolveAvailableBarberInTransaction,
} = require('../services/availabilityService');

const generateBookingCode = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `PF-${randomNum}`;
};

// @desc    Enviar código de verificación de 6 dígitos de un solo uso al correo
// @route   POST /api/appointments/send-otp
// @access  Public
exports.sendBookingOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return sendError(res, 400, 'Ingresa un correo electrónico válido para enviar el código de verificación.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    // Rate limiting por correo: máximo 5 códigos en los últimos 10 minutos
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const recentCount = await prisma.emailVerificationCode.count({
      where: {
        email: normalizedEmail,
        createdAt: { gte: tenMinAgo },
      },
    });

    if (recentCount >= 5) {
      return sendError(res, 429, 'Has solicitado demasiados códigos recientemente. Espera unos minutos antes de intentar de nuevo.');
    }

    const rawCode = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(rawCode, 8);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutos

    await prisma.emailVerificationCode.create({
      data: {
        email: normalizedEmail,
        codeHash,
        expiresAt,
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    const { html, text } = buildOtpVerificationEmail({ email: normalizedEmail, code: rawCode });
    await sendEmail({
      to: normalizedEmail,
      subject: `${rawCode} es tu código de verificación en Punto Fino`,
      html,
      text,
    });

    return sendSuccess(res, 200, 'Código de 6 dígitos enviado a tu correo electrónico.', {
      email: normalizedEmail,
      expiresInMinutes: 10,
      ...(process.env.NODE_ENV !== 'production' ? { devOtpCode: rawCode } : {}),
    });
  } catch (error) {
    console.error('Error en sendBookingOtp:', error);
    return sendError(res, 500, 'No fue posible enviar el código de verificación.');
  }
};

// @desc    Verificar código OTP de 6 dígitos
// @route   POST /api/appointments/verify-otp
// @access  Public
exports.verifyBookingOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return sendError(res, 400, 'Correo y código de 6 dígitos son obligatorios.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date();

    const record = await prisma.emailVerificationCode.findFirst({
      where: {
        email: normalizedEmail,
        usedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      return sendError(res, 400, 'El código ha expirado o no existe. Solicita uno nuevo.');
    }

    if (record.attempts >= 5) {
      return sendError(res, 429, 'Demasiados intentos fallidos. Solicita un nuevo código.');
    }

    const isValid = await bcrypt.compare(String(code).trim(), record.codeHash);
    if (!isValid) {
      await prisma.emailVerificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return sendError(res, 400, 'El código ingresado es incorrecto.');
    }

    await prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { usedAt: now },
    });

    return sendSuccess(res, 200, 'Correo verificado correctamente.', {
      verified: true,
      verificationToken: record.id,
    });
  } catch (error) {
    console.error('Error en verifyBookingOtp:', error);
    return sendError(res, 500, 'Error al verificar el código.');
  }
};

// @desc    Reserva temporal de 8 minutos en base de datos
// @route   POST /api/appointments/hold
// @access  Public
exports.holdSlot = async (req, res) => {
  try {
    const { barberId = 'any', startTime, durationMinutes = 35, sessionId, serviceId } = req.body;

    if (!startTime) {
      return sendError(res, 400, 'Se requiere la fecha y hora de inicio (startTime).');
    }

    const start = new Date(startTime);
    const duration = parseInt(durationMinutes, 10) || 35;
    const end = new Date(start.getTime() + duration * 60 * 1000);
    const now = new Date();

    if (start <= now) {
      return sendError(res, 400, 'No es posible apartar un horario en el pasado.');
    }

    const hold = await prisma.$transaction(
      async (tx) => {
        if (sessionId) {
          await tx.slotHold.deleteMany({
            where: { sessionId, appointmentId: null },
          });
        }

        const targetBarber = await resolveAvailableBarberInTransaction(tx, {
          barberIdOrAny: barberId,
          startTime: start,
          endTime: end,
          sessionId,
        });

        const expiresAt = new Date(now.getTime() + 8 * 60 * 1000);
        return tx.slotHold.create({
          data: {
            barberId: targetBarber.id,
            serviceId: serviceId || null,
            startTime: start,
            endTime: end,
            sessionId: sessionId || crypto.randomUUID(),
            expiresAt,
          },
          include: {
            barber: { include: { user: { select: { name: true } } } },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    return sendSuccess(res, 201, 'Te guardamos este horario durante 8 minutos.', {
      holdId: hold.id,
      barberId: hold.barberId,
      barberName: hold.barber?.user?.name || hold.barber?.nickname,
      sessionId: hold.sessionId,
      expiresAt: hold.expiresAt,
      startTime: hold.startTime,
      endTime: hold.endTime,
    });
  } catch (error) {
    // Calcular alternativas claras en el mismo día si hay colisión
    let alternatives = [];
    try {
      if (req.body?.startTime) {
        const bogotaDateStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(req.body.startTime));
        const daily = await calculateDailySlots({
          date: bogotaDateStr,
          durationMinutes: parseInt(req.body.durationMinutes, 10) || 35,
          barberId: req.body.barberId || 'any',
        });
        alternatives = daily.slots.filter((s) => s.available).slice(0, 3);
      }
    } catch (_) {}

    if (error.message === 'CONCURRENCY_SLOT_TAKEN') {
      return res.status(409).json({
        success: false,
        message: 'Este horario acaba de ser ocupado por otro cliente. Te sugerimos estas alternativas disponibles:',
        alternatives,
      });
    }
    if (error.message === 'BARBER_ON_REST_DAY') {
      return sendError(res, 400, 'El barbero seleccionado se encuentra en su día de descanso semanal.');
    }
    if (error.message === 'OUTSIDE_BUSINESS_HOURS' || error.message === 'SHOP_CLOSED_ON_DATE') {
      return sendError(res, 400, 'El horario seleccionado está fuera del horario de atención o excede la hora de cierre.');
    }
    console.error('Error en holdSlot:', error);
    return sendError(res, 500, 'Error al guardar temporalmente el horario.');
  }
};

// @desc    Liberar reserva temporal cuando el cliente vuelve atrás en el flujo
// @route   DELETE /api/appointments/hold/:id
// @access  Public
exports.releaseHold = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.slotHold.deleteMany({
      where: { id, appointmentId: null },
    });
    return sendSuccess(res, 200, 'Horario liberado correctamente.');
  } catch (error) {
    console.error('Error en releaseHold:', error);
    return sendError(res, 500, 'Error al liberar el horario.');
  }
};

// @desc    Crear cita confirmada (Un solo servicio, cero teléfono, sin cruces)
// @route   POST /api/appointments
// @access  Public / Staff
exports.createAppointment = async (req, res) => {
  try {
    const {
      serviceId: bodyServiceId,
      serviceIds,
      barberId = 'any',
      startTime,
      clientName,
      clientEmail,
      clientPhone,
      phone,
      clientNotes,
      acceptHabeasData,
      privacyPolicyAccepted,
      acceptMarketing,
      holdId: bodyHoldId,
      holdAppointmentId,
      sessionId,
      productIds = [],
    } = req.body;

    const holdId = bodyHoldId || holdAppointmentId || null;
    const rawPhone = clientPhone || phone || null;

    // Regla 2: Un solo servicio por reserva
    if (Array.isArray(serviceIds) && serviceIds.length > 1) {
      return sendError(
        res,
        400,
        'Cada reserva admite exactamente un servicio. No es posible combinar varios servicios en una misma cita.'
      );
    }

    const singleServiceId = bodyServiceId || (Array.isArray(serviceIds) ? serviceIds[0] : null);

    if (!startTime || !singleServiceId) {
      return sendError(res, 400, 'Debes elegir un servicio y un horario para confirmar la cita.');
    }

    if (!clientName || !clientEmail) {
      return sendError(res, 400, 'El nombre completo y el correo electrónico son obligatorios.');
    }

    const hasHabeasConsent = Boolean(acceptHabeasData || privacyPolicyAccepted);
    if (!hasHabeasConsent) {
      return sendError(
        res,
        400,
        'Debes autorizar el tratamiento de datos personales (Ley 1581 de 2012) para confirmar tu cita.'
      );
    }

    const normalizedEmail = clientEmail.toLowerCase().trim();

    const service = await prisma.service.findFirst({
      where: { id: singleServiceId, isActive: true },
    });

    if (!service) {
      return sendError(res, 400, 'El servicio seleccionado no está disponible.');
    }

    // Consultar productos adicionales opcionales ("Lo que usamos contigo")
    let selectedProducts = [];
    if (Array.isArray(productIds) && productIds.length > 0) {
      selectedProducts = await prisma.product.findMany({
        where: { id: { in: productIds }, isActive: true, stock: { gt: 0 } },
      });
    }

    const productsTotalCOP = selectedProducts.reduce((sum, p) => sum + p.priceCOP, 0);
    const totalDurationMin = service.durationMinutes;
    const totalPriceCOP = service.priceCOP + productsTotalCOP;

    const start = new Date(startTime);
    const end = new Date(start.getTime() + totalDurationMin * 60 * 1000);

    const appointment = await prisma.$transaction(
      async (tx) => {
      // 1. Buscar o crear usuario cliente por correo normalizado (Cero teléfono)
      let clientUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!clientUser) {
        clientUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: clientName.trim(),
            phone: rawPhone ? String(rawPhone).trim() : null,
            role: 'CLIENT',
            clientProfile: {
              create: {},
            },
          },
        });
      } else {
        await tx.user.update({
          where: { id: clientUser.id },
          data: {
            name: clientName.trim(),
            ...(rawPhone ? { phone: String(rawPhone).trim() } : {}),
          },
        });
      }

      // 2. Verificar que el mismo cliente no tenga otra cita solapada (ni siquiera con otro barbero)
      const clientOverlap = await tx.appointment.findFirst({
        where: {
          clientId: clientUser.id,
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });

      if (clientOverlap) {
        throw new Error('CLIENT_OVERLAPPING_APPOINTMENT');
      }

      // 3. Resolver barbero disponible (específico o 'any' determinista) y verificar horario oficial + descansos
      let effectiveSessionId = sessionId || null;
      let existingHold = null;

      if (holdId) {
        existingHold = await tx.slotHold.findUnique({
          where: { id: holdId },
        });
        if (existingHold) {
          effectiveSessionId = existingHold.sessionId || effectiveSessionId;
        }
      }

      if (!existingHold && effectiveSessionId) {
        existingHold = await tx.slotHold.findFirst({
          where: {
            sessionId: effectiveSessionId,
            appointmentId: null,
            expiresAt: { gt: new Date() },
          },
        });
      }

      const assignedBarber = await resolveAvailableBarberInTransaction(tx, {
        barberIdOrAny: barberId,
        startTime: start,
        endTime: end,
        sessionId: effectiveSessionId,
        holdId: existingHold?.id || holdId || null,
        preferredBarberId: existingHold?.barberId || null,
      });

      // 4. Registrar consentimiento de Habeas Data
      await tx.habeasDataConsent.create({
        data: {
          userId: clientUser.id,
          policyVersion: 'v2.0-2026-10',
          acceptedTerms: true,
          acceptedMarketing: Boolean(acceptMarketing),
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
          userAgent: req.headers['user-agent'] || 'Web',
        },
      });

      const bookingCode = generateBookingCode();
      const actionToken = crypto.randomBytes(24).toString('hex');
      const actionTokenExpiry = new Date(Date.now() + 30 * 24 * 3600 * 1000);

      const newApt = await tx.appointment.create({
        data: {
          bookingCode,
          clientId: clientUser.id,
          barberId: assignedBarber.id,
          serviceId: service.id,
          startTime: start,
          endTime: end,
          totalDurationMin,
          totalPriceCOP,
          status: 'CONFIRMED',
          clientNotes: clientNotes || null,
          clientPhone: rawPhone ? String(rawPhone).trim() : null,
          actionToken,
          actionTokenExpiry,
          items: {
            create: [
              {
                serviceId: service.id,
                priceCOP: service.priceCOP,
                durationMinutes: service.durationMinutes,
              },
            ],
          },
          ...(selectedProducts.length > 0
            ? {
                consumedProducts: {
                  create: selectedProducts.map((p) => ({
                    productId: p.id,
                    quantity: 1,
                    unitPriceCOP: p.priceCOP,
                  })),
                },
              }
            : {}),
          emailLogs: {
            create: [
              {
                recipientType: 'CLIENT',
                toEmail: normalizedEmail,
                subject: `Tu cita en Punto Fino está confirmada — [${bookingCode}]`,
                status: 'QUEUED',
              },
            ],
          },
        },
        include: {
          barber: { include: { user: true } },
          service: true,
          items: { include: { service: true } },
          consumedProducts: { include: { product: true } },
          client: true,
        },
      });

      if (existingHold?.id || holdId) {
        await tx.slotHold.updateMany({
          where: { id: existingHold?.id || holdId },
          data: { appointmentId: newApt.id },
        });
      }

      if (effectiveSessionId) {
        await tx.slotHold.updateMany({
          where: { sessionId: effectiveSessionId, appointmentId: null },
          data: { appointmentId: newApt.id },
        });
      }

      return newApt;
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    const io = req.app?.get?.('io');
    if (io) emailQueue.setSocketIO(io);
    emailQueue.enqueueBookingEmails(appointment.id);

    return sendSuccess(res, 201, '¡Tu cita en Punto Fino está confirmada!', {
      bookingCode: appointment.bookingCode,
      actionToken: appointment.actionToken,
      appointment: {
        id: appointment.id,
        bookingCode: appointment.bookingCode,
        barberId: appointment.barberId,
        barberName: appointment.barber.user.name,
        barberNickname: appointment.barber.nickname,
        serviceId: appointment.serviceId,
        serviceName: service.name,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        totalDurationMin: appointment.totalDurationMin,
        totalPriceCOP: appointment.totalPriceCOP,
        items: [
          {
            id: service.id,
            name: service.name,
            priceCOP: service.priceCOP,
            duration: service.durationMinutes,
          },
        ],
        products: appointment.consumedProducts.map((cp) => ({
          id: cp.product.id,
          name: cp.product.name,
          priceCOP: cp.unitPriceCOP,
        })),
      },
    });
  } catch (error) {
    if (error.message === 'CLIENT_OVERLAPPING_APPOINTMENT') {
      return sendError(
        res,
        409,
        'Ya tienes otra cita activa en ese mismo horario. Elige otra hora o reprograma tu cita existente.'
      );
    }
    if (
      error.message === 'CONCURRENCY_SLOT_TAKEN' ||
      error.code === 'P2002' ||
      error.code === 'P2004' ||
      error.code === 'P2034' ||
      error.code === 'P2010' ||
      error.message?.includes('exclusion') ||
      error.message?.includes('overlapping') ||
      error.message?.includes('23P01') ||
      error.message?.includes('conflict') ||
      (error.meta && (error.meta.code === '23P01' || String(error.meta.target).includes('overlapping')))
    ) {
      return sendError(res, 409, 'Este horario acaba de ser reservado por otra persona. Elige otra franja disponible.');
    }
    if (error.message === 'BARBER_ON_REST_DAY') {
      return sendError(res, 400, 'El barbero elegido descansa en ese día de la semana.');
    }
    if (error.message === 'OUTSIDE_BUSINESS_HOURS' || error.message === 'SHOP_CLOSED_ON_DATE') {
      return sendError(res, 400, 'El horario elegido está fuera de nuestro horario de atención o supera el cierre del día.');
    }
    console.error('Error al crear cita:', error);
    return sendError(res, 500, 'Error al procesar la reserva.');
  }
};

// @desc    Consultar cita por código de reserva (Sin teléfonos)
// @route   GET /api/appointments/code/:code
// @access  Public
exports.getAppointmentByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { bookingCode: code.toUpperCase() },
      include: {
        barber: {
          include: { user: { select: { name: true, email: true } } },
        },
        client: {
          select: { name: true, email: true },
        },
        service: true,
        items: {
          include: { service: true },
        },
        consumedProducts: {
          include: { product: true },
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

// @desc    Reprogramar o cancelar cita mediante enlace seguro con token (Barbero fijo inmutable)
// @route   POST /api/appointments/token/:token/:action
// @access  Public
exports.manageAppointmentByToken = async (req, res) => {
  try {
    const { token, action } = req.params;
    const { newStartTime, newBarberId } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { actionToken: token },
      include: { barber: true },
    });

    if (!appointment) {
      return sendError(res, 404, 'Enlace no válido o ya fue utilizado.');
    }

    if (appointment.actionTokenExpiry < new Date()) {
      return sendError(res, 400, 'Este enlace de autogestión ha caducado.');
    }

    const requestedBarberId = newBarberId || req.body.barberId;
    if (requestedBarberId && requestedBarberId !== appointment.barberId) {
      return sendError(
        res,
        400,
        'Una vez confirmada la cita, no es posible cambiar de barbero. Puedes reprogramar con el mismo barbero o cancelar y reservar de nuevo.'
      );
    }

    if (action === 'cancel') {
      const updated = await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'CANCELLED',
          actionToken: null,
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

      // Validar horario oficial, descanso del barbero y cero colisiones
      await prisma.$transaction(async (tx) => {
        await resolveAvailableBarberInTransaction(tx, {
          barberIdOrAny: appointment.barberId,
          startTime: start,
          endTime: end,
        });
      });

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
    if (error.message === 'CONCURRENCY_SLOT_TAKEN' || (error.meta && error.meta.code === '23P01')) {
      return sendError(res, 409, 'El nuevo horario ya no está disponible. Elige otra hora.');
    }
    if (error.message === 'BARBER_ON_REST_DAY') {
      return sendError(res, 400, 'Tu barbero descansa en el día seleccionado.');
    }
    if (error.message === 'OUTSIDE_BUSINESS_HOURS' || error.message === 'SHOP_CLOSED_ON_DATE') {
      return sendError(res, 400, 'El nuevo horario está fuera del horario de atención del local.');
    }
    console.error(error);
    return sendError(res, 500, 'Error al gestionar la cita.');
  }
};

// @desc    Listar citas (Con aislamiento RBAC estricto para barberos)
// @route   GET /api/appointments
// @access  Private (Staff)
exports.getAppointments = async (req, res) => {
  try {
    const { barberId, date, month, status, serviceId, search } = req.query;
    const where = {};

    // Si es BARBER, prohibir ver citas de otro barbero
    if (req.user.role === 'BARBER') {
      const ownBarberId = req.user.barberProfile?.id;
      if (barberId && barberId !== ownBarberId) {
        return sendError(res, 403, 'Acceso denegado: no puedes consultar las citas de otro barbero.');
      }
      where.barberId = ownBarberId;
    } else if (barberId) {
      where.barberId = barberId;
    }

    if (status) {
      const STATUS_MAP_TO_PRISMA = {
        confirmada: 'CONFIRMED',
        en_progreso: 'IN_PROGRESS',
        completada: 'COMPLETED',
        cancelada: 'CANCELLED',
        no_asistio: 'NO_SHOW',
      };
      where.status = STATUS_MAP_TO_PRISMA[status.toLowerCase()] || status.toUpperCase();
    }
    if (serviceId) where.serviceId = serviceId;

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000-05:00`);
      const endOfDay = new Date(`${date}T23:59:59.999-05:00`);
      where.startTime = { gte: startOfDay, lte: endOfDay };
    } else if (month) {
      let year = new Date().getFullYear();
      let monthNum = parseInt(month, 10);
      if (typeof month === 'string' && month.includes('-')) {
        const parts = month.split('-');
        year = parseInt(parts[0], 10);
        monthNum = parseInt(parts[1], 10);
      }
      if (!isNaN(year) && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        const mStr = String(monthNum).padStart(2, '0');
        const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
        const startOfMonth = new Date(`${year}-${mStr}-01T00:00:00.000-05:00`);
        const endOfMonth = new Date(`${year}-${mStr}-${String(lastDayOfMonth).padStart(2, '0')}T23:59:59.999-05:00`);
        where.startTime = { gte: startOfMonth, lte: endOfMonth };
      }
    }

    if (search) {
      where.OR = [
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { client: { email: { contains: search, mode: 'insensitive' } } },
        { bookingCode: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        barber: { select: { id: true, nickname: true, user: { select: { name: true, email: true } } } },
        service: true,
        items: { include: { service: true } },
        consumedProducts: { include: { product: true } },
      },
    });

    const STATUS_MAP_FROM_PRISMA = {
      CONFIRMED: 'confirmada',
      IN_PROGRESS: 'en_progreso',
      COMPLETED: 'completada',
      CANCELLED: 'cancelada',
      NO_SHOW: 'no_asistio',
    };

    const formattedAppointments = appointments.map((a) => {
      const srvName = a.service?.name || a.items?.[0]?.service?.name || 'Servicio Punto Fino';
      const phone = a.clientPhone || a.client?.phone || '';
      return {
        ...a,
        bookingCode: a.bookingCode,
        clientName: a.client?.name || 'Cliente',
        clientEmail: a.client?.email || '',
        clientPhone: phone,
        client: a.client ? { ...a.client, phone } : { id: a.clientId, name: 'Cliente', email: '', phone },
        serviceName: srvName,
        service: a.service || (a.items?.[0]?.service ? a.items[0].service : { name: srvName }),
        totalPrice: a.totalPriceCOP,
        totalPriceCOP: a.totalPriceCOP,
        totalDuration: a.totalDurationMin,
        totalDurationMin: a.totalDurationMin,
        paymentMethod: a.paymentMethod || 'efectivo',
        status: STATUS_MAP_FROM_PRISMA[a.status] || a.status?.toLowerCase() || 'confirmada',
        rawStatus: a.status,
      };
    });

    return sendSuccess(res, 200, 'Citas obtenidas.', {
      count: formattedAppointments.length,
      appointments: formattedAppointments,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al consultar las citas.');
  }
};

// @desc    Actualizar estado de la cita (Verificando propiedad del recurso para BARBER)
// @route   PUT /api/appointments/:id/status
// @access  Private (Staff)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 404, 'Cita no encontrada.');
    }

    if (req.user.role === 'BARBER' && existing.barberId !== req.user.barberProfile?.id) {
      return sendError(res, 403, 'Acceso denegado: no puedes modificar una cita de otro barbero.');
    }

    const STATUS_MAP_TO_PRISMA = {
      pendiente: 'CONFIRMED',
      confirmada: 'CONFIRMED',
      en_progreso: 'IN_PROGRESS',
      completada: 'COMPLETED',
      cancelada: 'CANCELLED',
      no_asistio: 'NO_SHOW',
      CONFIRMED: 'CONFIRMED',
      IN_PROGRESS: 'IN_PROGRESS',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      NO_SHOW: 'NO_SHOW',
    };
    const prismaStatus = STATUS_MAP_TO_PRISMA[status] || status;

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: prismaStatus },
    });

    const io = req.app?.get?.('io');
    if (io) {
      io.emit('appointment:status_changed', { appointmentId: id, status: prismaStatus });
    }

    return sendSuccess(res, 200, `Estado actualizado a ${status}.`, { appointment: updated });
  } catch (error) {
    console.error(error);
    return sendError(res, 500, 'Error al actualizar el estado de la cita.');
  }
};

// @desc    Registro de cliente sin reserva previa (Walk-in) con método de pago y facturación inmediata
// @route   POST /api/appointments/walk-in
// @access  Private (Staff)
exports.createWalkInAppointment = async (req, res) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      serviceId: bodyServiceId,
      serviceIds,
      barberId: paramBarberId,
      barberNotes,
      notes,
      startTime: customStartTime,
      paymentMethod: rawPaymentMethod = 'EFECTIVO',
      isCompleted = true,
      status: requestedStatus,
    } = req.body;

    if (Array.isArray(serviceIds) && serviceIds.length > 1) {
      return sendError(res, 400, 'Solo se admite un servicio por cita.');
    }

    const singleServiceId = bodyServiceId || (Array.isArray(serviceIds) ? serviceIds[0] : null);
    if (!clientName || !singleServiceId) {
      return sendError(res, 400, 'Nombre del cliente y servicio son obligatorios.');
    }

    if (req.user.role === 'BARBER' && paramBarberId && paramBarberId !== req.user.barberProfile?.id) {
      return sendError(res, 403, 'Un barbero solo puede registrar citas en su propia agenda.');
    }

    let barberId = paramBarberId || req.user?.barberProfile?.id;
    if (!barberId) {
      const firstBarber = await prisma.barberProfile.findFirst({ where: { isActive: true, isArchived: false } });
      barberId = firstBarber?.id;
    }

    const service = await prisma.service.findUnique({ where: { id: singleServiceId } });
    if (!service) {
      return sendError(res, 400, 'Servicio no encontrado.');
    }

    const PAYMENT_METHOD_MAP_TO_PRISMA = {
      efectivo: 'EFECTIVO',
      EFECTIVO: 'EFECTIVO',
      transaccion: 'TRANSFERENCIA_BANCARIA',
      TRANSACCION: 'TRANSFERENCIA_BANCARIA',
      transferencia: 'TRANSFERENCIA_BANCARIA',
      TRANSFERENCIA: 'TRANSFERENCIA_BANCARIA',
      transferencia_bancaria: 'TRANSFERENCIA_BANCARIA',
      TRANSFERENCIA_BANCARIA: 'TRANSFERENCIA_BANCARIA',
      nequi: 'NEQUI',
      NEQUI: 'NEQUI',
      daviplata: 'DAVIPLATA',
      DAVIPLATA: 'DAVIPLATA',
      datafono: 'DATAFONO',
      DATAFONO: 'DATAFONO',
    };

    const finalPaymentMethod = PAYMENT_METHOD_MAP_TO_PRISMA[rawPaymentMethod] || 'EFECTIVO';
    const markAsFinished = requestedStatus ? requestedStatus === 'COMPLETED' || requestedStatus === 'completada' : Boolean(isCompleted);
    const finalStatus = markAsFinished ? 'COMPLETED' : 'IN_PROGRESS';
    const finalNotes = barberNotes || notes || null;

    const totalDurationMin = service.durationMinutes;
    const totalPriceCOP = service.priceCOP;

    const start = customStartTime ? new Date(customStartTime) : new Date();
    const end = new Date(start.getTime() + totalDurationMin * 60 * 1000);
    const emailToUse = clientEmail && clientEmail.includes('@')
      ? clientEmail.toLowerCase().trim()
      : `walkin.${Date.now()}.${Math.floor(Math.random() * 1000)}@puntofino.co`;

    const bookingCode = generateBookingCode();

    const appointment = await prisma.$transaction(async (tx) => {
      let effectiveStart = start;
      let effectiveEnd = end;

      // Resolver cualquier solapamiento con citas existentes del barbero para cumplir
      // estrictamente con la restricción de PostgreSQL: no_overlapping_barber_appointments
      let safetyCounter = 0;
      while (safetyCounter < 50) {
        safetyCounter++;
        const overlappingApt = await tx.appointment.findFirst({
          where: {
            barberId,
            status: { not: 'CANCELLED' },
            startTime: { lt: effectiveEnd },
            endTime: { gt: effectiveStart },
          },
          orderBy: { endTime: 'desc' },
        });

        if (!overlappingApt) break;

        // Si se especificó una hora fija y no se está completando de inmediato, alertar
        if (customStartTime && !markAsFinished) {
          throw new Error('CONCURRENCY_SLOT_TAKEN');
        }

        // Si es walk-in inmediato o servicio completado, ubicar el slot 1 segundo después del fin de la cita previa
        effectiveStart = new Date(overlappingApt.endTime.getTime() + 1000);
        effectiveEnd = new Date(effectiveStart.getTime() + totalDurationMin * 60 * 1000);
      }

      let clientUser = await tx.user.findUnique({
        where: { email: emailToUse },
        include: { clientProfile: true },
      });

      if (!clientUser) {
        clientUser = await tx.user.create({
          data: {
            email: emailToUse,
            name: clientName.trim(),
            role: 'CLIENT',
            clientProfile: {
              create: {
                preferredBarberId: barberId,
                technicalNotes: finalNotes || null,
                totalVisits: markAsFinished ? 1 : 0,
                totalSpentCOP: markAsFinished ? totalPriceCOP : 0,
                loyaltyStamps: markAsFinished ? 1 : 0,
              },
            },
          },
          include: { clientProfile: true },
        });
      } else if (clientUser.clientProfile) {
        await tx.clientProfile.update({
          where: { id: clientUser.clientProfile.id },
          data: {
            ...(finalNotes ? { technicalNotes: finalNotes } : {}),
            ...(markAsFinished
              ? {
                  totalVisits: { increment: 1 },
                  totalSpentCOP: { increment: totalPriceCOP },
                  loyaltyStamps: { increment: 1 },
                }
              : {}),
          },
        });
      }

      const createdAppointment = await tx.appointment.create({
        data: {
          bookingCode,
          clientId: clientUser.id,
          barberId,
          serviceId: service.id,
          startTime: effectiveStart,
          endTime: effectiveEnd,
          totalDurationMin,
          totalPriceCOP,
          status: finalStatus,
          paymentMethod: markAsFinished ? finalPaymentMethod : null,
          clientPhone: clientPhone || null,
          barberNotes: finalNotes || null,
          isWalkIn: true,
          items: {
            create: [
              {
                serviceId: service.id,
                priceCOP: service.priceCOP,
                durationMinutes: service.durationMinutes,
              },
            ],
          },
        },
        include: {
          client: { select: { id: true, name: true, email: true, phone: true } },
          barber: { select: { id: true, nickname: true, user: { select: { name: true } } } },
          service: true,
          items: { include: { service: true } },
        },
      });

      // Si el servicio ya fue cobrado y finalizado, registrar en la caja diaria activa
      if (markAsFinished) {
        const activeSession = await tx.cashSession.findFirst({
          where: { closedAt: null },
          orderBy: { openedAt: 'desc' },
        });

        if (activeSession) {
          await tx.cashTransaction.create({
            data: {
              cashSessionId: activeSession.id,
              appointmentId: createdAppointment.id,
              type: 'INGRESO_SERVICIO',
              paymentMethod: finalPaymentMethod,
              amountCOP: totalPriceCOP,
              description: `Walk-in en local [${bookingCode}] - ${service.name} (${finalPaymentMethod})`,
            },
          });
        }
      }

      return createdAppointment;
    });

    return sendSuccess(res, 201, 'Cliente presencial (walk-in) registrado exitosamente.', { appointment });
  } catch (error) {
    if (
      error.message === 'CONCURRENCY_SLOT_TAKEN' ||
      (error.meta && error.meta.code === '23P01') ||
      (error.message && (error.message.includes('23P01') || error.message.includes('no_overlapping_barber_appointments')))
    ) {
      return sendError(res, 409, 'El barbero ya tiene una cita activa en ese horario.');
    }
    console.error('Error en walk-in:', error);
    return sendError(res, 500, error.message || 'Error al registrar cliente presencial sin cita.');
  }
};

// @desc    Finalizar y liquidar servicio en silla (incluyendo productos consumidos, propina y método de pago)
// @route   POST /api/appointments/:id/checkout
// @access  Private (Staff: ADMIN, BARBER)
exports.checkoutAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      paymentMethod: rawPaymentMethod = 'EFECTIVO',
      tipsCOP = 0,
      tip: paramTip,
      barberNotes,
      products = [],
      consumedProducts: paramConsumedProducts = [],
    } = req.body;

    const PAYMENT_METHOD_MAP_TO_PRISMA = {
      efectivo: 'EFECTIVO',
      EFECTIVO: 'EFECTIVO',
      transaccion: 'TRANSFERENCIA_BANCARIA',
      TRANSACCION: 'TRANSFERENCIA_BANCARIA',
      transferencia: 'TRANSFERENCIA_BANCARIA',
      TRANSFERENCIA: 'TRANSFERENCIA_BANCARIA',
      transferencia_bancaria: 'TRANSFERENCIA_BANCARIA',
      TRANSFERENCIA_BANCARIA: 'TRANSFERENCIA_BANCARIA',
      nequi: 'NEQUI',
      NEQUI: 'NEQUI',
      daviplata: 'DAVIPLATA',
      DAVIPLATA: 'DAVIPLATA',
      datafono: 'DATAFONO',
      DATAFONO: 'DATAFONO',
      wompi: 'WOMPI_ONLINE',
      WOMPI_ONLINE: 'WOMPI_ONLINE',
    };

    const paymentMethod = PAYMENT_METHOD_MAP_TO_PRISMA[rawPaymentMethod] || 'EFECTIVO';
    const tip = Math.max(0, parseInt(paramTip !== undefined ? paramTip : tipsCOP, 10) || 0);
    const consumedProducts = Array.isArray(products) && products.length > 0
      ? products
      : (Array.isArray(paramConsumedProducts) ? paramConsumedProducts : []);

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        barber: true,
        client: { include: { clientProfile: true } },
        consumedProducts: true,
      },
    });

    if (!appointment) {
      return sendError(res, 404, 'Cita no encontrada.');
    }

    if (req.user.role === 'BARBER' && appointment.barberId !== req.user.barberProfile?.id) {
      return sendError(res, 403, 'Acceso denegado: solo puedes finalizar citas de tu propia silla.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      let extraProductsTotalCOP = 0;

      // Registrar productos adicionales consumidos al finalizar el servicio y descontar stock
      if (Array.isArray(consumedProducts) && consumedProducts.length > 0) {
        for (const item of consumedProducts) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod && prod.isActive) {
            const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
            extraProductsTotalCOP += prod.priceCOP * qty;

            await tx.appointmentProduct.create({
              data: {
                appointmentId: appointment.id,
                productId: prod.id,
                quantity: qty,
                unitPriceCOP: prod.priceCOP,
              },
            });

            await tx.product.update({
              where: { id: prod.id },
              data: { stock: Math.max(0, prod.stock - qty) },
            });

            await tx.inventoryMovement.create({
              data: {
                productId: prod.id,
                type: 'SALIDA_VENTA',
                quantity: qty,
                notes: `Consumido en cita [${appointment.bookingCode}]`,
              },
            });
          }
        }
      }

      const newTotalPriceCOP = appointment.totalPriceCOP + extraProductsTotalCOP;
      const totalCollectedCOP = newTotalPriceCOP + tip;

      if (appointment.client.clientProfile) {
        await tx.clientProfile.update({
          where: { id: appointment.client.clientProfile.id },
          data: {
            ...(barberNotes ? { technicalNotes: barberNotes } : {}),
            totalVisits: { increment: 1 },
            totalSpentCOP: { increment: newTotalPriceCOP },
            loyaltyStamps: { increment: 1 },
          },
        });
      }

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
            paymentMethod,
            amountCOP: totalCollectedCOP,
            description: `Cobro en silla - Cita [${appointment.bookingCode}] (${paymentMethod})`,
          },
        });
      }

      const nowCheckout = new Date();
      const updatedEndTime = nowCheckout > appointment.startTime ? nowCheckout : appointment.endTime;

      return tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'COMPLETED',
          endTime: updatedEndTime,
          totalPriceCOP: newTotalPriceCOP,
          tipCOP: tip,
          paymentMethod,
          barberNotes: barberNotes || appointment.barberNotes,
        },
        include: {
          client: { select: { id: true, name: true, email: true } },
          barber: true,
          service: true,
          items: { include: { service: true } },
          consumedProducts: { include: { product: true } },
        },
      });
    });

    const commissionRate = Number(appointment.barber.commissionRate) || 0.5;
    const commissionCOP = Math.round(updated.totalPriceCOP * commissionRate);
    const totalCollectedCOP = updated.totalPriceCOP + tip;

    const io = req.app?.get?.('io');
    if (io) {
      io.emit('appointment:status_changed', { appointmentId: id, status: 'COMPLETED' });
      io.emit('appointment:completed', { appointmentId: id });
    }

    return sendSuccess(res, 200, 'Servicio finalizado y liquidado exitosamente.', {
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
    return sendError(res, 500, 'Error al finalizar el servicio en silla.');
  }
};