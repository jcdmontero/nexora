import { test, expect } from '@playwright/test';
import { loginAsAdmin, screenshotStep, searchInTable } from './helpers';

const BASE_URL = process.env.APP_URL || 'http://localhost:8000';
const TEST_CLIENTE = {
  documento: '900123456-' + Date.now().toString().slice(-3),
  nombres: 'Juan',
  apellidos: 'Pérez Test',
  email: `juan.test${Date.now()}@email.com`,
  telefono: '3001234567',
  direccion: 'Calle 123 #45-67',
};

test.describe('CRM - Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('crear cliente nuevo', async ({ page }) => {
    await page.goto(`${BASE_URL}/crm/clientes`);
    await screenshotStep(page, 'crm-01-lista-clientes');

    await page.click('a[href*="crear"], button:has-text("Nuevo")');
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'crm-02-formulario-crear');

    await page.fill('input[name="documento"]', TEST_CLIENTE.documento);
    await page.fill('input[name="nombres"]', TEST_CLIENTE.nombres);
    await page.fill('input[name="apellidos"]', TEST_CLIENTE.apellidos);
    await page.fill('input[name="email"]', TEST_CLIENTE.email);
    await page.fill('input[name="telefono"]', TEST_CLIENTE.telefono);
    await page.fill('input[name="direccion"]', TEST_CLIENTE.direccion);
    await screenshotStep(page, 'crm-03-formulario-lleno');

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'crm-04-cliente-creado');

    const successMsg = page.locator('text=correctamente, text=creado, text=exitoso');
    await expect(successMsg.first()).toBeVisible({ timeout: 10000 });
  });

  test('buscar cliente existente', async ({ page }) => {
    await page.goto(`${BASE_URL}/crm/clientes`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'crm-05-buscar-inicio');

    await searchInTable(page, 'Pérez');
    await screenshotStep(page, 'crm-06-buscar-resultado');

    const result = page.locator('text=Pérez').first();
    await expect(result).toBeVisible({ timeout: 10000 });
  });

  test('editar cliente', async ({ page }) => {
    await page.goto(`${BASE_URL}/crm/clientes`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.locator('a[href*="editar"], button:has-text("Editar")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForLoadState('networkidle');
      await screenshotStep(page, 'crm-07-editar-cliente');

      const phoneInput = page.locator('input[name="telefono"]');
      if (await phoneInput.isVisible()) {
        await phoneInput.clear();
        await phoneInput.fill('3009999999');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await screenshotStep(page, 'crm-08-cliente-actualizado');
      }
    }
  });

  test('crear contacto para cliente', async ({ page }) => {
    await page.goto(`${BASE_URL}/crm/clientes`);
    await page.waitForLoadState('networkidle');

    const viewBtn = page.locator('a[href*="clientes/"], button:has-text("Ver")').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForLoadState('networkidle');
      await screenshotStep(page, 'crm-09-detalle-cliente');

      const addContactBtn = page.locator('button:has-text("Contacto"), button:has-text("Agregar")').first();
      if (await addContactBtn.isVisible()) {
        await addContactBtn.click();
        await page.waitForTimeout(1000);
        await screenshotStep(page, 'crm-10-modal-contacto');
      }
    }
  });
});
