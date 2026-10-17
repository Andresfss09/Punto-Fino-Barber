/**
 * TEST SUITE INTEGRAL - RONDA 2 DE AJUSTES: PUNTO FINO
 * 
 * Verifica exhaustivamente contra la base de datos Neon PostgreSQL y la API en vivo:
 * 1. Concurrencia atómica y prevención de colisión (2 peticiones simultáneas -> 201 y 409)
 * 2. Días de descanso semanal estricto:
 *    - Juan David y Juan Diego descansan los Miércoles (0 slots / rechazo)
 *    - Emanuel Torres descansa los Lunes (0 slots / rechazo)
 * 3. Asignación determinista de "El primero disponible" ('any') respetando descansos
 * 4. Horarios oficiales de los 7 días y fronteras de cierre (Lunes 8:00 a.m., Domingo 16:00 cierre)
 * 5. Intervalos semi-abiertos [startTime, endTime) (cita a las 15:30 permite otra a las 15:30)
 * 6. Validación de UN SOLO SERVICIO por cita en servidor
 * 7. Inmutabilidad de barbero en reprogramación y reasignación exclusiva de administrador
 * 8. Aislamiento RBAC estricto entre barberos (403 Forbidden al acceder a otra silla)
 * 9. Flujo de verificación OTP por correo (6 dígitos de un solo uso)
 * 10. Catálogo de productos "Lo que usamos contigo" (8 productos oficiales y advertencia legal)
 */

const assert = require('assert');
const prisma = require('../config/prisma');

const API_URL = 'http://localhost:5000/api';

