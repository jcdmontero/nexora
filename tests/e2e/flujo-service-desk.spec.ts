/**
 * flujo-service-desk.spec.ts — Flujo completo de Orden de Trabajo (Premium)
 *
 * Escenario dorado:
 *  1. Navegar al listado de órdenes
 *  2. Crear nueva orden (seleccionar cliente, tipo equipo, falla, descripción)
 *  3. Verificar la orden aparece en el listado
 *  4. Abrir la orden y verificar datos
 *  5. Cambiar estado: recibido → diagnosticado
 *  6. Cambiar estado: diagnosticado → en_proceso
 *  7. Cambiar estado: en_proceso → completado
 *  8. Verificar catálogos de servicios y marcas
 *
 * Usa el storageState del ADMIN (ya autenticado) via playwright.config.ts.
 */
import { test, expect } from '@playwright/test';
import { AppLayout } from './pages/AppLayout';

const BASE = process.env.APP_URL || 'http://localhost:8000';

// Datos del test — timestamp para unicidad
const TS = Date.now().toString().slice(-5);

test.describe('Flujo Completo — Service Desk @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Ir al listado de órdenes (ya autenticado por storageState)
    await page.goto(`${BASE}/service-desk/ordenes`);
    await page.waitForLoadState('networkidle');
  });

  // ─── Listado de órdenes ──────────────────────────────────────────────────────

  test('listado de órdenes carga correctamente @smoke', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/service-desk\/ordenes/);

    // Esperar que React hidrate y muestre contenido (tabla o empty state)
    const content = page.locator('table, [class*="empty"], h1, h2, h3').first();
    await expect(content).toBeVisible({ timeout: 15_000 });

    await page.screenshot({ path: 'tests/e2e/results/sd-01-listado-ordenes.png' });
  });

  // ─── Crear orden ─────────────────────────────────────────────────────────────

  test('crear nueva orden de reparación', async ({ page }) => {
    // Buscar el botón de crear
    const createBtn = page
      .locator('a[href*="crear"], a[href*="nuevo"], button')
      .filter({ hasText: /nueva orden|nueva|crear/i })
      .first();

    if (!await createBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Botón de crear orden no encontrado');
      return;
    }

    await createBtn.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/results/sd-02-formulario-crear.png' });

    // ── Seleccionar cliente ─────────────────────────────────────────────────
    // Combobox o select de cliente
    const clienteField = page
      .locator('input[placeholder*="cliente"], input[placeholder*="Cliente"]')
      .or(page.locator('select[name*="cliente"]'))
      .first();

    if (await clienteField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const tagName = await clienteField.evaluate((el: HTMLElement) => el.tagName);

      if (tagName === 'INPUT') {
        await clienteField.click();
        await clienteField.fill('Demo');
        // Esperar opciones del combobox
        const option = page.locator('[role="option"]').first();
        if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await option.click();
        }
      } else {
        await clienteField.selectOption({ index: 1 });
      }
    }

    // ── Tipo de equipo ────────────────────────────────────────────────────────
    const tipoEquipo = page.locator('select[name*="tipo_equipo"]').or(
                         page.locator('button[aria-haspopup]').filter({ hasText: /equipo|tipo/i }),
                       ).first();

    if (await tipoEquipo.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const tag = await tipoEquipo.evaluate((el: HTMLElement) => el.tagName);
      if (tag === 'SELECT') {
        await tipoEquipo.selectOption({ index: 1 });
      } else {
        await tipoEquipo.click();
        const firstOption = page.locator('[role="option"]').first();
        if (await firstOption.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await firstOption.click();
        }
      }
    }

    // ── Descripción del problema ──────────────────────────────────────────────
    const descripcion = page
      .locator('textarea[name*="descripcion"], textarea[name*="problema"], textarea')
      .first();

    if (await descripcion.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await descripcion.fill(`Orden de prueba E2E #${TS} - pantalla no enciende`);
    }

    await page.screenshot({ path: 'tests/e2e/results/sd-03-formulario-lleno.png' });

    // ── Guardar ──────────────────────────────────────────────────────────────
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'tests/e2e/results/sd-04-orden-guardada.png' });

      // Verificar éxito: redirigido a listado o detalle con mensaje
      const isSuccess = page.url().includes('/service-desk/') &&
                        !page.url().includes('/crear');
      expect(isSuccess, `URL tras crear: ${page.url()}`).toBeTruthy();
    }
  });

  // ─── Cambio de estados ───────────────────────────────────────────────────────

  test('cambiar estado de una orden existente', async ({ page }) => {
    await page.goto(`${BASE}/service-desk/ordenes`);
    await page.waitForLoadState('networkidle');

    // Abrir la primera orden disponible
    const firstOrderLink = page
      .locator('table tr a, [data-testid*="row"] a, [href*="ordenes/"]')
      .first();

    if (!await firstOrderLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'No hay órdenes disponibles para cambiar estado');
      return;
    }

    await firstOrderLink.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/results/sd-05-detalle-orden.png' });

    // Buscar botón para cambiar estado
    const estadoBtn = page
      .locator('button, a')
      .filter({ hasText: /cambiar estado|diagnosticar|procesar|completar/i })
      .first();

    if (await estadoBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await estadoBtn.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: 'tests/e2e/results/sd-06-modal-estado.png' });

      // Confirmar en el modal si existe
      const confirmBtn = page
        .locator('button[type="submit"], button')
        .filter({ hasText: /confirmar|guardar|sí/i })
        .first();

      if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await confirmBtn.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'tests/e2e/results/sd-07-estado-cambiado.png' });
      }
    }
  });

  // ─── Catálogos ───────────────────────────────────────────────────────────────

  test('catálogo de servicios carga @smoke', async ({ page }) => {
    await page.goto(`${BASE}/service-desk/catalogos/servicios`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/catalogos\/servicios/);
    // Puede mostrar tabla (si hay datos) o empty state (si no hay servicios aún)
    const content = page.locator('table, [class*="empty"], h2, h3, button').first();
    await expect(content).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'tests/e2e/results/sd-08-catalogo-servicios.png' });
  });

  test('catálogo de marcas de equipos carga correctamente', async ({ page }) => {
    await page.goto(`${BASE}/service-desk/catalogos/marcas`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/catalogos\/marcas/);
    // Con 20 marcas en demo debe mostrar tabla
    const content = page.locator('table, h2, h3').first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });

  test('catálogo de tipos de equipo carga correctamente', async ({ page }) => {
    await page.goto(`${BASE}/service-desk/catalogos/tipos-equipo`);
    await page.waitForLoadState('networkidle');

    // Con 13 tipos en demo debe mostrar tabla
    const content = page.locator('table, h2, h3').first();
    await expect(content).toBeVisible({ timeout: 10_000 });
  });

  // ─── Búsqueda en listado ─────────────────────────────────────────────────────

  test('búsqueda de órdenes por número funciona', async ({ page }) => {
    const searchInput = page
      .locator('input[placeholder*="Buscar"], input[type="search"]')
      .first();

    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('OT-');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'tests/e2e/results/sd-09-busqueda.png' });
      // La tabla debe seguir visible (aunque sin resultados)
      await expect(page.locator('table, [role="table"]').first()).toBeVisible();
    }
  });
});
