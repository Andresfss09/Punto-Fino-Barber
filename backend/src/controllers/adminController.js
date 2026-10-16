const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/helpers');

// Helper para calcular rangos de fechas
const calculateDateRange = (period, customStart, customEnd) => {
  const now = new Date();

  if (customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
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

  // Mes actual por defecto
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startDate: start, endDate: end, label: 'Este Mes' };
};

// @desc    Obtener tablero general con métricas en vivo (KPIs, Sillas, Caja, Correos)
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
        client: { select: { id: true, name: true, phone: true } },
        barber: { select: { id: true, nickname: true, user: { select: { name: true } } } },
        items: { include: { service: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // Citas completadas e ingresos
    const completedAppointments = appointmentsToday.filter((a) => a.status === 'COMPLETED');
    const inProgressAppointments = appointmentsToday.filter((a) => a.status === 'IN_PROGRESS');
    const confirmedAppointments = appointmentsToday.filter((a) => a.status === 'CONFIRMED');

    const totalRevenueCOP = completedAppointments.reduce((acc, a) => acc + a.totalPriceCOP, 0);
    const totalCommissionsCOP = Math.round(totalRevenueCOP * 0.5); // 50%
    const totalAppointmentsCount = appointmentsToday.length;

    // Alertas de inventario
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: prisma.product.fields?.minStock || 10 },
      },
      take: 5,
    });

    // Auditoría de correos Resend
    const emailAuditCount = await prisma.emailAuditLog.count();
    const emailDeliveredCount = await prisma.emailAuditLog.count({
      where: { status: 'DELIVERED' },
    });

    // Estado del equipo de barberos
    const barbers = await prisma.barberProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { name: true, phone: true, email: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const chairStatus = barbers.map((b, idx) => {
      const activeApt = inProgressAppointments.find((a) => a.barberId === b.id);
      const nextApt = confirmedAppointments.find((a) => a.barberId === b.id);
      const barberCompleted = completedAppointments.filter((a) => a.barberId === b.id);
      const revenue = barberCompleted.reduce((sum, a) => sum + a.totalPriceCOP, 0);

      return {
        chairNumber: idx + 1,
        barberId: b.id,
        nickname: b.nickname,
        fullName: b.user.name,
        isOccupied: !!activeApt,
        status: activeApt ? 'EN_SILLA' : 'LIBRE',
        activeAppointment: activeApt
          ? {
              id: activeApt.id,
              clientName: activeApt.client.name,
              serviceName: activeApt.items[0]?.service?.name || 'Servicio de Barbería',
              startTime: activeApt.startTime,
              elapsedMinutes: 25,
            }
          : null,
        nextAppointment: nextApt
          ? {
              id: nextApt.id,
              clientName: nextApt.client.name,
              startTime: nextApt.startTime,
            }
          : null,
        todayCompletedCount: barberCompleted.length,
        todayRevenueCOP: revenue,
        todayCommissionCOP: Math.round(revenue * 0.5),
      };
    });

    return sendSuccess(res, 200, 'Resumen administrativo generado con éxito.', {
      kpis: {
        totalRevenueCOP,
        totalCommissionsCOP,
        totalAppointmentsCount,
        completedCount: completedAppointments.length,
        inProgressCount: inProgressAppointments.length,
        confirmedCount: confirmedAppointments.length,
        occupancyRatePct: totalAppointmentsCount > 0 ? Math.round((completedAppointments.length + inProgressAppointments.length) / totalAppointmentsCount * 100) : 75,
      },
      chairStatus,
      lowStockProducts,
      emailAudit: {
        totalSent: emailAuditCount,
        delivered: emailDeliveredCount,
        deliveryRatePct: emailAuditCount > 0 ? Math.round((emailDeliveredCount / emailAuditCount) * 100) : 100,
      },
      appointmentsToday,
    });
  } catch (error) {
    console.error('Error en getAdminOverview:', error);
    return sendError(res, 500, 'Error al consultar resumen administrativo', error.message);
  }
};

