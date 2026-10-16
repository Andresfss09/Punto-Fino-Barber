const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');

// @desc    Listar todos los barberos activos con sus especialidades y fotos
// @route   GET /api/barbers
// @access  Public
exports.getBarbers = async (req, res) => {
  try {
    const barbers = await prisma.barberProfile.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        services: {
          include: {
            service: true,
          },
        },
        schedules: true,
      },
    });

    const formatted = barbers.map((b) => ({
      id: b.id,
      userId: b.userId,
      name: b.user.name,
      nickname: b.nickname,
      bio: b.bio,
      avatarUrl: b.avatarUrl,
      commissionRate: Number(b.commissionRate),
      services: b.services.map((bs) => ({
        id: bs.service.id,
        name: bs.service.name,
        priceCOP: bs.customPriceCOP || bs.service.priceCOP,
        durationMinutes: bs.customDuration || bs.service.durationMinutes,
      })),
      schedules: b.schedules,
    }));

    return sendSuccess(res, 200, 'Equipo de barberos obtenido.', {
      count: formatted.length,
      barbers: formatted,
    });
  } catch (error) {
    console.error('Error al obtener barberos:', error);
    return sendError(res, 500, 'Error al consultar la lista de barberos.');
  }
};

// @desc    Obtener disponibilidad en tiempo real para una fecha específica
// @route   GET /api/barbers/:id/availability
// @access  Public
exports.getBarberAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, duration = 40 } = req.query; // date en formato 'YYYY-MM-DD'

    if (!date) {
      return sendError(res, 400, 'El parámetro date (YYYY-MM-DD) es obligatorio.');
    }

    const targetDate = new Date(`${date}T00:00:00.000-05:00`); // Zona America/Bogota
    const dayOfWeek = targetDate.getDay(); // 0: Domingo, 1: Lunes, etc.

    // 1. Verificar horario laboral del barbero para este día
    const schedule = await prisma.barberSchedule.findUnique({
      where: {
        barberId_dayOfWeek: {
          barberId: id,
          dayOfWeek,
        },
      },
    });

    if (!schedule || !schedule.isWorking) {
      return sendSuccess(res, 200, 'El barbero no labora en este día.', {
        available: false,
        reason: 'Día no laboral para este barbero.',
        slots: [],
      });
    }

    // 2. Verificar si tiene ausencias o descansos registrados
    const startOfDay = new Date(`${date}T00:00:00.000-05:00`);
    const endOfDay = new Date(`${date}T23:59:59.999-05:00`);

    const absences = await prisma.barberAbsence.findMany({
      where: {
        barberId: id,
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
    });

    // 3. Consultar citas confirmadas del día
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: id,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // 4. Consultar bloqueos atómicos temporales activos (SlotHold de 8 min)
    const now = new Date();
    const activeHolds = await prisma.slotHold.findMany({
      where: {
        barberId: id,
        expiresAt: { gt: now },
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // 5. Generar franjas horarias con intervalos de 15 min y validar colisiones
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);

    const serviceDuration = parseInt(duration, 10);
    const bufferMin = 10; // 10 min de limpieza y cambio de cuchilla
    const totalSlotSpan = serviceDuration + bufferMin;

    const slots = [];
    let currentMin = startH * 60 + startM;
    const closingMin = endH * 60 + endM;

    while (currentMin + serviceDuration <= closingMin) {
      const slotHour = Math.floor(currentMin / 60);
      const slotMinute = currentMin % 60;
      
      const slotStartTime = new Date(`${date}T${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}:00.000-05:00`);
      const slotEndTime = new Date(slotStartTime.getTime() + serviceDuration * 60 * 1000);

      // Comprobar si choca con alguna cita existente
      const collidesAppointment = appointments.some((apt) => {
        return (slotStartTime < apt.endTime && slotEndTime > apt.startTime);
      });

      // Comprobar si choca con algún bloqueo temporal activo
      const collidesHold = activeHolds.some((hold) => {
        return (slotStartTime < hold.endTime && slotEndTime > hold.startTime);
      });

      // Comprobar si choca con alguna ausencia/descanso
      const collidesAbsence = absences.some((abs) => {
        return (slotStartTime < abs.endDate && slotEndTime > abs.startDate);
      });

      // No permitir horas en el pasado si la fecha es hoy
      const isPast = slotStartTime <= now;

      const isAvailable = !collidesAppointment && !collidesHold && !collidesAbsence && !isPast;

      const period = slotHour >= 12 ? 'p. m.' : 'a. m.';
      const displayHour = slotHour > 12 ? slotHour - 12 : slotHour === 0 ? 12 : slotHour;
      const timeFormatted = `${String(displayHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')} ${period}`;

      slots.push({
        time: timeFormatted,
        isoStartTime: slotStartTime.toISOString(),
        available: isAvailable,
        busyReason: collidesAppointment ? 'Cita programada' : collidesHold ? 'Cupo en proceso de pago' : collidesAbsence ? 'Descanso del barbero' : isPast ? 'Hora pasada' : null,
      });

      // Avanzar al siguiente intervalo (por bloques de 45 o 30 min)
      currentMin += 45;
    }

    return sendSuccess(res, 200, 'Disponibilidad calculada.', {
      date,
      barberId: id,
      daySchedule: `${schedule.startTime} - ${schedule.endTime}`,
      totalSlots: slots.length,
      availableSlotsCount: slots.filter((s) => s.available).length,
      slots,
    });
  } catch (error) {
    console.error('Error al calcular disponibilidad:', error);
    return sendError(res, 500, 'Error al calcular la disponibilidad del barbero.');
  }
};

// @desc    Obtener resumen del día para la app móvil del barbero (Citas, en silla, comisión)
// @route   GET /api/barbers/me/daily-summary
// @access  Private (Staff)
exports.getBarberDailySummary = async (req, res) => {
  try {
    let barberProfile = req.user.barberProfile;
    if (!barberProfile) {
      if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
        barberProfile = await prisma.barberProfile.findFirst({
          where: { isActive: true },
          include: { user: true },
        });
      }
    }

    if (!barberProfile) {
      return sendError(res, 404, 'Perfil de barbero no encontrado.');
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: barberProfile.id,
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { startTime: 'asc' },
      include: {
        client: {
          include: {
            clientProfile: true,
          },
        },
        items: {
          include: { service: true },
        },
      },
    });

    const inChair = appointments.find((a) => a.status === 'IN_PROGRESS');
    const completed = appointments.filter((a) => a.status === 'COMPLETED');
    const upcoming = appointments.filter((a) => a.status === 'CONFIRMED');

    const totalServicesCOP = completed.reduce((sum, a) => sum + a.totalPriceCOP, 0);
    const commissionRate = Number(barberProfile.commissionRate) || 0.5;
    const commissionCOP = Math.round(totalServicesCOP * commissionRate);

    let inChairMinutes = 0;
    if (inChair) {
      inChairMinutes = Math.max(0, Math.floor((now.getTime() - new Date(inChair.startTime).getTime()) / 60000));
    }

    return sendSuccess(res, 200, 'Resumen del día del barbero.', {
      date: now.toISOString().split('T')[0],
      barber: {
        id: barberProfile.id,
        nickname: barberProfile.nickname,
        name: req.user.name,
        commissionRate,
      },
      stats: {
        totalAppointments: appointments.length,
        completedCount: completed.length,
        upcomingCount: upcoming.length,
        hasInChair: Boolean(inChair),
        totalServicesCOP,
        commissionCOP, // [REVISAR CON CONTADOR / ABOGADO LABORAL: 50% honorarios independientes]
      },
      inChair: inChair ? {
        id: inChair.id,
        bookingCode: inChair.bookingCode,
        clientName: inChair.client.name,
        clientPhone: inChair.client.phone,
        serviceNames: inChair.items.map((i) => i.service.name).join(' + '),
        totalPriceCOP: inChair.totalPriceCOP,
        technicalNotes: inChair.client.clientProfile?.technicalNotes || inChair.barberNotes,
        startTime: inChair.startTime,
        inChairMinutes,
      } : null,
      appointments: appointments.map((a) => ({
        id: a.id,
        bookingCode: a.bookingCode,
        clientName: a.client.name,
        clientPhone: a.client.phone,
        serviceNames: a.items.map((i) => i.service.name).join(' + '),
        totalPriceCOP: a.totalPriceCOP,
        status: a.status,
        isWalkIn: a.isWalkIn,
        startTime: a.startTime,
        endTime: a.endTime,
        technicalNotes: a.client.clientProfile?.technicalNotes || a.barberNotes,
      })),
    });
  } catch (error) {
    console.error('Error en daily summary:', error);
    return sendError(res, 500, 'Error al obtener resumen diario.');
  }
};