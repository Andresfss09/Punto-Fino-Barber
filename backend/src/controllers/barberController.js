const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');
const { calculateDailySlots } = require('../services/availabilityService');

const REST_DAY_NAMES = {
  0: 'Descansa los domingos',
  1: 'Descansa los lunes',
  2: 'Descansa los martes',
  3: 'Descansa los miércoles',
  4: 'Descansa los jueves',
  5: 'Descansa los viernes',
  6: 'Descansa los sábados',
};

// @desc    Listar todos los barberos activos (Sin fotos de perfil ni teléfonos)
// @route   GET /api/barbers
// @access  Public
exports.getBarbers = async (req, res) => {
  try {
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const [barbers, allServices] = await Promise.all([
      prisma.barberProfile.findMany({
        where: { isActive: true, isArchived: false },
        orderBy: { sortOrder: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          schedules: true,
        },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const formattedServices = allServices.map((s) => ({
      id: s.id,
      name: s.name,
      priceCOP: s.priceCOP,
      durationMinutes: s.durationMinutes,
      category: s.category,
      isPopular: s.isPopular,
      badgeLabel: s.isPopular ? (s.badgeLabel || 'Popular') : null,
    }));

    const formatted = await Promise.all(
      barbers.map(async (b) => {
        const todayAvailability = await calculateDailySlots({
          date: todayStr,
          durationMinutes: 35,
          barberId: b.id,
        });

        return {
          id: b.id,
          userId: b.userId,
          name: b.user.name,
          nickname: b.nickname,
          bio: b.bio,
          isDualRole: b.user.role === 'ADMIN',
          weeklyRestDay: b.weeklyRestDay,
          restDayLabel: REST_DAY_NAMES[b.weeklyRestDay] || 'Descanso semanal',
          commissionRate: Number(b.commissionRate),
          availableToday: todayAvailability.available,
          todayReason: todayAvailability.reason || null,
          nextSlotToday: todayAvailability.firstAvailableSlot?.time || null,
          services: formattedServices,
          schedules: b.schedules,
        };
      })
    );

    return sendSuccess(res, 200, 'Equipo de barberos obtenido.', {
      count: formatted.length,
      barbers: formatted,
    });
  } catch (error) {
    console.error('Error al obtener barberos:', error);
    return sendError(res, 500, 'Error al consultar la lista de barberos.');
  }
};

// @desc    Obtener disponibilidad en tiempo real para una fecha específica y barbero (o 'any')
// @route   GET /api/barbers/:id/availability
// @access  Public
exports.getBarberAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, duration = 35, excludeAppointmentId } = req.query;

    if (!date) {
      return sendError(res, 400, 'El parámetro date (YYYY-MM-DD) es obligatorio.');
    }

    const result = await calculateDailySlots({
      date,
      durationMinutes: parseInt(duration, 10) || 35,
      barberId: id || 'any',
      excludeAppointmentId: excludeAppointmentId || null,
    });

    return sendSuccess(res, 200, 'Disponibilidad calculada.', {
      ...result,
      barberId: id,
    });
  } catch (error) {
    console.error('Error al calcular disponibilidad:', error);
    return sendError(res, 500, 'Error al calcular la disponibilidad.');
  }
};

// @desc    Obtener resumen del día del barbero autenticado (Estricto aislamiento por rol)
// @route   GET /api/barbers/me/daily-summary
// @access  Private (BARBER, ADMIN)
exports.getBarberDailySummary = async (req, res) => {
  try {
    // RBAC estricto: un barbero jamás puede consultar el resumen de otro barbero manipulando parámetros
    if (req.user.role === 'BARBER') {
      if (req.query.barberId && req.query.barberId !== req.user.barberProfile?.id) {
        return sendError(res, 403, 'Acceso denegado: no tienes permiso para ver datos de otro barbero.');
      }
      if (req.params.barberId && req.params.barberId !== req.user.barberProfile?.id) {
        return sendError(res, 403, 'Acceso denegado: no tienes permiso para ver datos de otro barbero.');
      }
    }

    let barberProfile = req.user.barberProfile;
    if (!barberProfile && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
      barberProfile = await prisma.barberProfile.findFirst({
        where: { isActive: true, isArchived: false },
        orderBy: { sortOrder: 'asc' },
        include: { user: true },
      });
    }

    if (!barberProfile) {
      return sendError(res, 404, 'Perfil de barbero no encontrado.');
    }

    let targetDate = req.query.date;
    if (!targetDate) {
      targetDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    }

    const startOfDay = new Date(`${targetDate}T00:00:00.000-05:00`);
    const endOfDay = new Date(`${targetDate}T23:59:59.999-05:00`);

    const [appointments, notifications] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          barberId: barberProfile.id,
          startTime: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { startTime: 'asc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              clientProfile: true,
            },
          },
          service: true,
          items: { include: { service: true } },
          consumedProducts: { include: { product: true } },
        },
      }),
      prisma.panelNotification.findMany({
        where: {
          barberId: barberProfile.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
    ]);

    const inChair = appointments.find((a) => a.status === 'IN_PROGRESS');
    const completed = appointments.filter((a) => a.status === 'COMPLETED');
    const upcoming = appointments.filter((a) => a.status === 'CONFIRMED');

    const totalServicesCOP = completed.reduce((sum, a) => sum + a.totalPriceCOP, 0);
    const totalTipsCOP = completed.reduce((sum, a) => sum + (a.tipCOP || 0), 0);
    const commissionRate = Number(barberProfile.commissionRate) || 0.5;
    const commissionCOP = Math.round(totalServicesCOP * commissionRate);

    let inChairMinutes = 0;
    const now = new Date();
    if (inChair) {
      inChairMinutes = Math.max(0, Math.floor((now.getTime() - new Date(inChair.startTime).getTime()) / 60000));
    }

    const STATUS_MAP_FROM_PRISMA = {
      CONFIRMED: 'confirmada',
      IN_PROGRESS: 'en_progreso',
      COMPLETED: 'completada',
      CANCELLED: 'cancelada',
      NO_SHOW: 'no_asistio',
    };

    const formatApt = (a) => {
      const srvName = a.service?.name || a.items[0]?.service?.name || 'Servicio Punto Fino';
      const phone = a.clientPhone || a.client?.phone || '';
      return {
        id: a.id,
        _id: a.id,
        bookingCode: a.bookingCode,
        clientName: a.client?.name || 'Cliente',
        clientEmail: a.client?.email || '',
        clientPhone: phone,
        client: {
          id: a.client?.id,
          name: a.client?.name || 'Cliente',
          email: a.client?.email || '',
          phone,
        },
        service: a.service || (a.items[0]?.service ? a.items[0].service : { name: srvName }),
        serviceName: srvName,
        serviceNames: srvName,
        totalDuration: a.totalDurationMin,
        totalDurationMin: a.totalDurationMin,
        totalPrice: a.totalPriceCOP,
        totalPriceCOP: a.totalPriceCOP,
        tipCOP: a.tipCOP || 0,
        paymentMethod: a.paymentMethod || 'efectivo',
        status: STATUS_MAP_FROM_PRISMA[a.status] || a.status?.toLowerCase() || 'confirmada',
        rawStatus: a.status,
        isWalkIn: a.isWalkIn,
        startTime: a.startTime,
        endTime: a.endTime,
        clientNotes: a.clientNotes,
        technicalNotes: a.client?.clientProfile?.technicalNotes || a.barberNotes,
        consumedProducts: a.consumedProducts.map((cp) => ({
          id: cp.product.id,
          name: cp.product.name,
          quantity: cp.quantity,
          unitPriceCOP: cp.unitPriceCOP,
        })),
      };
    };

    return sendSuccess(res, 200, 'Resumen del día del barbero.', {
      date: targetDate,
      barber: {
        id: barberProfile.id,
        nickname: barberProfile.nickname,
        name: req.user.name,
        weeklyRestDay: barberProfile.weeklyRestDay,
        restDayLabel: REST_DAY_NAMES[barberProfile.weeklyRestDay],
        commissionRate,
      },
      stats: {
        totalAppointments: appointments.length,
        completedCount: completed.length,
        upcomingCount: upcoming.length,
        hasInChair: Boolean(inChair),
        totalServicesCOP,
        totalTipsCOP,
        commissionCOP,
      },
      inChair: inChair ? { ...formatApt(inChair), inChairMinutes } : null,
      appointments: appointments.map(formatApt),
      notifications,
    });
  } catch (error) {
    console.error('Error en daily summary:', error);
    return sendError(res, 500, 'Error al obtener resumen diario.');
  }
};

