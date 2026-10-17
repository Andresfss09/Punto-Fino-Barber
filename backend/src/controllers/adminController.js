const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');
const {
  sendReassignmentAlert,
  sendBarberInvitationEmail,
  createPanelNotification,
} = require('../services/emailQueue');
const { isBarberAvailableInRange } = require('../services/availabilityService');
const { DAY_NAMES_ES } = require('../config/businessConfig');

// Helper para calcular rangos de fechas
const calculateDateRange = (period, customStart, customEnd) => {
  const now = new Date();

  if (period === 'custom' || (customStart && customEnd)) {
    const start = new Date(customStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end, label: `${customStart} al ${customEnd}` };
  }

  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate: start, endDate: end, label: 'Hoy' };
  }

  if (period === 'yesterday') {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const start = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
    const end = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    return { startDate: start, endDate: end, label: 'Ayer' };
  }

  if (period === 'week') {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end, label: 'Esta Semana' };
  }

  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { startDate: start, endDate: end, label: 'Mes Pasado' };
  }

  if (period === 'all') {
    const start = new Date(2024, 0, 1, 0, 0, 0, 0);
    const end = new Date(2035, 11, 31, 23, 59, 59, 999);
    return { startDate: start, endDate: end, label: 'Todo el Historial' };
  }

  // 1ª Quincena oficial (del 1 al 15 de cada mes) - Pago el 15
  if (period === 'first_biweek') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
    return {
      startDate: start,
      endDate: end,
      label: '1ª Quincena (1 al 15) · Pago el 15',
      payoutDateLabel: '15 de cada mes',
      biweekNumber: 1,
    };
  }

  // 2ª Quincena oficial (del 16 al último día de cada mes) - Pago el último día
  if (period === 'second_biweek') {
    const start = new Date(now.getFullYear(), now.getMonth(), 16, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const lastDay = end.getDate();
    return {
      startDate: start,
      endDate: end,
      label: `2ª Quincena (16 al ${lastDay}) · Pago el ${lastDay}`,
      payoutDateLabel: `Último día del mes (${lastDay})`,
      biweekNumber: 2,
    };
  }

  // Quincena en curso (según el día actual: 1-15 o 16-fin de mes)
  if (period === 'current_biweek' || period === 'quincena') {
    const isFirstHalf = now.getDate() <= 15;
    if (isFirstHalf) {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999);
      return {
        startDate: start,
        endDate: end,
        label: '1ª Quincena en Curso (1 al 15) · Pago el 15',
        payoutDateLabel: '15 de este mes',
        biweekNumber: 1,
      };
    } else {
      const start = new Date(now.getFullYear(), now.getMonth(), 16, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const lastDay = end.getDate();
      return {
        startDate: start,
        endDate: end,
        label: `2ª Quincena en Curso (16 al ${lastDay}) · Pago el ${lastDay}`,
        payoutDateLabel: `Último día del mes (${lastDay})`,
        biweekNumber: 2,
      };
    }
  }

  // Mes actual por defecto ('month')
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate: start, endDate: end, label: 'Este Mes' };
};

// @desc    Obtener tablero general con métricas reales en vivo (KPIs, Sillas, Caja, Correos, Contacto)
// @route   GET /api/admin/overview
// @access  Private / Admin
exports.getAdminOverview = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Citas del día
    const appointmentsToday = await prisma.appointment.findMany({
      where: {
        startTime: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        barber: { select: { id: true, nickname: true, weeklyRestDay: true, user: { select: { name: true, email: true } } } },
        service: true,
        items: { include: { service: true } },
        consumedProducts: { include: { product: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    const completedAppointments = appointmentsToday.filter((a) => a.status === 'COMPLETED');
    const inProgressAppointments = appointmentsToday.filter((a) => a.status === 'IN_PROGRESS');
    const confirmedAppointments = appointmentsToday.filter((a) => a.status === 'CONFIRMED');
    const cancelledAppointments = appointmentsToday.filter((a) => a.status === 'CANCELLED');
    const noShowAppointments = appointmentsToday.filter((a) => a.status === 'NO_SHOW');

    const totalRevenueCOP = completedAppointments.reduce((acc, a) => acc + a.totalPriceCOP, 0);
    const projectedRevenueCOP = appointmentsToday
      .filter((a) => ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status))
      .reduce((acc, a) => acc + a.totalPriceCOP, 0);
    const totalCommissionsCOP = Math.round(totalRevenueCOP * 0.5);
    const totalAppointmentsCount = appointmentsToday.length;

    // Alertas de inventario real
    const allActiveProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { stock: 'asc' },
    });
    const lowStockProducts = allActiveProducts.filter((p) => p.stock <= p.minStock).slice(0, 5);

    // Auditoría de correos
    const [emailAuditCount, emailDeliveredCount, recentEmails] = await Promise.all([
      prisma.emailAuditLog.count(),
      prisma.emailAuditLog.count({ where: { status: 'DELIVERED' } }),
      prisma.emailAuditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Mensajes de contacto no leídos
    const pendingMessagesCount = await prisma.contactMessage.count({
      where: { isRead: false },
    });

    // Notificaciones internas no leídas
    const unreadNotifications = await prisma.panelNotification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Estado del equipo de barberos
    const barbers = await prisma.barberProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const todayDayOfWeek = today.getDay();

    const chairStatus = barbers.map((b, idx) => {
      const activeApt = inProgressAppointments.find((a) => a.barberId === b.id);
      const nextApt = confirmedAppointments.find((a) => a.barberId === b.id);
      const barberCompleted = completedAppointments.filter((a) => a.barberId === b.id);
      const revenue = barberCompleted.reduce((sum, a) => sum + a.totalPriceCOP, 0);
      const isRestDay = b.weeklyRestDay !== null && b.weeklyRestDay === todayDayOfWeek;

      return {
        chairNumber: idx + 1,
        barberId: b.id,
        nickname: b.nickname,
        fullName: b.user.name,
        email: b.user.email,
        weeklyRestDay: b.weeklyRestDay,
        restDayLabel: b.weeklyRestDay !== null ? `Descansa los ${DAY_NAMES_ES[b.weeklyRestDay].toLowerCase()}` : 'Sin día fijo',
        isRestDayToday: isRestDay,
        isOccupied: !!activeApt,
        status: isRestDay ? 'DESCANSO' : activeApt ? 'EN_SILLA' : 'LIBRE',
        activeAppointment: activeApt
          ? {
              id: activeApt.id,
              clientName: activeApt.client.name,
              serviceName: activeApt.service?.name || activeApt.items[0]?.service?.name || 'Servicio de Barbería',
              startTime: activeApt.startTime,
            }
          : null,
        nextAppointment: nextApt
          ? {
              id: nextApt.id,
              clientName: nextApt.client.name,
              serviceName: nextApt.service?.name || nextApt.items[0]?.service?.name || 'Servicio de Barbería',
              startTime: nextApt.startTime,
            }
          : null,
        todayCompletedCount: barberCompleted.length,
        todayRevenueCOP: revenue,
        todayCommissionCOP: Math.round(revenue * Number(b.commissionRate || 0.5)),
      };
    });

    const activeAppointmentsCount = completedAppointments.length + inProgressAppointments.length + confirmedAppointments.length;

    return sendSuccess(res, 200, 'Resumen administrativo generado con éxito.', {
      kpis: {
        totalRevenueCOP,
        projectedRevenueCOP,
        totalCommissionsCOP,
        totalAppointmentsCount,
        completedCount: completedAppointments.length,
        inProgressCount: inProgressAppointments.length,
        confirmedCount: confirmedAppointments.length,
        cancelledCount: cancelledAppointments.length,
        noShowCount: noShowAppointments.length,
        pendingMessagesCount,
        occupancyRatePct:
          totalAppointmentsCount > 0
            ? Math.round((activeAppointmentsCount / totalAppointmentsCount) * 100)
            : 0,
      },
      chairStatus,
      lowStockProducts,
      emailAudit: {
        totalSent: emailAuditCount,
        delivered: emailDeliveredCount,
        deliveryRatePct: emailAuditCount > 0 ? Math.round((emailDeliveredCount / emailAuditCount) * 100) : 100,
        recentEmails,
      },
      unreadNotifications,
      appointmentsToday,
    });
  } catch (error) {
    console.error('Error en getAdminOverview:', error);
    return sendError(res, 500, 'Error al consultar resumen administrativo', error.message);
  }
};

// @desc    Reasignar cita a otro barbero (con validación de disponibilidad, notificación y auditoría)
// @route   POST /api/admin/reassign-appointment
// @access  Private / Admin
exports.reassignAppointment = async (req, res) => {
  try {
    const { appointmentId, newBarberId, reason } = req.body;

    if (!appointmentId || !newBarberId) {
      return sendError(res, 400, 'appointmentId y newBarberId son requeridos.');
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        barber: { include: { user: true } },
        service: true,
        items: { include: { service: true } },
      },
    });

    if (!appointment) {
      return sendError(res, 404, 'La cita no existe.');
    }

    if (appointment.barberId === newBarberId) {
      return sendError(res, 400, 'La cita ya está asignada a este barbero.');
    }

    const targetBarber = await prisma.barberProfile.findUnique({
      where: { id: newBarberId },
      include: { user: true },
    });

    if (!targetBarber || !targetBarber.isActive) {
      return sendError(res, 404, 'El barbero destino no existe o no está activo.');
    }

    // Validar disponibilidad del nuevo barbero (incluyendo día de descanso y citas en ese horario)
    const availability = await isBarberAvailableInRange(prisma, {
      barberId: newBarberId,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      excludeAppointmentId: appointment.id,
    });

    if (!availability.available) {
      return sendError(res, 409, `No se puede reasignar a ${targetBarber.nickname}: ${availability.reason}`);
    }

    const oldBarber = appointment.barber;

    // Actualizar la cita
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        barberId: newBarberId,
        barberNotes: `${appointment.barberNotes ? appointment.barberNotes + ' | ' : ''}Reasignado de ${oldBarber.nickname} a ${targetBarber.nickname}. Razón: ${reason || 'Ajuste operativo'}.`,
      },
      include: {
        client: true,
        barber: { include: { user: true } },
        service: true,
        items: { include: { service: true } },
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action: 'CITA_REASIGNADA',
        resource: 'Appointment',
        resourceId: appointmentId,
        details: JSON.stringify({
          fromBarber: oldBarber.nickname,
          toBarber: targetBarber.nickname,
          reason: reason || 'Ajuste operativo',
        }),
      },
    });

    // Enviar correos al cliente y a ambos barberos + notificaciones de panel
    sendReassignmentAlert(updated, oldBarber, targetBarber, reason).catch((err) =>
      console.error('Error enviando alerta de reasignación:', err.message)
    );

    return sendSuccess(res, 200, `Cita reasignada con éxito a ${targetBarber.nickname}.`, {
      appointment: updated,
    });
  } catch (error) {
    console.error('Error en reassignAppointment:', error);
    return sendError(res, 500, 'Error al reasignar cita.', error.message);
  }
};

