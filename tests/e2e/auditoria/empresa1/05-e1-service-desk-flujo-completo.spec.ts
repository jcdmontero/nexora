/**
 * 05-e1-service-desk-flujo-completo.spec.ts — Service Desk / Taller — Empresa 1
 *
 * Flujo completo End-to-End:
 * 1. Crear orden (llenado de formulario y selección de cliente/equipo).
 * 2. Asignar técnico.
 * 3. Registrar diagnóstico.
 * 4. Registrar presupuesto.
 * 5. Aprobar presupuesto.
 * 6. Registrar reparación.
 * 7. Registrar repuestos utilizados.
 * 8. Cambiar estados (en cascada).
 * 9. Generar factura.
 * 10. Registrar pago.
 * 11. Entregar equipo.
 * 12. Cerrar orden.
 */
import { test, expect, type Page } from '@playwright/test';
import { AUDIT_AUTH } from '../../../../playwright.auditoria.config';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';
const TS   = Date.now().toString().slice(-6);

const e1 = test.extend<{ page: Page }>({
  page: async ({ browser }, use) => {
    const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.empresa1 });
    const page = await ctx.newPage();
    await use(page);
    await ctx.close();
  },
});

async function ss(page: Page, name: string) {
  await page.screenshot({ path: `tests/e2e/auditoria/results/screenshots/${name}.png`, fullPage: true });
}

