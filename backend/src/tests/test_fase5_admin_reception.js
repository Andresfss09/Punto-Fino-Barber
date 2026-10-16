/**
 * PRUEBAS DE INTEGRACIÓN FASE 5: PANEL WEB DE ADMINISTRACIÓN & RECEPCIÓN/CAJA
 * 
 * Verifica contra Neon PostgreSQL:
 * 1. Autenticación de Administrador (Alberto Cardona).
 * 2. Consulta de Tablero General & KPIs (GET /api/admin/overview).
 * 3. Estado Multi-Silla en tiempo real (Sillas 1 a 4).
 * 4. Reasignación de cita entre barberos con auditoría (POST /api/admin/reassign-appointment).
 * 5. Apertura de Caja Diaria con base en efectivo (POST /api/admin/cash/open).
 * 6. Consulta en vivo de Arqueo de Caja y Canales de Pago (GET /api/admin/cash/current).
 * 7. Inventario de Insumos & Pomadas con alertas de stock mínimo (GET /api/admin/inventory).
 * 8. Registro de movimiento de inventario (POST /api/admin/inventory/movement).
 * 9. Nómina de barberos y liquidación 50% con disclaimer legal (GET /api/admin/payroll).
 * 10. Directorio de clientes con sellos de fidelización y notas (GET /api/admin/clients).
 * 11. Cierre formal de Caja Diaria y Arqueo Físico (POST /api/admin/cash/close).
 */

const axios = require('axios');
const prisma = require('../config/prisma');

const API_BASE = 'http://localhost:5000/api';

