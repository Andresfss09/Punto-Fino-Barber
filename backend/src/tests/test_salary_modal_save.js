const { chromium } = require('playwright');
const path = require('path');

async function testModalSave() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'juandavid@puntofino.com');
    await page.fill('input[type="password"]', 'Barbero2026!');
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(2000);

    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const payrollTab = page.locator('button:has-text("Nómina y Liquidaciones")');
    await payrollTab.click();
    await page.waitForTimeout(1500);

    // Click base button on Emanuel Torres (the 2nd barber)
    const baseBtns = page.locator('button[title="Editar Salario Base y Comisión de Productos"]');
    await baseBtns.nth(1).click();
    await page.waitForTimeout(800);

    // Change monthly salary to 1800000 and product commission to 20%
    const salaryInput = page.locator('input[placeholder="1623500"]');
    await salaryInput.fill('1800000');

    const prodInput = page.locator('input[placeholder="15"]');
    await prodInput.fill('20');

    // Click "Guardar Sueldo y Comisión"
    await page.click('button:has-text("Guardar Sueldo y Comisión")');
    await page.waitForTimeout(2000);

    // Take screenshot after save
    const screenshotsDir = 'C:\\Users\\andre\\.gemini\\antigravity\\brain\\19d3299f-24f8-40a7-8a32-423bf8e42cf0\\screenshots_approved_salaries';
    await page.screenshot({
      path: path.join(screenshotsDir, '03_despues_de_editar_sueldo_emanuel.png'),
      fullPage: true,
    });
    console.log('Saved screenshot after editing salary!');

    // Reset Emanuel back to 1623500 / 15%
    await baseBtns.nth(1).click();
    await page.waitForTimeout(800);
    await salaryInput.fill('1623500');
    await prodInput.fill('15');
    await page.click('button:has-text("Guardar Sueldo y Comisión")');
    await page.waitForTimeout(2000);

    console.log('Reset Emanuel back to legal minimum successfully!');
  } catch (error) {
    console.error('Error in testModalSave:', error);
  } finally {
    await browser.close();
  }
}

testModalSave();

