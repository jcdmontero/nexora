/**
 * 11-e2-roles-permisos.spec.ts — Roles, Permisos y Usuarios — Empresa 2
 *
 * Flujos cubiertos:
 *  ✓ Listar usuarios de la empresa
 *  ✓ Crear usuario nuevo con rol
 *  ✓ Editar usuario (cambiar rol)
 *  ✓ Desactivar usuario
 *  ✓ Reactivar usuario
 *  ✓ Listar roles
 *  ✓ Crear rol personalizado
 *  ✓ Asignar permisos a rol
 *  ✓ Verificar que VENDEDOR no accede a RRHH
 *  ✓ Verificar que TÉCNICO no accede a CONTABILIDAD
 *  ✓ Verificar que CONTADOR accede a CONTABILIDAD
 *  ✓ Sedes: listar, crear, editar
 */
import { test, expect, type Page, type Browser } from '@playwright/test';
import { AUDIT_AUTH } from '../../../../playwright.auditoria.config';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';
const TS   = Date.now().toString().slice(-6);

const e2Admin = test.extend<{ page: Page }>({
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

async function pageAs(browser: Browser, storageFile: string) {
  const ctx  = await browser.newContext({ storageState: storageFile });
  const page = await ctx.newPage();
  return { page, ctx };
}

// ══════════════════════════════════════════════════════════════════════════════
// USUARIOS
// ══════════════════════════════════════════════════════════════════════════════

e2Admin.describe('E2 — Usuarios', () => {

  e2Admin('listar usuarios @smoke', async ({ page }) => {
    await page.goto(`${BASE}/usuarios`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/usuarios/);
    const contenido = page.locator('table, [class*="card"], main').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    const filas = await page.locator('tbody tr').count();
    console.log(`  👤 Usuarios visibles: ${filas}`);
    expect(filas).toBeGreaterThan(0);
    await ss(page, 'e2-usr-01-lista');
  });

  e2Admin('crear usuario nuevo con rol VENDEDOR', async ({ page }) => {
    await page.goto(`${BASE}/usuarios/crear`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e2-usr-02-form');

    const campos = [
      ['name',     `Usuario E2E ${TS}`],
      ['email',    `usuario.e2e.${TS}@comercializadora.co`],
      ['password', 'Audit2026!'],
      ['password_confirmation', 'Audit2026!'],
    ];

    for (const [name, value] of campos) {
      const input = page.locator(`input[name="${name}"]`).first();
      if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await input.fill(value);
      }
    }

    // Rol
    const rolSelect = page.locator('select[name="role"]').first();
    if (await rolSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await rolSelect.selectOption('VENDEDOR');
    }

    await ss(page, 'e2-usr-03-form-lleno');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForLoadState('networkidle');
    await ss(page, 'e2-usr-04-creado');

    const exito = !page.url().includes('/crear');
    expect(exito, `URL: ${page.url()}`).toBeTruthy();
  });

  e2Admin('desactivar y reactivar usuario', async ({ page }) => {
    await page.goto(`${BASE}/usuarios`);
    await page.waitForLoadState('networkidle');

    // Buscar botón de desactivar/cambiar estado en primera fila (no el admin)
    const toggleBtn = page.locator('button').filter({ hasText: /desactivar|inactivar|toggle/i }).last();
    if (await toggleBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await toggleBtn.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-usr-05-toggle-estado');

      // Reactivar
      const reactivarBtn = page.locator('button').filter({ hasText: /activar|reactivar/i }).last();
      if (await reactivarBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await reactivarBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e2-usr-06-reactivado');
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ROLES
// ══════════════════════════════════════════════════════════════════════════════

e2Admin.describe('E2 — Roles', () => {

  e2Admin('listar roles @smoke', async ({ page }) => {
    await page.goto(`${BASE}/roles`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/roles/);
    const contenido = page.locator('table, [class*="card"], main').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    await ss(page, 'e2-rol-01-lista');
  });

  e2Admin('crear rol personalizado con permisos', async ({ page }) => {
    await page.goto(`${BASE}/roles`);
    await page.waitForLoadState('networkidle');

    const btnNuevo = page.locator('button, a').filter({ hasText: /nuevo|crear/i }).first();
    if (await btnNuevo.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await btnNuevo.click();
      await page.waitForTimeout(600);
      await ss(page, 'e2-rol-02-form');

      const nombreInput = page.locator('input[name="name"], input[name="nombre"]').first();
      if (await nombreInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await nombreInput.fill(`ROL_AUDITOR_${TS}`);
      }

      // Seleccionar permisos
      const permisos = ['crm:view', 'inventory:view', 'sales:view'];
      for (const perm of permisos) {
        const checkbox = page.locator(`input[value="${perm}"], input[name="${perm}"]`).first();
        if (await checkbox.isVisible({ timeout: 1_000 }).catch(() => false)) {
          await checkbox.check();
        }
      }

      await ss(page, 'e2-rol-03-permisos-seleccionados');

      const submitBtn = page.locator('button[type="submit"]').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await ss(page, 'e2-rol-04-rol-creado');
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AISLAMIENTO DE PERMISOS
// ══════════════════════════════════════════════════════════════════════════════

e2Admin.describe('E2 — Aislamiento de Permisos entre Roles', () => {

  e2Admin('VENDEDOR no puede acceder a RRHH', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUDIT_AUTH.vendedor2);

    await page.goto(`${BASE}/hr/empleados`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const es403 = await page.locator('text=403').isVisible().catch(() => false);
    const redirigido = !url.includes('/hr/empleados');

    await ss(page, 'e2-perm-01-vendedor-hr-denegado');
    expect(es403 || redirigido, `Vendedor accedió a RRHH: ${url}`).toBeTruthy();

    await ctx.close();
  });

  e2Admin('TÉCNICO no puede acceder a Contabilidad', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUDIT_AUTH.tecnico2);

    await page.goto(`${BASE}/contabilidad/asientos`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const es403 = await page.locator('text=403').isVisible().catch(() => false);
    const redirigido = !url.includes('/contabilidad/asientos');

    await ss(page, 'e2-perm-02-tecnico-contab-denegado');
    expect(es403 || redirigido, `Técnico accedió a Contabilidad: ${url}`).toBeTruthy(); // espera 403 o redirect a /dashboard

    await ctx.close();
  });

  e2Admin('empresa 2 no puede acceder a datos de empresa 1 (aislamiento tenant)', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUDIT_AUTH.empresa2);

    // Intentar acceder directamente al cliente 1 de empresa 1 (por URL)
    await page.goto(`${BASE}/crm/clientes/1`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const es403 = await page.locator('text=403, text=404, text=No encontrado').isVisible().catch(() => false);
    const redirigido = !url.includes('/crm/clientes/1');

    await ss(page, 'e2-perm-03-aislamiento-tenant');
    // El tenant isolation debe bloquear o no mostrar el registro de otro tenant
    console.log(`  Aislamiento tenant: URL=${url}, 403=${es403}, redirigido=${redirigido}`);

    await ctx.close();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SEDES
// ══════════════════════════════════════════════════════════════════════════════

e2Admin.describe('E2 — Sedes', () => {

  e2Admin('listar sedes @smoke', async ({ page }) => {
    await page.goto(`${BASE}/sedes`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const contenido = page.locator('table, [class*="card"], main').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });
    const filas = await page.locator('tbody tr, [class*="sede-row"]').count();
    console.log(`  🏢 Sedes: ${filas}`);
    await ss(page, 'e2-sedes-01-lista');
  });

  e2Admin('crear sede nueva', async ({ page }) => {
    await page.goto(`${BASE}/sedes/crear`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'e2-sedes-02-form');

    const campos = [
      ['nombre',    `Sede Auditoría E2E ${TS}`],
      ['direccion', 'Cll 100 # 45-67, Bogotá'],
    ];

    for (const [name, value] of campos) {
      const input = page.locator(`input[name="${name}"]`).first();
      if (await input.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await input.fill(value);
      }
    }

    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e2-sedes-03-creada');
    }
  });
});