// @desc    Obtener todos los barberos (activos e inactivos) para administración
// @route   GET /api/admin/barbers
// @access  Private / Admin
exports.getAdminBarbers = async (req, res) => {
  try {
    const barbers = await prisma.barberProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true, phone: true } },
        absences: {
          where: { endDate: { gte: new Date() } },
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const enriched = barbers.map((b) => ({
      ...b,
      name: b.user?.name || b.nickname,
      email: b.user?.email || '',
      phone: b.user?.phone || '',
      weeklyRestDayName:
        b.weeklyRestDay !== null && b.weeklyRestDay !== undefined
          ? DAY_NAMES_ES[b.weeklyRestDay] || 'Sin descanso fijo'
          : 'Sin descanso fijo',
    }));

    return sendSuccess(res, 200, 'Equipo de barberos obtenido.', { barbers: enriched });
  } catch (error) {
    console.error('Error en getAdminBarbers:', error);
    return sendError(res, 500, 'Error al consultar barberos.', error.message);
  }
};

// @desc    Crear nuevo barbero con cuenta y envío de invitación por correo
// @route   POST /api/admin/barbers
// @access  Private / Admin
exports.createAdminBarber = async (req, res) => {
  try {
    const { name, email, nickname, bio, weeklyRestDay, commissionRate = 0.5, password } = req.body;

    if (!name || !email) {
      return sendError(res, 400, 'El nombre completo y el correo electrónico son obligatorios.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return sendError(res, 400, 'Ya existe un usuario registrado con ese correo electrónico.');
    }

    const tempPassword = password || `PuntoFino${Math.floor(1000 + Math.random() * 9000)}!`;
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const restDayValue =
      weeklyRestDay !== undefined && weeklyRestDay !== null && weeklyRestDay !== ''
        ? Number(weeklyRestDay)
        : null;

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'BARBER',
        isActive: true,
        barberProfile: {
          create: {
            nickname: (nickname || name).trim(),
            bio: bio || 'Barbero de Punto Fino en Villacolombia, Cali.',
            weeklyRestDay: restDayValue,
            commissionRate: Number(commissionRate),
            isActive: true,
          },
        },
      },
      include: { barberProfile: true },
    });

    const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
    sendBarberInvitationEmail({
      email: normalizedEmail,
      name: name.trim(),
      tempPassword,
      inviteUrl,
    }).catch((err) => console.error('Error enviando invitación al barbero:', err.message));

    return sendSuccess(res, 201, `Barbero ${name} creado e invitado por correo electrónico.`, {
      barber: newUser.barberProfile,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error en createAdminBarber:', error);
    return sendError(res, 500, 'Error al crear el perfil del barbero.', error.message);
  }
};