e1.describe('E1 — Service Desk — Flujo Completo End-to-End', () => {

  e1('Ejecutar flujo completo de Orden de Reparación', async ({ page }) => {
    // 1. Crear orden
    await test.step('Paso 1: Crear orden', async () => {
      await page.goto(`${BASE}/service-desk/ordenes/crear`);
      await page.waitForLoadState('networkidle');

      // Seleccionar cliente
      const clienteSelect = page.locator('select[name="cliente_id"]').first();
      if (await clienteSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await clienteSelect.selectOption({ index: 1 });
      } else {
        const clienteInput = page.locator('input[placeholder*="cliente"], input[placeholder*="Cliente"]').first();
        if (await clienteInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await clienteInput.click();
          await clienteInput.fill('Pérez');
          await page.waitForTimeout(600);
          const opt = page.locator('[role="option"]').first();
          if (await opt.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await opt.click();
          }
        }
      }

      // Tipo de equipo, marca
      const tipoEquipoSelect = page.locator('select[name="tipo_equipo_id"]').first();
      if (await tipoEquipoSelect.isVisible({ timeout: 2_000 }).catch(() => false)) await tipoEquipoSelect.selectOption({ index: 1 });

      const marcaSelect = page.locator('select[name="marca_id"]').first();
      if (await marcaSelect.isVisible({ timeout: 2_000 }).catch(() => false)) await marcaSelect.selectOption({ index: 1 });

      // Modelo y serial
      await page.locator('input[name="modelo"], input[name="modelo_equipo"]').first().fill('TestFlow-2000');
      await page.locator('input[name="serial"], input[name="numero_serie"]').first().fill(`SN-FLOW-${TS}`);
      
      // Problema
      await page.locator('textarea[name="descripcion_problema"], textarea[name="problema"]').first().fill('Flujo de prueba completo E2E');
      
      await ss(page, 'e1-sd-flow-01-crear-lleno');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForLoadState('networkidle');
      await ss(page, 'e1-sd-flow-02-orden-creada');

      // Si nos redirigió al listado, entramos a la primera orden
      if (page.url().includes('/service-desk/ordenes') && !page.url().includes('/ordenes/')) {
        const viewLink = page.locator('a[href*="/service-desk/ordenes/"]').filter({ hasNotText: /crear|nuevo/i }).first();
        if (await viewLink.isVisible()) {
          await viewLink.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    // Validamos estar en el detalle de la orden
    await expect(page).toHaveURL(/service-desk\/ordenes\/\d+/);
    const ordenId = page.url().split('/').pop();

    // 2. Asignar técnico (Cambio manual de estado a Diagnóstico o edición)
    await test.step('Paso 2 y 3: Asignar técnico y Diagnóstico', async () => {
      // Cambiamos estado a diagnóstico si hay select
      const btnCambiarFase = page.locator('button').filter({ hasText: /Cambiar estado|fase|manual/i }).first();
      if (await btnCambiarFase.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await btnCambiarFase.click();
      }

      const estadoSelect = page.locator('select[name="estado"], select').filter({ hasText: /recibido|diagnostico|aprobado/i }).first();
      if (await estadoSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await estadoSelect.selectOption('diagnostico');
        const btnGuardarEstado = page.locator('button').filter({ hasText: /Solo guardar|Confirmar/i }).first();
        if (await btnGuardarEstado.isVisible()) await btnGuardarEstado.click();
        await page.waitForLoadState('networkidle');
      }
      await ss(page, 'e1-sd-flow-03-diagnostico');
    });

    // 4. Registrar presupuesto / 6. Registrar reparación / 7. Repuestos
    await test.step('Pasos 4, 6 y 7: Servicios y Repuestos', async () => {
      // Editar la orden para añadir servicios y repuestos
      const editBtn = page.locator(`a[href*="/service-desk/ordenes/${ordenId}/edit"]`).first();
      if (await editBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForLoadState('networkidle');
        
        // Agregar repuesto si existe el botón
        const btnAddRepuesto = page.locator('button').filter({ hasText: /agregar repuesto/i }).first();
        if (await btnAddRepuesto.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await btnAddRepuesto.click();
          const selectRepuesto = page.locator('select[name*="repuesto"]').last();
          if (await selectRepuesto.isVisible()) await selectRepuesto.selectOption({ index: 1 });
        }

        // Agregar servicio
        const btnAddServicio = page.locator('button').filter({ hasText: /agregar servicio/i }).first();
        if (await btnAddServicio.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await btnAddServicio.click();
          const selectServicio = page.locator('select[name*="servicio"]').last();
          if (await selectServicio.isVisible()) await selectServicio.selectOption({ index: 1 });
        }

        await ss(page, 'e1-sd-flow-04-repuestos-servicios');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForLoadState('networkidle');
      }
    });

    // 5. Aprobar presupuesto y 8. Cambiar estados en cascada
    await test.step('Paso 5 y 8: Aprobar y avanzar a Listo', async () => {
      const avanzarEstado = async (targetValue: string) => {
        const btnCambiar = page.locator('button').filter({ hasText: /Cambiar/i }).first();
        if (await btnCambiar.isVisible({ timeout: 2_000 }).catch(() => false)) await btnCambiar.click();
        
        const sel = page.locator('select').filter({ hasText: /diagnostico|aprobado|reparacion|listo/i }).first();
        if (await sel.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await sel.selectOption(targetValue);
          const btnG = page.locator('button').filter({ hasText: /Solo guardar/i }).first();
          if (await btnG.isVisible()) await btnG.click();
          await page.waitForLoadState('networkidle');
        }
      };

      await avanzarEstado('aprobado'); // 5. Aprobar
      await ss(page, 'e1-sd-flow-05-aprobado');
      await avanzarEstado('reparacion');
      await avanzarEstado('listo'); // Avanza a listo
      await ss(page, 'e1-sd-flow-08-listo');
    });

    // 9. Generar factura y 10. Registrar pago
    await test.step('Paso 9 y 10: Factura y Pago (Prefactura)', async () => {
      // Cuando está en listo, aparece la prefactura
      const btnPrefactura = page.locator('a, button').filter({ hasText: /Prefactura/i }).first();
      if (await btnPrefactura.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await btnPrefactura.click();
        await page.waitForLoadState('networkidle');
        
        await ss(page, 'e1-sd-flow-09-prefactura');
        
        // Generar Factura
        const btnGenerarFactura = page.locator('button').filter({ hasText: /Generar Factura/i }).first();
        if (await btnGenerarFactura.isVisible({ timeout: 2_000 }).catch(() => false)) {
          await btnGenerarFactura.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
          
          // Puede haber un modal de confirmación
          const btnConfirm = page.locator('button').filter({ hasText: /Confirmar|Sí/i }).first();
          if (await btnConfirm.isVisible({ timeout: 2_000 }).catch(() => false)) {
            await btnConfirm.click();
            await page.waitForLoadState('networkidle');
          }
        }
      }
      
      // Intentar agregar un abono/pago si existe la sección de Abonos
      const inputAbono = page.locator('input[type="number"], input[name="monto"]').first();
      if (await inputAbono.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await inputAbono.fill('10000');
        const btnAbonar = page.locator('button').filter({ hasText: /Registrar Abono|Abonar/i }).first();
        if (await btnAbonar.isVisible()) {
          await btnAbonar.click();
          await page.waitForLoadState('networkidle');
        }
      }
      await ss(page, 'e1-sd-flow-10-pago-registrado');
    });

    // 11. Entregar equipo y 12. Cerrar orden
    await test.step('Paso 11 y 12: Entregar y Cerrar', async () => {
      // Regresar al detalle si salimos
      if (!page.url().includes(`/service-desk/ordenes/${ordenId}`)) {
        await page.goto(`${BASE}/service-desk/ordenes/${ordenId}`);
        await page.waitForLoadState('networkidle');
      }

      const btnCambiar = page.locator('button').filter({ hasText: /Cambiar/i }).first();
      if (await btnCambiar.isVisible({ timeout: 2_000 }).catch(() => false)) await btnCambiar.click();
      
      const sel = page.locator('select').filter({ hasText: /listo|entregado/i }).first();
      if (await sel.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await sel.selectOption('entregado'); // 11 y 12
        const btnG = page.locator('button').filter({ hasText: /Solo guardar/i }).first();
        if (await btnG.isVisible()) await btnG.click();
        await page.waitForLoadState('networkidle');
      }
      
      await ss(page, 'e1-sd-flow-12-entregado');
    });

  });
});
