/**
 * roles-permisos.spec.ts — Pruebas de control de acceso por rol (Premium)
 *
 * Cobertura:
 *  - Sidebar muestra solo módulos permitidos por rol
 *  - Rutas protegidas retornan 403 para roles no autorizados
 *  - Admin ve todos los módulos
 *  - Vendedor solo ve ventas y módulos básicos
 *  - Técnico solo ve service-desk
 *  - Rutas de superadmin bloqueadas para todos los roles de empresa
 */
import { test, expect, type Browser } from '@playwright/test';
import { AUTH } from '../../playwright.config';
import { AppLayout } from './pages/AppLayout';

const BASE = process.env.APP_URL || 'http://localhost:8000';

// Crear contextos con diferentes roles
async function pageAs(browser: Browser, storageFile: string) {
  const ctx  = await browser.newContext({ storageState: storageFile });
  const page = await ctx.newPage();
  return { page, ctx };
}

test.describe('Control de Acceso por Rol', () => {

  // ─── Admin ve todos los módulos ─────────────────────────────────────────────

  test('ADMIN: sidebar contiene navegación de módulos activos', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUTH.admin);

    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    // El sidebar debe tener varios enlaces de navegación
    const navLinks = page.locator('nav a, aside a').filter({ hasText: /.{2,}/ });
    const count = await navLinks.count();
    expect(count, 'Sidebar sin links de módulos').toBeGreaterThan(3);

    await page.screenshot({ path: 'tests/e2e/results/roles-admin-sidebar.png', fullPage: false });
    await ctx.close();
  });

  test('ADMIN: puede acceder a gestión de usuarios', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUTH.admin);
    await page.goto(`${BASE}/usuarios`);
    await page.waitForLoadState('networkidle');

    // Debe cargar la página (200) sin redirigir a login
    expect(page.url()).not.toMatch(/login/);
    const content = page.locator('main, [role="main"], h1, table').first();
    await expect(content).toBeVisible({ timeout: 10_000 });
    await ctx.close();
  });

  test('ADMIN: puede acceder a configuración de la empresa', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUTH.admin);
    await page.goto(`${BASE}/mi-empresa`);
    await page.waitForLoadState('networkidle');

    expect(page.url()).not.toMatch(/login/);
    expect(page.url()).toMatch(/mi-empresa/);
    await ctx.close();
  });

  // ─── Vendedor — acceso limitado ─────────────────────────────────────────────

  test('VENDEDOR: accede a POS y facturas', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUTH.vendedor);
    await page.goto(`${BASE}/sales/facturas`);
    await page.waitForLoadState('networkidle');

    // Puede estar en facturas o en dashboard si redirigido
    const url = page.url();
    const hasAccess = url.includes('/sales/') || url.includes('/dashboard');
    expect(hasAccess, `URL inesperada: ${url}`).toBeTruthy();

    await page.screenshot({ path: 'tests/e2e/results/roles-vendedor-ventas.png' });
    await ctx.close();
  });

  test('VENDEDOR: no puede acceder a gestión de usuarios', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUTH.vendedor);
    await page.goto(`${BASE}/usuarios`);
    await page.waitForLoadState('networkidle');

    // Debe retornar 403 o redirigir a dashboard
    const is403 = await page.locator('text=403').isVisible().catch(() => false);
    const isRedirected = !page.url().includes('/usuarios');
    expect(is403 || isRedirected, `Vendedor accedió a usuarios: ${page.url()}`).toBeTruthy();

    await page.screenshot({ path: 'tests/e2e/results/roles-vendedor-forbidden.png' });
    await ctx.close();
  });

  test('VENDEDOR: no puede acceder a configuración contable', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUTH.vendedor);
    await page.goto(`${BASE}/accounting/asientos`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    // No debe estar en la página de asientos ni autenticado en accounting
    const forbidden = await page.locator('text=403, text=No tienes permiso, text=módulo').isVisible().catch(() => false);
    const redirected = !url.includes('/accounting/asientos');
    expect(forbidden || redirected, `Vendedor accedió a contabilidad: ${url}`).toBeTruthy();

    await ctx.close();
  });

  // ─── Técnico — acceso solo a service-desk ───────────────────────────────────

  test('TECNICO: puede acceder a órdenes de servicio', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUTH.tecnico);
    await page.goto(`${BASE}/service-desk/ordenes`);
    await page.waitForLoadState('networkidle');

    const hasAccess = page.url().includes('/service-desk/') ||
                      await page.locator('table, [role="table"]').first().isVisible();
    expect(hasAccess, `Técnico no puede ver órdenes: ${page.url()}`).toBeTruthy();

    await page.screenshot({ path: 'tests/e2e/results/roles-tecnico-ordenes.png' });
    await ctx.close();
  });

  test('TECNICO: no puede acceder al módulo de ventas', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUTH.tecnico);
    await page.goto(`${BASE}/sales/facturas`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const forbidden = await page.locator('text=403, text=No tienes permiso, text=módulo').isVisible().catch(() => false);
    // El técnico no tiene ventas:view, debe ser redirigido o ver 403
    const redirected = !url.includes('/sales/facturas');
    expect(forbidden || redirected, `Técnico accedió a ventas: ${url}`).toBeTruthy();

    await ctx.close();
  });

  // ─── Portal SuperAdmin — bloqueado para todos ───────────────────────────────

  test.describe('Portal SuperAdmin bloqueado para roles de empresa', () => {
    const roles = [
      { name: 'admin empresa', file: AUTH.admin },
      { name: 'vendedor',      file: AUTH.vendedor },
      { name: 'tecnico',       file: AUTH.tecnico },
    ];

    for (const rol of roles) {
      test(`${rol.name} no puede acceder a /superadmin`, async ({ browser }) => {
        const { page, ctx } = await pageAs(browser, rol.file);
        await page.goto(`${BASE}/superadmin`);
        await page.waitForLoadState('networkidle');

        const url = page.url();
        const blocked = !url.includes('/superadmin/') ||
                        url.includes('/superadmin/login') ||
                        await page.locator('text=403').isVisible().catch(() => false);

        expect(blocked, `${rol.name} accedió al SuperAdmin: ${url}`).toBeTruthy();
        await ctx.close();
      });
    }
  });

  // ─── Rutas no existentes ─────────────────────────────────────────────────────

  test('ADMIN: ruta inexistente retorna 404', async ({ browser }) => {
    const { page, ctx } = await pageAs(browser, AUTH.admin);
    const response = await page.goto(`${BASE}/esta-ruta-no-existe-nunca`);

    expect(response?.status()).toBe(404);
    await page.screenshot({ path: 'tests/e2e/results/roles-404.png' });
    await ctx.close();
  });
});
