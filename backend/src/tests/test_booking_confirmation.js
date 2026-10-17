const { chromium } = require('playwright');
const path = require('path');

async function testBookingSuccess() {
  const screenshotDir = path.resolve('C:/Users/andre/.gemini/antigravity/brain/19d3299f-24f8-40a7-8a32-423bf8e42cf0/screenshots_final_ronda2');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 850 } });

  await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' });
  await page.click('button:has-text("Continuar con el barbero")');
  await page.waitForTimeout(600);

  await page.click('button:has-text("Ver horarios disponibles")');
  await page.waitForTimeout(1000);

  const dayButtons = page.locator('.flex.gap-2\\.5.overflow-x-auto button');
  if (await dayButtons.count() > 1) {
    await dayButtons.nth(1).click();
    await page.waitForTimeout(1000);
  }

  const slotBtn = page.locator('button.tabular-nums:not([disabled])').first();
  await slotBtn.waitFor({ state: 'visible', timeout: 8000 });
  await slotBtn.click();
  await page.waitForTimeout(400);

  await page.click('button:has-text("Continuar con mis datos")');
  await page.waitForTimeout(600);

  await page.fill('input[placeholder="Ej. Mateo Holguín"]', 'Carlos Mendoza');
  await page.fill('input[placeholder="Ej. 312 345 6789"]', '315 889 4432');
  await page.fill('input[placeholder="tu@correo.com"]', 'carlos.mendoza.test@gmail.com');

  await page.click('button:has-text("Confirmar mi cita")');
  await page.waitForSelector('text=¡Te esperamos', { timeout: 10000 });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(screenshotDir, '03_reserva_confirmada_exito.png') });
  console.log('Confirmed screenshot saved: 03_reserva_confirmada_exito.png');

  await browser.close();
}

testBookingSuccess().catch((e) => {
  console.error(e);
  process.exit(1);
});

