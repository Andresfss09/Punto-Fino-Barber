const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifyDurationSlots() {
  const screenshotDir = path.resolve('C:/Users/andre/.gemini/antigravity/brain/19d3299f-24f8-40a7-8a32-423bf8e42cf0/screenshots_horarios_dinamicos');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1100 },
  });
  const page = await context.newPage();

  async function captureService(serviceIndex, filename) {
    await page.goto('http://localhost:5173/reservar', { waitUntil: 'networkidle' });
    const serviceCards = page.locator('div[role="radio"]');
    await serviceCards.nth(serviceIndex).click();
    await page.click('button:has-text("Continuar con el barbero")');
    await page.waitForTimeout(400);
    await page.click('button:has-text("Ver horarios disponibles")');
    await page.waitForSelector('button:has-text("09:00")', { timeout: 10000 });
    await page.waitForTimeout(600);

    // Scroll suave para centrar la tarjeta de horarios
    await page.evaluate(() => {
      window.scrollTo(0, 160);
    });
    await page.waitForTimeout(500);

    await page.screenshot({ path: path.join(screenshotDir, filename) });
    console.log('Guardado:', filename);
  }

  console.log('1. Capturando 35 min...');
  await captureService(0, '01_horarios_35min_corte_cejas.png');

  console.log('2. Capturando 45 min...');
  await captureService(1, '02_horarios_45min_ritual_barba.png');

  console.log('3. Capturando 60 min...');
  await captureService(2, '03_horarios_60min_platinium.png');

  await browser.close();
  console.log('¡Verificación y capturas completadas con éxito!');
}

verifyDurationSlots().catch((err) => {
  console.error('Error durante la verificación:', err);
  process.exit(1);
});

