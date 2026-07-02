/**
 * AppLayout.ts — Page Object para el layout autenticado.
 * Cubre sidebar, navegación, búsqueda global y menú de usuario.
 */
import { type Locator, type Page, expect } from '@playwright/test';

export class AppLayout {
  readonly page: Page;

  readonly sidebar:      Locator;
  readonly userDropdown: Locator;
  readonly globalSearch: Locator;
  readonly pageTitle:    Locator;
  readonly flashSuccess: Locator;
  readonly flashError:   Locator;

  constructor(page: Page) {
    this.page        = page;
    this.sidebar     = page.locator('nav, aside, [role="navigation"]').first();
    this.userDropdown = page.locator('[data-slot="dropdown-menu-trigger"]').or(
                          page.locator('button[aria-haspopup="menu"]'),
                        ).first();
    this.globalSearch = page.locator('input[placeholder*="Buscar"], [data-testid="global-search"]').first();
    this.pageTitle    = page.locator('h1, [data-testid="page-title"]').first();
    this.flashSuccess = page.locator('[data-variant="success"], .toast-success, [class*="toast"][class*="success"]').first();
    this.flashError   = page.locator('[data-variant="destructive"], .toast-error, [class*="toast"][class*="error"]').first();
  }

  // ─── Navegación ───────────────────────────────────────────────────────────

  async navigateTo(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async clickSidebarLink(text: string | RegExp) {
    const link = this.sidebar.locator('a').filter({ hasText: text }).first();
    await link.click();
    await this.page.waitForLoadState('networkidle');
  }

  async openUserMenu() {
    await this.userDropdown.click();
  }

  async logout() {
    await this.openUserMenu();
    const logoutBtn = this.page
      .locator('button, [role="menuitem"]')
      .filter({ hasText: /cerrar sesi|logout|salir/i })
      .first();
    await logoutBtn.click();
    await this.page.waitForURL(/login/, { timeout: 10_000 });
  }

  // ─── Búsqueda global ──────────────────────────────────────────────────────

  async openGlobalSearch() {
    // Cmd+K / Ctrl+K
    await this.page.keyboard.press('Control+k');
    await this.globalSearch.waitFor({ state: 'visible', timeout: 5_000 });
  }

  async searchGlobal(query: string) {
    await this.openGlobalSearch();
    await this.globalSearch.fill(query);
    await this.page.waitForLoadState('networkidle');
  }

  // ─── Aserciones ───────────────────────────────────────────────────────────

  async expectSidebarVisible() {
    await expect(this.sidebar).toBeVisible();
  }

  async expectSidebarContainsModule(moduleName: string | RegExp) {
    const link = this.sidebar.locator('a').filter({ hasText: moduleName }).first();
    await expect(link).toBeVisible();
  }

  async expectSidebarNotContainsModule(moduleName: string | RegExp) {
    const link = this.sidebar.locator('a').filter({ hasText: moduleName });
    await expect(link).toHaveCount(0);
  }

  async expectFlashSuccess(partialText?: string) {
    if (partialText) {
      await expect(this.page.locator(`text=${partialText}`).or(this.flashSuccess)).toBeVisible({ timeout: 8_000 });
    } else {
      await expect(this.flashSuccess).toBeVisible({ timeout: 8_000 });
    }
  }

  async expectFlashError() {
    await expect(this.flashError).toBeVisible({ timeout: 8_000 });
  }

  async expectPageTitle(text: string | RegExp) {
    await expect(this.pageTitle).toContainText(text instanceof RegExp ? text.source : text);
  }

  // ─── Utilidades ───────────────────────────────────────────────────────────

  async getPerformanceTiming(): Promise<{ domContentLoaded: number; load: number }> {
    return this.page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        load: Math.round(nav.loadEventEnd - nav.startTime),
      };
    });
  }
}
