/**
 * playwright.auditoria.config.ts
 *
 * Configuración exclusiva para la suite de Auditoría E2E Integral.
 * Cubre DOS empresas de prueba completamente nuevas:
 *
 *  - Empresa 1: TallerTech Reparaciones SAS (sin HR/Nómina)
 *  - Empresa 2: Comercializadora Integral SAS (todos los módulos)
 *
 * Uso:
 *   npx playwright test --config=playwright.auditoria.config.ts
 *   npx playwright test --config=playwright.auditoria.config.ts --ui
 *   npx playwright test --config=playwright.auditoria.config.ts --reporter=html
 */
import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export const AUDIT_AUTH = {
  superadmin:   path.join('.playwright', '.auth', 'audit-superadmin.json'),
  empresa1:     path.join('.playwright', '.auth', 'audit-empresa1.json'),
  empresa2:     path.join('.playwright', '.auth', 'audit-empresa2.json'),
  vendedor1:    path.join('.playwright', '.auth', 'audit-vendedor1.json'),
  tecnico1:     path.join('.playwright', '.auth', 'audit-tecnico1.json'),
  vendedor2:    path.join('.playwright', '.auth', 'audit-vendedor2.json'),
  tecnico2:     path.join('.playwright', '.auth', 'audit-tecnico2.json'),
};

export const E1 = {
  admin:    { email: 'admin@tallertech.co',     password: 'Audit2026!' },
  vendedor: { email: 'vendedor@tallertech.co',  password: 'Audit2026!' },
  tecnico:  { email: 'tecnico@tallertech.co',   password: 'Audit2026!' },
};

export const E2 = {
  admin:    { email: 'admin@comercializadora.co',    password: 'Audit2026!' },
  vendedor: { email: 'vendedor@comercializadora.co', password: 'Audit2026!' },
  tecnico:  { email: 'tecnico@comercializadora.co',  password: 'Audit2026!' },
};

export const SA = {
  email:    'admin@nexora.com',
  password: 'admin123',
};

export default defineConfig({
  testDir: './tests/e2e/auditoria',

  fullyParallel: false,        // Las suites por empresa son secuenciales (CSRF + estado)
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,                  // Un trabajador para mantener el orden correcto

  reporter: [
    ['html', { outputFolder: 'tests/e2e/auditoria/reports', open: 'never' }],
    ['list', { printSteps: true }],
    ['json', { outputFile: 'tests/e2e/auditoria/reports/results.json' }],
  ],

  use: {
    baseURL:           process.env.APP_URL || 'http://127.0.0.1:8000',
    trace:             'on',                    // Captura trace de TODOS los tests
    screenshot:        'on',                    // Captura screenshot de TODOS los tests
    video:             'on',                    // Graba video de TODOS los tests
    actionTimeout:     20_000,
    navigationTimeout: 45_000,
    locale:            'es-CO',
    timezoneId:        'America/Bogota',
    viewport:          { width: 1440, height: 900 },
  },

  projects: [
    // ── Setup global: genera storage states ────────────────────────────────────
    {
      name: 'auditoria-setup',
      testMatch: '**/setup/auth.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Suite completa — Chrome Desktop ───────────────────────────────────────
    {
      name: 'auditoria-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUDIT_AUTH.empresa1,     // Default: admin empresa 1
      },
      dependencies: ['auditoria-setup'],
      testIgnore: '**/setup/**',
    },

    // ── Smoke rápido — Mobile ─────────────────────────────────────────────────
    {
      name: 'auditoria-mobile',
      use: {
        ...devices['Pixel 7'],
        storageState: AUDIT_AUTH.empresa1,
      },
      dependencies: ['auditoria-setup'],
      testIgnore: '**/setup/**',
      grep: /@smoke/,
    },
  ],

  outputDir: './tests/e2e/auditoria/results',
});
