/**
 * Suite de Pruebas de Integración - FASE 3
 * Punto Fino Barbería (Santiago de Cali)
 * 
 * 1. Concurrencia atómica y protección contra doble reserva (SlotHold y Appointment)
 * 2. Validación de archivo .ics (RFC 5545 iCalendar con alarma PT2H)
 * 3. Despacho y auditoría de la terna de correos (Cliente, Barbero, Admin)
 * 4. Webhook de Resend (Eventos email.delivered y email.bounced en EmailAuditLog)
 * 5. Autogestión segura por token HMAC de un solo uso (Reprogramar y Cancelar)
 */

const assert = require('assert');
const prisma = require('../config/prisma');
const { generateICS } = require('../services/calendarService');
const emailQueue = require('../services/emailQueue');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n=============================================================');
  console.log('💈 INICIANDO PRUEBAS DE INTEGRACIÓN FASE 3 - PUNTO FINO 💈');
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

  // Obtener barbero y servicio del seeder
  const brayan = await prisma.barberProfile.findFirst({
    where: { nickname: 'El Fino' },
    include: { user: true },
  });
  assert(brayan, 'Barbero Brayan Murillo "El Fino" debe existir en la base de datos');

  const corteService = await prisma.service.findFirst({
    where: { name: { contains: 'Corte Clásico' } },
  });
  assert(corteService, 'Servicio de corte debe existir en la base de datos');

  // TEST 1: Validación de formato RFC 5545 del archivo .ics
  await test('1. Validación RFC 5545 de calendario .ics con alarma de 2 horas', async () => {
    const mockApt = {
      id: 'apt-test-123',
      bookingCode: 'PF-9999',
      startTime: new Date('2026-11-10T15:00:00.000Z'),
      endTime: new Date('2026-11-10T15:40:00.000Z'),
      totalPriceCOP: 25000,
      actionToken: 'tok_test_abc123',
    };
    const mockClient = { name: 'Sebastián Eder', phone: '+573159998877' };
    const mockBarber = { nickname: 'El Fino', name: 'Brayan Murillo' };
    const mockServices = [{ name: 'Corte Clásico Punto Fino', durationMinutes: 40 }];

    const ics = generateICS(mockApt, mockClient, mockBarber, mockServices);

    assert(ics.includes('BEGIN:VCALENDAR'), 'Debe contener BEGIN:VCALENDAR');
    assert(ics.includes('VERSION:2.0'), 'Debe especificar VERSION:2.0');
    assert(ics.includes('BEGIN:VEVENT'), 'Debe contener BEGIN:VEVENT');
    assert(ics.includes('UID:PF-9999-apt-test-123@puntofinobarberia.com'), 'UID debe ser determinístico');
    assert(ics.includes('DTSTART:20261110T150000Z'), 'DTSTART debe coincidir con formato iCal');
    assert(ics.includes('SUMMARY:Cita en Punto Fino — El Fino [PF-9999]'), 'Resumen debe incluir código y barbero');
    assert(ics.includes('TRIGGER:-PT2H'), 'Alarma debe disparar 2 horas antes (-PT2H)');
    assert(ics.includes('END:VCALENDAR'), 'Debe cerrar con END:VCALENDAR');
  });

  // TEST 2: Bloqueo atómico temporal por 8 minutos (SlotHold)
  let holdResultA;
  const testSlotStart = new Date(Date.now() + 10 * 24 * 3600 * 1000); // 10 días en el futuro
  testSlotStart.setMinutes(0, 0, 0);

  await test('2. Bloqueo atómico de cupo por 8 minutos (POST /api/appointments/hold)', async () => {
    const res = await fetch(`${API_URL}/appointments/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barberId: brayan.id,
        startTime: testSlotStart.toISOString(),
        durationMinutes: 40,
        sessionId: 'session_cliente_A',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201, `Esperado 201, recibido ${res.status}: ${JSON.stringify(data)}`);
    assert(data.success, 'Respuesta debe ser exitosa');
    const holdId = data.holdId || data.data?.holdId;
    assert(holdId, 'Debe devolver holdId');
    holdResultA = { holdId, ...data };
  });

  // TEST 3: Prevención de colisión por SlotHold activo de otro cliente (409 Conflict)
  await test('3. Prevención de colisión: Cliente B intenta apartar el mismo turno (409 Conflict)', async () => {
    const res = await fetch(`${API_URL}/appointments/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barberId: brayan.id,
        startTime: testSlotStart.toISOString(),
        durationMinutes: 40,
        sessionId: 'session_cliente_B', // Otra sesión
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 409, `Esperado 409 Conflict, recibido ${res.status}`);
    assert(data.message.includes('Alguien está completando la reserva'), 'Debe advertir que el turno está retenido');
  });

  // TEST 4: Crear cita confirmada asociada al hold con consentimiento de Habeas Data
  let createdAppointment;
  await test('4. Crear cita confirmada con Habeas Data Ley 1581 (POST /api/appointments)', async () => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceIds: [corteService.id],
        barberId: brayan.id,
        startTime: testSlotStart.toISOString(),
        clientName: 'Alejandro Lloreda',
        clientPhone: '3165551234',
        clientEmail: 'alejandro.lloreda@cali.co',
        clientNotes: 'Corte clásico con toalla tibia y pomada mate.',
        acceptHabeasData: true,
        acceptMarketing: true,
        holdId: holdResultA.holdId,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 201, `Esperado 201, recibido ${res.status}: ${JSON.stringify(data)}`);
    assert(data.success, 'Respuesta debe ser exitosa');
    const bookingCode = data.bookingCode || data.data?.bookingCode;
    const actionToken = data.actionToken || data.data?.actionToken;
    assert(bookingCode && bookingCode.startsWith('PF-'), 'Código de reserva debe iniciar con PF-');
    assert(actionToken, 'Debe devolver token de autogestión');
    createdAppointment = { bookingCode, actionToken, ...data };
  });

  // TEST 5: Prevención de doble reserva de cita confirmada (409 Conflict)
  await test('5. Prevención de doble reserva sobre cita ya confirmada (409 Conflict)', async () => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceIds: [corteService.id],
        barberId: brayan.id,
        startTime: testSlotStart.toISOString(),
        clientName: 'Tercer Cliente',
        clientPhone: '3179998877',
        clientEmail: 'tercero@cali.co',
        acceptHabeasData: true,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 409, `Esperado 409 Conflict, recibido ${res.status}`);
    assert(
      data.message.includes('ya no está disponible') ||
      data.message.includes('ya fue reservado') ||
      data.message.includes('acaba de ser ocupado')
    );
  });

  // TEST 6: Verificación de despacho y auditoría de la terna de correos
  let emailLogs;
  await test('6. Auditoría y despacho de la terna de correos (Cliente, Barbero, Admin)', async () => {
    const appointmentId = createdAppointment.appointment?.id || createdAppointment.id;
    
    // Esperar hasta que el servidor procese los 3 correos (hasta 5 segundos)
    for (let i = 0; i < 50; i++) {
      emailLogs = await prisma.emailAuditLog.findMany({
        where: { appointmentId },
        orderBy: { createdAt: 'asc' },
      });
      if (emailLogs.length === 3 && emailLogs.every((l) => l.status === 'SENT')) {
        break;
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    assert.strictEqual(emailLogs.length, 3, `Deben existir 3 registros de auditoría de correo, encontrados ${emailLogs.length}`);

    const clientLog = emailLogs.find((l) => l.recipientType === 'CLIENT');
    const barberLog = emailLogs.find((l) => l.recipientType === 'BARBER');
    const adminLog = emailLogs.find((l) => l.recipientType === 'ADMIN');

    assert(clientLog, 'Debe existir log para CLIENT');
    assert(barberLog, 'Debe existir log para BARBER');
    assert(adminLog, 'Debe existir log para ADMIN');

    assert.strictEqual(clientLog.status, 'SENT', 'Estado de cliente debe ser SENT');
    assert.strictEqual(barberLog.status, 'SENT', 'Estado de barbero debe ser SENT');
    assert.strictEqual(adminLog.status, 'SENT', 'Estado de admin debe ser SENT');

    assert(clientLog.providerId, 'Debe registrar providerId');
    assert(clientLog.sentAt, 'Debe registrar marca temporal sentAt');
  });

  // TEST 7: Webhook de Resend - Entrega exitosa (email.delivered)
  await test('7. Webhook de Resend: Recepción de evento email.delivered', async () => {
    const clientLog = emailLogs.find((l) => l.recipientType === 'CLIENT');

    const res = await fetch(`${API_URL}/webhooks/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email.delivered',
        created_at: new Date().toISOString(),
        data: {
          email_id: clientLog.providerId,
          to: [clientLog.toEmail],
          subject: clientLog.subject,
        },
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Webhook debe responder 200 OK');
    assert(data.received, 'Webhook debe confirmar recepción');

    // Verificar en base de datos
    const updatedLog = await prisma.emailAuditLog.findUnique({
      where: { id: clientLog.id },
    });
    assert.strictEqual(updatedLog.status, 'DELIVERED', 'Estado debe actualizarse a DELIVERED en Neon DB');
  });

  // TEST 8: Webhook de Resend - Rebote de correo (email.bounced)
  await test('8. Webhook de Resend: Recepción de evento email.bounced con registro de error', async () => {
    const barberLog = emailLogs.find((l) => l.recipientType === 'BARBER');

    const res = await fetch(`${API_URL}/webhooks/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email.bounced',
        created_at: new Date().toISOString(),
        data: {
          email_id: barberLog.providerId,
          bounce_type: 'Buzón lleno en servidor del barbero',
        },
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Webhook debe responder 200 OK');

    const updatedLog = await prisma.emailAuditLog.findUnique({
      where: { id: barberLog.id },
    });
    assert.strictEqual(updatedLog.status, 'BOUNCED', 'Estado debe ser BOUNCED');
    assert(updatedLog.lastError.includes('Buzón lleno'), 'Debe persistir detalle del rebote');
  });

  // TEST 9: Reprogramar cita mediante token seguro de un solo uso
  let newActionToken;
  const rescheduledSlot = new Date(testSlotStart.getTime() + 2 * 3600 * 1000); // 2 horas más tarde

  await test('9. Autogestión: Reprogramar cita mediante token (POST /token/:token/reschedule)', async () => {
    const token = createdAppointment.actionToken;
    const res = await fetch(`${API_URL}/appointments/token/${token}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStartTime: rescheduledSlot.toISOString(),
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Esperado 200, recibido ${res.status}: ${JSON.stringify(data)}`);
    assert(data.success, 'Debe reprogramar con éxito');
    newActionToken = data.actionToken || data.data?.actionToken;
    assert(newActionToken, 'Debe devolver un NUEVO actionToken');
    assert.notStrictEqual(newActionToken, token, 'El token debe renovarse tras su uso');
  });

  // TEST 10: Invalidez de token antiguo tras ser usado (One-time use)
  await test('10. Seguridad: Token antiguo queda invalidado tras su primer uso', async () => {
    const token = createdAppointment.actionToken;
    const res = await fetch(`${API_URL}/appointments/token/${token}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    assert.strictEqual(res.status, 404, `Token gastado debe retornar 404, recibido ${res.status}`);
  });

  // TEST 11: Cancelar cita con el nuevo token válido
  await test('11. Autogestión: Cancelar cita con el nuevo token válido (POST /token/:token/cancel)', async () => {
    const res = await fetch(`${API_URL}/appointments/token/${newActionToken}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, 'Debe responder 200 OK');
    assert(data.message.includes('cancelada exitosamente'));

    // Verificar en Neon DB que el estado sea CANCELLED y actionToken sea null
    const aptId = createdAppointment.appointment?.id || createdAppointment.id;
    const aptInDb = await prisma.appointment.findUnique({
      where: { id: aptId },
    });
    assert.strictEqual(aptInDb.status, 'CANCELLED');
    assert.strictEqual(aptInDb.actionToken, null, 'ActionToken debe ser nulo tras cancelación');
  });

  // Resumen final
  console.log('\n=============================================================');
  console.log(`🏁 RESULTADOS FASE 3: ${passed}/${total} PRUEBAS EXITOSAS`);
  console.log('=============================================================\n');

  if (passed === total) {
    console.log('✨ TODAS LAS PRUEBAS DE FASE 3 PASARON SATISFACTORIAMENTE EN NEON DB ✨\n');
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
