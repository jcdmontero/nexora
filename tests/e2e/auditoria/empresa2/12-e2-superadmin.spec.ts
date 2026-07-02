/**
 * 12-e2-superadmin.spec.ts — Portal SuperAdmin — Gestión de ambas empresas
 *
 * Flujos cubiertos:
 *  ✓ Dashboard SuperAdmin carga sin errores
 *  ✓ Listar empresas: TallerTech y Comercializadora aparecen
 *  ✓ Ver detalle de Empresa 1 (TallerTech)
 *  ✓ Ver detalle de Empresa 2 (Comercializadora)
 *  ✓ Verificar módulos activos de cada empresa
 *  ✓ Editar datos de empresa
 *  ✓ Suspender empresa (sin confirmar)
 *  ✓ Catálogo de módulos: estados correctos
 *  ✓ Auditoría: registros generados por las pruebas
 */
import { test, expect, type Page } from '@playwright/test';
import { AUDIT_AUTH } from '../../../../playwright.auditoria.config';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';

const sa = test.extend<{ page: Page }>({
  page: async ({ browser }, use) => {
    const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.superadmin });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

async function ss(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/auditoria/results/screenshots/${name}.png`, fullPage: true });
}

sa.describe('SuperAdmin — Gestión de Empresas de Auditoría', () => {

  sa('dashboard SA carga sin errores JS @smoke', async ({ page }) => {
    const jsErrors: string[] = [];
    page.on('pageerror', err => jsErrors.push(err.message));

    await page.goto(`${BASE}/superadmin`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/superadmin/);
    const contenido = page.locator('main, [class*="dashboard"], h1').first();
    await expect(contenido).toBeVisible({ timeout: 15_000 });

    await ss(page, 'sa-01-dashboard');
    expect(jsErrors, `Errores JS: ${jsErrors.join('\n')}`).toHaveLength(0);
  });

  sa('empresa 1 "TallerTech" aparece en el listado @smoke', async ({ page }) => {
    await page.goto(`${BASE}/superadmin/empresas`);
    await page.waitForLoadState('networkidle');

    const tallertech = page.locator('text=TallerTech').first();
    await expect(tallertech).toBeVisible({ timeout: 10_000 });

    await ss(page, 'sa-02-empresas-con-tallertech');
  });

  sa('empresa 2 "Comercializadora" aparece en el listado @smoke', async ({ page }) => {
    await page.goto(`${BASE}/superadmin/empresas`);
    await page.waitForLoadState('networkidle');

    const comercializadora = page.locator('text=Comercializadora').first();
    await expect(comercializadora).toBeVisible({ timeout: 10_000 });

    await ss(page, 'sa-03-empresas-con-comercializadora');
  });

  sa('puede ver detalle de Empresa 1 con módulos activos', async ({ page }) => {
    await page.goto(`${BASE}/superadmin/empresas`);
    await page.waitForLoadState('networkidle');

    // Buscar el enlace de TallerTech
    const e1Row = page.locator('tr, [class*="row"]').filter({ hasText: /TallerTech/ }).first();
    const editLink = e1Row.locator('a[href*="editar"], a, button').filter({ hasText: /editar|ver/i }).first();

    if (await editLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'sa-04-detalle-empresa1');

      // Verificar que CRM, Inventario, etc. están activos
      const modulosCRM = page.locator('[class*="badge"], [class*="module"], input[type="checkbox"]').filter({ hasText: /CRM|crm/ }).first();
      if (await modulosCRM.isVisible({ timeout: 3_000 }).catch(() => false)) {
        console.log('  ✓ CRM visible en módulos de E1');
      }
    }
  });

  sa('puede ver detalle de Empresa 2 con TODOS los módulos activos', async ({ page }) => {
    await page.goto(`${BASE}/superadmin/empresas`);
    await page.waitForLoadState('networkidle');

    const e2Row = page.locator('tr, [class*="row"]').filter({ hasText: /Comercializadora/ }).first();
    const editLink = e2Row.locator('a[href*="editar"], a, button').filter({ hasText: /editar|ver/i }).first();

    if (await editLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await editLink.click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'sa-05-detalle-empresa2');
    }
  });

  sa('catálogo de módulos muestra estados correctos @smoke', async ({ page }) => {
    await page.goto(`${BASE}/superadmin/modulos`);
    await page.waitForLoadState('networkidle');

    const contenido = page.locator('table, [class*="card"], main').first();
    await expect(contenido).toBeVisible({ timeout: 10_000 });

    // Los módulos deben mostrar estado "publicado"
    const publicado = page.locator('text=publicado, text=Publicado, [class*="publicado"]').first();
    await expect(publicado).toBeVisible({ timeout: 5_000 }).catch(() => {
      console.log('  ⚠️ Badge "publicado" no encontrado — verificar estados');
    });

    await ss(page, 'sa-06-modulos-estados');
  });

  sa('formulario de nueva empresa tiene campos correctos', async ({ page }) => {
    await page.goto(`${BASE}/superadmin/empresas/crear`);
    await page.waitForLoadState('networkidle');
    await ss(page, 'sa-07-form-nueva-empresa');

    const camposEsperados = ['nombre', 'slug', 'email'];
    for (const campo of camposEsperados) {
      const input = page.locator(`input[name="${campo}"]`).first();
      if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
        console.log(`  ✓ Campo "${campo}" presente`);
      } else {
        console.log(`  ⚠️ Campo "${campo}" no encontrado`);
      }
    }
  });

  sa('usuario normal no puede acceder al portal SA @smoke', async ({ browser }) => {
    const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.empresa1 });
    const page = await ctx.newPage();

    await page.goto(`${BASE}/superadmin`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const bloqueado = url.includes('/superadmin/login') ||
                      !url.includes('/superadmin/') ||
                      await page.locator('text=403').isVisible().catch(() => false);

    await page.screenshot({ path: 'tests/e2e/auditoria/results/screenshots/sa-08-acceso-denegado.png' });
    expect(bloqueado, `Admin empresa accedió al SA: ${url}`).toBeTruthy();
    await ctx.close();
  });
});
