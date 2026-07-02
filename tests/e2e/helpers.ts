import { type Page, type Expect } from '@playwright/test';

const BASE_URL = process.env.APP_URL || 'http://localhost:8000';
const ADMIN_EMAIL = process.env.TEST_EMAIL || 'admin@miempresa.com';
const ADMIN_PASSWORD = process.env.TEST_PASSWORD || 'password';
const SUPERADMIN_EMAIL = 'admin@nexora.com';
const SUPERADMIN_PASSWORD = 'admin123';

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/login`);
  // Si el storageState ya autenticó al usuario, /login redirige al dashboard.
  // En ese caso, no hay formulario que llenar.
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard')) {
    return; // ya autenticado
  }
  // Verificar si el formulario está visible (no redirigido)
  const emailInput = page.locator('input[type="email"]');
  const isLoginPage = await emailInput.isVisible({ timeout: 3000 }).catch(() => false);
  if (!isLoginPage) {
    // Fue redirigido al dashboard por el middleware de guest
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    return;
  }
  await emailInput.fill(ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

export async function loginAsSuperadmin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/superadmin/login`);
  await page.fill('input[type="email"]', SUPERADMIN_EMAIL);
  await page.fill('input[type="password"]', SUPERADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/superadmin', { timeout: 15000 });
}

export async function logout(page: Page): Promise<void> {
  const userDropdown = page.locator('button').filter({ has: page.locator('[data-lucide="chevron-down"], .lucide-chevron-down') }).first();
  if (await userDropdown.isVisible()) {
    await userDropdown.click();
    const logoutBtn = page.locator('button, a').filter({ hasText: /cerrar sesi|logout|salir/i }).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL('**/login', { timeout: 10000 });
    }
  }
}

export async function navigateToModule(page: Page, moduleName: string): Promise<void> {
  const sidebarLink = page.locator('nav a, aside a').filter({ hasText: new RegExp(moduleName, 'i') }).first();
  if (await sidebarLink.isVisible()) {
    await sidebarLink.click();
    await page.waitForLoadState('networkidle');
  }
}

export async function waitForToast(page: Page, type: 'success' | 'error' = 'success'): Promise<void> {
  const toast = page.locator(`[data-variant="${type}"], .toast-${type}`).first();
  await toast.waitFor({ state: 'visible', timeout: 10000 });
}

export async function fillForm(page: Page, fields: Record<string, string>): Promise<void> {
  for (const [label, value] of Object.entries(fields)) {
    const field = page.locator(`input[name="${label}"], textarea[name="${label}"], select[name="${label}"]`).first();
    if (await field.isVisible()) {
      const tagName = await field.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        await field.selectOption(value);
      } else {
        await field.fill(value);
      }
    }
  }
}

export async function clickButton(page: Page, text: string): Promise<void> {
  const btn = page.locator('button, a[role="button"]').filter({ hasText: new RegExp(text, 'i') }).first();
  await btn.click();
  await page.waitForLoadState('networkidle');
}

export async function searchInTable(page: Page, searchTerm: string): Promise<void> {
  const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
  if (await searchInput.isVisible()) {
    await searchInput.fill(searchTerm);
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');
  }
}

export async function expectVisible(page: Page, selector: string): Promise<void> {
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 10000 });
}

export async function screenshotStep(page: Page, name: string): Promise<void> {
  await page.screenshot({ 
    path: `tests/e2e/results/screenshots/${name}.png`,
    fullPage: true 
  });
}
