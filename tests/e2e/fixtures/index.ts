/**
 * fixtures/index.ts
 *
 * Extensión de `test` de Playwright con fixtures por rol.
 * Cada fixture crea un contexto de navegador con el storage state correspondiente
 * para evitar login en cada test.
 *
 * Uso:
 *   import { test, expect } from '../fixtures';
 *   test('solo visible para técnicos', async ({ tecnicoPage }) => { ... });
 */
import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { AUTH } from '../../../playwright.config';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { AppLayout } from '../pages/AppLayout';

export { expect } from '@playwright/test';

// ─── Tipos de fixtures ────────────────────────────────────────────────────────

type RoleFixtures = {
  /** Página autenticada como ADMIN_EMPRESA */
  adminPage: Page;
  /** Página autenticada como superadmin */
  superadminPage: Page;
  /** Página autenticada como VENDEDOR */
  vendedorPage: Page;
  /** Página autenticada como TECNICO */
  tecnicoPage: Page;
  /** POMs instanciados para el test actual */
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  appLayout: AppLayout;
};

// ─── Helper para crear contexto con rol ───────────────────────────────────────

async function pageWithRole(
  browser: import('@playwright/test').Browser,
  storageFile: string,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ storageState: storageFile });
  const page = await context.newPage();
  return { context, page };
}

// ─── Extensión del test ───────────────────────────────────────────────────────

export const test = base.extend<RoleFixtures>({
  adminPage: async ({ browser }, use) => {
    const { context, page } = await pageWithRole(browser, AUTH.admin);
    await use(page);
    await context.close();
  },

  superadminPage: async ({ browser }, use) => {
    const { context, page } = await pageWithRole(browser, AUTH.superadmin);
    await use(page);
    await context.close();
  },

  vendedorPage: async ({ browser }, use) => {
    const { context, page } = await pageWithRole(browser, AUTH.vendedor);
    await use(page);
    await context.close();
  },

  tecnicoPage: async ({ browser }, use) => {
    const { context, page } = await pageWithRole(browser, AUTH.tecnico);
    await use(page);
    await context.close();
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },

  appLayout: async ({ page }, use) => {
    await use(new AppLayout(page));
  },
});