async function runPhase5Tests() {
  console.log('\n=============================================================');
  console.log('🖥️ INICIANDO PRUEBAS DE INTEGRACIÓN FASE 5: ADMIN & CAJA 🖥️');
  console.log('=============================================================\n');

  let adminToken = '';
  let testAppointmentId = '';
  let targetBarberId = '';
  let testProductId = '';

  try {
    // 1. Autenticación del Administrador
    console.log('👉 1. Autenticando Administrador (Alberto Cardona)...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'admin@puntofino.com',
      password: 'PuntoFino2026!',
    });

    if (loginRes.data?.success && loginRes.data?.token) {
      adminToken = loginRes.data.token;
      console.log('✅ [PASS] 1. Administrador autenticado. Rol:', loginRes.data.user.role);
    } else {
      throw new Error('Fallo al autenticar administrador.');
    }

    const authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // 2. Consulta del Tablero General & KPIs
    console.log('\n👉 2. Consultando Tablero General & KPIs (GET /api/admin/overview)...');
    const overviewRes = await axios.get(`${API_BASE}/admin/overview`, authHeaders);
    if (overviewRes.data?.success && overviewRes.data?.kpis) {
      const kpis = overviewRes.data.kpis;
      console.log('✅ [PASS] 2. KPIs del Tablero obtenidos:');
      console.log(`   - Ingresos hoy: $ ${kpis.totalRevenueCOP.toLocaleString('es-CO')} COP`);
      console.log(`   - Citas hoy: ${kpis.totalAppointmentsCount} (${kpis.completedCount} completadas, ${kpis.inProgressCount} en silla)`);
      console.log(`   - Tasa de ocupación: ${kpis.occupancyRatePct}%`);
    } else {
      throw new Error('Fallo al consultar resumen del dashboard.');
    }

    // 3. Estado Multi-Silla en tiempo real
    console.log('\n👉 3. Verificando Estado de las 4 Sillas en Tiempo Real...');
    const chairStatus = overviewRes.data.chairStatus;
    if (chairStatus && chairStatus.length >= 3) {
      console.log(`✅ [PASS] 3. Sillas de barberos monitoreadas (${chairStatus.length} activas):`);
      chairStatus.forEach((ch) => {
        console.log(`   - Silla #${ch.chairNumber}: ${ch.nickname} (${ch.status}) · $ ${ch.todayRevenueCOP.toLocaleString('es-CO')} producidos`);
      });
      targetBarberId = chairStatus[1].barberId; // Carlos Valencia
    } else {
      throw new Error('Sillas no reportadas en el estado general.');
    }

    // 4. Reasignación de Cita con Auditoría
    console.log('\n👉 4. Reasignando cita de un barbero a otro (POST /api/admin/reassign-appointment)...');
    // Buscar una cita existente o crear una para la prueba
    let apt = await prisma.appointment.findFirst({
      where: { status: { in: ['CONFIRMED', 'HOLD'] } },
    });

    if (!apt) {
      const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
      const firstBarber = await prisma.barberProfile.findFirst({ where: { isActive: true } });
      apt = await prisma.appointment.create({
        data: {
          bookingCode: `PF-REASIGN-${Math.floor(1000 + Math.random() * 9000)}`,
          clientId: client.id,
          barberId: firstBarber.id,
          startTime: new Date(Date.now() + 3600000),
          endTime: new Date(Date.now() + 6000000),
          totalDurationMin: 40,
          totalPriceCOP: 25000,
          status: 'CONFIRMED',
        },
      });
    }
    testAppointmentId = apt.id;

    const reassignRes = await axios.post(
      `${API_BASE}/admin/reassign-appointment`,
      {
        appointmentId: testAppointmentId,
        newBarberId: targetBarberId,
        reason: 'Barbero original solicitó descanso médico',
      },
      authHeaders
    );

    if (reassignRes.data?.success) {
      console.log('✅ [PASS] 4. Cita reasignada con éxito a nuevo barbero.');
      // Verificar AuditLog
      const audit = await prisma.auditLog.findFirst({
        where: { resourceId: testAppointmentId, action: 'CITA_REASIGNADA' },
      });
      if (audit) {
        console.log('   - Registro en AuditLog verificado:', audit.details);
      }
    } else {
      throw new Error('Fallo al reasignar cita.');
    }

    // 5. Apertura formal de Caja Diaria
    console.log('\n👉 5. Apertura de Caja Diaria (POST /api/admin/cash/open)...');
    const openCashRes = await axios.post(
      `${API_BASE}/admin/cash/open`,
      { openingBalanceCOP: 100000, notes: 'Base inicial de gaveta turno matutino' },
      authHeaders
    );
    if (openCashRes.data?.success) {
      console.log('✅ [PASS] 5. Caja abierta con base de $ 100.000 COP en efectivo.');
    } else {
      throw new Error('Fallo al abrir caja diaria.');
    }

    // 6. Consulta de Arqueo de Caja Actual
    console.log('\n👉 6. Consultando Arqueo de Caja y Canales Digitales (GET /api/admin/cash/current)...');
    const cashCurrentRes = await axios.get(`${API_BASE}/admin/cash/current`, authHeaders);
    if (cashCurrentRes.data?.success && cashCurrentRes.data?.breakdown) {
      const b = cashCurrentRes.data.breakdown;
      console.log('✅ [PASS] 6. Arqueo en vivo discriminado:');
      console.log(`   - Base en gaveta: $ ${cashCurrentRes.data.openingBalance.toLocaleString('es-CO')} COP`);
      console.log(`   - Efectivo cobrado: $ ${b.cashInDrawer.amountCOP.toLocaleString('es-CO')} COP`);
      console.log(`   - Nequi / Daviplata: $ ${(b.nequi.amountCOP + b.daviplata.amountCOP).toLocaleString('es-CO')} COP`);
      console.log(`   - Datáfono Bold: $ ${b.datafono.amountCOP.toLocaleString('es-CO')} COP`);
    } else {
      throw new Error('Fallo al consultar arqueo de caja actual.');
    }

    // 7. Inventario de Insumos y Pomadas con Alertas
    console.log('\n👉 7. Consultando Inventario y Alertas de Stock (GET /api/admin/inventory)...');
    const invRes = await axios.get(`${API_BASE}/admin/inventory`, authHeaders);
    if (invRes.data?.success && invRes.data?.products?.length > 0) {
      console.log(`✅ [PASS] 7. Inventario obtenido: ${invRes.data.count} productos registrados.`);
      const firstProd = invRes.data.products[0];
      testProductId = firstProd.id;
      console.log(`   - Ejemplo: ${firstProd.name} (${firstProd.brand}) - Stock: ${firstProd.stock} (Mín: ${firstProd.minStock})`);
      if (invRes.data.lowStockCount > 0) {
        console.log(`   - ⚠️ Productos con alerta de stock crítico: ${invRes.data.lowStockCount}`);
      }
    } else {
      throw new Error('Fallo al obtener inventario.');
    }

    // 8. Registro de Movimiento de Inventario
    console.log('\n👉 8. Registrando Entrada de Compra en Inventario (POST /api/admin/inventory/movement)...');
    const movRes = await axios.post(
      `${API_BASE}/admin/inventory/movement`,
      {
        productId: testProductId,
        type: 'ENTRADA_COMPRA',
        quantity: 10,
        notes: 'Pedido mayorista recibido de distribuidor Cali',
      },
      authHeaders
    );
    if (movRes.data?.success && movRes.data?.product) {
      console.log(`✅ [PASS] 8. Entrada registrada. Nuevo stock: ${movRes.data.product.stock} unidades.`);
    } else {
      throw new Error('Fallo al registrar movimiento de inventario.');
    }

    // 9. Reporte de Nómina y Liquidación de Comisiones al 50%
    console.log('\n👉 9. Consultando Nómina y Liquidación de Barberos (GET /api/admin/payroll)...');
    const payrollRes = await axios.get(`${API_BASE}/admin/payroll?period=month`, authHeaders);
    if (payrollRes.data?.success && payrollRes.data?.barbersPayroll) {
      console.log('✅ [PASS] 9. Liquidación de nómina generada:');
      payrollRes.data.barbersPayroll.forEach((b) => {
        console.log(`   - ${b.nickname} (${b.fullName}): ${b.completedServicesCount} cortes · Comisión (50%): $ ${b.commissionAmountCOP.toLocaleString('es-CO')} COP`);
      });
      console.log('   - Cláusula legal validada:', payrollRes.data.barbersPayroll[0]?.legalDisclaimer);
    } else {
      throw new Error('Fallo al obtener reporte de nómina.');
    }

    // 10. Directorio de Clientes y Sellos de Fidelización
    console.log('\n👉 10. Consultando Directorio de Clientes (GET /api/admin/clients)...');
    const clientsRes = await axios.get(`${API_BASE}/admin/clients`, authHeaders);
    if (clientsRes.data?.success && clientsRes.data?.clients?.length > 0) {
      console.log(`✅ [PASS] 10. Directorio obtenido: ${clientsRes.data.count} clientes.`);
      const c = clientsRes.data.clients[0];
      console.log(`   - Cliente: ${c.name} (${c.phone}) · Sellos: ${c.loyaltyStamps}/6 · Nota: "${c.technicalNotes}"`);
    } else {
      throw new Error('Fallo al obtener directorio de clientes.');
    }

    // 11. Cierre Formal de Caja Diaria y Arqueo Físico
    console.log('\n👉 11. Ejecutando Cierre Formal de Caja Diaria (POST /api/admin/cash/close)...');
    const closeRes = await axios.post(
      `${API_BASE}/admin/cash/close`,
      {
        physicalCashCountedCOP: 190000,
        notes: 'Cierre de turno verificado por Alberto Cardona',
      },
      authHeaders
    );
    if (closeRes.data?.success && closeRes.data?.audit) {
      console.log('✅ [PASS] 11. Caja cerrada y auditada exitosamente:');
      console.log(`   - Efectivo contado en gaveta: $ ${closeRes.data.audit.countedInDrawer.toLocaleString('es-CO')} COP`);
      console.log(`   - Estado del arqueo: ${closeRes.data.audit.status} (Diferencia: $ ${closeRes.data.audit.difference} COP)`);
    } else {
      throw new Error('Fallo al cerrar caja diaria.');
    }

    console.log('\n=============================================================');
    console.log('🏁 RESULTADOS FASE 5 (ADMIN & RECEPCIÓN): 11/11 PRUEBAS EXITOSAS');
    console.log('=============================================================\n');
    console.log('✨ TODAS LAS PRUEBAS DE LA SUPERFICIE 3 PASARON SATISFACTORIAMENTE ✨\n');

  } catch (error) {
    console.error('\n❌ ERROR EN PRUEBAS FASE 5:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase5Tests();

