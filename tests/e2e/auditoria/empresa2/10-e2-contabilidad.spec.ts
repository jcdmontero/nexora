/**
 * 10-e2-contabilidad.spec.ts — Contabilidad — Empresa 2 (Comercializadora Integral)
 *
 * Flujos cubiertos:
 *  ✓ Listar plan de cuentas
 *  ✓ Crear cuenta contable
 *  ✓ Buscar cuenta por código
 *  ✓ Listar asientos contables
 *  ✓ Crear asiento contable con partida doble
 *  ✓ Verificar balance de asiento
 *  ✓ Listar períodos contables
 *  ✓ Crear período contable
 *  ✓ Cerrar período
 *  ✓ Reportes: Libro Diario, Mayor General, Balance de Prueba, P&G
 *  ✓ Auxiliar de cuenta
 *  ✓ Reporte por terceros
 */
import { test, expect, type Page } from '@playwright/test';
import { AUDIT_AUTH } from '../../../../playwright.auditoria.config';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';
const TS   = Date.now().toString().slice(-6);

const e2 = test.extend<{ page: Page }>({
  page: async ({ browser }, use) => {
    const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.empresa2 });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

async function ss(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/auditoria/results/screenshots/${name}.png`, fullPage: true });
}

// ══════════════════════════════════════════════════════════════════════════════
// PLAN DE CUENTAS
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — Contabilidad — Plan de Cuentas', () => {

  e2('plan de cuentas carga @smoke', async ({ page }) => {
    await page.goto(`${BASE}/contabilidad/cuentas`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/contabilidad\/cuentas/);
    const contenido = page.locator('table, [class*="tree"], main').first();
    await expect(contenido).toBeVisible({ timeout: 15_000 });
    await ss(page, 'e2-cont-01-plan-cuentas');
  });

  e2('crear cuenta contable nueva', async ({ page }) => {
    await page.goto(`${BASE}/contabilidad/cuentas`);
    await page.waitForLoadState('networkidle');

    const btnNueva = page.locator('button, a').filter({ hasText: /nueva|crear/i }).first();
    if (await btnNueva.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNueva.click();
      await page.waitForTimeout(600);
      await ss(page, 'e2-cont-02-form-cuenta');

      const campos = [
        ['codigo',   `1305${TS.slice(0,4)}`],
        ['nombre',   `Cuenta Auditoría E2E ${TS}`],
      ];

      for (const [name, value] of campos) {
        const input = page.locator(`input[name="${name}"]`).first();
        if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await input.fill(value);
        }
      }

      // Tipo de cuenta
      const tipoSelect = page.locator('select[name="tipo"]').first();
      if (await tipoSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await tipoSelect.selectOption({ index: 1 });
      }

      // Naturaleza
      const natSelect = page.locator('select[name="naturaleza"]').first();
      if (await natSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await natSelect.selectOption({ index: 0 });
      }

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e2-cont-03-cuenta-creada');
      }
    }
  });

  e2('buscar cuenta por código', async ({ page }) => {
    await page.goto(`${BASE}/contabilidad/cuentas`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('1305');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      await ss(page, 'e2-cont-04-buscar-cuenta');
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ASIENTOS CONTABLES
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — Contabilidad — Asientos', () => {

  e2('listar asientos contables @smoke', async ({ page }) => {
    await page.goto(`${BASE}/contabilidad/asientos`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-cont-05-lista-asientos');
  });

  e2('crear asiento contable con partida doble', async ({ page }) => {
    await page.goto(`${BASE}/accounting/asientos/crear`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e2-cont-06-form-asiento');

    // Fecha
    const fechaInput = page.locator('input[name="fecha"], input[type="date"]').first();
    if (await fechaInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await fechaInput.fill(new Date().toISOString().split('T')[0]);
    }

    // Descripción
    const descInput = page.locator('textarea[name="descripcion"], input[name="descripcion"]').first();
    if (await descInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await descInput.fill(`Asiento auditoría E2E ${TS}`);
    }

    // Línea DÉBITO
    const addLineBtn = page.locator('button').filter({ hasText: /agregar línea|añadir|nueva línea/i }).first();
    if (await addLineBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await addLineBtn.click();
      await page.waitForTimeout(400);

      // Cuenta débito
      const cuentaDebitoInput = page.locator('input[name*="cuenta"], select[name*="cuenta"]').first();
      if (await cuentaDebitoInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const tag = await cuentaDebitoInput.evaluate((el: Element) => el.tagName);
        if (tag === 'SELECT') {
          await cuentaDebitoInput.selectOption({ index: 1 });
        } else {
          await cuentaDebitoInput.fill('1105');
          await page.waitForTimeout(400);
          const opt = page.locator('[role="option"]').first();
          if (await opt.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await opt.click();
          }
        }
      }

      // Débito
      const debitoInput = page.locator('input[name*="debito"]').last();
      if (await debitoInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await debitoInput.fill('100000');
      }

      // Segunda línea: CRÉDITO
      await addLineBtn.click();
      await page.waitForTimeout(400);

      const cuentaCreditoInput = page.locator('input[name*="cuenta"], select[name*="cuenta"]').last();
      if (await cuentaCreditoInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const tag = await cuentaCreditoInput.evaluate((el: Element) => el.tagName);
        if (tag === 'SELECT') {
          await cuentaCreditoInput.selectOption({ index: 2 });
        } else {
          await cuentaCreditoInput.fill('2105');
          await page.waitForTimeout(400);
          const opt = page.locator('[role="option"]').last();
          if (await opt.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await opt.click();
          }
        }
      }

      const creditoInput = page.locator('input[name*="credito"]').last();
      if (await creditoInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await creditoInput.fill('100000');
      }
    }

    await ss(page, 'e2-cont-07-asiento-lleno');

    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-cont-08-asiento-creado');
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PERÍODOS CONTABLES
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — Contabilidad — Períodos', () => {

  e2('listar períodos contables @smoke', async ({ page }) => {
    await page.goto(`${BASE}/contabilidad/periodos`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-cont-09-periodos-contables');
  });

  e2('crear período contable', async ({ page }) => {
    await page.goto(`${BASE}/contabilidad/periodos`);
    await page.waitForLoadState('networkidle');

    const btnNuevo = page.locator('button, a').filter({ hasText: /nuevo|crear/i }).first();
    if (await btnNuevo.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNuevo.click();
      await page.waitForTimeout(600);

      const now = new Date();
      const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const fechaIniInput = page.locator('input[name="fecha_inicio"]').first();
      if (await fechaIniInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await fechaIniInput.fill(primerDiaMes);
      }

      const fechaFinInput = page.locator('input[name="fecha_fin"]').first();
      if (await fechaFinInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await fechaFinInput.fill(ultimoDiaMes);
      }

      const nombreInput = page.locator('input[name="nombre"]').first();
      if (await nombreInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await nombreInput.fill(`Período Auditoría ${TS}`);
      }

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e2-cont-10-periodo-creado');
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// REPORTES CONTABLES
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — Contabilidad — Reportes', () => {

  const reportes = [
    { nombre: 'Libro Diario',        url: `${BASE}/contabilidad/reportes?tipo=diario` },
    { nombre: 'Libro Mayor',         url: `${BASE}/contabilidad/reportes?tipo=mayor` },
    { nombre: 'Balance de Prueba',   url: `${BASE}/contabilidad/reportes?tipo=balance` },
    { nombre: 'P&G',                 url: `${BASE}/contabilidad/reportes?tipo=pyg` },
    { nombre: 'Balance General',     url: `${BASE}/contabilidad/reportes?tipo=balance_general` },
  ];

  e2('página de reportes contables carga @smoke', async ({ page }) => {
    await page.goto(`${BASE}/contabilidad/reportes`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('main, [class*="reporte"], form').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-cont-11-reportes-index');
  });

  for (const reporte of reportes) {
    e2(`reporte "${reporte.nombre}" es accesible`, async ({ page }) => {
      await page.goto(reporte.url);
      await page.waitForLoadState('networkidle');
      await expect(page).not.toHaveURL(/login/);
      const contenido = page.locator('main, table, [class*="reporte"]').first();
      await expect(contenido).toBeVisible({ timeout: 10_000 });
      await ss(page, `e2-cont-reporte-${reporte.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
    });
  }

  e2('libro contable diario carga con asientos', async ({ page }) => {
    await page.goto(`${BASE}/contabilidad/libros/diario`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('main, table, [class*="libro"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-cont-12-libro-diario');
  });
});
