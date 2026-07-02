# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empresa1\04-e1-compras.spec.ts >> E1 — Compras — Proveedores >> crear proveedor nuevo
- Location: tests\e2e\auditoria\empresa1\04-e1-compras.spec.ts:52:3

# Error details

```
Error: URL: http://127.0.0.1:8000/purchasing/proveedores/crear

expect(received).toBeTruthy()

Received: false
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
        - generic [ref=e45]:
          - button "COMPRAS" [expanded] [ref=e46]:
            - img [ref=e47]
            - generic [ref=e52]: COMPRAS
            - img [ref=e53]
          - generic [ref=e55]:
            - link "Proveedores" [ref=e56] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/purchasing/proveedores
              - img [ref=e58]
              - generic [ref=e63]: Proveedores
              - img [ref=e64]
            - link "Órdenes de Compra" [ref=e66] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/purchasing/ordenes
              - img [ref=e67]
              - generic [ref=e72]: Órdenes de Compra
              - img [ref=e73]
        - button "TESORERÍA" [ref=e76]:
          - img [ref=e77]
          - generic [ref=e80]: TESORERÍA
          - img [ref=e81]
        - button "Inventario" [ref=e84]:
          - img [ref=e85]
          - generic [ref=e89]: Inventario
          - img [ref=e90]
        - button "NOTIFICACIONES" [ref=e93]:
          - img [ref=e94]
          - generic [ref=e98]: NOTIFICACIONES
          - img [ref=e99]
        - button "SERVICIO TÉCNICO" [ref=e102]:
          - img [ref=e103]
          - generic [ref=e105]: SERVICIO TÉCNICO
          - img [ref=e106]
      - generic [ref=e108]:
        - generic [ref=e109]: Sistema
        - button "CONFIGURACIÓN" [ref=e111]:
          - img [ref=e112]
          - generic [ref=e115]: CONFIGURACIÓN
          - img [ref=e116]
    - generic [ref=e118]:
      - generic [ref=e119]:
        - img [ref=e121]
        - heading "Plan Empresarial" [level=4] [ref=e123]
        - generic [ref=e126]: Tu plan está activo
        - button "Ver detalles del plan" [ref=e127]:
          - text: Ver detalles del plan
          - img [ref=e128]
      - link "Ayuda" [ref=e130] [cursor=pointer]:
        - /url: "#"
        - img [ref=e131]
        - text: Ayuda
      - link "Documentación" [ref=e134] [cursor=pointer]:
        - /url: "#"
        - img [ref=e135]
        - text: Documentación
        - img [ref=e138]
      - link "Soporte" [ref=e142] [cursor=pointer]:
        - /url: "#"
        - img [ref=e143]
        - text: Soporte
    - button "Colapsar menú" [ref=e145]:
      - img [ref=e146]
      - generic [ref=e149]: Colapsar
  - main [ref=e150]:
    - generic [ref=e152]:
      - navigation "Breadcrumb" [ref=e153]:
        - generic [ref=e154]: COMPRAS
        - generic [ref=e155]: /
        - generic [ref=e156]: Proveedores
      - generic [ref=e157]:
        - button "Buscar o ir a…" [ref=e158]:
          - img [ref=e159]
          - generic [ref=e162]: Buscar en Nexora…
          - generic:
            - generic: ⌘
            - text: K
        - generic [ref=e163]:
          - heading "Buscar en Nexora" [level=2] [ref=e164]
          - paragraph [ref=e165]: Busca clientes, productos, facturas o navega a una sección.
      - generic [ref=e166]:
        - button "Activar modo oscuro" [ref=e167]:
          - img [ref=e168]
        - button "Notificaciones" [ref=e170]:
          - img [ref=e171]
        - button "Ayuda" [ref=e175]:
          - img [ref=e176]
        - button "AT Administrador TallerTech" [ref=e180] [cursor=pointer]:
          - generic [ref=e181]: AT
          - generic [ref=e183]: Administrador TallerTech
    - generic [ref=e186]:
      - generic [ref=e187]:
        - generic [ref=e188]:
          - link [ref=e189] [cursor=pointer]:
            - /url: http://127.0.0.1:8000/purchasing/proveedores
            - img [ref=e190]
          - generic [ref=e192]:
            - heading "Nuevo proveedor" [level=2] [ref=e193]
            - paragraph [ref=e194]: Registra un nuevo proveedor para tus compras.
        - generic [ref=e195]:
          - link "Cancelar" [ref=e196] [cursor=pointer]:
            - /url: http://127.0.0.1:8000/purchasing/proveedores
            - button "Cancelar" [ref=e197]
          - button "Creando..." [disabled]
      - generic [ref=e198]:
        - generic [ref=e199]:
          - generic [ref=e200]:
            - generic [ref=e201]:
              - generic [ref=e202]: Información principal
              - generic [ref=e203]: Datos básicos del proveedor para su identificación.
            - generic [ref=e204]:
              - generic [ref=e205]:
                - generic [ref=e206]:
                  - generic [ref=e207]:
                    - text: Razón Social / Nombre
                    - generic [ref=e208]: "*"
                  - textbox "Razón Social / Nombre *" [ref=e209]:
                    - /placeholder: Ej. Suministros Globales SAS
                    - text: Proveedor Auditoría 074631 SAS
                - generic [ref=e210]:
                  - generic [ref=e211]:
                    - generic [ref=e212]: Tipo Doc.
                    - combobox [ref=e213]:
                      - generic [ref=e214]: NIT
                      - img: ▼
                    - textbox [ref=e215]: NIT
                  - generic [ref=e216]:
                    - generic [ref=e217]: Número
                    - textbox "Número" [ref=e218]: "800074631"
              - generic [ref=e219]:
                - generic [ref=e220]:
                  - generic [ref=e221]: Persona de Contacto
                  - textbox "Persona de Contacto" [ref=e222]:
                    - /placeholder: Nombre de quien atiende
                    - text: Contacto Auditoría
                - generic [ref=e223]:
                  - generic [ref=e224]: Email
                  - textbox "Email" [ref=e225]:
                    - /placeholder: correo@empresa.com
                    - text: compras@proveedorauditoria074631.co
          - generic [ref=e226]:
            - generic [ref=e227]:
              - generic [ref=e228]: Información de ubicación y estado
              - generic [ref=e229]: Detalles adicionales para contacto y envío.
            - generic [ref=e230]:
              - generic [ref=e231]:
                - generic [ref=e232]:
                  - generic [ref=e233]: Teléfono
                  - textbox "Teléfono" [ref=e234]: "60130746"
                - generic [ref=e235]:
                  - generic [ref=e236]: Ciudad
                  - textbox "Ciudad" [ref=e237]: Bogotá
              - generic [ref=e238]:
                - generic [ref=e239]: Dirección
                - textbox "Dirección" [ref=e240]: "Cra 13 # 26-34, Bogotá"
              - generic [ref=e241]:
                - generic [ref=e242]: Notas internas
                - textbox "Notas internas" [ref=e243]
              - generic [ref=e244]:
                - generic [ref=e245]:
                  - generic [ref=e246]: Estado del proveedor
                  - paragraph [ref=e247]: Los proveedores inactivos no aparecerán en nuevas órdenes de compra.
                - switch [checked] [ref=e248]
                - checkbox [checked] [ref=e249]
        - generic [ref=e251]:
          - img [ref=e254]
          - heading "i Información importante" [level=3] [ref=e259]:
            - generic [ref=e260]: i
            - text: Información importante
          - paragraph [ref=e261]: Completa la información del proveedor para facilitar el proceso de abastecimiento.
          - list [ref=e262]:
            - listitem [ref=e263]:
              - img [ref=e264]
              - generic [ref=e267]: Los campos con * son obligatorios
            - listitem [ref=e268]:
              - img [ref=e269]
              - generic [ref=e272]: El contacto principal es clave para las órdenes
          - generic [ref=e273]:
            - heading "Consejo" [level=4] [ref=e274]:
              - img [ref=e275]
              - text: Consejo
            - paragraph [ref=e277]: Un correo electrónico válido es necesario si planeas enviar órdenes de compra automáticas en el futuro.
```