// @desc    Consultar historial e ingresos propios del barbero (RBAC estricto)
// @route   GET /api/barbers/me/earnings
// @access  Private (BARBER, ADMIN)
exports.getBarberEarnings = async (req, res) => {
  try {
    if (req.user.role === 'BARBER' && req.query.barberId && req.query.barberId !== req.user.barberProfile?.id) {
      return sendError(res, 403, 'Acceso denegado: solo puedes consultar tus propios ingresos.');
    }

    let barberProfile = req.user.barberProfile;
    if (!barberProfile && req.user.role === 'ADMIN') {
      barberProfile = await prisma.barberProfile.findFirst({ where: { isActive: true } });
    }
    if (!barberProfile) {
      return sendError(res, 404, 'Perfil de barbero no encontrado.');
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7));
    const startOfBiweekly = new Date(now.getFullYear(), now.getMonth(), now.getDate() <= 15 ? 1 : 16, 0, 0, 0);

    const [completedAppointments, settlements] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          barberId: barberProfile.id,
          status: 'COMPLETED',
        },
        orderBy: { startTime: 'desc' },
        include: {
          client: { select: { name: true, email: true } },
          service: true,
          items: { include: { service: true } },
          consumedProducts: { include: { product: true } },
        },
      }),
      prisma.commissionSettlement.findMany({
        where: {
          barberId: barberProfile.id,
          status: { in: ['APROBADA', 'PAGADA', 'LIQUIDADO'] },
        },
        orderBy: { periodEnd: 'desc' },
      }),
    ]);

    const commRate = Number(barberProfile.commissionRate) || 0.5;
    const prodCommRate = Number(barberProfile.productCommissionRate) || 0.15;

    const calcMetrics = (list) => {
      const servicesCOP = list.reduce((sum, a) => sum + a.totalPriceCOP, 0);
      const tipsCOP = list.reduce((sum, a) => sum + (a.tipCOP || 0), 0);
      const productsCOP = list.reduce(
        (sum, a) => sum + a.consumedProducts.reduce((ps, p) => ps + p.unitPriceCOP * p.quantity, 0),
        0
      );
      const serviceCommCOP = Math.round(servicesCOP * commRate);
      const productCommCOP = Math.round(productsCOP * prodCommRate);
      return {
        count: list.length,
        servicesCOP,
        tipsCOP,
        productsCOP,
        serviceCommCOP,
        productCommCOP,
        totalEarnedCOP: serviceCommCOP + productCommCOP + tipsCOP,
      };
    };

    const todayList = completedAppointments.filter((a) => new Date(a.startTime) >= startOfToday);
    const weekList = completedAppointments.filter((a) => new Date(a.startTime) >= startOfWeek);
    const biweeklyList = completedAppointments.filter((a) => new Date(a.startTime) >= startOfBiweekly);

    return sendSuccess(res, 200, 'Ingresos y liquidaciones del barbero.', {
      barber: {
        id: barberProfile.id,
        name: req.user.name,
        nickname: barberProfile.nickname,
        commissionRatePct: Math.round(commRate * 100),
        productCommissionRatePct: Math.round(prodCommRate * 100),
      },
      summary: {
        today: calcMetrics(todayList),
        week: calcMetrics(weekList),
        biweekly: calcMetrics(biweeklyList),
      },
      settlements,
    });
  } catch (error) {
    console.error('Error en getBarberEarnings:', error);
    return sendError(res, 500, 'Error al consultar ingresos.');
  }
};

