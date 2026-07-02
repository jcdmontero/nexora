import { test, expect } from '@playwright/test';
import { AUTH_CERT } from './playwright.certificacion.config';

test.describe('Certificación Funcional: Módulo de Taller (Service Desk)', () => {
  const nOrdenes = 5;

  test.describe('Recepcionista (Vendedor)', () => {
    test.use({ storageState: AUTH_CERT.vendedor }); // o recepcionista
    test(`Recepcionista crea ${nOrdenes} órdenes de servicio`, async ({ page }) => {
      await page.goto('/service-desk');
      
      for(let o = 1; o <= nOrdenes; o++) {
        await test.step(`Crear orden ${o}`, async () => {
           // Llenar datos de equipo, cliente, diagnóstico inicial
        });
      }
    });
  });

  test.describe('Técnico', () => {
    test.use({ storageState: AUTH_CERT.tecnico });
    test('Técnico atiende múltiples órdenes', async ({ page }) => {
      await page.goto('/service-desk');
      
      await test.step('Revisar y diagnosticar', async () => {
         // El técnico asume la orden, agrega repuestos y mano de obra
      });

      await test.step('Adjuntar fotografías de evidencia', async () => {
         // Probar subida de archivos
      });

      await test.step('Cambiar estado a Reparado/Terminado', async () => {
         // Cerrar orden técnica
      });
    });
  });

  test.describe('Cajero', () => {
    test.use({ storageState: AUTH_CERT.cajero });
    test('Facturar orden de servicio finalizada', async ({ page }) => {
      await page.goto('/service-desk');
      
      await test.step('Generar factura desde orden', async () => {
         // Validar que los costos de repuestos y mano de obra se trasladen a la factura
      });
    });
  });
});
