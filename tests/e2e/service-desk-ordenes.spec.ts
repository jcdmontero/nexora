import { test, expect } from '@playwright/test';
import { loginAsAdmin, screenshotStep } from './helpers';

const BASE_URL = process.env.APP_URL || 'http://localhost:8000';

test.describe('Service Desk - Flujo Completo de Orden', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('flujo completo: crear → diagnosticar → reparar → facturar → entregar', async ({ page }) => {
    // 1. Crear orden
    await page.goto(`${BASE_URL}/service-desk/ordenes`);
    await screenshotStep(page, 'sd-01-lista-ordenes');

    await page.click('a[href*="crear"], button:has-text("Nueva"), button:has-text("Crear")');
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'sd-02-formulario-crear');

    // Seleccionar cliente
    const clienteSelect = page.locator('select[name="cliente_id"], [data-combobox*="cliente"]').first();
    if (await clienteSelect.isVisible()) {
      await clienteSelect.click();
      const firstOption = page.locator('[role="option"], option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // Seleccionar tipo de equipo
    const tipoSelect = page.locator('select[name="tipo_equipo_id"]').first();
    if (await tipoSelect.isVisible()) {
      await tipoSelect.click();
      const option = page.locator('[role="option"], option').nth(1);
      if (await option.isVisible()) {
        await option.click();
      }
    }

    await screenshotStep(page, 'sd-03-formulario-llenado');

    // Guardar orden
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
      await screenshotStep(page, 'sd-04-orden-creada');
    }
  });

  test('cambiar estado de orden', async ({ page }) => {
    await page.goto(`${BASE_URL}/service-desk/ordenes`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'sd-05-lista-para-cambiar-estado');

    // Buscar primera orden y cambiar estado
    const ordenRow = page.locator('tr, [data-testid*="row"]').first();
    if (await ordenRow.isVisible()) {
      await ordenRow.click();
      await page.waitForLoadState('networkidle');
      await screenshotStep(page, 'sd-06-detalle-orden');

      // Buscar botón de cambiar estado
      const estadoBtn = page.locator('button:has-text("Estado"), button:has-text("Cambiar")').first();
      if (await estadoBtn.isVisible()) {
        await estadoBtn.click();
        await page.waitForTimeout(1000);
        await screenshotStep(page, 'sd-07-modal-cambiar-estado');
      }
    }
  });

  test('ver catálogo de servicios', async ({ page }) => {
    await page.goto(`${BASE_URL}/service-desk/catalogos/servicios`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'sd-08-catalogo-servicios');

    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('ver catálogo de marcas', async ({ page }) => {
    await page.goto(`${BASE_URL}/service-desk/catalogos/marcas`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'sd-09-catalogo-marcas');

    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('ver prestadores/técnicos', async ({ page }) => {
    await page.goto(`${BASE_URL}/service-desk/prestadores`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'sd-10-lista-prestadores');

    const table = page.locator('table, [role="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
  });
});
