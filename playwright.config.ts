import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// ─── Rutas de storage state por rol ───────────────────────────────────────────
export const AUTH = {
  admin:      path.join('.playwright', '.auth', 'admin.json'),
  superadmin: path.join('.playwright', '.auth', 'superadmin.json'),
  vendedor:   path.join('.playwright', '.auth', 'vendedor.json'),
  tecnico:    path.join('.playwright', '.auth', 'tecnico.json'),
};

export default defineConfig({
  testDir: './tests/e2e',

  // Paralelo entre archivos, secuencial dentro de cada archivo (Inertia+CSRF)
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['html', { outputFolder: 'tests/e2e/reports', open: 'never' }],
    ['list', { printSteps: true }],
    ['json', { outputFile: 'tests/e2e/reports/results.json' }],
  ],

  use: {
    baseURL:           process.env.APP_URL || 'http://localhost:8000',
    trace:             'retain-on-failure',
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    actionTimeout:     15_000,
    navigationTimeout: 30_000,
    locale:            'es-CO',
    timezoneId:        'America/Bogota',
    viewport:          { width: 1440, height: 900 },
    // Captura de consola en fallos
    bypassCSP: false,
  },

  projects: [
    // ── Setup: genera los storage states de autenticación ─────────────────────
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Chrome Desktop (principal) ─────────────────────────────────────────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH.admin,
      },
      dependencies: ['setup'],
      testIgnore: '**/auth.setup.ts',
    },

    // ── Firefox Desktop (cross-browser) ───────────────────────────────────────
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: AUTH.admin,
      },
      dependencies: ['setup'],
      testIgnore: '**/auth.setup.ts',
    },

    // ── Mobile Chrome — solo tests @smoke ─────────────────────────────────────
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        storageState: AUTH.admin,
      },
      dependencies: ['setup'],
      testIgnore: '**/auth.setup.ts',
      grep: /@smoke/,
    },
  ],

  outputDir: './tests/e2e/results',
});
