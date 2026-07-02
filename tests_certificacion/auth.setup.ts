import { test as setup, expect } from '@playwright/test';
import { AUTH_CERT } from './playwright.certificacion.config';
import fs from 'fs';
import path from 'path';

const authDir = path.join('.playwright.cert', '.auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

const BASE = process.env.APP_URL || 'http://localhost:8000';

async function authenticateAs(page: import('@playwright/test').Page, email: string, password: string, storageFile: string) {
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/dashboard/, { timeout: 30_000 });
  await page.context().storageState({ path: storageFile });
}

setup('autenticar como admin', async ({ page }) => {
  await authenticateAs(page, 'admin@certificacion.com', 'password', AUTH_CERT.admin);
});
setup('autenticar como gerente', async ({ page }) => {
  await authenticateAs(page, 'gerente@certificacion.com', 'password', AUTH_CERT.gerente);
});
setup('autenticar como vendedor', async ({ page }) => {
  await authenticateAs(page, 'vendedor@certificacion.com', 'password', AUTH_CERT.vendedor);
});
setup('autenticar como tecnico', async ({ page }) => {
  await authenticateAs(page, 'tecnico@certificacion.com', 'password', AUTH_CERT.tecnico);
});
setup('autenticar como cajero', async ({ page }) => {
  await authenticateAs(page, 'cajero@certificacion.com', 'password', AUTH_CERT.cajero);
});
setup('autenticar como contador', async ({ page }) => {
  await authenticateAs(page, 'contador@certificacion.com', 'password', AUTH_CERT.contador);
});
setup('autenticar como rrhh', async ({ page }) => {
  await authenticateAs(page, 'rrhh@certificacion.com', 'password', AUTH_CERT.rrhh);
});
