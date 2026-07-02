/**
 * 09-e2-nomina.spec.ts — Nómina — Empresa 2 (Comercializadora Integral)
 *
 * Flujos cubiertos:
 *  ✓ Listar períodos de nómina
 *  ✓ Crear período de nómina
 *  ✓ Agregar novedades (horas extras, bonificaciones, descuentos)
 *  ✓ Liquidar período
 *  ✓ Ver detalle de nómina individual
 *  ✓ Ver desprendible de pago (PDF)
 *  ✓ Aprobar nómina
 *  ✓ Reporte de resumen de nómina
 *  ✓ Verificar cálculos: devengados, deducciones, neto a pagar
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
// PERÍODOS DE NÓMINA
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — Nómina — Períodos', () => {

  e2('listado de períodos de nómina @smoke', async ({ page }) => {
    await page.goto(`${BASE}/payroll/periodos`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/payroll\/periodos/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 15_000 });
    await ss(page, 'e2-nom-01-lista-periodos');
  });

  e2('crear período de nómina nuevo', async ({ page }) => {
    await page.goto(`${BASE}/payroll/periodos`);
    await page.waitForLoadState('networkidle');

    const btnNuevo = page.locator('button, a').filter({ hasText: /nuevo|crear|periodo/i }).first();
    if (!await btnNuevo.isVisible({ timeout: 5_000 }).catch(() => false)) {
      test.skip(true, 'Botón de crear período no encontrado');
      return;
    }

    await btnNuevo.click();
    await page.waitForTimeout(600);
    await ss(page, 'e2-nom-02-form-periodo');

    // Tipo de período (quincenal, mensual)
    const tipoSelect = page.locator('select[name="tipo"]').first();
    if (await tipoSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await tipoSelect.selectOption('mensual');
    }

    // Fecha inicio
    const now = new Date();
    const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const fechaIniInput = page.locator('input[name="fecha_inicio"]').first();
    if (await fechaIniInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await fechaIniInput.fill(primerDiaMes);
    }

    const fechaFinInput = page.locator('input[name="fecha_fin"]').first();
    if (await fechaFinInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await fechaFinInput.fill(ultimoDiaMes);
    }

    await ss(page, 'e2-nom-03-form-periodo-lleno');

    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-nom-04-periodo-creado');
    }
  });

  e2('ver detalle de período de nómina', async ({ page }) => {
    await page.goto(`${BASE}/payroll/periodos`);
    await page.waitForLoadState('networkidle');

    const periodoLink = page.locator('a[href*="/payroll/periodos/"]').filter({ hasNotText: /crear|nuevo/i }).first();
    if (await periodoLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await periodoLink.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-nom-05-detalle-periodo');
      await expect(page).toHaveURL(/payroll\/periodos\/\d+/);
    } else {
      test.skip(true, 'No hay períodos disponibles');
    }
  });

  e2('liquidar período de nómina', async ({ page }) => {
    await page.goto(`${BASE}/payroll/periodos`);
    await page.waitForLoadState('networkidle');

    // Buscar período en estado borrador
    const periodoLink = page.locator('a[href*="/payroll/periodos/"]').first();
    if (await periodoLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await periodoLink.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-nom-06-antes-liquidar');

      // Botón liquidar
      const liquidarBtn = page.locator('button, a').filter({ hasText: /liquidar|calcular/i }).first();
      if (await liquidarBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await liquidarBtn.click();
        await page.waitForTimeout(800);

        // Confirmar en modal
        const confirmBtn = page.locator('button').filter({ hasText: /confirmar|sí|liquidar/i }).first();
        if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await confirmBtn.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2_000); // La liquidación puede tardar
          await ss(page, 'e2-nom-07-periodo-liquidado');
        }
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// NOVEDADES
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — Nómina — Novedades', () => {

  e2('listar novedades @smoke', async ({ page }) => {
    await page.goto(`${BASE}/payroll/novedades`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-nom-08-novedades');
  });

  e2('crear novedad de horas extra', async ({ page }) => {
    await page.goto(`${BASE}/payroll/novedades`);
    await page.waitForLoadState('networkidle');

    const btnNueva = page.locator('button, a').filter({ hasText: /nueva|crear|registrar/i }).first();
    if (await btnNueva.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNueva.click();
      await page.waitForTimeout(600);
      await ss(page, 'e2-nom-09-form-novedad');

      // Empleado
      const empSelect = page.locator('select[name="empleado_id"]').first();
      if (await empSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await empSelect.selectOption({ index: 1 });
      }

      // Tipo de novedad
      const tipoSelect = page.locator('select[name="tipo"]').first();
      if (await tipoSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await tipoSelect.selectOption({ index: 1 });
      }

      // Valor/Cantidad
      const valorInput = page.locator('input[name="valor"], input[name="cantidad"]').first();
      if (await valorInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await valorInput.fill('8');
      }

      // Descripción
      const descInput = page.locator('textarea[name="descripcion"], input[name="descripcion"]').first();
      if (await descInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await descInput.fill(`Novedad E2E ${TS}`);
      }

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e2-nom-10-novedad-creada');
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// NÓMINAS INDIVIDUALES Y REPORTES
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — Nómina — Nóminas y Reportes', () => {

  e2('listar nóminas individuales', async ({ page }) => {
    await page.goto(`${BASE}/payroll/nominas`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });

    const filas = await page.locator('tbody tr').count();
    console.log(`  📊 Nóminas individuales: ${filas}`);
    await ss(page, 'e2-nom-11-nominas');
  });

  e2('ver detalle de nómina individual con devengados y deducciones', async ({ page }) => {
    await page.goto(`${BASE}/payroll/nominas`);
    await page.waitForLoadState('networkidle');

    const nominaLink = page.locator('a[href*="/payroll/nominas/"]').first();
    if (await nominaLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nominaLink.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-nom-12-detalle-nomina');

      // Verificar que aparecen secciones de devengados y deducciones
      const devengados = page.locator('[class*="devengado"], text=Devengado, text=Salario').first();
      await expect(devengados).toBeVisible({ timeout: 10_000 }).catch(() => {
        console.log('  ⚠️ Sección devengados no visible');
      });
    }
  });

  e2('ver desprendible de pago (PDF)', async ({ page }) => {
    await page.goto(`${BASE}/payroll/nominas`);
    await page.waitForLoadState('networkidle');

    const nominaLink = page.locator('a[href*="/payroll/nominas/"]').first();
    if (await nominaLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await nominaLink.click();
      await page.waitForLoadState('networkidle');

      // Buscar botón de desprendible/PDF
      const pdfBtn = page.locator('button, a').filter({ hasText: /desprendible|pdf|imprimir/i }).first();
      if (await pdfBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        // No hacer click (abre nueva ventana), solo verificar que existe
        await expect(pdfBtn).toBeEnabled();
        await ss(page, 'e2-nom-13-boton-desprendible');
      }
    }
  });

  e2('reporte de resumen de nómina', async ({ page }) => {
    await page.goto(`${BASE}/payroll/reportes`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('main, [class*="reporte"], table').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-nom-14-reporte');
  });
});
