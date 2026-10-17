/**
 * MOTOR CRÍTICO DE DISPONIBILIDAD Y AGENDA SIN CRUCES — PUNTO FINO (RONDA 2)
 * - Respeta horarios oficiales de cada día (Lun desde 08:00, Mar-Sáb desde 09:00 hasta 20:30, Dom 09:00 a 16:00)
 * - Respeta descansos semanales: Juan David (Mié), Emanuel Torres (Lun), Juan Diego (Mié)
 * - Ninguna cita puede terminar después de la hora de cierre del día
 * - Rangos semiabiertos [startTime, endTime): si termina a las 3:30 p. m., permite otra a las 3:30 p. m.
 * - Asignación determinista para "El primero disponible" ('any')
 */

const prisma = require('../config/prisma');
const { OFFICIAL_SCHEDULES, formatTime12h } = require('../config/businessConfig');
const { isColombianHoliday } = require('../utils/colombianHolidays');

/**
 * Obtiene el día de la semana (0=Dom..6=Sáb) para una fecha 'YYYY-MM-DD' en America/Bogota
 */
function getDayOfWeekBogota(dateStr) {
  const dt = new Date(`${dateStr}T12:00:00.000-05:00`);
  return dt.getDay();
}

/**
 * Obtiene el horario oficial del negocio para una fecha 'YYYY-MM-DD' (incluyendo festivos y excepciones)
 */
async function getBusinessHoursForDate(dateStr, tx = prisma) {
  const dayOfWeek = getDayOfWeekBogota(dateStr);

  // 1. Verificar si existe una excepción puntual (cierre o horario especial manual en BD)
  const exception = await tx.scheduleException.findUnique({
    where: { date: dateStr },
  });

  if (exception) {
    if (exception.isClosed) {
      return {
        isOpen: false,
        dayOfWeek,
        openTime: null,
        closeTime: null,
        reason: exception.reason || 'Cerrado por fecha especial.',
        isException: true,
      };
    }
    if (exception.openTime && exception.closeTime) {
      return {
        isOpen: true,
        dayOfWeek,
        openTime: exception.openTime,
        closeTime: exception.closeTime,
        reason: exception.reason,
        isException: true,
      };
    }
  }

  // 2. Verificar si es festivo oficial en Colombia (abren en horario de domingos: 09:00 a 16:00)
  const holiday = isColombianHoliday(dateStr);
  if (holiday.isHoliday) {
    return {
      isOpen: true,
      dayOfWeek,
      dayName: `Festivo (${holiday.name})`,
      openTime: '09:00',
      closeTime: '16:00',
      isHoliday: true,
      isException: false,
    };
  }

  // 3. Consultar tabla BusinessSchedule o fallback a OFFICIAL_SCHEDULES
  const dbSchedule = await tx.businessSchedule.findUnique({
    where: { dayOfWeek },
  });

  const fallback = OFFICIAL_SCHEDULES.find((s) => s.dayOfWeek === dayOfWeek);
  const sched = dbSchedule || fallback;

  if (!sched || !sched.isOpen) {
    return {
      isOpen: false,
      dayOfWeek,
      openTime: null,
      closeTime: null,
      reason: 'El local permanece cerrado en este día.',
      isException: false,
    };
  }

  return {
    isOpen: true,
    dayOfWeek,
    dayName: sched.dayName || fallback?.dayName,
    openTime: sched.openTime,
    closeTime: sched.closeTime,
    isException: false,
  };
}

/**
 * Verifica qué barberos trabajan en una fecha 'YYYY-MM-DD'
 */