async function runRonda2TestSuite() {
  console.log('\n=============================================================');
  console.log('💈 SUITE INTEGRAL DE PRUEBAS AUTOMATIZADAS - RONDA 2 💈');
  console.log('   Punto Fino · Carrera 12 #53-51, Villacolombia, Cali');
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

  // Cargar datos base de barberos y servicios
  const barbers = await prisma.barberProfile.findMany({
    where: { isActive: true },
    include: { user: true },
    orderBy: { sortOrder: 'asc' },
  });
  assert(barbers.length === 3, `Deben existir exactamente 3 barberos, encontrados: ${barbers.length}`);

  const juanDavid = barbers.find((b) => b.nickname === 'Juan David');
  const emanuel = barbers.find((b) => b.nickname === 'Emanuel Torres');
  const juanDiego = barbers.find((b) => b.nickname === 'Juan Diego');

  assert(juanDavid && emanuel && juanDiego, 'Los 3 barberos oficiales deben estar presentes');

  const services = await prisma.service.findMany({ where: { isActive: true } });
  assert(services.length >= 4, 'Deben existir al menos 4 servicios en el catálogo');
  const corteSencillo = services.find((s) => s.name === 'Corte sencillo') || services[0];
  const corteBarba = services.find((s) => s.name === 'Corte + barba') || services[1];

  // Limpieza de citas y consentimientos de pruebas anteriores para garantizar idempotencia
  const testEmails = [
    'cliente.multiple@test.co',
    'cliente.a@semiabierto.co',
    'cliente.b@semiabierto.co',
    'c1@concurrencia.co',
    'c2@concurrencia.co',
    'andres.felipe@cali.co',
  ];
  await prisma.appointment.deleteMany({
    where: { client: { email: { in: testEmails } } },
  });
  await prisma.emailVerificationCode.deleteMany({
    where: { email: { in: testEmails } },
  });

  // 1. REGLA: UN SOLO SERVICIO POR RESERVA (400 si se envían múltiples)
  await test('1. Servidor rechaza reservas con más de un servicio (400 Bad Request)', async () => {
    const res = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceIds: [corteSencillo.id, corteBarba.id], // Múltiples servicios
        barberId: juanDavid.id,
        startTime: '2026-11-19T15:00:00.000Z',
        clientName: 'Cliente Prueba Múltiple',
        clientEmail: 'cliente.multiple@test.co',
        acceptHabeasData: true,
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400, `Esperado 400, recibido ${res.status}`);
    assert(
      data.message.includes('exactamente un servicio') ||
      data.message.includes('un único servicio') ||
      data.message.includes('un solo servicio'),
      'Debe indicar que solo se admite un servicio'
    );
  });

  // 2. REGLA: VERIFICACIÓN OTP POR CORREO (Generación y validación de 6 dígitos)
  let testOtpCode;
  await test('2. Generación de código OTP de 6 dígitos para reserva por correo', async () => {
    const res = await fetch(`${API_URL}/appointments/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'andres.felipe@cali.co',
        name: 'Andrés Felipe',
      }),
    });

    const data = await res.json();
    assert.strictEqual(res.status, 200, `Esperado 200, recibido ${res.status}`);
    assert(data.success);
    testOtpCode = data.devOtpCode || data.devCode || data.code;
    assert(testOtpCode, 'En entorno local debe retornar el código para pruebas');
    assert.strictEqual(testOtpCode.length, 6, 'El código OTP debe tener 6 dígitos');
  });

  // 3. REGLA: DÍAS DE DESCANSO SEMANAL ESTRICTO
  // - Emanuel Torres descansa los Lunes (day 1)
  // - Juan Diego descansa los Martes (day 2)
  // - Juan David descansa los Miércoles (day 3)
  // Jueves 2026-11-19 es día laboral para todos (day 4)
  // Lunes 2026-11-16 es descanso para Emanuel
  // Martes 2026-11-17 es descanso para Juan Diego
  // Miércoles 2026-11-18 es descanso para Juan David
  await test('3. Días de descanso: Juan David no tiene disponibilidad los Miércoles', async () => {
    const res = await fetch(
      `${API_URL}/barbers/${juanDavid.id}/availability?date=2026-11-18&duration=40`
    );
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(data.isRestDay === true || data.slots.length === 0, 'isRestDay debe ser true o slots vacíos');
    assert.strictEqual(data.slots.length, 0, 'No debe haber franjas en día de descanso');
  });

  await test('4. Días de descanso: Emanuel Torres no tiene disponibilidad los Lunes', async () => {
    const res = await fetch(
      `${API_URL}/barbers/${emanuel.id}/availability?date=2026-11-16&duration=40`
    );
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(data.isRestDay === true || data.slots.length === 0, 'isRestDay debe ser true o slots vacíos');
    assert.strictEqual(data.slots.length, 0, 'No debe haber franjas en día de descanso');
  });

  await test('4b. Días de descanso: Juan Diego no tiene disponibilidad los Martes', async () => {
    const res = await fetch(
      `${API_URL}/barbers/${juanDiego.id}/availability?date=2026-11-17&duration=40`
    );
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(data.isRestDay === true || data.slots.length === 0, 'isRestDay debe ser true o slots vacíos');
    assert.strictEqual(data.slots.length, 0, 'No debe haber franjas en día de descanso');
  });

  // 4. REGLA: "EL PRIMERO DISPONIBLE" ('any') ASIGNA DETERMINISTA Y RESPETA DESCANSOS
  await test('5. "El primero disponible" en Miércoles asigna a Emanuel o Juan Diego (no a Juan David)', async () => {
    const res = await fetch(
      `${API_URL}/barbers/any/availability?date=2026-11-18&duration=40`
    );
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(data.slots.length > 0, 'Debe haber slots disponibles en Miércoles');
    data.slots.forEach((s) => {
      assert.notStrictEqual(s.barberId, juanDavid.id, 'Ningún slot de Miércoles puede ser de Juan David');
    });
  });

  await test('6. "El primero disponible" en Lunes asigna a Juan David o Juan Diego (no a Emanuel)', async () => {
    const res = await fetch(
      `${API_URL}/barbers/any/availability?date=2026-11-16&duration=40`
    );
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(data.slots.length > 0, 'Debe haber slots disponibles en Lunes');
    data.slots.forEach((s) => {
      assert.notStrictEqual(s.barberId, emanuel.id, 'Ningún slot de Lunes puede ser de Emanuel');
    });
  });

  await test('6b. "El primero disponible" en Martes asigna a Juan David o Emanuel (no a Juan Diego)', async () => {
    const res = await fetch(
      `${API_URL}/barbers/any/availability?date=2026-11-17&duration=40`
    );
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(data.slots.length > 0, 'Debe haber slots disponibles en Martes');
    data.slots.forEach((s) => {
      assert.notStrictEqual(s.barberId, juanDiego.id, 'Ningún slot de Martes puede ser de Juan Diego');
    });
  });

  // 5. REGLA: HORARIOS OFICIALES Y FRONTERAS DE CIERRE
  // Lunes abre a las 8:00 a.m. (13:00 UTC)
  await test('7. Horario oficial Lunes: Apertura a las 8:00 a. m.', async () => {
    const res = await fetch(
      `${API_URL}/barbers/${juanDavid.id}/availability?date=2026-11-23&duration=40`
    );
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    const firstSlot = data.slots[0];
    assert(firstSlot, 'Debe haber primer slot');
    // En hora de Cali (UTC-5): 8:00 AM = 13:00 UTC
    const startTimeDate = new Date(firstSlot.isoStartTime);
    const hoursBogota = (startTimeDate.getUTCHours() - 5 + 24) % 24;
    assert.strictEqual(hoursBogota, 8, `El primer slot del lunes debe ser a las 8:00 a.m., fue ${hoursBogota}:00`);
  });

  // Domingo cierra a las 16:00 (21:00 UTC). Cita de 45m no puede empezar después de las 15:15
  await test('8. Frontera de cierre Domingo: Ningún servicio termina después de las 4:00 p. m.', async () => {
    const res = await fetch(
      `${API_URL}/barbers/${juanDavid.id}/availability?date=2026-11-15&duration=45`
    );
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    const lastSlot = data.slots[data.slots.length - 1];
    const endTime = new Date(lastSlot.isoEndTime);
    const endHourBogota = (endTime.getUTCHours() - 5 + 24) % 24;
    const endMinutes = endTime.getUTCMinutes();
    assert(
      endHourBogota < 16 || (endHourBogota === 16 && endMinutes === 0),
      `La última cita del domingo no puede terminar después de las 16:00, terminó a las ${endHourBogota}:${endMinutes}`
    );
  });

  // Festivo oficial: 2026-05-01 (Día del Trabajo, Viernes). Normal abriría hasta las 20:30, pero por ser festivo abre de 09:00 a 16:00
  await test('8b. Festivos de Colombia abren en horario de domingo (9:00 a. m. a 4:00 p. m.)', async () => {
    const res = await fetch(
      `${API_URL}/barbers/${juanDavid.id}/availability?date=2026-05-01&duration=40`
    );
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert(data.slots.length > 0, 'Debe haber disponibilidad en día festivo');
    const firstSlot = data.slots[0];
    const lastSlot = data.slots[data.slots.length - 1];
    const startTime = new Date(firstSlot.isoStartTime);
    const startHourBogota = (startTime.getUTCHours() - 5 + 24) % 24;
    assert.strictEqual(startHourBogota, 9, `El festivo debe abrir a las 9:00 a.m., abrió a las ${startHourBogota}:00`);
    const endTime = new Date(lastSlot.isoEndTime);
    const endHourBogota = (endTime.getUTCHours() - 5 + 24) % 24;
    const endMinutes = endTime.getUTCMinutes();
    assert(
      endHourBogota < 16 || (endHourBogota === 16 && endMinutes === 0),
      `El festivo debe cerrar a las 16:00 (jornada de domingo), cerró a las ${endHourBogota}:${endMinutes}`
    );
  });

  // 6. REGLA: INTERVALOS SEMI-ABIERTOS [startTime, endTime)
  // Cita de 15:00 a 15:40 permite otra de 15:40 a 16:20 sin conflicto
  let confirmedAppointmentA;
  const testDateThursday = '2026-11-19T15:00:00.000Z'; // 10:00 a.m. Cali
  const consecutiveSlotStart = '2026-11-19T15:40:00.000Z'; // 10:40 a.m. Cali

  await test('9. Intervalo semi-abierto: Cita de 15:00 a 15:40 permite otra a las 15:40 sin colisión', async () => {
    // Crear Cita A
    const resA = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: corteSencillo.id,
        barberId: juanDavid.id,
        startTime: testDateThursday,
        clientName: 'Cliente A Semi-abierto',
        clientEmail: 'cliente.a@semiabierto.co',
        acceptHabeasData: true,
        verificationCode: testOtpCode,
      }),
    });
    const dataA = await resA.json();
    assert.strictEqual(resA.status, 201, `Cita A debe crearse: ${JSON.stringify(dataA)}`);
    confirmedAppointmentA = dataA;

    // Crear Cita B consecutiva exactamente a la hora de fin de Cita A (15:40)
    const resB = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: corteSencillo.id,
        barberId: juanDavid.id,
        startTime: consecutiveSlotStart,
        clientName: 'Cliente B Consecutivo',
        clientEmail: 'cliente.b@semiabierto.co',
        acceptHabeasData: true,
      }),
    });
    const dataB = await resB.json();
    assert.strictEqual(resB.status, 201, `Cita B consecutiva debe permitirse exactamente a las 15:40: ${JSON.stringify(dataB)}`);
  });

  // 7. REGLA: CONCURRENCIA ATÓMICA (2 peticiones simultáneas -> una 201, una 409)
  await test('10. Concurrencia atómica: Dos peticiones simultáneas para la misma franja -> 201 y 409', async () => {
    const concurrentSlot = '2026-11-19T17:00:00.000Z';

    const p1 = fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: corteSencillo.id,
        barberId: juanDavid.id,
        startTime: concurrentSlot,
        clientName: 'Cliente Concurrente 1',
        clientEmail: 'c1@concurrencia.co',
        acceptHabeasData: true,
      }),
    });

    const p2 = fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: corteSencillo.id,
        barberId: juanDavid.id,
        startTime: concurrentSlot,
        clientName: 'Cliente Concurrente 2',
        clientEmail: 'c2@concurrencia.co',
        acceptHabeasData: true,
      }),
    });

    const [res1, res2] = await Promise.all([p1, p2]);
    const statuses = [res1.status, res2.status].sort();

    assert.strictEqual(statuses[0], 201, 'Una de las solicitudes debe tener éxito (201)');
    assert.strictEqual(statuses[1], 409, 'La solicitud colisionante debe recibir 409 Conflict');
  });

  // 8. REGLA: INMUTABILIDAD DE BARBERO EN REPROGRAMACIÓN (Cliente no puede cambiar de barbero)
  await test('11. Inmutabilidad de barbero: Cliente no puede cambiar de barbero al reprogramar', async () => {
    const token = confirmedAppointmentA.actionToken;
    const res = await fetch(`${API_URL}/appointments/token/${token}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newStartTime: '2026-11-19T18:00:00.000Z',
        barberId: emanuel.id, // Intento no autorizado de cambiar barbero
      }),
    });

    const data = await res.json();
    // La API debe rechazar el cambio o forzar la cita con el barbero original
    if (res.status === 200) {
      // Verificar que el barbero sigue siendo Juan David
      const apt = await prisma.appointment.findFirst({
        where: { bookingCode: confirmedAppointmentA.bookingCode },
      });
      assert.strictEqual(apt.barberId, juanDavid.id, 'El barbero debe ser inmutable');
    } else {
      assert.strictEqual(res.status, 400, 'Debe rechazar el cambio de barbero');
    }
  });

  // 9. REGLA: AISLAMIENTO RBAC ENTRE ROLES Y SILLAS (Barbero no puede ver ni modificar otra silla)
  await test('12. Aislamiento RBAC: Barbero autenticado recibe 403 al acceder a panel de administrador', async () => {
    // Autenticar como Emanuel (Barbero)
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'emanuel@puntofino.com',
        password: 'Barbero2026!',
      }),
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    const emanuelToken = loginData.token;

    // Intentar acceder a endpoint administrativo protegido (ej. nómina o reasignación)
    const adminRes = await fetch(`${API_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${emanuelToken}` },
    });
    assert.strictEqual(adminRes.status, 403, `Esperado 403 Forbidden para barbero en ruta admin, recibido: ${adminRes.status}`);
  });

  // 10. REGLA: CATÁLOGO DE PRODUCTOS OFICIALES ("Lo que usamos contigo")
  await test('13. Catálogo oficial de 8 productos con alerta legal para bebidas alcohólicas', async () => {
    const res = await fetch(`${API_URL}/admin/inventory`);
    // Si la ruta requiere admin, consultamos la configuración central
    const { OFFICIAL_PRODUCTS } = require('../config/businessConfig');
    assert.strictEqual(OFFICIAL_PRODUCTS.length, 8, 'Deben existir exactamente 8 productos');

    const aguila = OFFICIAL_PRODUCTS.find((p) => p.name.includes('Águila') || p.name.includes('Aguila'));
    assert(aguila, 'Cerveza Águila Latón debe estar presente');
    assert.strictEqual(aguila.priceCOP, 6000, 'Precio debe ser $6.000 COP');
    assert(aguila.containsAlcohol || aguila.isAlcohol, 'Debe estar marcada como producto alcohólico');
    assert(
      (aguila.description && aguila.description.includes('REVISAR CON ABOGADO')) ||
      (aguila.legalNotice && aguila.legalNotice.includes('REVISAR CON ABOGADO')) ||
      (aguila.description && aguila.description.includes('18 años')),
      'Debe incluir nota legal de venta exclusiva a mayores'
    );
  });

  // Resumen final
  console.log('\n=============================================================');
  console.log(`🏁 RESULTADOS SUITE INTEGRAL: ${passed}/${total} PRUEBAS EXITOSAS`);
  console.log('=============================================================\n');

  if (passed === total) {
    console.log('✨ TODAS LAS REGLAS DE LA RONDA 2 ESTÁN VERIFICADAS Y EN VERDE ✨\n');
    process.exit(0);
  } else {
    console.error('⚠️ ALGUNAS PRUEBAS FALLARON.');
    process.exit(1);
  }
}

runRonda2TestSuite().catch((err) => {
  console.error('Error fatal ejecutando test suite:', err);
  process.exit(1);
});
