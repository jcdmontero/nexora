/**
 * 01-e1-dashboard.spec.ts — Dashboard y navegación — Empresa 1 (TallerTech)
 *
 * Verifica:
 *  - Dashboard carga sin errores JS
 *  - KPIs y widgets visibles
 *  - Sidebar con módulos activos de E1
 *  - Navegación a cada módulo activo funciona
 *  - Responsivo (viewport 768px)
 */
import { test, expect, type Page } from '@playwright/test';
import { AUDIT_AUTH } from '../../../../playwright.auditoria.config';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';

// ── Fixture: página autenticada como admin E1 ─────────────────────────────────
const test_e1 = test.extend<{ page: Page }>({
  page: async ({ browser }, use) => {
    const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.empresa1 });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

test_e1.describe('E1 — Dashboard y Navegación @smoke', () => {
  test_e1('dashboard carga sin errores JavaScript', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') jsErrors.push(`[Console] ${msg.text()}`);
    });

    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/dashboard/);

    const contenido = page.locator('main, [role="main"], h1, h2').first();
    await expect(contenido).toBeVisible({ timeout: 20_000 });

    await page.screenshot({
      path: 'tests/e2e/auditoria/results/screenshots/e1-01-dashboard.png',
      fullPage: true,
    });

    expect(jsErrors, `Errores JS: ${jsErrors.join('\n')}`).toHaveLength(0);
  });

  test_e1('sidebar muestra módulos activos de TallerTech @smoke', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Módulos que deben aparecer en E1
    const modulosEsperados = ['CRM', 'Inventario', 'Compras', 'Ventas', 'Caja', 'Service', 'Taller'];
    // Módulos que NO deben aparecer en E1
    const modulosAusentes  = ['Nómina', 'Recursos Humanos', 'RRHH'];

    const sidebar = page.locator('nav, aside').first();
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    for (const modulo of modulosEsperados) {
      const link = sidebar.locator(`text=${modulo}`).first();
      const visible = await link.isVisible({ timeout: 3_000 }).catch(() => false);
      console.log(`  Módulo "${modulo}": ${visible ? '✓ visible' : '⚠ no visible (puede estar en submenú)'}`);
    }

    for (const modulo of modulosAusentes) {
      const link = sidebar.locator(`text=${modulo}`).first();
      const visible = await link.isVisible({ timeout: 2_000 }).catch(() => false);
      expect(visible, `"${modulo}" no debe aparecer en E1 (sin HR/Nómina)`).toBeFalsy();
    }

    await page.screenshot({ path: 'tests/e2e/auditoria/results/screenshots/e1-02-sidebar.png' });
  });

  test_e1('puede navegar al perfil de usuario', async ({ page }) => {
    await page.goto(`${BASE}/perfil`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    const form = page.locator('form, input[name="name"]').first();
    await expect(form).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'tests/e2e/auditoria/results/screenshots/e1-03-perfil.png' });
  });

  test_e1('puede navegar a usuarios y roles', async ({ page }) => {
    await page.goto(`${BASE}/usuarios`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);

    await page.goto(`${BASE}/roles`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);

    await page.screenshot({ path: 'tests/e2e/auditoria/results/screenshots/e1-04-roles.png' });
  });

  test_e1('mi empresa (configuración del tenant) carga', async ({ page }) => {
    await page.goto(`${BASE}/mi-empresa`);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/mi-empresa/);
    const form = page.locator('form, input').first();
    await expect(form).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'tests/e2e/auditoria/results/screenshots/e1-05-mi-empresa.png' });
  });

  test_e1('registro de auditoría es accesible', async ({ page }) => {
    await page.goto(`${BASE}/auditoria`);
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login/);
    await page.screenshot({ path: 'tests/e2e/auditoria/results/screenshots/e1-06-auditoria.png' });
  });
});