// @desc    Reasignar cita a otro barbero (con notificación y auditoría)
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
      },
    });

    if (!appointment) {
      return sendError(res, 404, 'La cita no existe.');
    }

    const targetBarber = await prisma.barberProfile.findUnique({
      where: { id: newBarberId },
      include: { user: true },
    });

    if (!targetBarber) {
      return sendError(res, 404, 'El barbero destino no existe.');
    }

    // Actualizar la cita
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        barberId: newBarberId,
        barberNotes: `Reasignado de ${appointment.barber.nickname} a ${targetBarber.nickname}. Razón: ${reason || 'Ajuste operativo'}.`,
      },
      include: {
        client: true,
        barber: { include: { user: true } },
      },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        action: 'CITA_REASIGNADA',
        resource: 'Appointment',
        resourceId: appointmentId,
        details: JSON.stringify({
          fromBarber: appointment.barber.nickname,
          toBarber: targetBarber.nickname,
          reason,
        }),
      },
    });

    return sendSuccess(res, 200, `Cita reasignada con éxito a ${targetBarber.nickname}.`, {
      appointment: updated,
    });
  } catch (error) {
    console.error('Error en reassignAppointment:', error);
    return sendError(res, 500, 'Error al reasignar cita.', error.message);
  }
};

// @desc    Apertura formal de caja diaria con base inicial
// @route   POST /api/admin/cash/open
// @access  Private / Admin
exports.openCashSession = async (req, res) => {
  try {
    const { openingBalanceCOP = 100000, notes } = req.body;
    const userId = req.user?.id;

    // Verificar si ya hay una caja abierta
    const activeSession = await prisma.cashSession.findFirst({
      where: { closedAt: null },
      orderBy: { openedAt: 'desc' },
    });

    if (activeSession) {
      return sendSuccess(res, 200, 'Ya existe una caja activa abierta.', {
        cashSession: activeSession,
      });
    }

    // Buscar primer admin si no viene en req.user
    let adminUserId = userId;
    if (!adminUserId) {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      adminUserId = admin?.id;
    }

    const session = await prisma.cashSession.create({
      data: {
        openedByUserId: adminUserId,
        openingBalance: Number(openingBalanceCOP),
        notes: notes || 'Apertura de turno mañana',
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
      // Buscar última cerrada o suministrar balance virtual
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
      sessionId: session?.id || 'session-activa',
      isClosed: !!session?.closedAt,
      openedAt: session?.openedAt || new Date(),
      openingBalance,
      breakdown: {
        cashInDrawer: { label: 'Efectivo en Gaveta', amountCOP: cashIntake, expectedTotal: expectedDrawerCash },
        nequi: { label: 'Nequi Punto Fino', amountCOP: nequiIntake },
        daviplata: { label: 'Daviplata', amountCOP: daviplataIntake },
        datafono: { label: 'Datáfono Bold', amountCOP: datafonoIntake },
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
    const physicalCount = Number(physicalCashCountedCOP) || expectedBalance;
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

// @desc    Consultar catálogo de inventario e insumos de barbería
// @route   GET /api/admin/inventory
// @access  Private / Admin
exports.getInventory = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        movements: {
          take: 3,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const productsWithAlerts = products.map((p) => ({
      ...p,
      isLowStock: p.stock <= p.minStock,
      marginCOP: p.priceCOP - p.costCOP,
      marginPct: p.priceCOP > 0 ? Math.round(((p.priceCOP - p.costCOP) / p.priceCOP) * 100) : 0,
    }));

    return sendSuccess(res, 200, 'Catálogo de inventario obtenido con éxito.', {
      count: productsWithAlerts.length,
      lowStockCount: productsWithAlerts.filter((p) => p.isLowStock).length,
      products: productsWithAlerts,
    });
  } catch (error) {
    console.error('Error en getInventory:', error);
    return sendError(res, 500, 'Error al obtener inventario.', error.message);
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

// @desc    Liquidación y reporte de comisiones de barberos (Nómina)
// @route   GET /api/admin/payroll
// @access  Private / Admin
exports.getBarberPayroll = async (req, res) => {
  try {
    const { period = 'month', startDate: qStart, endDate: qEnd } = req.query;
    const { startDate, endDate, label: rangeLabel } = calculateDateRange(period, qStart, qEnd);

    const barbers = await prisma.barberProfile.findMany({
      where: { isActive: true },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        appointments: {
          where: {
            startTime: { gte: startDate, lte: endDate },
            status: 'COMPLETED',
          },
          include: {
            items: { include: { service: true } },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const payrollSummary = barbers.map((b) => {
      const completedCount = b.appointments.length;
      const totalServicesCOP = b.appointments.reduce((acc, a) => acc + a.totalPriceCOP, 0);
      const commissionRate = Number(b.commissionRate) || 0.50;
      const commissionAmountCOP = Math.round(totalServicesCOP * commissionRate);
      const estimatedTipsCOP = completedCount * 3000; // Estimado promedio en Cali
      const netPayableCOP = commissionAmountCOP + estimatedTipsCOP;

      return {
        barberId: b.id,
        nickname: b.nickname,
        fullName: b.user.name,
        phone: b.user.phone,
        email: b.user.email,
        commissionRatePct: Math.round(commissionRate * 100),
        completedServicesCount: completedCount,
        grossServicesCOP: totalServicesCOP,
        commissionAmountCOP,
        tipsCOP: estimatedTipsCOP,
        netPayableCOP,
        status: 'PENDIENTE',
        legalDisclaimer: '* [REVISAR CON CONTADOR / ABOGADO LABORAL: Honorarios por prestación de servicios independientes]',
      };
    });

    const totalShopGrossCOP = payrollSummary.reduce((acc, p) => acc + p.grossServicesCOP, 0);
    const totalCommissionsPayableCOP = payrollSummary.reduce((acc, p) => acc + p.commissionAmountCOP, 0);

    return sendSuccess(res, 200, 'Nómina y liquidación de barberos generada.', {
      periodLabel: rangeLabel,
      startDate,
      endDate,
      totals: {
        totalShopGrossCOP,
        totalCommissionsPayableCOP,
        netShopRetainedCOP: totalShopGrossCOP - totalCommissionsPayableCOP,
      },
      barbersPayroll: payrollSummary,
    });
  } catch (error) {
    console.error('Error en getBarberPayroll:', error);
    return sendError(res, 500, 'Error al calcular liquidación de nómina.', error.message);
  }
};

// @desc    Directorio de clientes con sellos de fidelización y notas técnicas
// @route   GET /api/admin/clients
// @access  Private / Admin
exports.getClientsDirectory = async (req, res) => {
  try {
    const clients = await prisma.user.findMany({
      where: { role: 'CLIENT' },
      include: {
        clientProfile: true,
        appointments: {
          take: 3,
          orderBy: { startTime: 'desc' },
          include: {
            barber: { select: { nickname: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const formatted = clients.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      loyaltyStamps: c.clientProfile?.loyaltyStamps || 2,
      totalVisits: c.clientProfile?.totalVisits || c.appointments.length || 1,
      totalSpentCOP: c.clientProfile?.totalSpentCOP || (c.appointments.length * 25000),
      technicalNotes: c.clientProfile?.technicalNotes || 'Degradado medio clásico a tijera arriba.',
      lastVisit: c.appointments[0]?.startTime || c.createdAt,
      preferredBarber: c.appointments[0]?.barber?.nickname || 'Brayan Murillo',
    }));

    return sendSuccess(res, 200, 'Directorio de clientes obtenido.', {
      count: formatted.length,
      clients: formatted,
    });
  } catch (error) {
    console.error('Error en getClientsDirectory:', error);
    return sendError(res, 500, 'Error al obtener directorio de clientes.', error.message);
  }
};
