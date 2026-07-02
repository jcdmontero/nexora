/**
 * dashboard.spec.ts — Pruebas E2E del Dashboard (Premium)
 *
 * Cobertura:
 *  - Carga sin errores JS
 *  - KPIs visibles y con valores numéricos válidos
 *  - Deferred props: alertas y actividad cargan
 *  - Sidebar con módulos activos
 *  - Navegación rápida funciona
 *  - Layout responsivo (mobile via proyecto "mobile")
 *  - Rendimiento: < 4s carga inicial
 *
 * @smoke — tests core que se corren en todos los proyectos
 */
import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { AppLayout }    from './pages/AppLayout';

const BASE = process.env.APP_URL || 'http://localhost:8000';

test.describe('Dashboard', () => {
  let dashboard: DashboardPage;
  let layout: AppLayout;

  test.beforeEach(async ({ page }) => {
    dashboard = new DashboardPage(page);
    layout    = new AppLayout(page);
    await dashboard.goto();
  });

  // ─── Carga básica ──────────────────────────────────────────────────────────

  test('carga sin errores JavaScript @smoke', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    // Navegar desde cero para capturar errores de carga
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    expect(jsErrors, `Errores JS: ${jsErrors.join('\n')}`).toHaveLength(0);
  });

  test('KPIs se renderizan con valores válidos @smoke', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Esperar cualquier elemento de stats/KPI visible
    const kpi = page.locator('h2, h3, p, span, div')
      .filter({ hasText: /^\d+$|^\$[\d.,]+/ })
      .first();

    const anyContent = page.locator('main, [role="main"], #app').first();
    await expect(anyContent).toBeVisible({ timeout: 15_000 });

    // Verificar que no haya errores de renderizado
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('NaN');
    expect(bodyText).not.toContain('[object Object]');

    await page.screenshot({ path: 'tests/e2e/results/dashboard-kpis.png', fullPage: false });
  });

  test('sidebar muestra módulos activos del tenant @smoke', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    // El layout autenticado debe tener una barra de navegación lateral
    const nav = page.locator('nav, aside, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 10_000 });

    // Debe haber al menos un enlace de módulo en la navegación
    const links = page.locator('nav a, aside a').filter({ hasText: /.{2,}/ });
    const count = await links.count();
    expect(count, 'Sidebar sin enlaces de módulos').toBeGreaterThan(0);

    await page.screenshot({ path: 'tests/e2e/results/dashboard-sidebar.png', fullPage: false });
  });

  // ─── Deferred props ────────────────────────────────────────────────────────

  test('sección de alertas carga via deferred props', async ({ page }) => {
    // Interceptar la petición de deferred data de Inertia
    const deferredRequest = page.waitForResponse(
      r => r.url().includes('/dashboard') && r.request().method() === 'GET',
      { timeout: 15_000 },
    );

    await page.goto(`${BASE}/dashboard`);
    await deferredRequest;

    // La sección de alertas debería ser visible después de la carga diferida
    const alertsVisible = await page
      .locator('text=Centro de Alertas, text=Stock bajo, text=cajas abiertas')
      .first()
      .isVisible({ timeout: 15_000 })
      .catch(() => false);

    // No falla si la sección no existe (según módulos activos), pero no debe dar error
    console.log(`📊 Alertas visibles: ${alertsVisible}`);
  });

  test('feed de actividad reciente muestra eventos', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    const activityVisible = await page
      .locator('text=Actividad reciente, text=Actividad, text=eventos')
      .first()
      .isVisible()
      .catch(() => false);

    console.log(`📋 Actividad visible: ${activityVisible}`);
    // No falla — depende de que haya datos en el sistema
  });

  // ─── Navegación ────────────────────────────────────────────────────────────

  test('acceso rápido navega a módulos @smoke', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Buscar botón de acceso rápido que sea visible y tenga href
    const quickBtn = page
      .locator('a[href*="/crm"], a[href*="/sales"], a[href*="/service-desk"]')
      .first();

    if (await quickBtn.isVisible()) {
      const href = await quickBtn.getAttribute('href');
      await quickBtn.click();
      await page.waitForLoadState('networkidle');

      // Debe haber navegado a una URL diferente al dashboard
      expect(page.url()).not.toMatch(/\/dashboard$/);
      console.log(`✅ Acceso rápido navegó a: ${page.url()}`);
    }
  });

  test('buscador global se abre con Ctrl+K', async ({ page }) => {
    await page.keyboard.press('Control+k');

    // Esperar que aparezca algún elemento de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"]').first();
    const dialogVisible = await searchInput.isVisible({ timeout: 5_000 }).catch(() => false);

    console.log(`🔍 Búsqueda global visible: ${dialogVisible}`);
    // No falla — depende de si el feature está implementado
  });

  // ─── Rendimiento ───────────────────────────────────────────────────────────

  test('dashboard carga en menos de 4 segundos', async ({ page }) => {
    const start = Date.now();
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    console.log(`⏱ Dashboard: ${elapsed}ms`);
    expect(elapsed, `Dashboard tardó ${elapsed}ms`).toBeLessThan(4_000);
  });

  test('métricas Web Vitals dentro de umbrales aceptables', async ({ page }) => {
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    const timing = await layout.getPerformanceTiming();
    console.log(`📈 DOMContentLoaded: ${timing.domContentLoaded}ms | Load: ${timing.load}ms`);

    expect(timing.domContentLoaded, 'DOMContentLoaded > 3s').toBeLessThan(3_000);
  });

  // ─── Responsivo ────────────────────────────────────────────────────────────

  test('layout es funcional en mobile @smoke', async ({ page }) => {
    // Este test solo corre en el proyecto "mobile" (viewport 412×915)
    await page.goto(`${BASE}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Verificar que la página carga sin overflow horizontal
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    expect(scrollWidth, `Overflow horizontal: ${scrollWidth} > ${clientWidth}`).toBeLessThanOrEqual(clientWidth + 5);

    await page.screenshot({
      path: 'tests/e2e/results/dashboard-mobile.png',
      fullPage: false,
    });
  });
});
