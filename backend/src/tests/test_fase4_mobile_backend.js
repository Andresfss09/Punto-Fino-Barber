/**
 * Suite de Pruebas de Integración - FASE 4: BACKEND APP MÓVIL
 * Punto Fino Barbería (Santiago de Cali)
 * 
 * 1. Autenticación y vinculación de dispositivo móvil del barbero con biometría
 * 2. Consulta de resumen del día (Citas, cliente en silla, comisiones)
 * 3. Registro rápido de cliente sin cita (Walk-in en 2 toques con status IN_PROGRESS)
 * 4. Ficha privada de corte: Guardar y consultar notas técnicas de peinado
 * 5. Cobro en silla POS Móvil con Nequi/Daviplata/Efectivo, propina y liquidación de comisión 50%
 */

const assert = require('assert');
const prisma = require('../config/prisma');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n=============================================================');
  console.log('📱 INICIANDO PRUEBAS DE INTEGRACIÓN FASE 4: APP MÓVIL 📱');
  console.log('=============================================================\n');

  let passed = 0;
  let total = 0;

  const test = async (name, fn) => {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}`);
      console.error('   Motivo:', err.message);
    }
  };

  let brayanToken;
  let brayanUser;
  let walkInAppointment;

  // TEST 1: Login de Barbero
  await test('1. Autenticación del barbero Brayan Murillo "El Fino"', async () => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneOrEmail: 'brayan@puntofino.com',
        password: 'Barbero2026!',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Esperado 200, recibido ${res.status}`);
    assert(data.success);
    assert(data.token, 'Debe devolver JWT token');
    brayanToken = data.token;
    brayanUser = data.user;
    assert.strictEqual(brayanUser.role, 'BARBER');
  });

  // TEST 2: Vinculación de dispositivo móvil con biometría
  await test('2. Vinculación de dispositivo móvil y biometría (POST /api/auth/register-device)', async () => {
    const res = await fetch(`${API_URL}/auth/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brayanToken}`,
      },
      body: JSON.stringify({
        deviceId: 'device-iphone15-brayan-cali',
        deviceName: 'iPhone 15 Pro de Brayan (Silla 1)',
        biometricsEnabled: true,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Esperado 200, recibido ${res.status}`);
    assert(data.success);
    assert.strictEqual(data.session.deviceId, 'device-iphone15-brayan-cali');
    assert.strictEqual(data.session.biometricsEnabled, true);
    assert(data.refreshToken, 'Debe retornar refresh token');
  });

  // TEST 3: Resumen del día del barbero
  await test('3. Consulta de agenda y resumen del día (GET /api/barbers/me/daily-summary)', async () => {
    const res = await fetch(`${API_URL}/barbers/me/daily-summary`, {
      headers: {
        Authorization: `Bearer ${brayanToken}`,
      },
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Esperado 200, recibido ${res.status}`);
    assert(data.success);
    assert(data.barber.nickname === 'El Fino');
    assert(data.stats, 'Debe incluir objeto de estadísticas');
    assert(Array.isArray(data.appointments), 'Debe devolver lista de citas');
  });

  // TEST 4: Registro rápido de cliente Walk-in en 2 toques
  const corteService = await prisma.service.findFirst({
    where: { name: { contains: 'Corte Clásico' } },
  });
  assert(corteService);

  await test('4. Registro rápido de cliente sin cita Walk-in (POST /api/appointments/walk-in)', async () => {
    const res = await fetch(`${API_URL}/appointments/walk-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brayanToken}`,
      },
      body: JSON.stringify({
        clientName: 'Don Jaime (Vecino Tequendama)',
        clientPhone: '3157891122',
        serviceIds: [corteService.id],
        barberNotes: 'Fade #1 en sienes, cerquillo recto con navaja, remolino atrás a tijera.',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201, `Esperado 201, recibido ${res.status}`);
    assert(data.success);
    assert(data.appointment.isWalkIn, 'isWalkIn debe ser true');
    assert.strictEqual(data.appointment.status, 'IN_PROGRESS', 'Debe quedar en status IN_PROGRESS (En silla)');
    walkInAppointment = data.appointment;
  });

  // TEST 5: Consulta de ficha y notas técnicas privadas de corte
  await test('5. Consulta de ficha técnica privada del cliente (GET /api/users/:id/technical-notes)', async () => {
    const clientId = walkInAppointment.clientId || walkInAppointment.client.id;
    const res = await fetch(`${API_URL}/users/${clientId}/technical-notes`, {
      headers: {
        Authorization: `Bearer ${brayanToken}`,
      },
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Esperado 200, recibido ${res.status}`);
    assert(data.success);
    assert(data.technicalNotes.includes('Fade #1'), 'Debe devolver las notas técnicas guardadas');
  });

  // TEST 6: Actualización de fórmula de corte del cliente
  await test('6. Actualización de fórmula de corte (PUT /api/users/:id/technical-notes)', async () => {
    const clientId = walkInAppointment.clientId || walkInAppointment.client.id;
    const updatedFormula = 'Fade #1.5 con degradado alto, toalla tibia con menta, evitar alcohol en cuello.';

    const res = await fetch(`${API_URL}/users/${clientId}/technical-notes`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brayanToken}`,
      },
      body: JSON.stringify({ technicalNotes: updatedFormula }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Esperado 200, recibido ${res.status}`);
    assert.strictEqual(data.technicalNotes, updatedFormula);
  });

  // TEST 7: Cobro en silla POS Móvil con Nequi y propina
  await test('7. Cobro en silla POS Móvil con Nequi (POST /api/appointments/:id/checkout)', async () => {
    const res = await fetch(`${API_URL}/appointments/${walkInAppointment.id}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brayanToken}`,
      },
      body: JSON.stringify({
        paymentMethod: 'NEQUI',
        tipsCOP: 5000,
        barberNotes: 'Corte terminado. Se usó cera pomada mate.',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Esperado 200, recibido ${res.status}`);
    assert(data.success);
    assert.strictEqual(data.appointment.status, 'COMPLETED');
    assert.strictEqual(data.receipt.paymentMethod, 'NEQUI');
    assert.strictEqual(data.receipt.tipsCOP, 5000);
    assert.strictEqual(data.receipt.totalCollectedCOP, corteService.priceCOP + 5000);
    assert.strictEqual(data.receipt.commissionEarnedCOP, Math.round(corteService.priceCOP * 0.5));
  });

  // Resumen final
  console.log('\n=============================================================');
  console.log(`🏁 RESULTADOS FASE 4 (BACKEND MÓVIL): ${passed}/${total} PRUEBAS EXITOSAS`);
  console.log('=============================================================\n');

  if (passed === total) {
    console.log('✨ TODAS LAS PRUEBAS DE LA APP MÓVIL PASARON SATISFACTORIAMENTE ✨\n');
    process.exit(0);
  } else {
    console.error('⚠️ ALGUNAS PRUEBAS FALLARON.');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Error fatal ejecutando test suite:', err);
  process.exit(1);
});