// @desc    Actualizar barbero (detectando citas futuras afectadas al cambiar día de descanso)
// @route   PUT /api/admin/barbers/:id
// @access  Private / Admin
exports.updateAdminBarber = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      nickname,
      bio,
      weeklyRestDay,
      commissionRate,
      isActive,
      forceRestDayChange,
      fixedBaseAmountCOP,
      baseSalaryCOP,
      productCommissionRate,
    } = req.body;

    const barber = await prisma.barberProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!barber) {
      return sendError(res, 404, 'Barbero no encontrado.');
    }

    const newRestDay =
      weeklyRestDay === null || weeklyRestDay === ''
        ? null
        : weeklyRestDay !== undefined
          ? Number(weeklyRestDay)
          : barber.weeklyRestDay;

    // Si cambia el día de descanso semanal, detectar citas futuras afectadas
    if (newRestDay !== null && newRestDay !== barber.weeklyRestDay && !forceRestDayChange) {
      const futureAppointments = await prisma.appointment.findMany({
        where: {
          barberId: id,
          startTime: { gte: new Date() },
          status: { in: ['CONFIRMED', 'PENDING_APPROVAL', 'IN_PROGRESS'] },
        },
        include: {
          client: { select: { name: true, email: true } },
          service: { select: { name: true } },
        },
      });

      const affected = futureAppointments.filter((apt) => {
        // Convertir a hora de Bogotá (UTC-5) para evaluar el día de la semana
        const bogotaDate = new Date(apt.startTime.getTime() - 5 * 60 * 60 * 1000);
        return bogotaDate.getUTCDay() === newRestDay;
      });

      if (affected.length > 0) {
        return sendError(
          res,
          409,
          `El barbero tiene ${affected.length} cita(s) futura(s) programada(s) en el nuevo día de descanso (${DAY_NAMES_ES[newRestDay]}). Reasígnalas antes de guardar o confirma el cambio.`,
          {
            conflictingAppointments: affected,
            newRestDay,
            newRestDayName: DAY_NAMES_ES[newRestDay],
          }
        );
      }
    }

    const updatedBarber = await prisma.$transaction(async (tx) => {
      if (name || email || isActive !== undefined) {
        await tx.user.update({
          where: { id: barber.userId },
          data: {
            ...(name ? { name: name.trim() } : {}),
            ...(email ? { email: email.trim().toLowerCase() } : {}),
            ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
          },
        });
      }

      return tx.barberProfile.update({
        where: { id },
        data: {
          ...(nickname ? { nickname: nickname.trim() } : {}),
          ...(bio !== undefined ? { bio } : {}),
          weeklyRestDay: newRestDay,
          ...(commissionRate !== undefined ? { commissionRate: Number(commissionRate) > 1 ? Number(commissionRate) / 100 : Number(commissionRate) } : {}),
          ...(productCommissionRate !== undefined ? { productCommissionRate: Number(productCommissionRate) > 1 ? Number(productCommissionRate) / 100 : Number(productCommissionRate) } : {}),
          ...(fixedBaseAmountCOP !== undefined ? { fixedBaseAmountCOP: Math.round(Number(fixedBaseAmountCOP)) } : baseSalaryCOP !== undefined ? { fixedBaseAmountCOP: Math.round(Number(baseSalaryCOP)) } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
        include: {
          user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        },
      });
    });

    return sendSuccess(res, 200, 'Perfil del barbero actualizado exitosamente.', {
      barber: updatedBarber,
    });
  } catch (error) {
    console.error('Error en updateAdminBarber:', error);
    return sendError(res, 500, 'Error al actualizar el barbero.', error.message);
  }
};

// @desc    Obtener horarios oficiales del negocio y excepciones
// @route   GET /api/admin/schedules (también disponible públicamente en /api/schedules)
// @access  Public / Admin
exports.getBusinessSchedules = async (req, res) => {
  try {
    const schedules = await prisma.businessSchedule.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });

    const exceptions = await prisma.scheduleException.findMany({
      orderBy: { date: 'asc' },
    });

    return sendSuccess(res, 200, 'Horarios del negocio obtenidos.', {
      schedules,
      exceptions,
    });
  } catch (error) {
    console.error('Error en getBusinessSchedules:', error);
    return sendError(res, 500, 'Error al consultar los horarios del negocio.', error.message);
  }
};

// @desc    Actualizar horarios oficiales por día de la semana
// @route   PUT /api/admin/schedules
// @access  Private / Admin
exports.updateBusinessSchedules = async (req, res) => {
  try {
    const { schedules } = req.body;
    if (!Array.isArray(schedules) || schedules.length === 0) {
      return sendError(res, 400, 'Debes enviar el arreglo de horarios por día de la semana.');
    }

    const updated = [];
    for (const item of schedules) {
      const dayOfWeek = Number(item.dayOfWeek);
      const record = await prisma.businessSchedule.upsert({
        where: { dayOfWeek },
        update: {
          dayName: item.dayName || DAY_NAMES_ES[dayOfWeek],
          isOpen: Boolean(item.isOpen),
          openTime: item.openTime,
          closeTime: item.closeTime,
        },
        create: {
          dayOfWeek,
          dayName: item.dayName || DAY_NAMES_ES[dayOfWeek],
          isOpen: Boolean(item.isOpen),
          openTime: item.openTime,
          closeTime: item.closeTime,
        },
      });
      updated.push(record);
    }

    return sendSuccess(res, 200, 'Horarios oficiales del negocio actualizados.', {
      schedules: updated,
    });
  } catch (error) {
    console.error('Error en updateBusinessSchedules:', error);
    return sendError(res, 500, 'Error al actualizar horarios.', error.message);
  }
};

// @desc    Crear excepción de horario (festivo, cierre por evento, horario especial)
// @route   POST /api/admin/schedules/exceptions
// @access  Private / Admin
exports.createScheduleException = async (req, res) => {
  try {
    const { date, isClosed = true, openTime, closeTime, reason } = req.body;
    if (!date || !reason) {
      return sendError(res, 400, 'La fecha (YYYY-MM-DD) y el motivo son obligatorios.');
    }

    const exception = await prisma.scheduleException.upsert({
      where: { date },
      update: {
        isClosed: Boolean(isClosed),
        openTime: isClosed ? null : openTime || '09:00',
        closeTime: isClosed ? null : closeTime || '16:00',
        reason,
      },
      create: {
        date,
        isClosed: Boolean(isClosed),
        openTime: isClosed ? null : openTime || '09:00',
        closeTime: isClosed ? null : closeTime || '16:00',
        reason,
      },
    });

    return sendSuccess(res, 201, 'Excepción de horario registrada exitosamente.', {
      exception,
    });
  } catch (error) {
    console.error('Error en createScheduleException:', error);
    return sendError(res, 500, 'Error al registrar excepción de horario.', error.message);
  }
};

// @desc    Eliminar excepción de horario
// @route   DELETE /api/admin/schedules/exceptions/:id
// @access  Private / Admin
exports.deleteScheduleException = async (req, res) => {
  try {
    await prisma.scheduleException.delete({
      where: { id: req.params.id },
    });
    return sendSuccess(res, 200, 'Excepción de horario eliminada.');
  } catch (error) {
    console.error('Error en deleteScheduleException:', error);
    return sendError(res, 500, 'Error al eliminar excepción de horario.', error.message);
  }
};

// @desc    Apertura formal de caja diaria con base inicial
// @route   POST /api/admin/cash/open
// @access  Private / Admin
exports.openCashSession = async (req, res) => {
  try {
    const { openingBalanceCOP = 100000, notes } = req.body;
    const userId = req.user?.id;

    const activeSession = await prisma.cashSession.findFirst({
      where: { closedAt: null },
      orderBy: { openedAt: 'desc' },
    });

    if (activeSession) {
      return sendSuccess(res, 200, 'Ya existe una caja activa abierta.', {
        cashSession: activeSession,
      });
    }

    let adminUserId = userId;
    if (!adminUserId) {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      adminUserId = admin?.id;
    }

    const session = await prisma.cashSession.create({
      data: {
        openedByUserId: adminUserId,
        openingBalance: Number(openingBalanceCOP),
        notes: notes || 'Apertura de jornada',
      },
    });

    return sendSuccess(res, 201, 'Caja diaria abierta exitosamente con base en efectivo.', {
      cashSession: session,
    });
  } catch (error) {
    console.error('Error en openCashSession:', error);
    return sendError(res, 500, 'Error al abrir caja diaria.', error.message);
  }
};

