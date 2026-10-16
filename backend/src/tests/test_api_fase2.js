// Script de Pruebas de Integración - Fase 2: Backend, Autenticación y Neon DB
const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 EJECUTANDO PRUEBAS DE INTEGRACIÓN FASE 2: API & NEON DB');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // 1. Health Check
  console.log('👉 1. Verificando Health Check...');
  const healthRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  assert(healthRes.status === 200, `Health check responde 200 OK (${healthRes.data?.message})`);

  // 2. Catálogo de Servicios en COP
  console.log('\n👉 2. Verificando Catálogo de Servicios...');
  const servicesRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/services',
    method: 'GET',
  });
  assert(servicesRes.status === 200, 'Obtener servicios responde 200 OK');
  assert(servicesRes.data?.services?.length >= 5, `Se encontraron ${servicesRes.data?.services?.length} servicios en COP.`);
  const sampleService = servicesRes.data?.services?.[0];
  console.log(`   Ejemplo: ${sampleService?.name} ($ ${sampleService?.priceCOP} COP - ${sampleService?.durationMinutes} min)`);

  // 3. Equipo de Barberos
  console.log('\n👉 3. Verificando Equipo de Barberos...');
  const barbersRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/barbers',
    method: 'GET',
  });
  assert(barbersRes.status === 200, 'Obtener barberos responde 200 OK');
  assert(barbersRes.data?.barbers?.length >= 3, `Se encontraron ${barbersRes.data?.barbers?.length} barberos activos.`);
  const brayan = barbersRes.data?.barbers?.find((b) => b.nickname === 'El Fino');
  assert(brayan !== undefined, 'Barbero Brayan "El Fino" presente en Neon DB.');

  // 4. Disponibilidad en Tiempo Real
  console.log('\n👉 4. Verificando Cálculo de Disponibilidad...');
  const availRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/barbers/${brayan.id}/availability?date=2026-10-18&duration=40`,
    method: 'GET',
  });
  assert(availRes.status === 200, 'Disponibilidad responde 200 OK');
  assert(availRes.data?.slots?.length > 0, `Generados ${availRes.data?.slots?.length} slots para el Domingo 18.`);

  // 5. Bloqueo Atómico Temporal (SlotHold 8 min)
  console.log('\n👉 5. Verificando Bloqueo Temporal (SlotHold)...');
  const targetSlot = availRes.data.slots.find((s) => s.available);
  const holdRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/appointments/hold',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      barberId: brayan.id,
      startTime: targetSlot.isoStartTime,
      durationMinutes: 40,
      sessionId: 'test_session_automated_cali',
    }
  );
  assert(holdRes.status === 201, `SlotHold creado con éxito (Expira en: ${holdRes.data?.expiresAt})`);

  // 6. Creación de Cita con Consentimiento Habeas Data (Ley 1581)
  console.log('\n👉 6. Creando Cita con Habeas Data...');
  const createAptRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/appointments',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      barberId: brayan.id,
      serviceIds: [sampleService.id],
      startTime: targetSlot.isoStartTime,
      clientName: 'Santiago Caicedo',
      clientPhone: '3169874512',
      clientEmail: 'santiago.caicedo@cali.co',
      clientNotes: 'Degradado al 0 en patillas.',
      acceptHabeasData: true,
      acceptMarketing: false,
      holdId: holdRes.data?.holdId,
    }
  );
  assert(createAptRes.status === 201, `Cita creada con código de reserva: ${createAptRes.data?.bookingCode}`);
  assert(createAptRes.data?.actionToken !== undefined, 'Token de autogestión generado correctamente.');

  // 7. Consulta Pública por Código
  console.log('\n👉 7. Verificando Consulta Pública por Código...');
  const codeRes = await request({
    host: 'localhost',
    port: 5000,
    path: `/api/appointments/code/${createAptRes.data.bookingCode}`,
    method: 'GET',
  });
  assert(codeRes.status === 200, `Búsqueda por código ${createAptRes.data.bookingCode} exitosa.`);

  // 8. Autenticación Administrador (JWT)
  console.log('\n👉 8. Autenticando Administrador...');
  const adminLoginRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'admin@puntofino.com',
      password: 'PuntoFino2026!',
    }
  );
  assert(adminLoginRes.status === 200, `Admin logueado con éxito. Rol: ${adminLoginRes.data?.user?.role}`);
  const adminToken = adminLoginRes.data?.token;

  // 9. Autenticación Barbero con Registro de Dispositivo Móvil
  console.log('\n👉 9. Autenticando Barbero con Sesión Móvil...');
  const barberLoginRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      email: 'brayan@puntofino.com',
      password: 'Barbero2026!',
      deviceId: 'iphone_15_brayan_uuid_demo',
      deviceName: 'iPhone de Brayan (App Móvil)',
    }
  );
  assert(barberLoginRes.status === 200, `Barbero logueado con éxito. Nickname: ${barberLoginRes.data?.user?.barberProfile?.nickname}`);

  // 10. Ruta Protegida /api/auth/me
  console.log('\n👉 10. Verificando Ruta Protegida con Bearer Token...');
  const meRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(meRes.status === 200, `Token verificado. Usuario autenticado: ${meRes.data?.user?.name}`);

  console.log('\n========================================================');
  console.log(`🏁 RESULTADO DE PRUEBAS: ${passed} / ${total} PRUEBAS SUPERADAS`);
  console.log('========================================================\n');
}

runTests().catch(console.error);
