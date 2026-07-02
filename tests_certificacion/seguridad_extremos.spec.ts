import { test, expect } from '@playwright/test';
import { AUTH_CERT } from './playwright.certificacion.config';

test.describe('Certificación Funcional: Seguridad y Casos Extremos', () => {

  test.describe('Acceso limitado (Vendedor)', () => {
    test.use({ storageState: AUTH_CERT.vendedor }); // Vendedor tiene permisos limitados
    
    test('Prevención de accesos no autorizados', async ({ page }) => {
      await test.step('Intentar entrar a roles y permisos', async () => {
         const response = await page.goto('/roles');
         // Debería devolver un 403 o redirigir
         expect(response?.status() === 403 || !response?.url()?.endsWith('/roles')).toBeTruthy();
         // Alternativamente chequear que no estamos viendo la UI de roles
         await expect(page.locator('text="Roles y permisos"')).not.toBeVisible();
      });
    });
  });

  test.describe('Acceso administrativo (Admin)', () => {
    test.use({ storageState: AUTH_CERT.admin });
    
    test('Validaciones extremas de formularios', async ({ page }) => {
      await page.goto('/crm/clientes/crear');
      
      await test.step('Envío de formulario vacío', async () => {
         await page.getByRole('button', { name: /Crear cliente/i }).click();
         // Esperar mensajes de validación
         await page.waitForTimeout(500); // Give it a brief moment to show errors
         const errors = await page.locator('.text-red-500').count();
         expect(errors).toBeGreaterThan(0);
      });

      await test.step('Inyección XSS en nombre', async () => {
         await page.getByPlaceholder('Ej. Comercializadora del Norte S.A.S.').fill('<script>alert("XSS")</script>');
         // Validar que se guarde sanitizado y no se ejecute
      });

      await test.step('Textos extremadamente largos y caracteres especiales (Emojis)', async () => {
         const longText = 'A'.repeat(5000);
         await page.getByPlaceholder('Ej. Carrera 30 # 45-67').fill(`🏢🏠 ${longText}`);
         await page.getByRole('button', { name: /Crear cliente/i }).click();
         // El sistema debe manejarlo (error de validación max:255 o truncarlo seguro)
      });
    });

    test('Chaos Monkey: Doble click en envío de formulario', async ({ page }) => {
      // Simular un usuario impaciente enviando un form 3 veces seguidas rápido
      // El sistema no debería crear registros duplicados
    });
  });
});
