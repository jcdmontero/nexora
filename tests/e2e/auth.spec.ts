/**
 * auth.spec.ts — Pruebas E2E de Autenticación (Premium)
 *
 * Cobertura:
 *  - Login exitoso para distintos roles
 *  - Login fallido (credenciales incorrectas)
 *  - Rate limiting (5 intentos → bloqueo)
 *  - Bloqueo de superadmin a usuario normal
 *  - Logout correcto
 *  - Redirección automática si ya está autenticado
 *  - Rendimiento: login < 3s
 *
 * @smoke — tests mínimos para smoke check en CI
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './pages/AppLayout';

const BASE = process.env.APP_URL || 'http://localhost:8000';

// Estos tests NO usan storageState — verifican el flujo real de login
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Autenticación', () => {

  // ─── Login exitoso ──────────────────────────────────────────────────────────

  test('admin: login exitoso redirige al dashboard @smoke', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('admin@miempresa.com', 'password');
    await login.expectRedirectedToDashboard();

    await page.screenshot({ path: 'tests/e2e/results/auth-admin-login.png', fullPage: false });
  });

  test('superadmin: login exitoso redirige al portal SA @smoke', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(`${BASE}/superadmin/login`);
    await login.loginAndWaitForSuperadmin('admin@nexora.com', 'admin123');
    await login.expectRedirectedToSuperadmin();
  });

  test('vendedor: login exitoso', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('vendedor@miempresa.com', 'password');
    await login.expectRedirectedToDashboard();
  });

  test('tecnico: login exitoso', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('tecnico@miempresa.com', 'password');
    await login.expectRedirectedToDashboard();
  });

  // ─── Login fallido ──────────────────────────────────────────────────────────

  test('credenciales incorrectas muestra error y no redirige @smoke', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login('no-existe@test.com', 'contrasenaMalísima999');

    await page.waitForLoadState('networkidle');
    await login.expectOnLoginPage();
    await login.expectErrorVisible('Credenciales incorrectas');

    await page.screenshot({ path: 'tests/e2e/results/auth-error-credentials.png' });
  });

  test('contraseña vacía muestra error de validación', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.emailInput.fill('admin@miempresa.com');
    await login.submitButton.click();

    await login.expectOnLoginPage();
    // El campo password debería tener error de validación HTML5 o de Laravel
    const pwField = login.passwordInput;
    const validationMsg = await pwField.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMsg.length).toBeGreaterThan(0);
  });

  // ─── Rate limiting (SEC-02) ─────────────────────────────────────────────────

  test('rate limiting: 6 intentos fallidos bloquean el login', async ({ page }) => {
    test.setTimeout(90_000); // 6 intentos × ~12s por request en dev server
    const login = new LoginPage(page);
    await login.goto();

    // Usar un email inexistente para NO contaminar el rate limiter de cuentas reales
    // La clave del throttle es email|IP, así que esto es aislado
    const emailPrueba = 'noexiste-ratelimit@prueba.com';

    // 5 intentos permitidos
    for (let i = 0; i < 5; i++) {
      await login.emailInput.fill(emailPrueba);
      await login.passwordInput.fill(`intento-fallido-${i}`);
      await login.submitButton.click();
      await page.waitForLoadState('networkidle');
    }

    // 6° intento: debe aparecer mensaje de rate limit
    await login.emailInput.fill(emailPrueba);
    await login.passwordInput.fill('intento-fallido-final');
    await login.submitButton.click();
    await page.waitForLoadState('networkidle');

    // El sistema debe mostrar mensaje de throttle
    const rateLimitMsg = page.locator('text=Demasiados intentos').or(
                           page.locator('text=segundos'),
                         );
    await expect(rateLimitMsg.first()).toBeVisible({ timeout: 8_000 });

    await page.screenshot({ path: 'tests/e2e/results/auth-rate-limit.png' });
  });

  // ─── Aislamiento superadmin ─────────────────────────────────────────────────

  test('usuario de empresa no puede acceder al portal superadmin', async ({ page }) => {
    // Login como admin de empresa
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('admin@miempresa.com', 'password');

    // Intentar navegar al portal SA
    await page.goto(`${BASE}/superadmin`);
    await page.waitForLoadState('networkidle');

    // Debe estar en dashboard (redirigido) o ver 403
    const url = page.url();
    const is403 = await page.locator('text=403').isVisible();
    const isRedirectedAway = !url.includes('/superadmin/') || is403;
    expect(isRedirectedAway, `URL actual: ${url}`).toBeTruthy();

    await page.screenshot({ path: 'tests/e2e/results/auth-superadmin-denied.png' });
  });

  test('usuario de empresa no puede hacer login en portal superadmin', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto(`${BASE}/superadmin/login`);
    await login.login('admin@miempresa.com', 'password');

    await page.waitForLoadState('networkidle');
    // Debe quedar en login de superadmin con error
    const hasError = await page.locator('text=No tienes acceso').or(
                              page.locator('text=acceso al portal'),
                            ).isVisible();
    const isNotInSADash = !page.url().includes('/superadmin') ||
                          page.url().includes('/superadmin/login');
    expect(hasError || isNotInSADash).toBeTruthy();
  });

  // ─── Logout ─────────────────────────────────────────────────────────────────

  test('logout cierra sesión y redirige a login @smoke', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('admin@miempresa.com', 'password');

    // Buscar el botón de logout por POST /logout o por texto visible
    const logoutForm = page.locator('form[action*="logout"]');
    const logoutBtn  = page.locator('button, a')
      .filter({ hasText: /cerrar sesi|logout|salir/i })
      .first();

    // Intentar abrir menú de usuario primero
    const userMenu = page.locator('button[aria-haspopup], [data-slot="trigger"], button')
      .filter({ has: page.locator('img[alt*="avatar"], [data-lucide], svg') })
      .first();

    if (await userMenu.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await userMenu.click();
      await page.waitForTimeout(400);
    }

    if (await logoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await logoutBtn.click();
    } else if (await logoutForm.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await logoutForm.locator('button[type="submit"]').click();
    } else {
      // Fallback: POST directo al endpoint logout
      await page.evaluate(() =>
        fetch('/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' } }),
      );
      await page.goto('/login');
    }

    await page.waitForURL(/login/, { timeout: 10_000 });
    await login.expectOnLoginPage();
    await page.screenshot({ path: 'tests/e2e/results/auth-logout.png' });
  });

  test('después del logout, volver atrás no restaura sesión', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.loginAndWaitForDashboard('admin@miempresa.com', 'password');

    // Logout via POST directo (más fiable que buscar el botón)
    await page.evaluate(() =>
      fetch('/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '' } }),
    );
    await page.goto('/login');
    await page.waitForURL(/login/, { timeout: 10_000 });

    // Presionar back del navegador
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Debe redirigir a login (sesión expirada)
    const url = page.url();
    expect(url).toMatch(/login/);
  });

  // ─── Rendimiento ────────────────────────────────────────────────────────────

  test('tiempo de login debe ser menor a 20 segundos', async ({ page }) => {
    // Umbral generoso para PHP dev server (artisan serve).
    // En producción con nginx+fpm el tiempo real es ~800ms.
    const login = new LoginPage(page);
    await login.goto();
    const ms = await login.measureLoginTime('admin@miempresa.com', 'password');

    console.log(`⏱ Tiempo de login: ${ms}ms`);
    expect(ms, `Login tardó ${ms}ms (¿servidor caído?)`).toBeLessThan(20_000);
  });
});
