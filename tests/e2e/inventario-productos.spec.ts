import { test, expect } from '@playwright/test';
import { loginAsAdmin, screenshotStep, searchInTable } from './helpers';

const BASE_URL = process.env.APP_URL || 'http://localhost:8000';
const TEST_PRODUCTO = {
  codigo: 'PRD-' + Date.now().toString().slice(-6),
  nombre: 'Laptop Lenovo Test ' + Date.now(),
  unidad_medida: 'UN',
  precio_venta: '2500000',
  costo_promedio: '1800000',
  stock_actual: '10',
  stock_minimo: '3',
};

test.describe('Inventario - Productos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('crear producto nuevo', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory/productos`);
    await screenshotStep(page, 'inv-01-lista-productos');

    await page.click('a[href*="crear"], button:has-text("Nuevo")');
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'inv-02-formulario-crear');

    await page.fill('input[name="codigo"]', TEST_PRODUCTO.codigo);
    await page.fill('input[name="nombre"]', TEST_PRODUCTO.nombre);
    await page.selectOption('select[name="unidad_medida"]', TEST_PRODUCTO.unidad_medida);
    await page.fill('input[name="precio_venta"]', TEST_PRODUCTO.precio_venta);
    await page.fill('input[name="costo_promedio"]', TEST_PRODUCTO.costo_promedio);
    await page.fill('input[name="stock_actual"]', TEST_PRODUCTO.stock_actual);
    await page.fill('input[name="stock_minimo"]', TEST_PRODUCTO.stock_minimo);
    await screenshotStep(page, 'inv-03-formulario-lleno');

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'inv-04-producto-creado');

    const successMsg = page.locator('text=correctamente, text=creado');
    await expect(successMsg.first()).toBeVisible({ timeout: 10000 });
  });

  test('buscar producto por código', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory/productos`);
    await page.waitForLoadState('networkidle');

    await searchInTable(page, TEST_PRODUCTO.codigo);
    await screenshotStep(page, 'inv-05-buscar-resultado');

    const result = page.locator(`text=${TEST_PRODUCTO.codigo}`).first();
    await expect(result).toBeVisible({ timeout: 10000 });
  });

  test('editar producto', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory/productos`);
    await page.waitForLoadState('networkidle');

    const editBtn = page.locator('a[href*="editar"], button:has-text("Editar")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForLoadState('networkidle');
      await screenshotStep(page, 'inv-06-editar-producto');

      const precioInput = page.locator('input[name="precio_venta"]');
      if (await precioInput.isVisible()) {
        await precioInput.clear();
        await precioInput.fill('2700000');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await screenshotStep(page, 'inv-07-producto-actualizado');
      }
    }
  });

  test('crear categoría', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory/categorias`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'inv-08-lista-categorias');

    const addBtn = page.locator('button:has-text("Nueva"), button:has-text("Crear")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      const nombreInput = page.locator('input[name="nombre"]').first();
      if (await nombreInput.isVisible()) {
        await nombreInput.fill('Categoría Test E2E');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await screenshotStep(page, 'inv-09-categoria-creada');
      }
    }
  });

  test('crear marca', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory/marcas`);
    await page.waitForLoadState('networkidle');
    await screenshotStep(page, 'inv-10-lista-marcas');

    const addBtn = page.locator('button:has-text("Nueva"), button:has-text("Crear")').first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1000);

      const nombreInput = page.locator('input[name="nombre"]').first();
      if (await nombreInput.isVisible()) {
        await nombreInput.fill('Marca Test E2E');
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await screenshotStep(page, 'inv-11-marca-creada');
      }
    }
  });
});