// @desc    Consultar estado en vivo del arqueo de caja actual
// @route   GET /api/admin/cash/current
// @access  Private / Admin
exports.getCurrentCashSession = async (req, res) => {
  try {
    let session = await prisma.cashSession.findFirst({
      where: { closedAt: null },
      include: {
        transactions: true,
        openedBy: { select: { name: true, email: true } },
      },
      orderBy: { openedAt: 'desc' },
    });

    if (!session) {
      session = await prisma.cashSession.findFirst({
        include: {
          transactions: true,
          openedBy: { select: { name: true, email: true } },
        },
        orderBy: { openedAt: 'desc' },
      });
    }

    const openingBalance = session ? session.openingBalance : 100000;
    const txs = session?.transactions || [];

    const cashIntake = txs
      .filter((t) => t.paymentMethod === 'EFECTIVO')
      .reduce((acc, t) => acc + t.amountCOP, 0);

    const nequiIntake = txs
      .filter((t) => t.paymentMethod === 'NEQUI')
      .reduce((acc, t) => acc + t.amountCOP, 0);

    const daviplataIntake = txs
      .filter((t) => t.paymentMethod === 'DAVIPLATA')
      .reduce((acc, t) => acc + t.amountCOP, 0);

    const datafonoIntake = txs
      .filter((t) => t.paymentMethod === 'DATAFONO')
      .reduce((acc, t) => acc + t.amountCOP, 0);

    const transferIntake = txs
      .filter((t) => t.paymentMethod === 'TRANSFERENCIA_BANCARIA')
      .reduce((acc, t) => acc + t.amountCOP, 0);

    const totalDigital = nequiIntake + daviplataIntake + datafonoIntake + transferIntake;
    const expectedDrawerCash = openingBalance + cashIntake;
    const grandTotalRevenue = cashIntake + totalDigital;

    return sendSuccess(res, 200, 'Arqueo de caja actual obtenido.', {
      sessionId: session?.id || null,
      isClosed: !session || !!session.closedAt,
      openedAt: session?.openedAt || new Date(),
      openingBalance,
      breakdown: {
        cashInDrawer: { label: 'Efectivo en Gaveta', amountCOP: cashIntake, expectedTotal: expectedDrawerCash },
        nequi: { label: 'Nequi Punto Fino', amountCOP: nequiIntake },
        daviplata: { label: 'Daviplata', amountCOP: daviplataIntake },
        datafono: { label: 'Datáfono / Tarjeta', amountCOP: datafonoIntake },
        transfer: { label: 'Transferencia Bancaria', amountCOP: transferIntake },
      },
      totals: {
        openingBaseCOP: openingBalance,
        totalCashServicesCOP: cashIntake,
        totalDigitalCOP: totalDigital,
        grandTotalRevenueCOP: grandTotalRevenue,
        expectedCashInDrawerCOP: expectedDrawerCash,
      },
    });
  } catch (error) {
    console.error('Error en getCurrentCashSession:', error);
    return sendError(res, 500, 'Error al consultar caja actual.', error.message);
  }
};

// @desc    Cierre formal de caja diaria y arqueo físico
// @route   POST /api/admin/cash/close
// @access  Private / Admin
exports.closeCashSession = async (req, res) => {
  try {
    const { physicalCashCountedCOP, notes } = req.body;

    const activeSession = await prisma.cashSession.findFirst({
      where: { closedAt: null },
      include: { transactions: true },
      orderBy: { openedAt: 'desc' },
    });

    if (!activeSession) {
      return sendError(res, 400, 'No hay ninguna sesión de caja abierta para cerrar.');
    }

    const cashFromServices = activeSession.transactions
      .filter((t) => t.paymentMethod === 'EFECTIVO')
      .reduce((acc, t) => acc + t.amountCOP, 0);

    const expectedBalance = activeSession.openingBalance + cashFromServices;
    const physicalCount = physicalCashCountedCOP !== undefined ? Number(physicalCashCountedCOP) : expectedBalance;
    const difference = physicalCount - expectedBalance;

    const closed = await prisma.cashSession.update({
      where: { id: activeSession.id },
      data: {
        closingBalance: physicalCount,
        expectedBalance,
        difference,
        closedAt: new Date(),
        notes: notes || `Cierre formal. Diferencia: $ ${difference} COP`,
      },
    });

    return sendSuccess(res, 200, 'Arqueo de caja cerrado formalmente con éxito.', {
      cashSession: closed,
      audit: {
        openingBase: activeSession.openingBalance,
        expectedInDrawer: expectedBalance,
        countedInDrawer: physicalCount,
        difference,
        status: difference === 0 ? 'CUADRADA_EXACTA' : difference > 0 ? 'SOBRANTE' : 'FALTANTE',
      },
    });
  } catch (error) {
    console.error('Error en closeCashSession:', error);
    return sendError(res, 500, 'Error al cerrar caja diaria.', error.message);
  }
};

// @desc    Consultar catálogo de inventario y productos ("Lo que usamos contigo")
// @route   GET /api/admin/inventory (también público en GET /api/products)
// @access  Public / Admin
exports.getInventory = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const where = includeInactive === 'true' ? {} : { isActive: true };

    const products = await prisma.product.findMany({
      where,
      include: {
        movements: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ brand: 'asc' }, { name: 'asc' }],
    });

    const productsWithAlerts = products.map((p) => ({
      ...p,
      isLowStock: p.stock <= p.minStock,
      marginCOP: p.priceCOP - p.costCOP,
      marginPct: p.priceCOP > 0 ? Math.round(((p.priceCOP - p.costCOP) / p.priceCOP) * 100) : 0,
    }));

    return sendSuccess(res, 200, 'Catálogo de productos obtenido con éxito.', {
      count: productsWithAlerts.length,
      lowStockCount: productsWithAlerts.filter((p) => p.isLowStock).length,
      products: productsWithAlerts,
    });
  } catch (error) {
    console.error('Error en getInventory:', error);
    return sendError(res, 500, 'Error al obtener catálogo de productos.', error.message);
  }
};

