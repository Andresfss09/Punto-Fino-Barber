const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testSalaryUI() {
  const screenshotsDir = 'C:\\Users\\andre\\.gemini\\antigravity\\brain\\19d3299f-24f8-40a7-8a32-423bf8e42cf0\\screenshots_approved_salaries';
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

    console.log('Logging in as Juan David (Admin)...');
    await page.fill('input[type="email"]', 'juandavid@puntofino.com');
    await page.fill('input[type="password"]', 'Barbero2026!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2000);

    console.log('Navigating to Admin Panel...');
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Click "Nómina y Liquidaciones" tab
    console.log('Clicking Nómina y Liquidaciones tab...');
    const payrollTab = page.locator('button:has-text("Nómina y Liquidaciones")');
    if (await payrollTab.isVisible()) {
      await payrollTab.click();
      await page.waitForTimeout(1500);
    }

    // Capture screenshot of Nómina tab
    console.log('Capturing Nómina tab screenshot...');
    await page.screenshot({
      path: path.join(screenshotsDir, '01_nomina_liquidaciones_contador_aprobado.png'),
      fullPage: true,
    });

    // Find and click on the "Base:" button on one of the barber cards to open modal
    console.log('Clicking edit base salary button on Emanuel Torres...');
    const baseBtn = page.locator('button[title="Editar Salario Base y Comisión de Productos"]').first();
    if (await baseBtn.isVisible()) {
      await baseBtn.click();
      await page.waitForTimeout(1000);

      console.log('Capturing modal screenshot...');
      await page.screenshot({
        path: path.join(screenshotsDir, '02_modal_editar_sueldo_y_comision_contador.png'),
      });
    }

    console.log('✅ Screenshots saved in:', screenshotsDir);
  } catch (error) {
    console.error('Error during Playwright test:', error);
  } finally {
    await browser.close();
  }
}

testSalaryUI();

