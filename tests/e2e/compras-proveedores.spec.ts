import { test, expect } from '@playwright/test';
import { loginAsAdmin, screenshotStep, searchInTable } from './helpers';

const BASE_URL = process.env.APP_URL || 'http://localhost:8000';
const TEST_PROVEEDOR = {
  razon_social: 'Proveedor Test E2E ' + Date.now(),
  numero_documento: '900' + Date.now().toString().slice(-7),
  nombre_contacto: 'Contacto Test',
  email: `proveedor.test${Date.now()}@email.com`,
  telefono: '3009876543',
  direccion: 'Calle 456 #78-90',
  ciudad: 'Bogotá',
};

test.describe('Compras - Proveedores', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('crear proveedor nuevo', async ({ page }) => {
    await page.goto(`${BASE_URL}/purchasing/proveedores`);
    await screenshotStep(page, 'comp-01-lista-proveedores');

    await page.click('a[href*="crear"], button:has-text("Nuevo")');
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'comp-02-formulario-crear');

    await page.fill('input[name="razon_social"]', TEST_PROVEEDOR.razon_social);
    await page.fill('input[name="numero_documento"]', TEST_PROVEEDOR.numero_documento);
    await page.fill('input[name="nombre_contacto"]', TEST_PROVEEDOR.nombre_contacto);
    await page.fill('input[name="email"]', TEST_PROVEEDOR.email);
    await page.fill('input[name="telefono"]', TEST_PROVEEDOR.telefono);
    await page.fill('input[name="direccion"]', TEST_PROVEEDOR.direccion);
    await page.fill('input[name="ciudad"]', TEST_PROVEEDOR.ciudad);
    await screenshotStep(page, 'comp-03-formulario-lleno');

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'comp-04-proveedor-creado');

    const successMsg = page.locator('text=correctamente, text=creado');
    await expect(successMsg.first()).toBeVisible({ timeout: 10000 });
  });

  test('buscar proveedor', async ({ page }) => {
    await page.goto(`${BASE_URL}/purchasing/proveedores`);
    await page.waitForLoadState('networkidle');

    await searchInTable(page, 'Proveedor Test');
    await screenshotStep(page, 'comp-05-buscar-resultado');

    const result = page.locator('text=Proveedor Test').first();
    await expect(result).toBeVisible({ timeout: 10000 });
  });

  test('editar proveedor', async ({ page }) => {
    await page.goto(`${BASE_URL}/purchasing/proveedores`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.locator('a[href*="editar"], button:has-text("Editar")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForLoadState('networkidle');
      await screenshotStep(page, 'comp-06-editar-proveedor');

      const telInput = page.locator('input[name="telefono"]');
      if (await telInput.isVisible()) {
        await telInput.clear();
        await telInput.fill('3001111111');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await screenshotStep(page, 'comp-07-proveedor-actualizado');
      }
    }
  });
});
