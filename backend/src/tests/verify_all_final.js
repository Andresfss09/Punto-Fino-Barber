const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function runVerification() {
  const screenshotDir = path.resolve('C:/Users/andre/.gemini/antigravity/brain/19d3299f-24f8-40a7-8a32-423bf8e42cf0/screenshots_final_ronda2');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 },
  });
  const page = await context.newPage();

  console.log('1. Navegando al flujo público de reserva...');
  await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Paso 1: Seleccionar Servicio y continuar
  console.log('Paso 1: Seleccionar Servicio...');
  await page.click('button:has-text("Continuar con el barbero")');
  await page.waitForTimeout(1000);

  // Paso 2: Seleccionar Barbero (Emanuel Torres o El primero disponible)
  console.log('Paso 2: Seleccionar Barbero...');
  await page.click('button:has-text("Ver horarios disponibles")');
  await page.waitForTimeout(1500);

  // Paso 3: Seleccionar Horario disponible (cambiar a día siguiente si es de noche)
  console.log('Paso 3: Seleccionar día y horario disponible...');
  const dayButtons = page.locator('.flex.gap-2\\.5.overflow-x-auto button');
  if (await dayButtons.count() > 1) {
    await dayButtons.nth(1).click();
    await page.waitForTimeout(1000);
  }

  const slotBtn = page.locator('button.tabular-nums:not([disabled])').first();
  await slotBtn.waitFor({ state: 'visible', timeout: 8000 });
  await slotBtn.click();
  await page.waitForTimeout(600);

  await page.screenshot({ path: path.join(screenshotDir, '01_reserva_slot_seleccionado.png') });
  console.log('Screenshot guardado: 01_reserva_slot_seleccionado.png');

  // Continuar con mis datos
  await page.click('button:has-text("Continuar con mis datos")');
  await page.waitForTimeout(800);

  // Paso 4: Llenar datos (Nombre, Celular, Correo) sin OTP
  console.log('Paso 4: Llenando datos del cliente con celular...');
  await page.fill('input[placeholder="Ej. Mateo Holguín"]', 'Carlos Mendoza');
  await page.fill('input[placeholder="Ej. 312 345 6789"]', '315 889 4432');
  await page.fill('input[placeholder="tu@correo.com"]', 'carlos.mendoza.test@gmail.com');

  await page.screenshot({ path: path.join(screenshotDir, '02_reserva_formulario_con_celular.png') });
  console.log('Screenshot guardado: 02_reserva_formulario_con_celular.png');

  // Click directo a "Confirmar mi cita" (sin código OTP)
  console.log('Confirmando cita sin OTP...');
  await page.click('button:has-text("Confirmar mi cita")');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: path.join(screenshotDir, '03_reserva_confirmada_exito.png') });
  console.log('Screenshot guardado: 03_reserva_confirmada_exito.png');

  // 2. Iniciar sesión como Administrador (Juan David)
  console.log('2. Iniciando sesión como Administrador...');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'juandavid@puntofino.com');
  await page.fill('input[type="password"]', 'Barbero2026!');
  await page.click('button:has-text("Ingresar a mi panel")');
  await page.waitForTimeout(2500);

  // Tablero Admin
  await page.screenshot({ path: path.join(screenshotDir, '04_admin_dashboard_sin_errores.png') });
  console.log('Screenshot guardado: 04_admin_dashboard_sin_errores.png');

  // Sección Barberos & Descansos
  console.log('3. Visitando /admin/barbers...');
  await page.goto('http://localhost:5173/admin/barbers', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  await page.screenshot({ path: path.join(screenshotDir, '05_admin_barberos_descansos_activos.png') });
  console.log('Screenshot guardado: 05_admin_barberos_descansos_activos.png');

  // Sección Servicios y Productos con Imagen
  console.log('4. Visitando /admin/services...');
  await page.goto('http://localhost:5173/admin/services', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Abrir modal de nuevo servicio
  await page.click('button:has-text("Nuevo servicio")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotDir, '06_admin_modal_servicio_con_imagen.png') });
  console.log('Screenshot guardado: 06_admin_modal_servicio_con_imagen.png');

  // Cerrar modal
  await page.click('button:has-text("Cancelar")');
  await page.waitForTimeout(500);

  // Cambiar a pestaña de productos
  await page.click('button:has-text("Productos Rolda & Nevera")');
  await page.waitForTimeout(800);

  // Abrir modal de nuevo producto
  await page.click('button:has-text("Nuevo producto")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotDir, '07_admin_modal_producto_con_imagen.png') });
  console.log('Screenshot guardado: 07_admin_modal_producto_con_imagen.png');

  await browser.close();
  console.log('¡Verificación completa exitosa!');
}

runVerification().catch((err) => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});
