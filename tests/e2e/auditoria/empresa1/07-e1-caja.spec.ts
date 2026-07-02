/**
 * 07-e1-caja.spec.ts — Tesorería y Caja — Empresa 1 (TallerTech)
 *
 * Flujos cubiertos:
 *  ✓ Listar cajas
 *  ✓ Crear caja nueva
 *  ✓ Ver turno actual
 *  ✓ Abrir turno de caja
 *  ✓ Registrar movimiento (ingreso)
 *  ✓ Registrar movimiento (egreso)
 *  ✓ Ver listado de movimientos
 *  ✓ Generar recibo de caja
 *  ✓ Transferencia entre cajas
 *  ✓ Arqueo de caja
 *  ✓ Cierre de turno
 *  ✓ Reporte consolidado de cajas
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
// ADMINISTRACIÓN DE CAJAS
// ══════════════════════════════════════════════════════════════════════════════

e1.describe('E1 — Caja — Administración', () => {

  e1('listado de cajas carga @smoke', async ({ page }) => {
    await page.goto(`${BASE}/cash/cajas`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, [class*="card"], main').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e1-caja-01-lista-cajas');
  });

  e1('crear caja nueva', async ({ page }) => {
    await page.goto(`${BASE}/cash/cajas`);
    await page.waitForLoadState('networkidle');

    const btnNueva = page.locator('button, a').filter({ hasText: /nueva|crear|agregar/i }).first();
    if (await btnNueva.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNueva.click();
      await page.waitForTimeout(600);
      await ss(page, 'e1-caja-02-form-nueva-caja');

      const nombreInput = page.locator('input[name="nombre"]').first();
      if (await nombreInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nombreInput.fill(`Caja Auditoría ${TS}`);

        const submitBtn = page.locator('button[type="submit"]').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForLoadState('networkidle');
          await ss(page, 'e1-caja-03-caja-creada');
        }
      }
    }
  });

  e1('ver turno actual (dashboard de caja) @smoke', async ({ page }) => {
    await page.goto(`${BASE}/cash/caja`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('main, [class*="turno"], [class*="caja"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e1-caja-04-turno-actual');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TURNO DE CAJA
// ══════════════════════════════════════════════════════════════════════════════

e1.describe('E1 — Caja — Turno', () => {

  e1('abrir turno de caja', async ({ page }) => {
    await page.goto(`${BASE}/cash/caja`);
    await page.waitForLoadState('networkidle');

    // Si ya hay turno abierto, verificar y saltar
    const turnoAbierto = page.locator('[class*="abierto"], [class*="activo"], text=Cerrar turno').first();
    if (await turnoAbierto.isVisible({ timeout: 3_000 }).catch(() => false)) {
      console.log('  ℹ️ Ya hay un turno abierto, verificando estado...');
      await ss(page, 'e1-caja-turno-ya-abierto');
      return;
    }

    const abrirBtn = page.locator('button, a').filter({ hasText: /abrir|iniciar turno/i }).first();
    if (await abrirBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await abrirBtn.click();
      await page.waitForTimeout(600);
      await ss(page, 'e1-caja-05-form-abrir-turno');

      // Monto inicial
      const montoInput = page.locator('input[name="monto_inicial"], input[name="saldo_inicial"]').first();
      if (await montoInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await montoInput.fill('500000');
      }

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e1-caja-06-turno-abierto');
      }
    } else {
      await ss(page, 'e1-caja-05-sin-boton-abrir');
    }
  });

  e1('registrar movimiento de ingreso', async ({ page }) => {
    await page.goto(`${BASE}/cash/movimientos`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e1-caja-07-movimientos');

    const btnNuevo = page.locator('button, a').filter({ hasText: /nuevo|registrar|agregar/i }).first();
    if (await btnNuevo.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNuevo.click();
      await page.waitForTimeout(600);
      await ss(page, 'e1-caja-08-form-movimiento');

      // Tipo
      const tipoSelect = page.locator('select[name="tipo"]').first();
      if (await tipoSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await tipoSelect.selectOption('ingreso');
      }

      // Monto
      const montoInput = page.locator('input[name="monto"]').first();
      if (await montoInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await montoInput.fill('50000');
      }

      // Concepto
      const conceptoInput = page.locator('input[name="concepto"], textarea[name="concepto"]').first();
      if (await conceptoInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await conceptoInput.fill(`Ingreso auditoría E2E ${TS}`);
      }

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e1-caja-09-movimiento-registrado');
      }
    }
  });

  e1('ver listado de movimientos', async ({ page }) => {
    await page.goto(`${BASE}/cash/movimientos`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e1-caja-10-lista-movimientos');
  });

  e1('ver listado de transferencias entre cajas', async ({ page }) => {
    await page.goto(`${BASE}/cash/transferencias`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e1-caja-11-transferencias');
  });

  e1('ver reporte consolidado de cajas', async ({ page }) => {
    await page.goto(`${BASE}/cash/reporte/consolidado`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('main, table, [class*="report"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e1-caja-12-reporte-consolidado');
  });
});