// @desc    Bloquear tiempo puntual propio del barbero
// @route   POST /api/barbers/me/block-time
// @access  Private (BARBER, ADMIN)
exports.blockOwnTime = async (req, res) => {
  try {
    const barberProfile = req.user.barberProfile;
    if (!barberProfile) {
      return sendError(res, 403, 'Solo un barbero activo puede bloquear tiempo en su agenda.');
    }

    const { startTime, endTime, reason } = req.body;
    if (!startTime || !endTime) {
      return sendError(res, 400, 'Debes indicar la hora de inicio y fin del bloqueo.');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      return sendError(res, 400, 'La hora de fin debe ser posterior a la de inicio.');
    }

    // Verificar que no tenga citas confirmadas en ese rango
    const conflict = await prisma.appointment.findFirst({
      where: {
        barberId: barberProfile.id,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflict) {
      return sendError(res, 409, 'Ya tienes una cita confirmada en ese rango horario. Solicita al administrador reasignarla primero.');
    }

    const absence = await prisma.barberAbsence.create({
      data: {
        barberId: barberProfile.id,
        startDate: start,
        endDate: end,
        reason: reason || 'Bloqueo puntual de agenda',
      },
    });

    return sendSuccess(res, 201, 'Horario bloqueado en tu agenda.', { absence });
  } catch (error) {
    console.error('Error en blockOwnTime:', error);
    return sendError(res, 500, 'Error al bloquear horario.');
  }
};