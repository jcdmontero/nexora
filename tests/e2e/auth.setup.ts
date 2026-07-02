/**
 * auth.setup.ts
 *
 * Genera los storage states de autenticación para cada rol.
 * Se ejecuta UNA SOLA VEZ antes de toda la suite (proyecto "setup").
 * Los archivos .json resultantes son reutilizados por los demás proyectos
 * (chromium, firefox, mobile) para omitir el login en cada test.
 */
import { test as setup, expect } from '@playwright/test';
import { AUTH } from '../../playwright.config';
import fs from 'fs';
import path from 'path';

// Crear directorio si no existe
const authDir = path.join('.playwright', '.auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const BASE = process.env.APP_URL || 'http://localhost:8000';

async function authenticateAs(
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  expectedUrl: RegExp,
  storageFile: string,
) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('domcontentloaded');

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(expectedUrl, { timeout: 20_000 });

  await page.context().storageState({ path: storageFile });
}

// ─── Admin de empresa ──────────────────────────────────────────────────────────
setup('autenticar como admin', async ({ page }) => {
  await authenticateAs(
    page,
    'admin@miempresa.com',
    'password',
    /dashboard/,
    AUTH.admin,
  );
  await expect(page).toHaveURL(/dashboard/);
});

// ─── Superadmin ────────────────────────────────────────────────────────────────
setup('autenticar como superadmin', async ({ page }) => {
  await page.goto(`${BASE}/superadmin/login`);
  await page.waitForLoadState('domcontentloaded');

  await page.locator('input[type="email"]').fill('admin@nexora.com');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();

  // Esperar EXCLUSIVAMENTE al dashboard de SA.
  // Regex: /superadmin sin ir seguido de /login (negative lookahead)
  await page.waitForURL(/\/superadmin(?!\/login)/, { timeout: 25_000 });

  await page.context().storageState({ path: AUTH.superadmin });
});

// ─── Vendedor ──────────────────────────────────────────────────────────────────
setup('autenticar como vendedor', async ({ page }) => {
  await authenticateAs(
    page,
    'vendedor@miempresa.com',
    'password',
    /dashboard/,
    AUTH.vendedor,
  );
});

// ─── Técnico ───────────────────────────────────────────────────────────────────
setup('autenticar como tecnico', async ({ page }) => {
  await authenticateAs(
    page,
    'tecnico@miempresa.com',
    'password',
    /dashboard/,
    AUTH.tecnico,
  );
});
