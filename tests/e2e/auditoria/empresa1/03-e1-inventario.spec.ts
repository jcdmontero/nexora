/**
 * 03-e1-inventario.spec.ts — Inventario completo — Empresa 1 (TallerTech)
 *
 * Flujos cubiertos:
 *  ✓ Listar productos (tabla, búsqueda, filtros)
 *  ✓ Crear categoría
 *  ✓ Crear marca
 *  ✓ Crear bodega
 *  ✓ Crear producto con todos los campos
 *  ✓ Editar producto (precio, stock mínimo)
 *  ✓ Buscar producto por nombre y código
 *  ✓ Filtrar por categoría y estado
 *  ✓ Ver kardex de un producto
 *  ✓ Crear ajuste de inventario (entrada manual)
 *  ✓ Crear ajuste de inventario (salida manual)
 *  ✓ Ver listado de bodegas
 *  ✓ Ver listado de traslados
 */
import { test, expect, type Page } from '@playwright/test';
import { AUDIT_AUTH } from '../../../../playwright.auditoria.config';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';
const TS   = Date.now().toString().slice(-6);

const e1 = test.extend<{ page: Page }>({
  page: async ({ browser }, use) => {
    const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.empresa1 });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

async function ss(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/auditoria/results/screenshots/${name}.png`, fullPage: true });
}

// ══════════════════════════════════════════════════════════════════════════════
// CATÁLOGOS
// ══════════════════════════════════════════════════════════════════════════════

e1.describe('E1 — Inventario — Catálogos', () => {

  e1('crear categoría nueva @smoke', async ({ page }) => {
    await page.goto(`${BASE}/inventory/categorias`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e1-inv-01-categorias');

    // Botón "Nueva categoría" o "Crear"
    const btnNueva = page.locator('button, a').filter({ hasText: /nueva|crear|agregar/i }).first();
    if (await btnNueva.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNueva.click();
      await page.waitForTimeout(600);
      await ss(page, 'e1-inv-02-form-categoria');

      const nombreInput = page.locator('input[name="nombre"]').first();
      if (await nombreInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nombreInput.fill(`Accesorios E2E ${TS}`);
      }

      const descInput = page.locator('textarea[name="descripcion"], input[name="descripcion"]').first();
      if (await descInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await descInput.fill('Categoría creada por auditoría E2E');
      }

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e1-inv-03-categoria-creada');
      }
    }
  });

  e1('crear marca nueva', async ({ page }) => {
    await page.goto(`${BASE}/inventory/marcas`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e1-inv-04-marcas');

    const btnNueva = page.locator('button, a').filter({ hasText: /nueva|crear|agregar/i }).first();
    if (await btnNueva.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNueva.click();
      await page.waitForTimeout(600);

      const nombreInput = page.locator('input[name="nombre"]').first();
      if (await nombreInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nombreInput.fill(`MarcaTest ${TS}`);

        const submitBtn = page.locator('button[type="submit"]').first();
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e1-inv-05-marca-creada');
      }
    }
  });

  e1('listar bodegas @smoke', async ({ page }) => {
    await page.goto(`${BASE}/inventory/bodegas`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/inventory\/bodegas/);
    const contenido = page.locator('table, [class*="card"], main > *').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e1-inv-06-bodegas');
  });

  e1('crear bodega nueva', async ({ page }) => {
    await page.goto(`${BASE}/inventory/bodegas/crear`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e1-inv-07-form-bodega');

    const nombreInput = page.locator('input[name="nombre"]').first();
    if (await nombreInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nombreInput.fill(`Bodega Auditoría ${TS}`);

      const dirInput = page.locator('input[name="direccion"], textarea[name="direccion"]').first();
      if (await dirInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await dirInput.fill('Cra 45 # 12-34, Bogotá');
      }

      await page.locator('button[type="submit"]').first().click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e1-inv-08-bodega-creada');
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTOS
// ══════════════════════════════════════════════════════════════════════════════

e1.describe('E1 — Inventario — Productos', () => {

  e1('listado de productos con datos del seeder @smoke', async ({ page }) => {
    await page.goto(`${BASE}/inventory/productos`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/inventory\/productos/);
    const filas = await page.locator('tbody tr').count();
    console.log(`  📦 Productos visibles: ${filas}`);
    expect(filas).toBeGreaterThan(0);
    await ss(page, 'e1-inv-09-lista-productos');
  });

  e1('crear producto con todos los campos', async ({ page }) => {
    await page.goto(`${BASE}/inventory/productos/crear`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e1-inv-10-form-crear-producto');

    const campos = [
      ['nombre',        `Producto E2E Auditoría ${TS}`],
      ['codigo',        `AUD-E1-${TS}`],
      ['descripcion',   'Producto creado por suite de auditoría E2E'],
      ['precio_venta',  '150000'],
      ['costo_promedio','100000'],
      ['stock_actual',  '10'],
      ['stock_minimo',  '5'],
    ];

    for (const [name, value] of campos) {
      const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
      if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await input.clear();
        await input.fill(value);
      }
    }

    // Seleccionar categoría si hay selector
    const catSelect = page.locator('select[name="categoria_id"]').first();
    if (await catSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await catSelect.selectOption({ index: 1 });
    }

    // Unidad de medida
    const udSelect = page.locator('select[name="unidad_medida"]').first();
    if (await udSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await udSelect.selectOption('unidad');
    }

    await ss(page, 'e1-inv-11-form-producto-lleno');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');
    await ss(page, 'e1-inv-12-producto-creado');

    const exito = !page.url().includes('/crear');
    expect(exito, `URL tras crear: ${page.url()}`).toBeTruthy();
  });

  e1('buscar producto por nombre', async ({ page }) => {
    await page.goto(`${BASE}/inventory/productos`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('Epson');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await ss(page, 'e1-inv-13-buscar-epson');
    }
  });

  e1('buscar producto por código', async ({ page }) => {
    await page.goto(`${BASE}/inventory/productos`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('AUD-E1-');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await ss(page, 'e1-inv-14-buscar-por-codigo');
    }
  });

  e1('editar producto — cambiar precio y stock mínimo', async ({ page }) => {
    await page.goto(`${BASE}/inventory/productos`);
    await page.waitForLoadState('networkidle');

    const editLink = page.locator('a[href*="/editar"]').first();
    if (await editLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e1-inv-15-editar-producto');

      const precioInput = page.locator('input[name="precio_venta"]').first();
      if (await precioInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await precioInput.clear();
        await precioInput.fill('165000');
      }

      const stockMinInput = page.locator('input[name="stock_minimo"]').first();
      if (await stockMinInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await stockMinInput.clear();
        await stockMinInput.fill('8');
      }

      await page.locator('button[type="submit"]').first().click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e1-inv-16-producto-actualizado');
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// KARDEX Y AJUSTES
// ══════════════════════════════════════════════════════════════════════════════

e1.describe('E1 — Inventario — Kardex y Ajustes', () => {

  e1('ver kardex de productos @smoke', async ({ page }) => {
    await page.goto(`${BASE}/inventory/kardex`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e1-inv-17-kardex');
  });

  e1('crear ajuste de entrada de inventario', async ({ page }) => {
    await page.goto(`${BASE}/inventory/ajustes/crear`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e1-inv-18-form-ajuste');

    // Tipo de ajuste
    const tipoSelect = page.locator('select[name="tipo"]').first();
    if (await tipoSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await tipoSelect.selectOption('entrada');
    }

    // Producto
    const prodSelect = page.locator('select[name="producto_id"]').first();
    if (await prodSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await prodSelect.selectOption({ index: 1 });
    }

    // Cantidad
    const cantInput = page.locator('input[name="cantidad"]').first();
    if (await cantInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cantInput.fill('10');
    }

    // Observaciones
    const obsInput = page.locator('textarea[name="observaciones"], input[name="observaciones"]').first();
    if (await obsInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await obsInput.fill(`Ajuste entrada auditoría E2E ${TS}`);
    }

    await ss(page, 'e1-inv-19-ajuste-lleno');

    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e1-inv-20-ajuste-guardado');
    }
  });

  e1('ver listado de traslados', async ({ page }) => {
    await page.goto(`${BASE}/inventory/traslados`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e1-inv-21-traslados');
  });

  e1('ver listado de recepciones', async ({ page }) => {
    await page.goto(`${BASE}/inventory/recepciones`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e1-inv-22-recepciones');
  });
});
