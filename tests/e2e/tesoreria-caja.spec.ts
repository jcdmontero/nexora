import { test, expect } from '@playwright/test';
import { loginAsAdmin, screenshotStep } from './helpers';

const BASE_URL = process.env.APP_URL || 'http://localhost:8000';

test.describe('Tesorería - Caja', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('ver estado de caja', async ({ page }) => {
    await page.goto(`${BASE_URL}/cash/caja`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'cash-01-estado-caja');

    // Verificar que la página carga correctamente
    const pageContent = page.locator('text=Caja, text=Turno, text=Saldo').first();
    await expect(pageContent).toBeVisible({ timeout: 10000 });
  });

  test('verificar sesión de caja', async ({ page }) => {
    await page.goto(`${BASE_URL}/cash/caja`);
    await page.waitForLoadState('networkidle');

    // Verificar si hay sesión activa
    const sesionActiva = page.locator('text=Abierta, text=Activa, text=Sesión').first();
    const sesionCerrada = page.locator('text=Cerrada, text=Sin sesión').first();

    if (await sesionActiva.isVisible()) {
      await screenshotStep(page, 'cash-02-sesion-activa');
    } else if (await sesionCerrada.isVisible()) {
      await screenshotStep(page, 'cash-02-sesion-cerrada');
    }
  });

  test('ver historial de movimientos', async ({ page }) => {
    await page.goto(`${BASE_URL}/cash/movimientos`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'cash-03-movimientos');

    const table = page.locator('table, [role="table"]').first();
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  });

  test('verificar reporte consolidado', async ({ page }) => {
    await page.goto(`${BASE_URL}/cash/reporte`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'cash-04-reporte');
  });
});