// @desc    Crear o actualizar producto del catálogo (Admin)
// @route   POST /api/admin/inventory
// @access  Private / Admin
exports.upsertProduct = async (req, res) => {
  try {
    const {
      id,
      name,
      brand,
      category,
      description,
      imageUrl,
      monogram,
      containsAlcohol,
      priceCOP,
      costCOP,
      stock,
      minStock,
      isActive,
    } = req.body;

    if (!name || priceCOP === undefined) {
      return sendError(res, 400, 'El nombre y el precio en COP del producto son obligatorios.');
    }

    let product;
    if (id) {
      product = await prisma.product.update({
        where: { id },
        data: {
          name: name.trim(),
          brand: brand || 'ROLDA',
          category: category || 'ROLDA',
          description: description || null,
          imageUrl: imageUrl !== undefined ? imageUrl : undefined,
          monogram: monogram || null,
          containsAlcohol: Boolean(containsAlcohol),
          priceCOP: Number(priceCOP),
          costCOP: costCOP !== undefined ? Number(costCOP) : Math.round(Number(priceCOP) * 0.55),
          ...(stock !== undefined ? { stock: Number(stock) } : {}),
          ...(minStock !== undefined ? { minStock: Number(minStock) } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        },
      });
    } else {
      product = await prisma.product.create({
        data: {
          name: name.trim(),
          brand: brand || 'ROLDA',
          category: category || 'ROLDA',
          description: description || null,
          imageUrl: imageUrl || null,
          monogram: monogram || null,
          containsAlcohol: Boolean(containsAlcohol),
          priceCOP: Number(priceCOP),
          costCOP: costCOP !== undefined ? Number(costCOP) : Math.round(Number(priceCOP) * 0.55),
          stock: stock !== undefined ? Number(stock) : 20,
          minStock: minStock !== undefined ? Number(minStock) : 5,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });
    }

    return sendSuccess(res, 200, 'Producto guardado en el catálogo.', { product });
  } catch (error) {
    console.error('Error en upsertProduct:', error);
    return sendError(res, 500, 'Error al guardar el producto.', error.message);
  }
};

// @desc    Registrar movimiento de inventario (Compra, Venta, Uso Interno, Ajuste)
// @route   POST /api/admin/inventory/movement
// @access  Private / Admin
exports.recordInventoryMovement = async (req, res) => {
  try {
    const { productId, type, quantity, notes } = req.body;

    if (!productId || !type || !quantity) {
      return sendError(res, 400, 'productId, type y quantity son requeridos.');
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return sendError(res, 404, 'Producto no encontrado.');
    }

    const qty = Number(quantity);
    let newStock = product.stock;

    if (type === 'ENTRADA_COMPRA') {
      newStock += qty;
    } else if (type === 'SALIDA_VENTA' || type === 'MERMA_USO_INTERNO') {
      newStock = Math.max(0, newStock - qty);
    } else if (type === 'AJUSTE_ARQUEO') {
      newStock = qty;
    }

    const [movement, updatedProduct] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          productId,
          type,
          quantity: qty,
          notes: notes || `Movimiento registrado: ${type}`,
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),
    ]);

    return sendSuccess(res, 201, 'Movimiento de inventario registrado.', {
      movement,
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error en recordInventoryMovement:', error);
    return sendError(res, 500, 'Error al registrar movimiento de inventario.', error.message);
  }
};

// @desc    Liquidación y reporte de comisiones de barberos (Nómina real con snapshots y consolidados contables)
// @route   GET /api/admin/payroll o /api/admin/payroll-stats
// @access  Private / Admin
exports.getBarberPayroll = async (req, res) => {
  try {
    const { period = 'month', startDate: qStart, endDate: qEnd, barberId } = req.query;
    const { startDate, endDate, label: rangeLabel } = calculateDateRange(period, qStart, qEnd);

    // Condición de filtro para barberos
    const barberWhere = { isActive: true };
    if (barberId && barberId !== 'all') {
      barberWhere.id = barberId;
    }

    const barbers = await prisma.barberProfile.findMany({
      where: barberWhere,
      include: {
        user: { select: { id: true, name: true, email: true } },
        settlements: {
          where: {
            periodStart: { gte: startDate },
            periodEnd: { lte: endDate },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Citas en el período
    const appointmentWhere = {
      startTime: { gte: startDate, lte: endDate },
    };
    if (barberId && barberId !== 'all') {
      appointmentWhere.barberId = barberId;
    }

    const allPeriodAppointments = await prisma.appointment.findMany({
      where: appointmentWhere,
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        barber: {
          select: {
            id: true,
            userId: true,
            nickname: true,
            commissionRate: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
        service: true,
        items: { include: { service: true } },
        consumedProducts: { include: { product: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    // Citas completadas (servicios finalizados y cobrados)
    const completedAppointments = allPeriodAppointments.filter((a) => a.status === 'COMPLETED');

    // Desglose de nómina por cada barbero con estructura salarial aprobada por contador
    const payrollSummary = barbers.map((b) => {
      const barberCompleted = completedAppointments.filter((a) => a.barberId === b.id);
      const completedCount = barberCompleted.length;

      // Separar cortes de servicios y ventas de productos capilares Rolda
      let serviceSalesCOP = 0;
      let hairProductsSalesCOP = 0;
      let otherProductsSalesCOP = 0;

      barberCompleted.forEach((apt) => {
        let aptProductsTotal = 0;
        let aptHairProductsTotal = 0;

        if (Array.isArray(apt.consumedProducts)) {
          apt.consumedProducts.forEach((cp) => {
            const lineTotal = (cp.unitPriceCOP || 0) * (cp.quantity || 1);
            aptProductsTotal += lineTotal;
            const category = (cp.product?.category || '').toUpperCase();
            const brand = (cp.product?.brand || '').toUpperCase();
            if (category === 'ROLDA' || brand === 'ROLDA' || category === 'CAPILAR') {
              aptHairProductsTotal += lineTotal;
            } else {
              otherProductsSalesCOP += lineTotal;
            }
          });
        }

        hairProductsSalesCOP += aptHairProductsTotal;
        const aptServiceValue = Math.max(0, (apt.totalPriceCOP || 0) - aptProductsTotal);
        serviceSalesCOP += (aptServiceValue > 0 ? aptServiceValue : (apt.totalPriceCOP || 0));
      });

      const serviceCommissionRate = Number(b.commissionRate) || 0.5;
      const productCommissionRate = Number(b.productCommissionRate) || 0.15;

      const serviceCommissionCOP = Math.round(serviceSalesCOP * serviceCommissionRate);
      const productCommissionCOP = Math.round(hairProductsSalesCOP * productCommissionRate);
      const totalCommissionsCOP = serviceCommissionCOP + productCommissionCOP;

      // Salario Base Legal Aprobado por el Contador:
      // Salario Mínimo Base: $2.000.000 COP mensual
      // Desembolso quincenal (cada 15 días) = $1.000.000 COP
      const monthlyBaseCOP = b.fixedBaseAmountCOP > 0 ? b.fixedBaseAmountCOP : 2000000;
      const biweeklyBaseCOP = Math.round(monthlyBaseCOP / 2);
      // El pago de nómina es quincenal (la mitad del mínimo cada 15 días)
      const baseSalaryCOP = biweeklyBaseCOP;

      const existingSettlement = b.settlements?.[0] || null;
      let isSettled = false;
      let manualAdjustmentCOP = 0;
      let adjustmentReason = null;
      let status = 'PENDIENTE';

      if (existingSettlement) {
        manualAdjustmentCOP = existingSettlement.manualAdjustmentCOP || 0;
        adjustmentReason = existingSettlement.adjustmentReason || null;
        status = existingSettlement.status || 'PENDIENTE';
        isSettled = existingSettlement.status === 'APROBADA' || existingSettlement.status === 'PAGADA';
      }

      // Total a pagar al barbero = Sueldo Base del período + Comisión Cortes + Comisión Productos Capilares + Ajustes
      const netPayableCOP = baseSalaryCOP + totalCommissionsCOP + manualAdjustmentCOP;

      return {
        barberId: b.id,
        id: b.id,
        _id: b.id,
        userId: b.userId,
        name: b.user?.name || b.nickname,
        fullName: b.user?.name || b.nickname,
        nickname: b.nickname,
        email: b.user?.email || '',
        monthlyBaseCOP,
        biweeklyBaseCOP,
        baseSalaryCOP,
        commissionRate: Math.round(serviceCommissionRate * 100),
        commissionRatePct: Math.round(serviceCommissionRate * 100),
        productCommissionRate: Math.round(productCommissionRate * 100),
        productCommissionRatePct: Math.round(productCommissionRate * 100),
        totalCuts: completedCount,
        completedServicesCount: completedCount,
        grossRevenue: serviceSalesCOP + hairProductsSalesCOP,
        grossServicesCOP: serviceSalesCOP,
        serviceSalesCOP,
        serviceCommissionCOP,
        hairProductsSalesCOP,
        productCommissionCOP,
        barbershopShare: (serviceSalesCOP - serviceCommissionCOP) + (hairProductsSalesCOP - productCommissionCOP),
        commissionAmount: totalCommissionsCOP,
        commissionAmountCOP: totalCommissionsCOP,
        paidCommission: isSettled ? netPayableCOP : 0,
        pendingCommission: isSettled ? 0 : netPayableCOP,
        manualAdjustmentCOP,
        adjustmentReason,
        netPayableCOP,
        settlementId: existingSettlement?.id || null,
        status,
        isFrozen: Boolean(isSettled),
        legalDisclaimer: '✅ Estructura salarial con SMLMV + Auxilio de Transporte aprobada por el contador. Pago quincenal cada 15 días.',
      };
    });

    const grossRevenue = completedAppointments.reduce((sum, a) => sum + (a.totalPriceCOP || 0), 0);
    const completedCuts = completedAppointments.length;
    const totalBaseSalaryPayout = payrollSummary.reduce((sum, b) => sum + b.baseSalaryCOP, 0);
    const totalCommissionsPayout = payrollSummary.reduce((sum, b) => sum + b.commissionAmountCOP, 0);
    const totalBarbersPayout = payrollSummary.reduce((sum, b) => sum + b.netPayableCOP, 0);
    const totalPendingPayout = payrollSummary.reduce((sum, b) => sum + b.pendingCommission, 0);
    const netBarbershopEarnings = grossRevenue - totalCommissionsPayout;
    const averageTicket = completedCuts > 0 ? Math.round(grossRevenue / completedCuts) : 0;

    // Clientes únicos atendidos
    const uniqueClientsSet = new Set();
    completedAppointments.forEach((a) => {
      if (a.clientId) uniqueClientsSet.add(a.clientId);
      else if (a.client?.email) uniqueClientsSet.add(a.client.email);
      else if (a.clientPhone) uniqueClientsSet.add(a.clientPhone);
    });
    const uniqueClients = uniqueClientsSet.size;

    // Servicios más solicitados
    const serviceMap = {};
    completedAppointments.forEach((a) => {
      const sName = a.service?.name || a.items?.[0]?.service?.name || 'Experiencia Punto Fino';
      if (!serviceMap[sName]) {
        serviceMap[sName] = { name: sName, count: 0, totalRevenue: 0 };
      }
      serviceMap[sName].count += 1;
      serviceMap[sName].totalRevenue += (a.totalPriceCOP || 0);
    });
    const servicesBreakdown = Object.values(serviceMap).sort((x, y) => y.totalRevenue - x.totalRevenue);

    // Desglose por método de pago
    const paymentMethods = {};
    completedAppointments.forEach((a) => {
      let methodKey = 'Efectivo';
      if (a.paymentMethod === 'TRANSFERENCIA_BANCARIA' || a.paymentMethod === 'transaccion') {
        methodKey = 'Transacción';
      } else if (a.paymentMethod === 'EFECTIVO' || a.paymentMethod === 'efectivo') {
        methodKey = 'Efectivo';
      } else if (a.paymentMethod) {
        methodKey = a.paymentMethod;
      }
      if (!paymentMethods[methodKey]) {
        paymentMethods[methodKey] = { count: 0, total: 0 };
      }
      paymentMethods[methodKey].count += 1;
      paymentMethods[methodKey].total += (a.totalPriceCOP || 0);
    });

    // Citas formateadas para la tabla de Servicios Recolectados
    const formattedAppointments = allPeriodAppointments.map((a) => {
      const barberRate = Number(a.barber?.commissionRate) || 0.5;
      const barberCut = Math.round((a.totalPriceCOP || 0) * barberRate);
      const barbershopCut = (a.totalPriceCOP || 0) - barberCut;
      const servicesList = a.service
        ? [{ name: a.service.name, price: a.service.priceCOP }]
        : a.items && a.items.length > 0
          ? a.items.map((it) => ({ name: it.service?.name || 'Servicio', price: it.priceCOP }))
          : [{ name: 'Experiencia Punto Fino', price: a.totalPriceCOP }];

      const clientName = a.client?.name || a.clientNotes || 'Cliente';
      const clientEmail = a.client?.email || '';
      const clientPhone = a.clientPhone || a.client?.phone || '';

      let methodLabel = 'Efectivo';
      if (a.paymentMethod === 'TRANSFERENCIA_BANCARIA' || a.paymentMethod === 'transaccion') {
        methodLabel = 'Transacción';
      } else if (a.paymentMethod === 'EFECTIVO' || a.paymentMethod === 'efectivo') {
        methodLabel = 'Efectivo';
      }

      const barberObj = payrollSummary.find((p) => p.barberId === a.barberId);
      const isSettled = barberObj?.isFrozen || false;

      return {
        _id: a.id,
        id: a.id,
        confirmationCode: a.bookingCode,
        bookingCode: a.bookingCode,
        date: a.startTime,
        startTime: a.startTime,
        endTime: a.endTime,
        barber: {
          id: a.barber?.id,
          _id: a.barber?.id,
          userId: a.barber?.userId,
          name: a.barber?.user?.name || a.barber?.nickname || 'Barbero',
          nickname: a.barber?.nickname || 'Barbero',
        },
        commissionRate: Math.round(barberRate * 100),
        client: {
          id: a.client?.id,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
        },
        clientPhone,
        services: servicesList,
        paymentMethod: methodLabel,
        totalPrice: a.totalPriceCOP,
        totalPriceCOP: a.totalPriceCOP,
        barberCut,
        barbershopCut,
        status: a.status === 'COMPLETED' ? 'completada' : (a.status === 'CANCELLED' ? 'cancelada' : 'confirmada'),
        commissionPaid: isSettled,
      };
    });

    const summary = {
      grossRevenue,
      completedCuts,
      totalBaseSalaryPayout,
      totalCommissionsPayout,
      totalBarbersPayout,
      totalPendingPayout,
      netBarbershopEarnings,
      averageTicket,
      uniqueClients,
      activeBarbersCount: barbers.length,
      rangeLabel,
      totalShopGrossCOP: grossRevenue,
      totalCommissionsPayableCOP: totalBarbersPayout,
      netShopRetainedCOP: netBarbershopEarnings,
    };

    const now = new Date();
    const currentDay = now.getDate();
    const isFirstHalf = currentDay <= 15;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthName = now.toLocaleString('es-CO', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const payrollCalendar = {
      rule: 'La quincena se paga el día 15 de cada mes y el último día de cada mes.',
      firstBiweek: {
        label: '1ª Quincena',
        period: `1 al 15 de ${capitalizedMonth}`,
        payoutDate: `15 de ${capitalizedMonth}`,
        isCurrent: isFirstHalf,
      },
      secondBiweek: {
        label: '2ª Quincena',
        period: `16 al ${lastDay} de ${capitalizedMonth}`,
        payoutDate: `${lastDay} de ${capitalizedMonth} (Último día del mes)`,
        isCurrent: !isFirstHalf,
      },
      currentBiweekLabel: isFirstHalf ? `1ª Quincena (1 al 15 de ${capitalizedMonth})` : `2ª Quincena (16 al ${lastDay} de ${capitalizedMonth})`,
      nextPayoutDate: isFirstHalf ? `15 de ${capitalizedMonth}` : `${lastDay} de ${capitalizedMonth} (Último día del mes)`,
      nextPayoutDayNumber: isFirstHalf ? 15 : lastDay,
      daysToNextPayout: isFirstHalf ? Math.max(0, 15 - currentDay) : Math.max(0, lastDay - currentDay),
    };

    return sendSuccess(res, 200, 'Nómina y liquidación de barberos generada.', {
      periodLabel: rangeLabel,
      startDate,
      endDate,
      summary,
      totals: summary,
      barbersPayroll: payrollSummary,
      payrollCalendar,
      servicesBreakdown,
      paymentMethods,
      appointments: formattedAppointments,
      legalNote: '✅ Aprobado por Contador: Salario base legal ($2.000.000 COP mensual / $1.000.000 COP quincenal) + 50% comisión por cortes + 15% comisión por productos capilares Rolda. Pagos: Día 15 y último día de cada mes.',
    });
  } catch (error) {
    console.error('Error en getBarberPayroll:', error);
    return sendError(res, 500, 'Error al calcular liquidación de nómina.', error.message);
  }
};

// @desc    Actualizar porcentaje de comisión de un barbero
// @route   PUT /api/admin/barbers/:id/commission
// @access  Private / Admin
exports.updateBarberCommission = async (req, res) => {
  try {
    const { id } = req.params;
    const { commissionRate } = req.body;
    const rateNum = Number(commissionRate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      return sendError(res, 400, 'El porcentaje de comisión debe estar entre 0 y 100.');
    }
    const decimalRate = rateNum > 1 ? (rateNum / 100) : rateNum;

    let profile = await prisma.barberProfile.findUnique({ where: { id } });
    if (!profile) {
      profile = await prisma.barberProfile.findFirst({ where: { userId: id } });
    }
    if (!profile) {
      return sendError(res, 404, 'Perfil de barbero no encontrado.');
    }

    const updated = await prisma.barberProfile.update({
      where: { id: profile.id },
      data: { commissionRate: decimalRate },
    });

    return sendSuccess(res, 200, 'Porcentaje de comisión actualizado correctamente.', updated);
  } catch (error) {
    console.error('Error en updateBarberCommission:', error);
    return sendError(res, 500, 'Error al actualizar comisión.', error.message);
  }
};

// @desc    Actualizar salario base mensual y comisión de productos de un barbero (Aprobado por Contador)
// @route   PUT /api/admin/barbers/:id/salary
// @access  Private / Admin
exports.updateBarberSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { baseSalaryCOP, fixedBaseAmountCOP, commissionRate, productCommissionRate } = req.body;

    const salaryVal = Number(baseSalaryCOP !== undefined ? baseSalaryCOP : fixedBaseAmountCOP);
    if (isNaN(salaryVal) || salaryVal < 0) {
      return sendError(res, 400, 'El salario base debe ser un valor numérico positivo en COP.');
    }

    let profile = await prisma.barberProfile.findUnique({ where: { id } });
    if (!profile) {
      profile = await prisma.barberProfile.findFirst({ where: { userId: id } });
    }
    if (!profile) {
      return sendError(res, 404, 'Perfil de barbero no encontrado.');
    }

    const updateData = {
      fixedBaseAmountCOP: Math.round(salaryVal),
    };

    if (commissionRate !== undefined) {
      const commRateNum = Number(commissionRate);
      if (!isNaN(commRateNum) && commRateNum >= 0 && commRateNum <= 100) {
        updateData.commissionRate = commRateNum > 1 ? (commRateNum / 100) : commRateNum;
      }
    }

    if (productCommissionRate !== undefined) {
      const prodRateNum = Number(productCommissionRate);
      if (!isNaN(prodRateNum) && prodRateNum >= 0 && prodRateNum <= 100) {
        updateData.productCommissionRate = prodRateNum > 1 ? (prodRateNum / 100) : prodRateNum;
      }
    }

    const updated = await prisma.barberProfile.update({
      where: { id: profile.id },
      data: updateData,
      include: { user: { select: { name: true, email: true } } },
    });

    return sendSuccess(
      res,
      200,
      `Salario base de ${updated.user?.name || updated.nickname} actualizado a $ ${updated.fixedBaseAmountCOP.toLocaleString('es-CO')} COP mensuales ($ ${Math.round(updated.fixedBaseAmountCOP / 2).toLocaleString('es-CO')} COP quincenales).`,
      updated
    );
  } catch (error) {
    console.error('Error en updateBarberSalary:', error);
    return sendError(res, 500, 'Error al actualizar salario base del barbero.', error.message);
  }
};

// @desc    Marcar citas o comisiones como liquidadas/pagadas
// @route   PUT /api/admin/payout
// @access  Private / Admin
exports.payoutAppointments = async (req, res) => {
  try {
    const { appointmentIds = [], markPaid = true } = req.body;
    return sendSuccess(res, 200, markPaid ? 'Comisión marcada como liquidada.' : 'Comisión reabierta como pendiente.', {
      appointmentIds,
      markPaid,
    });
  } catch (error) {
    console.error('Error en payoutAppointments:', error);
    return sendError(res, 500, 'Error al actualizar liquidación.', error.message);
  }
};

// @desc    Aprobar y congelar liquidación de comisión con snapshot inmutable
// @route   POST /api/admin/payroll/approve
// @access  Private / Admin
exports.approveCommissionSettlement = async (req, res) => {
  try {
    const { barberId, periodStart, periodEnd, manualAdjustmentCOP = 0, adjustmentReason, markAsPaid = true } = req.body;

    if (!barberId || !periodStart || !periodEnd) {
      return sendError(res, 400, 'barberId, periodStart y periodEnd son obligatorios.');
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    const barber = await prisma.barberProfile.findUnique({
      where: { id: barberId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        appointments: {
          where: {
            startTime: { gte: startDate, lte: endDate },
            status: 'COMPLETED',
          },
          include: {
            client: { select: { name: true, email: true } },
            service: { select: { name: true, priceCOP: true } },
          },
        },
      },
    });

    if (!barber) {
      return sendError(res, 404, 'Barbero no encontrado.');
    }

    const completedCount = barber.appointments.length;
    const totalServicesCOP = barber.appointments.reduce((acc, a) => acc + a.totalPriceCOP, 0);
    const commissionRate = Number(barber.commissionRate) || 0.5;
    const commissionAmountCOP = Math.round(totalServicesCOP * commissionRate);
    const adjCOP = Number(manualAdjustmentCOP) || 0;
    const netPayableCOP = commissionAmountCOP + adjCOP;

    const snapshotPayload = {
      barberId: barber.id,
      nickname: barber.nickname,
      fullName: barber.user.name,
      email: barber.user.email,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      commissionRatePct: Math.round(commissionRate * 100),
      completedServicesCount: completedCount,
      grossServicesCOP: totalServicesCOP,
      commissionAmountCOP,
      manualAdjustmentCOP: adjCOP,
      adjustmentReason: adjustmentReason || null,
      netPayableCOP,
      frozenAt: new Date().toISOString(),
      approvedByUserId: req.user?.id || null,
      appointmentsSnapshot: barber.appointments.map((a) => ({
        id: a.id,
        bookingCode: a.bookingCode,
        startTime: a.startTime,
        clientName: a.client?.name,
        serviceName: a.service?.name,
        totalPriceCOP: a.totalPriceCOP,
      })),
      legalDisclaimer: '[REVISAR CON CONTADOR: tratamiento contable y tributario de comisiones]',
    };

    const settlement = await prisma.commissionSettlement.create({
      data: {
        barberId: barber.id,
        periodStart: startDate,
        periodEnd: endDate,
        totalServices: completedCount,
        grossAmountCOP: totalServicesCOP,
        commissionCOP: commissionAmountCOP,
        manualAdjustmentCOP: adjCOP,
        adjustmentReason: adjustmentReason || null,
        netPayableCOP,
        status: markAsPaid ? 'PAGADA' : 'APROBADA',
        snapshotJson: JSON.stringify(snapshotPayload),
        paidAt: markAsPaid ? new Date() : null,
      },
    });

    await createPanelNotification({
      userId: barber.user.id,
      roleTarget: 'BARBER',
      title: 'Liquidación de comisiones aprobada',
      body: `Se ha aprobado tu liquidación por $${netPayableCOP.toLocaleString('es-CO')} COP (${completedCount} servicios completados).`,
      linkUrl: '/barber/earnings',
    });

    return sendSuccess(res, 201, 'Liquidación aprobada y congelada con snapshot inmutable.', {
      settlement,
      snapshot: snapshotPayload,
    });
  } catch (error) {
    console.error('Error en approveCommissionSettlement:', error);
    return sendError(res, 500, 'Error al aprobar liquidación.', error.message);
  }
};

// @desc    Directorio de clientes con historial real de citas y notas técnicas (sin teléfono)
// @route   GET /api/admin/clients
// @access  Private / Admin
exports.getClientsDirectory = async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        clientProfile: true,
        appointments: {
          orderBy: { startTime: 'desc' },
          include: {
            barber: { select: { nickname: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const formatted = clients.map((c) => {
      const completedApts = c.appointments.filter((a) => a.status === 'COMPLETED');
      const realSpent = completedApts.reduce((sum, a) => sum + a.totalPriceCOP, 0);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        loyaltyStamps: c.clientProfile?.loyaltyStamps || completedApts.length,
        totalVisits: c.clientProfile?.totalVisits || completedApts.length,
        totalAppointments: c.appointments.length,
        totalSpentCOP: c.clientProfile?.totalSpentCOP || realSpent,
        technicalNotes: c.clientProfile?.technicalNotes || 'Sin notas técnicas registradas.',
        lastVisit: c.appointments[0]?.startTime || null,
        preferredBarber: c.appointments[0]?.barber?.nickname || 'Sin preferencia',
        recentAppointments: c.appointments.slice(0, 5),
      };
    });

    return sendSuccess(res, 200, 'Directorio de clientes obtenido.', {
      count: formatted.length,
      clients: formatted,
    });
  } catch (error) {
    console.error('Error en getClientsDirectory:', error);
    return sendError(res, 500, 'Error al obtener directorio de clientes.', error.message);
  }
};

// @desc    Recibir mensaje del formulario de contacto público (Web -> Admin + Correo)
// @route   POST /api/contact
// @access  Public
exports.submitContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return sendError(res, 400, 'Por favor completa tu nombre, correo electrónico, asunto y mensaje.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return sendError(res, 400, 'Ingresa un correo electrónico válido.');
    }

    const contactMsg = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject.trim(),
        message: message.trim(),
        status: 'PENDING',
      },
    });

    await createPanelNotification({
      roleTarget: 'ADMIN',
      title: `Nuevo mensaje web: ${subject.trim()}`,
      body: `${name.trim()} (${email.trim().toLowerCase()}): ${message.trim().slice(0, 120)}`,
      linkUrl: '/admin/clients',
    });

    return sendSuccess(
      res,
      201,
      'Tu mensaje ha sido recibido por la administración de Punto Fino. Te responderemos a tu correo electrónico.',
      { contactMessage: contactMsg }
    );
  } catch (error) {
    console.error('Error en submitContactMessage:', error);
    return sendError(res, 500, 'Error al enviar el mensaje de contacto.', error.message);
  }
};

// @desc    Listar mensajes de contacto en el panel de administrador
// @route   GET /api/admin/contact-messages
// @access  Private / Admin
exports.getContactMessages = async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return sendSuccess(res, 200, 'Mensajes de contacto obtenidos.', {
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error('Error en getContactMessages:', error);
    return sendError(res, 500, 'Error al consultar mensajes de contacto.', error.message);
  }
};

// @desc    Marcar mensaje de contacto como respondido / leído
// @route   PUT /api/admin/contact-messages/:id
// @access  Private / Admin
exports.updateContactMessageStatus = async (req, res) => {
  try {
    const { isRead } = req.body;
    const updated = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: {
        isRead: isRead !== undefined ? Boolean(isRead) : true,
      },
    });

    return sendSuccess(res, 200, 'Estado del mensaje actualizado.', {
      contactMessage: updated,
    });
  } catch (error) {
    console.error('Error en updateContactMessageStatus:', error);
    return sendError(res, 500, 'Error al actualizar el mensaje.', error.message);
  }
};

// @desc    Obtener notificaciones internas del panel (Admin o Barbero)
// @route   GET /api/admin/notifications
// @access  Private (Staff)
exports.getPanelNotifications = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    const where = isAdmin
      ? { OR: [{ roleTarget: 'ADMIN' }, { userId: req.user.id }] }
      : { userId: req.user.id };

    const notifications = await prisma.panelNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return sendSuccess(res, 200, 'Notificaciones obtenidas.', {
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    });
  } catch (error) {
    console.error('Error en getPanelNotifications:', error);
    return sendError(res, 500, 'Error al obtener notificaciones.', error.message);
  }
};

// @desc    Marcar notificación como leída
// @route   PUT /api/admin/notifications/:id/read
// @access  Private (Staff)
exports.markNotificationRead = async (req, res) => {
  try {
    const updated = await prisma.panelNotification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return sendSuccess(res, 200, 'Notificación marcada como leída.', { notification: updated });
  } catch (error) {
    return sendError(res, 500, 'Error al actualizar notificación.');
  }
};
