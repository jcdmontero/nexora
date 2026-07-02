import { test, expect } from '@playwright/test';
import { loginAsAdmin, screenshotStep } from './helpers';

const BASE_URL = process.env.APP_URL || 'http://localhost:8000';

test.describe('Ventas - Facturas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('ver listado de facturas', async ({ page }) => {
    await page.goto(`${BASE_URL}/sales/facturas`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'ventas-01-lista-facturas');

    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('ver detalle de factura', async ({ page }) => {
    await page.goto(`${BASE_URL}/sales/facturas`);
    await page.waitForLoadState('networkidle');

    const viewBtn = page.locator('a[href*="facturas/"], button:has-text("Ver")').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForLoadState('networkidle');
      await screenshotStep(page, 'ventas-02-detalle-factura');
    }
  });

  test('verificar punto de venta (POS)', async ({ page }) => {
    await page.goto(`${BASE_URL}/sales/pos`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'ventas-03-pos');

    // Verificar que el POS carga correctamente
    const posContent = page.locator('text=Producto, text=Servicio, text=Carrito').first();
    await expect(posContent).toBeVisible({ timeout: 10000 });
  });
});
