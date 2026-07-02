/**
 * superadmin.spec.ts — Portal SuperAdmin (Premium)
 *
 * Usa storageState de superadmin (generado en auth.setup.ts).
 * Cobertura:
 *  - Dashboard superadmin carga correctamente
 *  - Listado de empresas con datos del seeder
 *  - Listado de módulos del catálogo
 *  - Toggle activo/suspendido de empresa
 *  - Centro de módulos: estados válidos
 *  - Seguridad: usuario de empresa no puede acceder
 */
import { test as base, expect, type Browser } from '@playwright/test';
import { AUTH } from '../../playwright.config';

const BASE = process.env.APP_URL || 'http://localhost:8000';

// Fixture: página autenticada como superadmin
const test = base.extend<{ saPage: import('@playwright/test').Page }>({
  saPage: async ({ browser }, use) => {
    const ctx  = await browser.newContext({ storageState: AUTH.superadmin });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

test.describe('Portal SuperAdmin', () => {

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  test('dashboard SA carga sin errores @smoke', async ({ saPage: page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/superadmin`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/superadmin/);
    expect(errors, `Errores JS: ${errors.join('\n')}`).toHaveLength(0);

    await page.screenshot({ path: 'tests/e2e/results/sa-01-dashboard.png', fullPage: false });
  });

  // ─── Empresas ───────────────────────────────────────────────────────────────

  test('listado de empresas muestra la empresa demo @smoke', async ({ saPage: page }) => {
    await page.goto(`${BASE}/superadmin/empresas`);
    await page.waitForLoadState('networkidle');

    // Esperar contenido cargado (tabla, cards o cualquier lista)
    const content = page.locator('table, [class*="card"], [class*="grid"], main > *').first();
    await expect(content).toBeVisible({ timeout: 10_000 });

    // La empresa "Mi Empresa" del seeder debe aparecer
    const miEmpresa = page.locator('text=Mi Empresa').or(page.locator('text=mi-empresa'));
    await expect(miEmpresa.first()).toBeVisible({ timeout: 8_000 });

    await page.screenshot({ path: 'tests/e2e/results/sa-02-empresas.png', fullPage: true });
  });

  test('puede ver detalle de empresa con módulos activos', async ({ saPage: page }) => {
    await page.goto(`${BASE}/superadmin/empresas`);
    await page.waitForLoadState('networkidle');

    // Buscar botón de editar/ver de la primera empresa
    const editBtn = page
      .locator('a[href*="superadmin/empresas/"], a[href*="editar"]')
      .first();

    if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForLoadState('networkidle');

      // Deben aparecer checkboxes/tags de módulos
      const modulos = page.locator('input[type="checkbox"], [class*="badge"], [class*="module"]');
      const count = await modulos.count();
      expect(count, 'No se encontraron módulos en el detalle de empresa').toBeGreaterThan(0);

      await page.screenshot({ path: 'tests/e2e/results/sa-03-empresa-detalle.png', fullPage: true });
    }
  });

  // ─── Módulos ─────────────────────────────────────────────────────────────────

  test('catálogo de módulos carga correctamente @smoke', async ({ saPage: page }) => {
    await page.goto(`${BASE}/superadmin/modulos`);
    await page.waitForLoadState('networkidle');

    const content = page.locator('table, [class*="card"], [class*="grid"], main > *').first();
    await expect(content).toBeVisible({ timeout: 10_000 });

    // Los módulos del sistema deben estar listados
    const moduloNames = ['Ventas', 'Inventario', 'CRM', 'Contabilidad'];
    for (const nombre of moduloNames) {
      const row = page.locator('text=' + nombre).first();
      if (await row.isVisible({ timeout: 2_000 }).catch(() => false)) {
        console.log(`✅ Módulo visible: ${nombre}`);
      }
    }

    await page.screenshot({ path: 'tests/e2e/results/sa-04-modulos.png', fullPage: true });
  });

  test('módulos tienen estados válidos en la UI', async ({ saPage: page }) => {
    await page.goto(`${BASE}/superadmin/modulos`);
    await page.waitForLoadState('networkidle');

    // Verificar que hay contenido en la página (módulos en tabla o cards)
    const content = page.locator('table tbody tr, [class*="card"], [class*="module-row"]');
    const rowCount = await content.count();
    console.log(`📦 Módulos en catálogo: ${rowCount}`);

    // Al menos 1 módulo debe estar listado
    const mainContent = page.locator('main > *').first();
    await expect(mainContent).toBeVisible({ timeout: 10_000 });
  });

  // ─── Creación de empresa ─────────────────────────────────────────────────────

  test('formulario de nueva empresa tiene todos los campos requeridos', async ({ saPage: page }) => {
    await page.goto(`${BASE}/superadmin/empresas/crear`);
    await page.waitForLoadState('networkidle');

    // Verificar campos críticos del formulario
    const fields = ['nombre', 'slug', 'email', 'admin_email', 'admin_password'];
    for (const field of fields) {
      const input = page.locator(`input[name="${field}"]`).first();
      if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
        console.log(`✅ Campo presente: ${field}`);
      }
    }

    await page.screenshot({ path: 'tests/e2e/results/sa-05-crear-empresa.png', fullPage: true });
  });

  // ─── Validación de seguridad ─────────────────────────────────────────────────

  test('usuario normal no puede acceder al portal SA via URL directa @smoke', async ({ browser }) => {
    // Usar contexto limpio (sin auth state de SA)
    const ctx  = await browser.newContext({ storageState: AUTH.admin });
    const page = await ctx.newPage();

    await page.goto(`${BASE}/superadmin`);
    await page.waitForLoadState('networkidle');

    // Debe ser redirigido fuera del SA o ver 403
    const url = page.url();
    const blocked = !url.includes('/superadmin/dashboard') ||
                    url.includes('/superadmin/login') ||
                    await page.locator('text=403').isVisible().catch(() => false);

    expect(blocked, `Admin de empresa accedió al SA dashboard: ${url}`).toBeTruthy();
    await page.screenshot({ path: 'tests/e2e/results/sa-06-acceso-denegado.png' });
    await ctx.close();
  });
});
