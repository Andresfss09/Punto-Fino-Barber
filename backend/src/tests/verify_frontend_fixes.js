const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = 'C:/Users/andre/.gemini/antigravity/brain/19d3299f-24f8-40a7-8a32-423bf8e42cf0/screenshots_ajustes_ronda2';

async function verify() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('1. Navegando a la sección de productos y bebidas en la landing...');
  await page.goto('http://localhost:5173/#bebidas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click en pestaña "Nevera & Bebidas"
  const neveraTab = page.locator('button:has-text("Nevera & Bebidas")');
  if (await neveraTab.isVisible()) {
    await neveraTab.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '01_nevera_bebidas_con_imagenes.png'),
    fullPage: false,
  });
  console.log('✅ Captura guardada: 01_nevera_bebidas_con_imagenes.png');

  console.log('2. Navegando al flujo de reserva pública para verificar franjas...');
  await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Seleccionar primer servicio y avanzar al paso 2 (Barbero)
  const nextBtnStep1 = page.locator('button:has-text("Continuar con el barbero")');
  if (await nextBtnStep1.isVisible()) {
    await nextBtnStep1.click();
    await page.waitForTimeout(800);
  }

  // En paso 2 (Barbero), seleccionar "El primero disponible" o Juan David y avanzar a paso 3
  const nextBtnStep2 = page.locator('button:has-text("Ver horarios disponibles")');
  if (await nextBtnStep2.isVisible()) {
    await nextBtnStep2.click();
    await page.waitForTimeout(1200);
  }

  // En paso 3 (Fecha y hora): click en el segundo día (mañana) para garantizar día futuro
  const dayButtons = page.locator('button:has(.tabular-nums)');
  const countDays = await dayButtons.count();
  if (countDays > 1) {
    await dayButtons.nth(1).click();
    await page.waitForTimeout(2000);
  }

  // Verificar que hay botones de franjas horarias
  const slotButtons = page.locator('button:has-text("m.")');
  const slotCount = await slotButtons.count();
  console.log(`Franjas horarias renderizadas para reserva: ${slotCount}`);

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '02_reserva_horarios_disponibles.png'),
    fullPage: false,
  });
  console.log('✅ Captura guardada: 02_reserva_horarios_disponibles.png');

  // Si hay franja, seleccionarla y avanzar a paso 4
  if (slotCount > 0) {
    await slotButtons.first().click();
    await page.waitForTimeout(600);
    const nextBtnStep3 = page.locator('button:has-text("Continuar con mis datos")');
    if (await nextBtnStep3.isVisible()) {
      await nextBtnStep3.click();
      await page.waitForTimeout(1200);
    }
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '03_reserva_recibo_pago_efectivo_transaccion.png'),
    fullPage: false,
  });
  console.log('✅ Captura guardada: 03_reserva_recibo_pago_efectivo_transaccion.png');

  console.log('3. Verificando inicio de sesión como Administrador...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@puntofino.com');
  await page.fill('input[type="password"]', 'PuntoFino2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  console.log('URL tras login admin:', page.url());
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '04_login_admin_dashboard.png'),
    fullPage: false,
  });
  console.log('✅ Captura guardada: 04_login_admin_dashboard.png');

  console.log('4. Verificando inicio de sesión como Barbero...');
  // Limpiar localStorage y volver a /login
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'emanuel@puntofino.com');
  await page.fill('input[type="password"]', 'Barbero2026!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  console.log('URL tras login barbero:', page.url());
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, '05_login_barbero_dashboard.png'),
    fullPage: false,
  });
  console.log('✅ Captura guardada: 05_login_barbero_dashboard.png');

  await browser.close();
  console.log('🎉 Verificación en navegador finalizada con éxito.');
}

verify().catch((err) => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
