# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empresa1\05-e1-service-desk-flujo-completo.spec.ts >> E1 — Service Desk — Flujo Completo End-to-End >> Ejecutar flujo completo de Orden de Reparación
- Location: tests\e2e\auditoria\empresa1\05-e1-service-desk-flujo-completo.spec.ts:39:3

# Error details

```
TimeoutError: locator.fill: Timeout 20000ms exceeded.
Call log:
  - waiting for locator('input[name="modelo"], input[name="modelo_equipo"]').first()

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]: "N"
      - generic [ref=e8]:
        - heading "NEXORA" [level=2] [ref=e9]
        - paragraph [ref=e10]: TallerTech Reparaciones SAS
    - navigation [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Acceso Rápido
        - link "Dashboard" [ref=e15] [cursor=pointer]:
          - /url: http://127.0.0.1:8000/dashboard
          - img [ref=e16]
          - generic [ref=e21]: Dashboard
          - img [ref=e22]
      - generic [ref=e24]:
        - generic [ref=e25]: Operaciones
        - button "CRM" [ref=e27]:
          - img [ref=e28]
          - generic [ref=e33]: CRM
          - img [ref=e34]
        - button "VENTAS" [ref=e37]:
          - img [ref=e38]
          - generic [ref=e42]: VENTAS
          - img [ref=e43]
        - button "COMPRAS" [ref=e46]:
          - img [ref=e47]
          - generic [ref=e52]: COMPRAS
          - img [ref=e53]
        - button "TESORERÍA" [ref=e56]:
          - img [ref=e57]
          - generic [ref=e60]: TESORERÍA
          - img [ref=e61]
        - button "Inventario" [ref=e64]:
          - img [ref=e65]
          - generic [ref=e69]: Inventario
          - img [ref=e70]
        - button "NOTIFICACIONES" [ref=e73]:
          - img [ref=e74]
          - generic [ref=e78]: NOTIFICACIONES
          - img [ref=e79]
        - generic [ref=e81]:
          - button "SERVICIO TÉCNICO" [expanded] [ref=e82]:
            - img [ref=e83]
            - generic [ref=e85]: SERVICIO TÉCNICO
            - img [ref=e86]
          - generic [ref=e88]:
            - link "Órdenes" [ref=e89] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/service-desk/ordenes
              - img [ref=e91]
              - generic [ref=e93]: Órdenes
              - img [ref=e94]
            - link "Garantías" [ref=e96] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/service-desk/garantias
              - img [ref=e97]
              - generic [ref=e99]: Garantías
              - img [ref=e100]
            - generic [ref=e103]: TÉCNICOS
            - link "Prestadores" [ref=e104] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/service-desk/prestadores
              - img [ref=e105]
              - generic [ref=e107]: Prestadores
              - img [ref=e108]
            - link "Comisiones" [ref=e110] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/service-desk/comisiones
              - img [ref=e111]
              - generic [ref=e113]: Comisiones
              - img [ref=e114]
            - generic [ref=e117]: CATÁLOGOS
            - link "Tipos de equipo" [ref=e118] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/service-desk/catalogos/tipos-equipo
              - img [ref=e119]
              - generic [ref=e121]: Tipos de equipo
              - img [ref=e122]
            - link "Marcas de equipo" [ref=e124] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/service-desk/catalogos/marcas
              - img [ref=e125]
              - generic [ref=e127]: Marcas de equipo
              - img [ref=e128]
            - link "Modelos de equipo" [ref=e130] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/service-desk/catalogos/modelos
              - img [ref=e131]
              - generic [ref=e133]: Modelos de equipo
              - img [ref=e134]
            - link "Servicios" [ref=e136] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/service-desk/catalogos/servicios
              - img [ref=e137]
              - generic [ref=e139]: Servicios
              - img [ref=e140]
            - link "Checklist de recepción" [ref=e142] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/service-desk/catalogos/checklist
              - img [ref=e143]
              - generic [ref=e145]: Checklist de recepción
              - img [ref=e146]
      - generic [ref=e148]:
        - generic [ref=e149]: Sistema
        - button "CONFIGURACIÓN" [ref=e151]:
          - img [ref=e152]
          - generic [ref=e155]: CONFIGURACIÓN
          - img [ref=e156]
    - generic [ref=e158]:
      - generic [ref=e159]:
        - img [ref=e161]
        - heading "Plan Empresarial" [level=4] [ref=e163]
        - generic [ref=e166]: Tu plan está activo
        - button "Ver detalles del plan" [ref=e167]:
          - text: Ver detalles del plan
          - img [ref=e168]
      - link "Ayuda" [ref=e170] [cursor=pointer]:
        - /url: "#"
        - img [ref=e171]
        - text: Ayuda
      - link "Documentación" [ref=e174] [cursor=pointer]:
        - /url: "#"
        - img [ref=e175]
        - text: Documentación
        - img [ref=e178]
      - link "Soporte" [ref=e182] [cursor=pointer]:
        - /url: "#"
        - img [ref=e183]
        - text: Soporte
    - button "Colapsar menú" [ref=e185]:
      - img [ref=e186]
      - generic [ref=e189]: Colapsar
  - main [ref=e190]:
    - generic [ref=e192]:
      - navigation "Breadcrumb" [ref=e193]:
        - generic [ref=e194]: SERVICIO TÉCNICO
        - generic [ref=e195]: /
        - generic [ref=e196]: Órdenes
      - generic [ref=e197]:
        - button "Buscar o ir a…" [ref=e198]:
          - img [ref=e199]
          - generic [ref=e202]: Buscar en Nexora…
          - generic:
            - generic: ⌘
            - text: K
        - generic [ref=e203]:
          - heading "Buscar en Nexora" [level=2] [ref=e204]
          - paragraph [ref=e205]: Busca clientes, productos, facturas o navega a una sección.
      - generic [ref=e206]:
        - button "Activar modo oscuro" [ref=e207]:
          - img [ref=e208]
        - button "Notificaciones" [ref=e210]:
          - img [ref=e211]
        - button "Ayuda" [ref=e215]:
          - img [ref=e216]
        - button "AT Administrador TallerTech" [ref=e220] [cursor=pointer]:
          - generic [ref=e221]: AT
          - generic [ref=e223]: Administrador TallerTech
    - generic [ref=e226]:
      - generic [ref=e227]:
        - link "Órdenes" [ref=e228] [cursor=pointer]:
          - /url: http://127.0.0.1:8000/service-desk/ordenes
          - img [ref=e229]
          - text: Órdenes
        - generic [ref=e232]:
          - img [ref=e234]
          - generic [ref=e236]:
            - heading "Nueva orden de reparación" [level=1] [ref=e237]
            - paragraph [ref=e238]: "Número sugerido: OR-20260630002526-659"
      - list [ref=e240]:
        - listitem [ref=e241]:
          - button "1 Cliente y Equipo Datos del ingreso" [disabled] [ref=e242]:
            - generic [ref=e243]: "1"
            - generic [ref=e244]:
              - paragraph [ref=e245]: Cliente y Equipo
              - paragraph [ref=e246]: Datos del ingreso
        - listitem [ref=e248]:
          - button "2 Recepción Fallas y accesorios" [disabled] [ref=e249]:
            - generic [ref=e250]: "2"
            - generic [ref=e251]:
              - paragraph [ref=e252]: Recepción
              - paragraph [ref=e253]: Fallas y accesorios
      - generic [ref=e254]:
        - generic [ref=e255]:
          - generic [ref=e256]:
            - img [ref=e258]
            - generic [ref=e261]:
              - heading "Cliente" [level=3] [ref=e262]
              - paragraph [ref=e263]: ¿Quién trae el equipo?
          - generic [ref=e265]:
            - generic [ref=e266]:
              - text: Cliente
              - generic [ref=e267]: "*"
            - combobox "Cliente *" [ref=e268]:
              - option "Selecciona un cliente…" [selected]
              - option "Andrés Rodríguez — CC 10020000"
              - option "Carlos Ortiz — CC 10020013"
              - option "Carlos Auditoría Pérez E2E — NIT 1005971712"
              - option "Carlos Auditoría Pérez E2E — NIT 1005963727"
              - option "Daniela Torres — CC 10020011"
              - option "Daniela Vargas — CC 10020002"
              - option "Diego Muñoz — CC 10020007"
              - option "Fabián Díaz — CC 10020001"
              - option "Felipe Gómez — CC 10020014"
              - option "Julián Mendoza — CC 10020008"
              - option "Julián Ortiz — CC 10020006"
              - option "Luis García — CC 10020005"
              - option "Luis Mendoza — CC 10020012"
              - option "María Suárez — CC 10020003"
              - option "Paola Sánchez — CC 10020009"
              - option "Patricia Ramírez — CC 10020010"
              - option "Patricia Torres — CC 10020004"
              - option "Empresa Auditoría 982391 SAS — NIT 900982391-1"
              - option "Tecnología Avanzada SAS Aud0 — NIT 900002000-0"
              - option "Colegio San Bartolomé Aud1 — NIT 900002001-1"
              - option "Clínica Dental Sonrisas Aud2 — NIT 900002002-2"
              - option "Distribuidora El Sol Aud3 — NIT 900002003-3"
              - option "Inmobiliaria Los Andes Aud4 — NIT 900002004-4"
              - option "Café Internet La Esquina Aud5 — NIT 900002005-5"
              - option "Constructora Horizonte Aud6 — NIT 900002006-6"
              - option "Farmacia La Salud Aud7 — NIT 900002007-7"
              - option "Hotel Colonial Aud8 — NIT 900002008-8"
              - option "Restaurante La Fogata Aud9 — NIT 900002009-0"
              - option "Ferromax Ferretería Aud10 — NIT 900002010-1"
              - option "Boutique Elite Aud11 — NIT 900002011-2"
              - option "Tecnología Avanzada SAS Aud12 — NIT 900002012-3"
              - option "Colegio San Bartolomé Aud13 — NIT 900002013-4"
              - option "Clínica Dental Sonrisas Aud14 — NIT 900002014-5"
              - option "Empresa Auditoría 977353 SAS — NIT 900977353-1"
        - generic [ref=e269]:
          - generic [ref=e270]:
            - img [ref=e272]
            - generic [ref=e274]:
              - heading "Equipo" [level=3] [ref=e275]
              - paragraph [ref=e276]: Tipo, marca, serie y bloqueo del equipo recibido.
          - generic [ref=e277]:
            - generic [ref=e278]:
              - generic [ref=e279]: Tipo de equipo
              - combobox "Tipo de equipo" [ref=e280]:
                - option "Selecciona…" [selected]
                - option "Celular"
                - option "Computador de Mesa"
                - option "Computador Portátil"
                - option "Computador Todo en Uno"
                - option "Consola"
                - option "Impresora Láser"
                - option "Impresora Láser Multifuncional"
                - option "Impresora Tinta"
                - option "Impresora Tinta Multifuncional"
                - option "Monitor"
                - option "Otro"
                - option "Proyector"
                - option "Tablet"
            - generic [ref=e281]:
              - generic [ref=e282]: Modelo
              - combobox "Modelo" [ref=e283]:
                - option "Selecciona…" [selected]
                - option "24MP400"
                - option "Dell Inspiron 24 AIO"
                - option "E2420H"
                - option "EcoTank L3110"
                - option "EcoTank L3150"
                - option "EliteBook 840"
                - option "Galaxy S24"
                - option "Galaxy Tab S9"
                - option "HL-L3210CW"
                - option "HP All-in-One 24"
                - option "IdeaPad 3"
                - option "iMac 24\""
                - option "iPad Air"
                - option "iPhone 15 Pro"
                - option "LaserJet M1132"
                - option "LaserJet MFP M227fdw"
                - option "Latitude 3420"
                - option "Lenovo IdeaCentre AIO"
                - option "MacBook Air M1"
                - option "OptiPlex 3080"
                - option "Pavilion 15"
                - option "PlayStation 5"
                - option "PowerLite 1288"
                - option "ProDesk 400"
                - option "Redmi Note 12"
                - option "Smart Tank 515"
                - option "Smart Tank 615"
                - option "ThinkCentre M720"
                - option "ThinkPad T480"
                - option "Xbox Series X"
            - generic [ref=e284]:
              - generic [ref=e285]: Número de serie / IMEI
              - textbox "Número de serie / IMEI" [ref=e286]:
                - /placeholder: Ej. SN-123456789 o IMEI
            - generic [ref=e288] [cursor=pointer]:
              - checkbox "El equipo tiene bloqueo de seguridad" [ref=e289]
              - generic [ref=e290]:
                - img [ref=e291]
                - text: El equipo tiene bloqueo de seguridad
        - generic [ref=e295]:
          - link "Cancelar" [ref=e296] [cursor=pointer]:
            - /url: http://127.0.0.1:8000/service-desk/ordenes
            - img [ref=e297]
            - text: Cancelar
          - button "Siguiente" [ref=e300]:
            - text: Siguiente
            - img [ref=e301]
```