# Test source

```ts
  1   | /**
  2   |  * 04-e1-compras.spec.ts — Compras y Proveedores — Empresa 1 (TallerTech)
  3   |  *
  4   |  * Flujos cubiertos:
  5   |  *  ✓ Listar proveedores
  6   |  *  ✓ Crear proveedor
  7   |  *  ✓ Editar proveedor
  8   |  *  ✓ Buscar proveedor
  9   |  *  ✓ Desactivar / reactivar proveedor
  10  |  *  ✓ Listar órdenes de compra
  11  |  *  ✓ Crear orden de compra con múltiples ítems
  12  |  *  ✓ Ver detalle de orden
  13  |  *  ✓ Cambiar estado de orden (recibida)
  14  |  *  ✓ Filtrar órdenes por estado y proveedor
  15  |  */
  16  | import { test, expect, type Page } from '@playwright/test';
  17  | import { AUDIT_AUTH } from '../../../../playwright.auditoria.config';
  18  | 
  19  | const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';
  20  | const TS   = Date.now().toString().slice(-6);
  21  | 
  22  | const e1 = test.extend<{ page: Page }>({
  23  |   page: async ({ browser }, use) => {
  24  |     const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.empresa1 });
  25  |     const page = await ctx.newPage();
  26  |     await use(page);
  27  |     await ctx.close();
  28  |   },
  29  | });
  30  | 
  31  | async function ss(page: Page, name: string) {
  32  |   await page.screenshot({ path: `tests/e2e/auditoria/results/screenshots/${name}.png`, fullPage: true });
  33  | }
  34  | 
  35  | // ══════════════════════════════════════════════════════════════════════════════
  36  | // PROVEEDORES
  37  | // ══════════════════════════════════════════════════════════════════════════════
  38  | 
  39  | e1.describe('E1 — Compras — Proveedores', () => {
  40  | 
  41  |   e1('listado de proveedores con datos del seeder @smoke', async ({ page }) => {
  42  |     await page.goto(`${BASE}/purchasing/proveedores`);
  43  |     await page.waitForLoadState('networkidle');
  44  | 
  45  |     await expect(page).toHaveURL(/purchasing\/proveedores/);
  46  |     const filas = await page.locator('tbody tr').count();
  47  |     console.log(`  🏭 Proveedores visibles: ${filas}`);
  48  |     expect(filas).toBeGreaterThan(0);
  49  |     await ss(page, 'e1-comp-01-lista-proveedores');
  50  |   });
  51  | 
  52  |   e1('crear proveedor nuevo', async ({ page }) => {
  53  |     await page.goto(`${BASE}/purchasing/proveedores/crear`);
  54  |     await page.waitForLoadState('networkidle');
  55  |     await ss(page, 'e1-comp-02-form-proveedor');
  56  | 
  57  |     const campos = [
  58  |       ['razon_social',      `Proveedor Auditoría ${TS} SAS`],
  59  |       ['numero_documento',  `800${TS}`],
  60  |       ['nombre_contacto',   'Contacto Auditoría'],
  61  |       ['email',             `compras@proveedorauditoria${TS}.co`],
  62  |       ['telefono',          `6013${TS.slice(0,4)}`],
  63  |       ['direccion',         'Cra 13 # 26-34, Bogotá'],
  64  |       ['ciudad',            'Bogotá'],
  65  |     ];
  66  | 
  67  |     for (const [name, value] of campos) {
  68  |       const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
  69  |       if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
  70  |         await input.fill(value);
  71  |       }
  72  |     }
  73  | 
  74  |     // Tipo de documento
  75  |     const tipoDocSelect = page.locator('select[name="tipo_documento"]').first();
  76  |     if (await tipoDocSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
  77  |       await tipoDocSelect.selectOption('NIT');
  78  |     }
  79  | 
  80  |     await ss(page, 'e1-comp-03-form-proveedor-lleno');
  81  |     await page.locator('button[type="submit"]').first().click();
  82  |     await page.waitForLoadState('networkidle');
  83  |     await ss(page, 'e1-comp-04-proveedor-creado');
  84  | 
  85  |     const exito = !page.url().includes('/crear');
> 86  |     expect(exito, `URL: ${page.url()}`).toBeTruthy();
      |                                         ^ Error: URL: http://127.0.0.1:8000/purchasing/proveedores/crear
  87  |   });
  88  | 
  89  |   e1('buscar proveedor por nombre', async ({ page }) => {
  90  |     await page.goto(`${BASE}/purchasing/proveedores`);
  91  |     await page.waitForLoadState('networkidle');
  92  | 
  93  |     const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
  94  |     if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
  95  |       await searchInput.fill('TechColombia');
  96  |       await page.keyboard.press('Enter');
  97  |       await page.waitForLoadState('networkidle');
  98  |       await page.waitForTimeout(500);
  99  |       await ss(page, 'e1-comp-05-buscar-proveedor');
  100 |     }
  101 |   });
  102 | 
  103 |   e1('editar proveedor existente', async ({ page }) => {
  104 |     await page.goto(`${BASE}/purchasing/proveedores`);
  105 |     await page.waitForLoadState('networkidle');
  106 | 
  107 |     const editLink = page.locator('a[href*="/editar"]').first();
  108 |     if (await editLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
  109 |       await editLink.click();
  110 |       await page.waitForLoadState('networkidle');
  111 |       await ss(page, 'e1-comp-06-editar-proveedor');
  112 | 
  113 |       const telInput = page.locator('input[name="telefono"]').first();
  114 |       if (await telInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  115 |         await telInput.clear();
  116 |         await telInput.fill('6019998877');
  117 |         await page.locator('button[type="submit"]').first().click();
  118 |         await page.waitForLoadState('networkidle');
  119 |         await ss(page, 'e1-comp-07-proveedor-actualizado');
  120 |       }
  121 |     }
  122 |   });
  123 | 
  124 |   e1('eliminar proveedor', async ({ page }) => {
  125 |     await page.goto(`${BASE}/purchasing/proveedores`);
  126 |     await page.waitForLoadState('networkidle');
  127 | 
  128 |     const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
  129 |     if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  130 |       await searchInput.fill(PROVEEDOR.razonSocial.substring(0, 10));
  131 |       await page.keyboard.press('Enter');
  132 |       await page.waitForLoadState('networkidle');
  133 |     }
  134 | 
  135 |     const deleteBtn = page.locator('button, a[role="button"]').filter({ has: page.locator('svg.lucide-trash, svg.lucide-trash-2, .text-destructive') }).first();
  136 |     if (await deleteBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
  137 |       await deleteBtn.click();
  138 |       await page.waitForTimeout(600);
  139 |       
  140 |       await ss(page, 'e1-comp-07b-modal-eliminar');
  141 |       
  142 |       const confirmBtn = page.locator('button').filter({ hasText: /eliminar|confirmar|sí/i }).first();
  143 |       if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  144 |         await confirmBtn.click();
  145 |         await page.waitForLoadState('networkidle');
  146 |         await ss(page, 'e1-comp-07c-proveedor-eliminado');
  147 |         
  148 |         const exito = page.locator('[data-sonner-toast], [role="status"], .toast').filter({ hasText: /eliminado|éxito/i }).first();
  149 |         const tieneExito = await exito.isVisible({ timeout: 5_000 }).catch(() => false);
  150 |         expect(tieneExito || !await deleteBtn.isVisible()).toBeTruthy();
  151 |       }
  152 |     } else {
  153 |       test.skip(true, 'Botón de eliminar no encontrado');
  154 |     }
  155 |   });
  156 | });
  157 | 
  158 | // ══════════════════════════════════════════════════════════════════════════════
  159 | // ÓRDENES DE COMPRA
  160 | // ══════════════════════════════════════════════════════════════════════════════
  161 | 
  162 | e1.describe('E1 — Compras — Órdenes', () => {
  163 | 
  164 |   e1('listado de órdenes de compra @smoke', async ({ page }) => {
  165 |     await page.goto(`${BASE}/purchasing/ordenes`);
  166 |     await page.waitForLoadState('networkidle');
  167 | 
  168 |     await expect(page).toHaveURL(/purchasing\/ordenes/);
  169 |     const contenido = page.locator('table, [class*="empty"], main > *').first();
  170 |     await expect(contenido).toBeVisible({ timeout: 10_000 });
  171 |     await ss(page, 'e1-comp-08-lista-ordenes');
  172 |   });
  173 | 
  174 |   e1('crear orden de compra con ítems', async ({ page }) => {
  175 |     await page.goto(`${BASE}/purchasing/ordenes/crear`);
  176 |     await page.waitForLoadState('networkidle');
  177 |     await ss(page, 'e1-comp-09-form-orden');
  178 | 
  179 |     // Seleccionar proveedor
  180 |     const proveedorSelect = page.locator('select[name="proveedor_id"]').first();
  181 |     if (await proveedorSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
  182 |       await proveedorSelect.selectOption({ index: 1 });
  183 |     } else {
  184 |       const provInput = page.locator('input[placeholder*="proveedor"], input[placeholder*="Proveedor"]').first();
  185 |       if (await provInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  186 |         await provInput.click();
```