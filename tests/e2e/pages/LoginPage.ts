import { type Locator, type Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // ─── Locators (semánticos, no CSS de implementación) ───────────────────────
  readonly emailInput:    Locator;
  readonly passwordInput: Locator;
  readonly submitButton:  Locator;
  readonly errorMessage:  Locator;
  readonly rememberCheck: Locator;

  constructor(page: Page) {
    this.page         = page;
    this.emailInput    = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton  = page.locator('button[type="submit"]');
    this.errorMessage  = page.locator('[class*="error"], p.text-destructive, [role="alert"]');
    this.rememberCheck = page.locator('input[type="checkbox"]').first();
  }

  // ─── Acciones ──────────────────────────────────────────────────────────────

  async goto(path = '/login') {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async loginAndWaitForDashboard(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL(/dashboard/, { timeout: 20_000 });
  }

  async loginAndWaitForSuperadmin(email: string, password: string) {
    await this.login(email, password);
    await this.page.waitForURL(/superadmin/, { timeout: 20_000 });
  }

  // ─── Aserciones ────────────────────────────────────────────────────────────

  async expectOnLoginPage() {
    await expect(this.page).toHaveURL(/login/);
    await expect(this.emailInput).toBeVisible();
  }

  async expectErrorVisible(partialText?: string) {
    const loc = partialText
      ? this.page.locator(`text=${partialText}`).or(this.errorMessage)
      : this.errorMessage;
    await expect(loc.first()).toBeVisible({ timeout: 8_000 });
  }

  async expectRedirectedToDashboard() {
    await expect(this.page).toHaveURL(/dashboard/, { timeout: 20_000 });
  }

  async expectRedirectedToSuperadmin() {
    await expect(this.page).toHaveURL(/superadmin/, { timeout: 20_000 });
  }

  // ─── Rendimiento ───────────────────────────────────────────────────────────

  async measureLoginTime(email: string, password: string): Promise<number> {
    const start = Date.now();
    await this.login(email, password);
    await this.page.waitForURL(/dashboard|superadmin/, { timeout: 20_000 });
    return Date.now() - start;
  }
}