async function getWorkingBarbersForDate(dateStr, barberIdOrAny = 'any', tx = prisma) {
  const dayOfWeek = getDayOfWeekBogota(dateStr);
  const startOfDay = new Date(`${dateStr}T00:00:00.000-05:00`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999-05:00`);

  const whereBarber = {
    isActive: true,
    isArchived: false,
    ...(barberIdOrAny && barberIdOrAny !== 'any' ? { id: barberIdOrAny } : {}),
  };

  const barbers = await tx.barberProfile.findMany({
    where: whereBarber,
    orderBy: { sortOrder: 'asc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      schedules: { where: { dayOfWeek } },
      absences: {
        where: {
          startDate: { lte: endOfDay },
          endDate: { gte: startOfDay },
        },
      },
    },
  });

  const workingBarbers = [];
  const restingBarbers = [];

  for (const b of barbers) {
    const sched = b.schedules[0];
    const isRestDay = b.weeklyRestDay === dayOfWeek || (sched && !sched.isWorking);

    // Verificar si tiene ausencia de día completo
    const fullDayAbsence = b.absences.find(
      (abs) => abs.startDate <= startOfDay && abs.endDate >= endOfDay
    );

    if (isRestDay) {
      restingBarbers.push({
        barber: b,
        reason: 'Día de descanso semanal',
      });
    } else if (fullDayAbsence) {
      restingBarbers.push({
        barber: b,
        reason: fullDayAbsence.reason || 'Ausencia programada',
      });
    } else {
      workingBarbers.push(b);
    }
  }

  return { workingBarbers, restingBarbers, dayOfWeek };
}

/**
 * Calcula las franjas horarias para una fecha, duración de servicio y barbero (o 'any')
 */
async function calculateDailySlots({
  date,
  durationMinutes = 35,
  barberId = 'any',
  ignoreAdvanceMargin = false,
  excludeAppointmentId = null,
}) {
  const settings = await prisma.platformSetting.findUnique({ where: { id: 'default' } });
  const minAdvanceMinutes = ignoreAdvanceMargin ? 0 : (settings?.minAdvanceMinutes ?? 30);
  const bufferMinutes = settings?.bufferMinutes ?? 0;

  const businessHours = await getBusinessHoursForDate(date);
  if (!businessHours.isOpen) {
    return {
      available: false,
      date,
      reason: businessHours.reason,
      openTime: null,
      closeTime: null,
      slots: [],
      groupedSlots: { morning: [], afternoon: [], evening: [] },
      availableSlotsCount: 0,
      afternoonAvailableCount: 0,
    };
  }

  const { workingBarbers, restingBarbers, dayOfWeek } = await getWorkingBarbersForDate(date, barberId);

  if (workingBarbers.length === 0) {
    const isRest = barberId !== 'any' && restingBarbers.some((r) => r.reason?.includes('descanso'));
    const reason =
      barberId !== 'any' && restingBarbers.length > 0
        ? restingBarbers[0].reason
        : 'No hay barberos disponibles en esta fecha.';
    return {
      available: false,
      date,
      dayOfWeek,
      isRestDay: isRest,
      reason,
      openTime: businessHours.openTime,
      closeTime: businessHours.closeTime,
      slots: [],
      groupedSlots: { morning: [], afternoon: [], evening: [] },
      availableSlotsCount: 0,
      afternoonAvailableCount: 0,
    };
  }

  const startOfDay = new Date(`${date}T00:00:00.000-05:00`);
  const endOfDay = new Date(`${date}T23:59:59.999-05:00`);
  const now = new Date();
  const minAllowedStart = new Date(now.getTime() + minAdvanceMinutes * 60 * 1000);

  const workingBarberIds = workingBarbers.map((b) => b.id);

  // Consultar citas activas y holds activos de los barberos que trabajan hoy
  const [appointments, activeHolds] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        barberId: { in: workingBarberIds },
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'HOLD'] },
        startTime: { lt: endOfDay },
        endTime: { gt: startOfDay },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
      select: { id: true, barberId: true, startTime: true, endTime: true },
    }),
    prisma.slotHold.findMany({
      where: {
        barberId: { in: workingBarberIds },
        appointmentId: null,
        expiresAt: { gt: now },
        startTime: { lt: endOfDay },
        endTime: { gt: startOfDay },
      },
      select: { id: true, barberId: true, startTime: true, endTime: true },
    }),
  ]);

  const [openH, openM] = businessHours.openTime.split(':').map(Number);
  const [closeH, closeM] = businessHours.closeTime.split(':').map(Number);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const serviceDuration = parseInt(durationMinutes, 10) || 35;
  const stepMinutes = serviceDuration; // Intervalo exacto según la duración del servicio (35 min, 45 min, 60 min, etc.)

  const slots = [];
  let currentMin = openMinutes;

  // Regla estricta: Ninguna cita puede terminar después del cierre del día
  while (currentMin + serviceDuration <= closeMinutes) {
    const slotH = Math.floor(currentMin / 60);
    const slotM = currentMin % 60;
    const time24 = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;
    const time12 = formatTime12h(time24);

    const slotStart = new Date(`${date}T${time24}:00.000-05:00`);
    const slotEnd = new Date(slotStart.getTime() + (serviceDuration + bufferMinutes) * 60 * 1000);

    const isTooSoon = slotStart < minAllowedStart;

    // Evaluar qué barberos están libres en el rango semiabierto [slotStart, slotEnd)
    const freeBarbersForSlot = [];

    if (!isTooSoon) {
      for (const b of workingBarbers) {
        const hasAptConflict = appointments.some(
          (a) => a.barberId === b.id && slotStart < a.endTime && slotEnd > a.startTime
        );
        const hasHoldConflict = activeHolds.some(
          (h) => h.barberId === b.id && slotStart < h.endTime && slotEnd > h.startTime
        );
        const hasAbsenceConflict = b.absences.some(
          (abs) => slotStart < abs.endDate && slotEnd > abs.startDate
        );

        if (!hasAptConflict && !hasHoldConflict && !hasAbsenceConflict) {
          freeBarbersForSlot.push({
            id: b.id,
            name: b.user.name,
            nickname: b.nickname,
            sortOrder: b.sortOrder,
          });
        }
      }
    }

    const isAvailable = !isTooSoon && freeBarbersForSlot.length > 0;
    const periodGroup = slotH < 12 ? 'morning' : slotH < 19 ? 'afternoon' : 'evening';

    slots.push({
      time: time12,
      time24,
      isoStartTime: slotStart.toISOString(),
      isoEndTime: slotEnd.toISOString(),
      available: isAvailable,
      period: periodGroup,
      freeBarberIds: freeBarbersForSlot.map((fb) => fb.id),
      busyReason: isTooSoon
        ? 'Hora pasada o dentro del margen de anticipación'
        : !isAvailable
        ? 'Horario ocupado'
        : null,
    });

    currentMin += stepMinutes;
  }

  const groupedSlots = {
    morning: slots.filter((s) => s.period === 'morning'),
    afternoon: slots.filter((s) => s.period === 'afternoon'),
    evening: slots.filter((s) => s.period === 'evening'),
  };

  const availableSlots = slots.filter((s) => s.available);
  const afternoonAvailable = groupedSlots.afternoon.filter((s) => s.available);

  return {
    available: availableSlots.length > 0,
    date,
    dayOfWeek,
    openTime: businessHours.openTime,
    closeTime: businessHours.closeTime,
    daySchedule12h: `${formatTime12h(businessHours.openTime)} a ${formatTime12h(businessHours.closeTime)}`,
    totalSlots: slots.length,
    availableSlotsCount: availableSlots.length,
    afternoonAvailableCount: afternoonAvailable.length,
    firstAvailableSlot: availableSlots[0] || null,
    slots,
    groupedSlots,
  };
}

/**
 * Selecciona de forma determinista el barbero para "El primero disponible" ('any')
 * dentro de una transacción activa.
 * Criterio:
 * 1. Filtra barberos activos que trabajan ese día (no es su weeklyRestDay) y sin ausencias/citas/holds en [start, end).
 * 2. Ordena por menor cantidad de citas en ese día (balance de carga) y desempata por sortOrder ascendente.
 */
async function resolveAvailableBarberInTransaction(
  tx,
  { barberIdOrAny, startTime, endTime, sessionId = null, holdId = null, preferredBarberId = null }
) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  // Obtener fecha YYYY-MM-DD en America/Bogota
  const bogotaDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(start);

  // Validar que la hora esté dentro del horario oficial del día y no termine después del cierre
  const businessHours = await getBusinessHoursForDate(bogotaDateStr, tx);
  if (!businessHours.isOpen) {
    throw new Error('SHOP_CLOSED_ON_DATE');
  }

  const dayOpen = new Date(`${bogotaDateStr}T${businessHours.openTime}:00.000-05:00`);
  const dayClose = new Date(`${bogotaDateStr}T${businessHours.closeTime}:00.000-05:00`);

  if (start < dayOpen || end > dayClose) {
    throw new Error('OUTSIDE_BUSINESS_HOURS');
  }

  const { workingBarbers } = await getWorkingBarbersForDate(bogotaDateStr, barberIdOrAny, tx);
  if (workingBarbers.length === 0) {
    throw new Error('BARBER_ON_REST_DAY');
  }

  const startOfDay = new Date(`${bogotaDateStr}T00:00:00.000-05:00`);
  const endOfDay = new Date(`${bogotaDateStr}T23:59:59.999-05:00`);

  const candidates = [];

  for (const b of workingBarbers) {
    // 1. Verificar colisión con citas [start, end)
    const aptConflict = await tx.appointment.findFirst({
      where: {
        barberId: b.id,
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'HOLD'] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });
    if (aptConflict) continue;

    // 2. Verificar colisión con SlotHolds de otra sesión
    const holdConflict = await tx.slotHold.findFirst({
      where: {
        barberId: b.id,
        appointmentId: null,
        expiresAt: { gt: now },
        ...(sessionId ? { sessionId: { not: sessionId } } : {}),
        ...(holdId ? { id: { not: holdId } } : {}),
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });
    if (holdConflict) continue;

    // 3. Verificar colisión con ausencias puntuales
    const absConflict = b.absences.some((abs) => start < abs.endDate && end > abs.startDate);
    if (absConflict) continue;

    // Contar citas del día para desempate por carga laboral
    const dayAptCount = await tx.appointment.count({
      where: {
        barberId: b.id,
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        startTime: { gte: startOfDay, lte: endOfDay },
      },
    });

    candidates.push({
      barber: b,
      dayAptCount,
    });
  }

  if (candidates.length === 0) {
    throw new Error('CONCURRENCY_SLOT_TAKEN');
  }

  // Priorizar el barbero previamente retenido para esta sesión si sigue libre y válido
  if (preferredBarberId) {
    const preferredCandidate = candidates.find((c) => c.barber.id === preferredBarberId);
    if (preferredCandidate) {
      return preferredCandidate.barber;
    }
  }

  // Orden determinista: menor carga en el día, luego sortOrder ascendente
  candidates.sort((a, b) => {
    if (a.dayAptCount !== b.dayAptCount) return a.dayAptCount - b.dayAptCount;
    return a.barber.sortOrder - b.barber.sortOrder;
  });

  return candidates[0].barber;
}

/**
 * Valida si un barbero específico está disponible en un rango [startTime, endTime)
 * Retorna { available: boolean, reason?: string }
 */
async function isBarberAvailableInRange(tx = prisma, { barberId, startTime, endTime, excludeAppointmentId = null }) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const bogotaDateStr = start.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  const dayOfWeek = getDayOfWeekBogota(bogotaDateStr);

  // 1. Validar horario oficial del negocio
  const businessHours = await getBusinessHoursForDate(bogotaDateStr, tx);
  if (!businessHours.isOpen) {
    return { available: false, reason: businessHours.reason || 'El negocio está cerrado en esta fecha.' };
  }

  const dayOpen = new Date(`${bogotaDateStr}T${businessHours.openTime}:00.000-05:00`);
  const dayClose = new Date(`${bogotaDateStr}T${businessHours.closeTime}:00.000-05:00`);

  if (start < dayOpen || end > dayClose) {
    return { available: false, reason: 'El horario está fuera del horario de atención del negocio.' };
  }

  // 2. Obtener barbero y verificar descanso semanal y ausencias
  const barber = await tx.barberProfile.findUnique({
    where: { id: barberId },
    include: {
      schedules: { where: { dayOfWeek } },
      absences: {
        where: {
          startDate: { lte: end },
          endDate: { gte: start },
        },
      },
    },
  });

  if (!barber || !barber.isActive || barber.isArchived) {
    return { available: false, reason: 'El barbero no está activo.' };
  }

  const sched = barber.schedules[0];
  const isRestDay = barber.weeklyRestDay === dayOfWeek || (sched && !sched.isWorking);
  if (isRestDay) {
    return { available: false, reason: 'Es su día de descanso semanal.' };
  }

  if (barber.absences && barber.absences.length > 0) {
    return { available: false, reason: 'Tiene una ausencia programada en ese horario.' };
  }

  // 3. Colisión con otras citas [startTime, endTime) - semiabierto
  const appointmentConflict = await tx.appointment.findFirst({
    where: {
      barberId,
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      status: { in: ['CONFIRMED', 'IN_PROGRESS', 'HOLD'] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  if (appointmentConflict) {
    return { available: false, reason: 'Ya tiene otra cita confirmada en ese horario.' };
  }

  return { available: true };
}

module.exports = {
  getDayOfWeekBogota,
  getBusinessHoursForDate,
  getWorkingBarbersForDate,
  calculateDailySlots,
  resolveAvailableBarberInTransaction,
  isBarberAvailableInRange,
};


