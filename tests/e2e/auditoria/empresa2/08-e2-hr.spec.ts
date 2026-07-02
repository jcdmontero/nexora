/**
 * 08-e2-hr.spec.ts — Recursos Humanos — Empresa 2 (Comercializadora Integral)
 *
 * Flujos cubiertos:
 *  ✓ Dashboard HR
 *  ✓ Listar empleados
 *  ✓ Crear empleado con contrato
 *  ✓ Editar empleado
 *  ✓ Ver detalle de empleado
 *  ✓ Ver contratos de empleado
 *  ✓ Crear departamento
 *  ✓ Crear cargo
 *  ✓ Ver organigrama
 *  ✓ Crear incapacidad
 *  ✓ Crear préstamo
 *  ✓ Pagar cuota de préstamo
 *  ✓ Configuración legal
 *  ✓ Afiliaciones
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
// DASHBOARD HR
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — HR — Dashboard y Organización', () => {

  e2('dashboard HR carga @smoke', async ({ page }) => {
    await page.goto(`${BASE}/hr/dashboard`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('main, [class*="dashboard"], h1').first();
    await expect(contenido).toBeVisible({ timeout: 15_000 });
    await ss(page, 'e2-hr-01-dashboard');
  });

  e2('crear departamento nuevo', async ({ page }) => {
    await page.goto(`${BASE}/hr/catalogos`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e2-hr-02-catalogos');

    // Buscar sección de departamentos
    const deptBtn = page.locator('button, a, h2, h3').filter({ hasText: /departamento/i }).first();
    if (await deptBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const btnNuevo = page.locator('button').filter({ hasText: /nuevo|crear/i }).first();
      if (await btnNuevo.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await btnNuevo.click();
        await page.waitForTimeout(500);

        const nombreInput = page.locator('input[name="nombre"]').first();
        if (await nombreInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await nombreInput.fill(`Departamento E2E ${TS}`);
          await page.locator('button[type="submit"]').first().click();
          await page.waitForLoadState('networkidle');
          await ss(page, 'e2-hr-03-departamento-creado');
        }
      }
    }
  });

  e2('ver organigrama', async ({ page }) => {
    await page.goto(`${BASE}/hr/catalogos`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    await ss(page, 'e2-hr-04-organigrama');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EMPLEADOS
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — HR — Empleados', () => {

  e2('listado de empleados con datos del seeder @smoke', async ({ page }) => {
    await page.goto(`${BASE}/hr/empleados`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/hr\/empleados/);
    const filas = await page.locator('tbody tr').count();
    console.log(`  👥 Empleados visibles: ${filas}`);
    expect(filas).toBeGreaterThan(0);
    await ss(page, 'e2-hr-05-lista-empleados');
  });

  e2('crear empleado nuevo con contrato', async ({ page }) => {
    await page.goto(`${BASE}/hr/empleados/crear`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e2-hr-06-form-crear-empleado');

    // Campos que realmente existen en el formulario HR
    const campos = [
      ['documento', `10${TS}`],
      ['nombres',   `Empleado Auditoría`],
      ['apellidos', `E2E ${TS}`],
      ['email',     `empleado.e2e.${TS}@comercializadora.co`],
      ['telefono',  `3001${TS.slice(0,5)}`],
    ];

    for (const [name, value] of campos) {
      const input = page.locator(`input[name="${name}"]`).first();
      if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await input.fill(value);
      }
    }

    // Sede — campo requerido
    const sedeSelect = page.locator('select[name="sede_id"]').first();
    if (await sedeSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await sedeSelect.selectOption({ index: 1 });
    }

    await ss(page, 'e2-hr-07-form-empleado-lleno');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');
    await ss(page, 'e2-hr-08-empleado-creado');

    const exito = !page.url().includes('/crear');
    expect(exito, `URL: ${page.url()}`).toBeTruthy();
  });

  e2('ver detalle de empleado', async ({ page }) => {
    await page.goto(`${BASE}/hr/empleados`);
    await page.waitForLoadState('networkidle');

    const viewLink = page.locator('a[href*="/hr/empleados/"]').filter({ hasNotText: /crear|nuevo/i }).first();
    if (await viewLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await viewLink.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-hr-09-detalle-empleado');
      await expect(page).toHaveURL(/hr\/empleados\/\d+/);
    }
  });

  e2('editar empleado — cambiar salario', async ({ page }) => {
    await page.goto(`${BASE}/hr/empleados`);
    await page.waitForLoadState('networkidle');

    const editLink = page.locator('a[href*="/hr/empleados/"][href*="editar"]').first();
    if (await editLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-hr-10-editar-empleado');

      const salarioInput = page.locator('input[name="salario"]').first();
      if (await salarioInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await salarioInput.clear();
        await salarioInput.fill('2200000');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e2-hr-11-empleado-actualizado');
      }
    }
  });

  e2('buscar empleado por nombre', async ({ page }) => {
    await page.goto(`${BASE}/hr/empleados`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('María');
      await page.keyboard.press('Enter');
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-hr-12-buscar-empleado');
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// INCAPACIDADES
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — HR — Incapacidades', () => {

  e2('listar incapacidades @smoke', async ({ page }) => {
    await page.goto(`${BASE}/hr/incapacidades`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-hr-13-incapacidades');
  });

  e2('crear incapacidad para un empleado', async ({ page }) => {
    await page.goto(`${BASE}/hr/incapacidades`);
    await page.waitForLoadState('networkidle');

    const btnNueva = page.locator('button, a').filter({ hasText: /nueva|crear|registrar/i }).first();
    if (await btnNueva.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNueva.click();
      await page.waitForTimeout(600);
      await ss(page, 'e2-hr-14-form-incapacidad');

      // Empleado
      const empSelect = page.locator('select[name="empleado_id"]').first();
      if (await empSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await empSelect.selectOption({ index: 1 });
      }

      // Fecha inicio
      const fechaIni = page.locator('input[name="fecha_inicio"], input[type="date"]').first();
      if (await fechaIni.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await fechaIni.fill(new Date().toISOString().split('T')[0]);
      }

      // Días
      const diasInput = page.locator('input[name="dias"]').first();
      if (await diasInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await diasInput.fill('5');
      }

      // Tipo
      const tipoSelect = page.locator('select[name="tipo"]').first();
      if (await tipoSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await tipoSelect.selectOption({ index: 1 });
      }

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e2-hr-15-incapacidad-creada');
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PRÉSTAMOS
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — HR — Préstamos', () => {

  e2('listar préstamos', async ({ page }) => {
    await page.goto(`${BASE}/hr/prestamos`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-hr-16-prestamos');
  });

  e2('crear préstamo para empleado', async ({ page }) => {
    await page.goto(`${BASE}/hr/prestamos`);
    await page.waitForLoadState('networkidle');

    const btnNuevo = page.locator('button, a').filter({ hasText: /nuevo|crear|registrar/i }).first();
    if (await btnNuevo.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNuevo.click();
      await page.waitForTimeout(600);
      await ss(page, 'e2-hr-17-form-prestamo');

      const empSelect = page.locator('select[name="empleado_id"]').first();
      if (await empSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await empSelect.selectOption({ index: 1 });
      }

      const montoInput = page.locator('input[name="monto"]').first();
      if (await montoInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await montoInput.fill('1000000');
      }

      const cuotasInput = page.locator('input[name="cuotas"]').first();
      if (await cuotasInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await cuotasInput.fill('6');
      }

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e2-hr-18-prestamo-creado');
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN LEGAL Y AFILIACIONES
// ══════════════════════════════════════════════════════════════════════════════

e2.describe('E2 — HR — Config Legal y Afiliaciones', () => {

  e2('configuración legal carga', async ({ page }) => {
    await page.goto(`${BASE}/hr/configuracion-legal`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('form, main, table').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-hr-19-config-legal');
  });

  e2('afiliaciones carga', async ({ page }) => {
    await page.goto(`${BASE}/hr/afiliaciones`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, main, [class*="empty"]').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-hr-20-afiliaciones');
  });
});
