const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBookingFix() {
  const screenshotDir = path.resolve('C:/Users/andre/.gemini/antigravity/brain/19d3299f-24f8-40a7-8a32-423bf8e42cf0/screenshots_fix_booking');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 950 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  console.log('1. Navegando a /reservar...');
  await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' });

  console.log('2. Seleccionando servicio...');
  const serviceCards = page.locator('div[role="radio"]');
  await serviceCards.first().click();
  await page.click('button:has-text("Continuar con el barbero")');
  await page.waitForTimeout(500);

  console.log('3. Seleccionando ver horarios...');
  await page.click('button:has-text("Ver horarios disponibles")');
  await page.waitForTimeout(1000);

  // Seleccionar día siguiente o día 2 para asegurar horarios libres
  const dayButtons = page.locator('.flex.gap-2\\.5.overflow-x-auto button');
  if (await dayButtons.count() > 1) {
    console.log('Seleccionando segundo día disponible...');
    await dayButtons.nth(1).click();
    await page.waitForTimeout(1000);
  }

  // Esperar a que aparezcan las franjas horarias
  const slotButtons = page.locator('button:has-text(":")');
  await slotButtons.first().waitFor({ state: 'visible', timeout: 8000 });

  // Buscar un botón de horario que no esté deshabilitado
  const count = await slotButtons.count();
  let clickedSlotText = '';
  for (let i = 0; i < count; i++) {
    const btn = slotButtons.nth(i);
    const isDisabled = await btn.isDisabled();
    if (!isDisabled) {
      clickedSlotText = await btn.innerText();
      await btn.click();
      console.log('Franja seleccionada:', clickedSlotText);
      break;
    }
  }

  await page.waitForTimeout(600);
  console.log('4. Clic en "Continuar con mis datos" (crea SlotHold)...');
  await page.click('button:has-text("Continuar con mis datos")');
  await page.waitForTimeout(1000);

  console.log('5. Llenando datos del formulario de cliente...');
  await page.locator('input[type="text"]').first().fill('Andrés Felipe Sarria Sabogal');
  await page.locator('input[type="tel"]').fill('3185753889');
  await page.locator('input[type="email"]').fill('andressarriasabogal@gmail.com');
  await page.locator('textarea').fill('Degradado medio con tijera arriba, sin patillas');

  // Asegurar que el checkbox de habeas data esté marcado
  const habeasCheckbox = page.locator('input[type="checkbox"]');
  const isChecked = await habeasCheckbox.isChecked();
  if (!isChecked) {
    await habeasCheckbox.check();
  }

  await page.screenshot({ path: path.join(screenshotDir, '01_formulario_llenado_antes_de_confirmar.png') });
  console.log('Screenshot guardado: 01_formulario_llenado_antes_de_confirmar.png');

  console.log('6. Clic en "Confirmar mi cita"...');
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/appointments') && r.request().method() === 'POST' && !r.url().includes('/hold'),
    { timeout: 15000 }
  );
  await page.click('button:has-text("Confirmar mi cita")');

  const response = await responsePromise;
  console.log('API RESPONSE STATUS:', response.status());
  const responseBody = await response.text();
  console.log('API RESPONSE BODY:', responseBody);

  await page.waitForTimeout(1000);

  // Verificar si hay error en pantalla
  const errorAlert = page.locator('.bg-rose-500\\/10');
  const hasError = await errorAlert.count();
  if (hasError > 0) {
    const errorText = await errorAlert.innerText();
    console.error('ERROR DETECTADO EN PANTALLA:', errorText);
    await page.screenshot({ path: path.join(screenshotDir, 'ERROR_confirmacion.png') });
    throw new Error(`Fallo al confirmar: ${errorText}`);
  }

  // Esperar a que la pantalla de confirmación esté visible
  console.log('7. Verificando pantalla de confirmación exitosa...');
  await page.waitForSelector('text=Cita confirmada en Punto Fino', { timeout: 15000 });
  await page.screenshot({ path: path.join(screenshotDir, '02_reserva_confirmada_exito.png') });
  console.log('Screenshot guardado: 02_reserva_confirmada_exito.png');

  // Verificar en base de datos que la cita existe
  const confirmed = await prisma.appointment.findFirst({
    where: { client: { email: 'andressarriasabogal@gmail.com' } },
    include: { barber: { include: { user: true } }, service: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!confirmed) {
    throw new Error('La cita no se encontró en la base de datos.');
  }

  console.log('¡CITA CONFIRMADA EXITOSAMENTE EN BASE DE DATOS!');
  console.log('Código de reserva:', confirmed.bookingCode);
  console.log('Barbero asignado:', confirmed.barber?.user?.name || confirmed.barber?.nickname);
  console.log('Horario:', confirmed.startTime.toISOString(), 'a', confirmed.endTime.toISOString());
  console.log('Cliente:', confirmed.clientPhone);

  await browser.close();
  await prisma.$disconnect();
  console.log('=== PRUEBA DE CORRECCIÓN COMPLETADA CON ÉXITO ===');
}

testBookingFix().catch((err) => {
  console.error('Fallo en la prueba:', err);
  process.exit(1);
});
