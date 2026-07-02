/**
 * setup/auth.setup.ts — Autenticación para la suite de Auditoría
 *
 * Genera storage states para:
 *  - SuperAdmin de plataforma
 *  - Admin Empresa 1 (TallerTech)
 *  - Admin Empresa 2 (Comercializadora)
 *  - Vendedor y Técnico de cada empresa
 *
 * Se ejecuta UNA SOLA VEZ antes de toda la suite (@dependency auditoria-setup).
 * Prerequisito: haber corrido `php artisan db:seed --class=AuditoriaSeeder`
 */
import { test as setup, expect } from '@playwright/test';
import { AUDIT_AUTH, E1, E2, SA } from '../../../../playwright.auditoria.config';
import fs from 'fs';
import path from 'path';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';

// Crear directorios de auth si no existen
const authDir = path.join('.playwright', '.auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

// ── Helper ─────────────────────────────────────────────────────────────────────

async function autenticar(
  page: import('@playwright/test').Page,
  loginUrl: string,
  email: string,
  password: string,
  expectedPattern: RegExp,
  storageFile: string,
  label: string,
) {
  console.log(`\n🔐 Autenticando: ${label} (${email})`);

  await page.goto(loginUrl);
  await page.waitForLoadState('domcontentloaded');

  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible({ timeout: 15_000 });

  await emailInput.fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();

  await page.waitForURL(expectedPattern, { timeout: 30_000 });
  await page.context().storageState({ path: storageFile });

  console.log(`   ✓ Auth guardada: ${storageFile}`);
}

// ── SuperAdmin ─────────────────────────────────────────────────────────────────

setup('auth: superadmin de plataforma', async ({ page }) => {
  await autenticar(
    page,
    `${BASE}/superadmin/login`,
    SA.email,
    SA.password,
    /\/superadmin(?!\/login)/,
    AUDIT_AUTH.superadmin,
    'SuperAdmin',
  );
  await expect(page).toHaveURL(/superadmin/);
});

// ── Empresa 1 — TallerTech ─────────────────────────────────────────────────────

setup('auth: admin empresa 1 (TallerTech)', async ({ page }) => {
  await autenticar(
    page,
    `${BASE}/login`,
    E1.admin.email,
    E1.admin.password,
    /dashboard/,
    AUDIT_AUTH.empresa1,
    'Admin TallerTech',
  );
});

setup('auth: vendedor empresa 1 (TallerTech)', async ({ page }) => {
  await autenticar(
    page,
    `${BASE}/login`,
    E1.vendedor.email,
    E1.vendedor.password,
    /dashboard/,
    AUDIT_AUTH.vendedor1,
    'Vendedor TallerTech',
  );
});

setup('auth: técnico empresa 1 (TallerTech)', async ({ page }) => {
  await autenticar(
    page,
    `${BASE}/login`,
    E1.tecnico.email,
    E1.tecnico.password,
    /dashboard/,
    AUDIT_AUTH.tecnico1,
    'Técnico TallerTech',
  );
});

// ── Empresa 2 — Comercializadora ───────────────────────────────────────────────

setup('auth: admin empresa 2 (Comercializadora)', async ({ page }) => {
  await autenticar(
    page,
    `${BASE}/login`,
    E2.admin.email,
    E2.admin.password,
    /dashboard/,
    AUDIT_AUTH.empresa2,
    'Admin Comercializadora',
  );
});

setup('auth: vendedor empresa 2 (Comercializadora)', async ({ page }) => {
  await autenticar(
    page,
    `${BASE}/login`,
    E2.vendedor.email,
    E2.vendedor.password,
    /dashboard/,
    AUDIT_AUTH.vendedor2,
    'Vendedor Comercializadora',
  );
});

setup('auth: técnico empresa 2 (Comercializadora)', async ({ page }) => {
  await autenticar(
    page,
    `${BASE}/login`,
    E2.tecnico.email,
    E2.tecnico.password,
    /dashboard/,
    AUDIT_AUTH.tecnico2,
    'Técnico Comercializadora',
  );
});