# Test source

```ts
  1   | /**
  2   |  * 05-e1-service-desk-flujo-completo.spec.ts — Service Desk / Taller — Empresa 1
  3   |  *
  4   |  * Flujo completo End-to-End:
  5   |  * 1. Crear orden (llenado de formulario y selección de cliente/equipo).
  6   |  * 2. Asignar técnico.
  7   |  * 3. Registrar diagnóstico.
  8   |  * 4. Registrar presupuesto.
  9   |  * 5. Aprobar presupuesto.
  10  |  * 6. Registrar reparación.
  11  |  * 7. Registrar repuestos utilizados.
  12  |  * 8. Cambiar estados (en cascada).
  13  |  * 9. Generar factura.
  14  |  * 10. Registrar pago.
  15  |  * 11. Entregar equipo.
  16  |  * 12. Cerrar orden.
  17  |  */
  18  | import { test, expect, type Page } from '@playwright/test';
  19  | import { AUDIT_AUTH } from '../../../../playwright.auditoria.config';
  20  | 
  21  | const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';
  22  | const TS   = Date.now().toString().slice(-6);
  23  | 
  24  | const e1 = test.extend<{ page: Page }>({
  25  |   page: async ({ browser }, use) => {
  26  |     const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.empresa1 });
  27  |     const page = await ctx.newPage();
  28  |     await use(page);
  29  |     await ctx.close();
  30  |   },
  31  | });
  32  | 
  33  | async function ss(page: Page, name: string) {
  34  |   await page.screenshot({ path: `tests/e2e/auditoria/results/screenshots/${name}.png`, fullPage: true });
  35  | }
  36  | 
  37  | e1.describe('E1 — Service Desk — Flujo Completo End-to-End', () => {
  38  | 
  39  |   e1('Ejecutar flujo completo de Orden de Reparación', async ({ page }) => {
  40  |     // 1. Crear orden
  41  |     await test.step('Paso 1: Crear orden', async () => {
  42  |       await page.goto(`${BASE}/service-desk/ordenes/crear`);
  43  |       await page.waitForLoadState('networkidle');
  44  | 
  45  |       // Seleccionar cliente
  46  |       const clienteSelect = page.locator('select[name="cliente_id"]').first();
  47  |       if (await clienteSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
  48  |         await clienteSelect.selectOption({ index: 1 });
  49  |       } else {
  50  |         const clienteInput = page.locator('input[placeholder*="cliente"], input[placeholder*="Cliente"]').first();
  51  |         if (await clienteInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  52  |           await clienteInput.click();
  53  |           await clienteInput.fill('Pérez');
  54  |           await page.waitForTimeout(600);
  55  |           const opt = page.locator('[role="option"]').first();
  56  |           if (await opt.isVisible({ timeout: 2_000 }).catch(() => false)) {
  57  |             await opt.click();
  58  |           }
  59  |         }
  60  |       }
  61  | 
  62  |       // Tipo de equipo, marca
  63  |       const tipoEquipoSelect = page.locator('select[name="tipo_equipo_id"]').first();
  64  |       if (await tipoEquipoSelect.isVisible({ timeout: 2_000 }).catch(() => false)) await tipoEquipoSelect.selectOption({ index: 1 });
  65  | 
  66  |       const marcaSelect = page.locator('select[name="marca_id"]').first();
  67  |       if (await marcaSelect.isVisible({ timeout: 2_000 }).catch(() => false)) await marcaSelect.selectOption({ index: 1 });
  68  | 
  69  |       // Modelo y serial
> 70  |       await page.locator('input[name="modelo"], input[name="modelo_equipo"]').first().fill('TestFlow-2000');
      |                                                                                       ^ TimeoutError: locator.fill: Timeout 20000ms exceeded.
  71  |       await page.locator('input[name="serial"], input[name="numero_serie"]').first().fill(`SN-FLOW-${TS}`);
  72  |       
  73  |       // Problema
  74  |       await page.locator('textarea[name="descripcion_problema"], textarea[name="problema"]').first().fill('Flujo de prueba completo E2E');
  75  |       
  76  |       await ss(page, 'e1-sd-flow-01-crear-lleno');
  77  |       await page.locator('button[type="submit"]').first().click();
  78  |       await page.waitForLoadState('networkidle');
  79  |       await ss(page, 'e1-sd-flow-02-orden-creada');
  80  | 
  81  |       // Si nos redirigió al listado, entramos a la primera orden
  82  |       if (page.url().includes('/service-desk/ordenes') && !page.url().includes('/ordenes/')) {
  83  |         const viewLink = page.locator('a[href*="/service-desk/ordenes/"]').filter({ hasNotText: /crear|nuevo/i }).first();
  84  |         if (await viewLink.isVisible()) {
  85  |           await viewLink.click();
  86  |           await page.waitForLoadState('networkidle');
  87  |         }
  88  |       }
  89  |     });
  90  | 
  91  |     // Validamos estar en el detalle de la orden
  92  |     await expect(page).toHaveURL(/service-desk\/ordenes\/\d+/);
  93  |     const ordenId = page.url().split('/').pop();
  94  | 
  95  |     // 2. Asignar técnico (Cambio manual de estado a Diagnóstico o edición)
  96  |     await test.step('Paso 2 y 3: Asignar técnico y Diagnóstico', async () => {
  97  |       // Cambiamos estado a diagnóstico si hay select
  98  |       const btnCambiarFase = page.locator('button').filter({ hasText: /Cambiar estado|fase|manual/i }).first();
  99  |       if (await btnCambiarFase.isVisible({ timeout: 2_000 }).catch(() => false)) {
  100 |         await btnCambiarFase.click();
  101 |       }
  102 | 
  103 |       const estadoSelect = page.locator('select[name="estado"], select').filter({ hasText: /recibido|diagnostico|aprobado/i }).first();
  104 |       if (await estadoSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
  105 |         await estadoSelect.selectOption('diagnostico');
  106 |         const btnGuardarEstado = page.locator('button').filter({ hasText: /Solo guardar|Confirmar/i }).first();
  107 |         if (await btnGuardarEstado.isVisible()) await btnGuardarEstado.click();
  108 |         await page.waitForLoadState('networkidle');
  109 |       }
  110 |       await ss(page, 'e1-sd-flow-03-diagnostico');
  111 |     });
  112 | 
  113 |     // 4. Registrar presupuesto / 6. Registrar reparación / 7. Repuestos
  114 |     await test.step('Pasos 4, 6 y 7: Servicios y Repuestos', async () => {
  115 |       // Editar la orden para añadir servicios y repuestos
  116 |       const editBtn = page.locator(`a[href*="/service-desk/ordenes/${ordenId}/edit"]`).first();
  117 |       if (await editBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
  118 |         await editBtn.click();
  119 |         await page.waitForLoadState('networkidle');
  120 |         
  121 |         // Agregar repuesto si existe el botón
  122 |         const btnAddRepuesto = page.locator('button').filter({ hasText: /agregar repuesto/i }).first();
  123 |         if (await btnAddRepuesto.isVisible({ timeout: 2_000 }).catch(() => false)) {
  124 |           await btnAddRepuesto.click();
  125 |           const selectRepuesto = page.locator('select[name*="repuesto"]').last();
  126 |           if (await selectRepuesto.isVisible()) await selectRepuesto.selectOption({ index: 1 });
  127 |         }
  128 | 
  129 |         // Agregar servicio
  130 |         const btnAddServicio = page.locator('button').filter({ hasText: /agregar servicio/i }).first();
  131 |         if (await btnAddServicio.isVisible({ timeout: 2_000 }).catch(() => false)) {
  132 |           await btnAddServicio.click();
  133 |           const selectServicio = page.locator('select[name*="servicio"]').last();
  134 |           if (await selectServicio.isVisible()) await selectServicio.selectOption({ index: 1 });
  135 |         }
  136 | 
  137 |         await ss(page, 'e1-sd-flow-04-repuestos-servicios');
  138 |         await page.locator('button[type="submit"]').first().click();
  139 |         await page.waitForLoadState('networkidle');
  140 |       }
  141 |     });
  142 | 
  143 |     // 5. Aprobar presupuesto y 8. Cambiar estados en cascada
  144 |     await test.step('Paso 5 y 8: Aprobar y avanzar a Listo', async () => {
  145 |       const avanzarEstado = async (targetValue: string) => {
  146 |         const btnCambiar = page.locator('button').filter({ hasText: /Cambiar/i }).first();
  147 |         if (await btnCambiar.isVisible({ timeout: 2_000 }).catch(() => false)) await btnCambiar.click();
  148 |         
  149 |         const sel = page.locator('select').filter({ hasText: /diagnostico|aprobado|reparacion|listo/i }).first();
  150 |         if (await sel.isVisible({ timeout: 2_000 }).catch(() => false)) {
  151 |           await sel.selectOption(targetValue);
  152 |           const btnG = page.locator('button').filter({ hasText: /Solo guardar/i }).first();
  153 |           if (await btnG.isVisible()) await btnG.click();
  154 |           await page.waitForLoadState('networkidle');
  155 |         }
  156 |       };
  157 | 
  158 |       await avanzarEstado('aprobado'); // 5. Aprobar
  159 |       await ss(page, 'e1-sd-flow-05-aprobado');
  160 |       await avanzarEstado('reparacion');
  161 |       await avanzarEstado('listo'); // Avanza a listo
  162 |       await ss(page, 'e1-sd-flow-08-listo');
  163 |     });
  164 | 
  165 |     // 9. Generar factura y 10. Registrar pago
  166 |     await test.step('Paso 9 y 10: Factura y Pago (Prefactura)', async () => {
  167 |       // Cuando está en listo, aparece la prefactura
  168 |       const btnPrefactura = page.locator('a, button').filter({ hasText: /Prefactura/i }).first();
  169 |       if (await btnPrefactura.isVisible({ timeout: 2_000 }).catch(() => false)) {
  170 |         await btnPrefactura.click();
```