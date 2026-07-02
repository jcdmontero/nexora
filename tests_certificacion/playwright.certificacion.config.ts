import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// ─── Rutas de storage state por rol para la Certificación ─────────────────────
export const AUTH_CERT = {
  superadmin: path.join('.playwright.cert', '.auth', 'superadmin.json'),
  admin:      path.join('.playwright.cert', '.auth', 'admin.json'),
  gerente:    path.join('.playwright.cert', '.auth', 'gerente.json'),
  vendedor:   path.join('.playwright.cert', '.auth', 'vendedor.json'),
  tecnico:    path.join('.playwright.cert', '.auth', 'tecnico.json'),
  cajero:     path.join('.playwright.cert', '.auth', 'cajero.json'),
  contador:   path.join('.playwright.cert', '.auth', 'contador.json'),
  rrhh:       path.join('.playwright.cert', '.auth', 'rrhh.json'),
};

export default defineConfig({
  testDir: '.', // Estamos en tests_certificacion
  
  // Para la certificación queremos correr tests en serie en gran parte 
  // para que las operaciones tengan sentido secuencial (ej. vender lo que se compró),
  // pero usaremos 'fullyParallel: false' por defecto y controlaremos el flujo.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1, // Garantizar secuencialidad estricta para el flujo lógico

  reporter: [
    ['html', { outputFolder: 'evidencias/reports', open: 'never' }],
    ['list', { printSteps: true }],
    ['json', { outputFile: 'evidencias/reports/results.json' }],
  ],

  use: {
    baseURL:           process.env.APP_URL || 'http://localhost:8000',
    trace:             'on',           // Retener traza siempre para auditoría
    screenshot:        'on',           // Captura en cada paso/test para evidencia
    video:             'on',           // Grabar todo para evidencia en auditoría
    actionTimeout:     30_000,         // Tiempos más altos por carga de datos masiva
    navigationTimeout: 60_000,
    locale:            'es-CO',
    timezoneId:        'America/Bogota',
    viewport:          { width: 1440, height: 900 },
    bypassCSP: false,
  },

  projects: [
    // ── Setup: genera los storage states de autenticación ─────────────────────
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Flujo Diario ────────────────────────────────────────────────────────
    {
      name: 'operacion_diaria',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: '**/operacion_diaria.spec.ts',
    },

    // ── Taller y Servicio ───────────────────────────────────────────────────
    {
      name: 'taller_servicio',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: '**/taller_servicio.spec.ts',
    },

    // ── Recursos Humanos ────────────────────────────────────────────────────
    {
      name: 'recursos_humanos',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: '**/recursos_humanos.spec.ts',
    },

    // ── Seguridad y Casos Extremos ──────────────────────────────────────────
    {
      name: 'seguridad_extremos',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: '**/seguridad_extremos.spec.ts',
    },

    // ── Rendimiento y Reportes ──────────────────────────────────────────────
    {
      name: 'reportes_rendimiento',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_CERT.admin },
      dependencies: ['setup'],
      testMatch: '**/reportes_rendimiento.spec.ts',
    },
  ],

  outputDir: 'evidencias/results',
});
