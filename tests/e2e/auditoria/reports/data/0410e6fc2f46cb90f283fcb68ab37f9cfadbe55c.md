# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empresa2\11-e2-roles-permisos.spec.ts >> E2 — Usuarios >> crear usuario nuevo con rol VENDEDOR
- Location: tests\e2e\auditoria\empresa2\11-e2-roles-permisos.spec.ts:61:3

# Error details

```
Error: URL: http://127.0.0.1:8000/usuarios/crear

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
        - paragraph [ref=e10]: Comercializadora Integral SAS
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
        - button "CONTABILIDAD" [ref=e27]:
          - img [ref=e28]
          - generic [ref=e30]: CONTABILIDAD
          - img [ref=e31]
        - button "CRM" [ref=e34]:
          - img [ref=e35]
          - generic [ref=e40]: CRM
          - img [ref=e41]
        - button "VENTAS" [ref=e44]:
          - img [ref=e45]
          - generic [ref=e49]: VENTAS
          - img [ref=e50]
        - button "COMPRAS" [ref=e53]:
          - img [ref=e54]
          - generic [ref=e59]: COMPRAS
          - img [ref=e60]
        - button "RECURSOS HUMANOS" [ref=e63]:
          - img [ref=e64]
          - generic [ref=e69]: RECURSOS HUMANOS
          - img [ref=e70]
        - button "TESORERÍA" [ref=e73]:
          - img [ref=e74]
          - generic [ref=e77]: TESORERÍA
          - img [ref=e78]
        - button "Inventario" [ref=e81]:
          - img [ref=e82]
          - generic [ref=e86]: Inventario
          - img [ref=e87]
        - button "NOTIFICACIONES" [ref=e90]:
          - img [ref=e91]
          - generic [ref=e95]: NOTIFICACIONES
          - img [ref=e96]
        - button "SERVICIO TÉCNICO" [ref=e99]:
          - img [ref=e100]
          - generic [ref=e102]: SERVICIO TÉCNICO
          - img [ref=e103]
      - generic [ref=e105]:
        - generic [ref=e106]: Sistema
        - generic [ref=e107]:
          - button "CONFIGURACIÓN" [expanded] [ref=e108]:
            - img [ref=e109]
            - generic [ref=e112]: CONFIGURACIÓN
            - img [ref=e113]
          - generic [ref=e115]:
            - link "Mi Empresa" [ref=e116] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/mi-empresa
              - img [ref=e117]
              - generic [ref=e121]: Mi Empresa
              - img [ref=e122]
            - link "Sedes / Sucursales" [ref=e124] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/sedes
              - img [ref=e125]
              - generic [ref=e129]: Sedes / Sucursales
              - img [ref=e130]
            - link "Usuarios" [ref=e132] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/usuarios
              - img [ref=e134]
              - generic [ref=e139]: Usuarios
              - img [ref=e140]
            - link "Roles" [ref=e142] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/roles
              - img [ref=e143]
              - generic [ref=e145]: Roles
              - img [ref=e146]
            - link "Auditoría" [ref=e148] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/auditoria
              - img [ref=e149]
              - generic [ref=e154]: Auditoría
              - img [ref=e155]
    - generic [ref=e157]:
      - generic [ref=e158]:
        - img [ref=e160]
        - heading "Plan Empresarial" [level=4] [ref=e162]
        - generic [ref=e165]: Tu plan está activo
        - button "Ver detalles del plan" [ref=e166]:
          - text: Ver detalles del plan
          - img [ref=e167]
      - link "Ayuda" [ref=e169] [cursor=pointer]:
        - /url: "#"
        - img [ref=e170]
        - text: Ayuda
      - link "Documentación" [ref=e173] [cursor=pointer]:
        - /url: "#"
        - img [ref=e174]
        - text: Documentación
        - img [ref=e177]
      - link "Soporte" [ref=e181] [cursor=pointer]:
        - /url: "#"
        - img [ref=e182]
        - text: Soporte
    - button "Colapsar menú" [ref=e184]:
      - img [ref=e185]
      - generic [ref=e188]: Colapsar
  - main [ref=e189]:
    - generic [ref=e191]:
      - navigation "Breadcrumb" [ref=e192]:
        - generic [ref=e193]: Configuración
        - generic [ref=e194]: /
        - generic [ref=e195]: Usuarios
      - generic [ref=e196]:
        - button "Buscar o ir a…" [ref=e197]:
          - img [ref=e198]
          - generic [ref=e201]: Buscar en Nexora…
          - generic:
            - generic: ⌘
            - text: K
        - generic [ref=e202]:
          - heading "Buscar en Nexora" [level=2] [ref=e203]
          - paragraph [ref=e204]: Busca clientes, productos, facturas o navega a una sección.
      - generic [ref=e205]:
        - button "Activar modo oscuro" [ref=e206]:
          - img [ref=e207]
        - button "Notificaciones" [ref=e209]:
          - img [ref=e210]
        - button "Ayuda" [ref=e214]:
          - img [ref=e215]
        - button "AC Administrador Comercializadora" [ref=e219] [cursor=pointer]:
          - generic [ref=e220]: AC
          - generic [ref=e222]: Administrador Comercializadora
    - generic [ref=e224]:
      - generic [ref=e225]:
        - link "Usuarios" [ref=e226] [cursor=pointer]:
          - /url: http://127.0.0.1:8000/usuarios
          - img [ref=e227]
          - text: Usuarios
        - generic [ref=e230]:
          - img [ref=e232]
          - generic [ref=e235]:
            - heading "Nuevo usuario" [level=1] [ref=e236]
            - paragraph [ref=e237]: Crea una cuenta de acceso y asígnale un rol.
      - generic [ref=e238]:
        - generic [ref=e239]:
          - generic [ref=e240]:
            - generic [ref=e241]:
              - img [ref=e243]
              - generic [ref=e246]:
                - heading "Información personal" [level=3] [ref=e247]
                - paragraph [ref=e248]: Datos básicos de identificación del usuario.
            - generic [ref=e249]:
              - generic [ref=e250]:
                - generic [ref=e251]:
                  - text: Nombre completo
                  - generic [ref=e252]: "*"
                - textbox "Nombre completo *" [ref=e253]:
                  - /placeholder: Ej. María González
                  - text: Usuario E2E 383752
              - generic [ref=e254]:
                - generic [ref=e255]:
                  - text: Correo electrónico
                  - generic [ref=e256]: "*"
                - generic [ref=e257]:
                  - img
                  - textbox "Correo electrónico *" [ref=e258]:
                    - /placeholder: usuario@empresa.com
                    - text: usuario.e2e.383752@comercializadora.co
          - generic [ref=e259]:
            - generic [ref=e260]:
              - img [ref=e262]
              - generic [ref=e265]:
                - heading "Acceso y permisos" [level=3] [ref=e266]
                - paragraph [ref=e267]: Define el rol y la sede del usuario dentro de la empresa.
            - generic [ref=e268]:
              - generic [ref=e269]:
                - generic [ref=e270]:
                  - text: Rol
                  - generic [ref=e271]: "*"
                - combobox "Rol *" [ref=e272]:
                  - option "Seleccionar rol…"
                  - option "Administrador"
                  - option "Cajero"
                  - option "Contador"
                  - option "Gerente"
                  - option "Recursos Humanos"
                  - option "Técnico"
                  - option "Vendedor" [selected]
                - paragraph [ref=e273]: Determina los permisos del usuario.
              - generic [ref=e274]:
                - generic [ref=e275]: Sede
                - generic [ref=e276]:
                  - img
                  - combobox "Sede" [ref=e277]:
                    - option "Todas las sedes (Global)" [selected]
                    - option "Sede Principal"
                    - option "Sede Norte"
                    - option "Sede Sur"
                - paragraph [ref=e278]: Opcional. Si se omite, accede a todas.
          - generic [ref=e279]:
            - generic [ref=e280]:
              - img [ref=e282]
              - generic [ref=e285]:
                - heading "Contraseña" [level=3] [ref=e286]
                - paragraph [ref=e287]: Define una contraseña segura para el acceso.
            - generic [ref=e288]:
              - generic [ref=e289]:
                - generic [ref=e290]:
                  - text: Contraseña
                  - generic [ref=e291]: "*"
                - textbox "Contraseña *" [ref=e292]:
                  - /placeholder: ••••••••
                  - text: Audit2026!
              - generic [ref=e293]:
                - generic [ref=e294]: Confirmar contraseña
                - textbox "Confirmar contraseña" [ref=e295]:
                  - /placeholder: ••••••••
                  - text: Audit2026!
          - generic [ref=e296]:
            - button "Guardando…" [disabled] [ref=e297]:
              - img [ref=e298]
              - text: Guardando…
            - link "Cancelar" [ref=e302] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/usuarios
              - img [ref=e303]
              - text: Cancelar
        - complementary [ref=e306]:
          - generic [ref=e307]:
            - heading "Antes de empezar" [level=3] [ref=e308]:
              - img [ref=e309]
              - text: Antes de empezar
            - list [ref=e311]:
              - listitem [ref=e312]:
                - generic [ref=e313]: •
                - text: El correo será su identificador de acceso.
              - listitem [ref=e314]:
                - generic [ref=e315]: •
                - text: El rol define qué módulos y acciones podrá usar.
              - listitem [ref=e316]:
                - generic [ref=e317]: •
                - text: Puedes cambiar todos estos datos más adelante.
          - generic [ref=e318]:
            - heading "Buenas prácticas" [level=3] [ref=e319]
            - paragraph [ref=e320]: Asigna el rol con los permisos mínimos necesarios. Evita compartir cuentas entre varias personas para mantener una auditoría confiable.
```

# Test source

```ts
  1   | /**
  2   |  * 11-e2-roles-permisos.spec.ts — Roles, Permisos y Usuarios — Empresa 2
  3   |  *
  4   |  * Flujos cubiertos:
  5   |  *  ✓ Listar usuarios de la empresa
  6   |  *  ✓ Crear usuario nuevo con rol
  7   |  *  ✓ Editar usuario (cambiar rol)
  8   |  *  ✓ Desactivar usuario
  9   |  *  ✓ Reactivar usuario
  10  |  *  ✓ Listar roles
  11  |  *  ✓ Crear rol personalizado
  12  |  *  ✓ Asignar permisos a rol
  13  |  *  ✓ Verificar que VENDEDOR no accede a RRHH
  14  |  *  ✓ Verificar que TÉCNICO no accede a CONTABILIDAD
  15  |  *  ✓ Verificar que CONTADOR accede a CONTABILIDAD
  16  |  *  ✓ Sedes: listar, crear, editar
  17  |  */
  18  | import { test, expect, type Page, type Browser } from '@playwright/test';
  19  | import { AUDIT_AUTH } from '../../../../playwright.auditoria.config';
  20  | 
  21  | const BASE = process.env.APP_URL || 'http://127.0.0.1:8000';
  22  | const TS   = Date.now().toString().slice(-6);
  23  | 
  24  | const e2Admin = test.extend<{ page: Page }>({
  25  |   page: async ({ browser }, use) => {
  26  |     const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.empresa2 });
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
  37  | async function pageAs(browser: Browser, storageFile: string) {
  38  |   const ctx  = await browser.newContext({ storageState: storageFile });
  39  |   const page = await ctx.newPage();
  40  |   return { page, ctx };
  41  | }
  42  | 
  43  | // ══════════════════════════════════════════════════════════════════════════════
  44  | // USUARIOS
  45  | // ══════════════════════════════════════════════════════════════════════════════
  46  | 
  47  | e2Admin.describe('E2 — Usuarios', () => {
  48  | 
  49  |   e2Admin('listar usuarios @smoke', async ({ page }) => {
  50  |     await page.goto(`${BASE}/usuarios`);
  51  |     await page.waitForLoadState('networkidle');
  52  |     await expect(page).toHaveURL(/usuarios/);
  53  |     const contenido = page.locator('table, [class*="card"], main').first();
  54  |     await expect(contenido).toBeVisible({ timeout: 10_000 });
  55  |     const filas = await page.locator('tbody tr').count();
  56  |     console.log(`  👤 Usuarios visibles: ${filas}`);
  57  |     expect(filas).toBeGreaterThan(0);
  58  |     await ss(page, 'e2-usr-01-lista');
  59  |   });
  60  | 
  61  |   e2Admin('crear usuario nuevo con rol VENDEDOR', async ({ page }) => {
  62  |     await page.goto(`${BASE}/usuarios/crear`);
  63  |     await page.waitForLoadState('networkidle');
  64  |     await ss(page, 'e2-usr-02-form');
  65  | 
  66  |     const campos = [
  67  |       ['name',     `Usuario E2E ${TS}`],
  68  |       ['email',    `usuario.e2e.${TS}@comercializadora.co`],
  69  |       ['password', 'Audit2026!'],
  70  |       ['password_confirmation', 'Audit2026!'],
  71  |     ];
  72  | 
  73  |     for (const [name, value] of campos) {
  74  |       const input = page.locator(`input[name="${name}"]`).first();
  75  |       if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
  76  |         await input.fill(value);
  77  |       }
  78  |     }
  79  | 
  80  |     // Rol
  81  |     const rolSelect = page.locator('select[name="role"]').first();
  82  |     if (await rolSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
  83  |       await rolSelect.selectOption('VENDEDOR');
  84  |     }
  85  | 
  86  |     await ss(page, 'e2-usr-03-form-lleno');
  87  |     await page.locator('button[type="submit"]').first().click();
  88  |     await page.waitForLoadState('networkidle');
  89  |     await ss(page, 'e2-usr-04-creado');
  90  | 
  91  |     const exito = !page.url().includes('/crear');
> 92  |     expect(exito, `URL: ${page.url()}`).toBeTruthy();
      |                                         ^ Error: URL: http://127.0.0.1:8000/usuarios/crear
  93  |   });
  94  | 
  95  |   e2Admin('desactivar y reactivar usuario', async ({ page }) => {
  96  |     await page.goto(`${BASE}/usuarios`);
  97  |     await page.waitForLoadState('networkidle');
  98  | 
  99  |     // Buscar botón de desactivar/cambiar estado en primera fila (no el admin)
  100 |     const toggleBtn = page.locator('button').filter({ hasText: /desactivar|inactivar|toggle/i }).last();
  101 |     if (await toggleBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
  102 |       await toggleBtn.click();
  103 |       await page.waitForLoadState('networkidle');
  104 |       await ss(page, 'e2-usr-05-toggle-estado');
  105 | 
  106 |       // Reactivar
  107 |       const reactivarBtn = page.locator('button').filter({ hasText: /activar|reactivar/i }).last();
  108 |       if (await reactivarBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  109 |         await reactivarBtn.click();
  110 |         await page.waitForLoadState('networkidle');
  111 |         await ss(page, 'e2-usr-06-reactivado');
  112 |       }
  113 |     }
  114 |   });
  115 | });
  116 | 
  117 | // ══════════════════════════════════════════════════════════════════════════════
  118 | // ROLES
  119 | // ══════════════════════════════════════════════════════════════════════════════
  120 | 
  121 | e2Admin.describe('E2 — Roles', () => {
  122 | 
  123 |   e2Admin('listar roles @smoke', async ({ page }) => {
  124 |     await page.goto(`${BASE}/roles`);
  125 |     await page.waitForLoadState('networkidle');
  126 |     await expect(page).toHaveURL(/roles/);
  127 |     const contenido = page.locator('table, [class*="card"], main').first();
  128 |     await expect(contenido).toBeVisible({ timeout: 10_000 });
  129 |     await ss(page, 'e2-rol-01-lista');
  130 |   });
  131 | 
  132 |   e2Admin('crear rol personalizado con permisos', async ({ page }) => {
  133 |     await page.goto(`${BASE}/roles`);
  134 |     await page.waitForLoadState('networkidle');
  135 | 
  136 |     const btnNuevo = page.locator('button, a').filter({ hasText: /nuevo|crear/i }).first();
  137 |     if (await btnNuevo.isVisible({ timeout: 5_000 }).catch(() => false)) {
  138 |       await btnNuevo.click();
  139 |       await page.waitForTimeout(600);
  140 |       await ss(page, 'e2-rol-02-form');
  141 | 
  142 |       const nombreInput = page.locator('input[name="name"], input[name="nombre"]').first();
  143 |       if (await nombreInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  144 |         await nombreInput.fill(`ROL_AUDITOR_${TS}`);
  145 |       }
  146 | 
  147 |       // Seleccionar permisos
  148 |       const permisos = ['crm:view', 'inventory:view', 'sales:view'];
  149 |       for (const perm of permisos) {
  150 |         const checkbox = page.locator(`input[value="${perm}"], input[name="${perm}"]`).first();
  151 |         if (await checkbox.isVisible({ timeout: 1_000 }).catch(() => false)) {
  152 |           await checkbox.check();
  153 |         }
  154 |       }
  155 | 
  156 |       await ss(page, 'e2-rol-03-permisos-seleccionados');
  157 | 
  158 |       const submitBtn = page.locator('button[type="submit"]').first();
  159 |       if (await submitBtn.isVisible()) {
  160 |         await submitBtn.click();
  161 |         await page.waitForLoadState('networkidle');
  162 |         await ss(page, 'e2-rol-04-rol-creado');
  163 |       }
  164 |     }
  165 |   });
  166 | });
  167 | 
  168 | // ══════════════════════════════════════════════════════════════════════════════
  169 | // AISLAMIENTO DE PERMISOS
  170 | // ══════════════════════════════════════════════════════════════════════════════
  171 | 
  172 | e2Admin.describe('E2 — Aislamiento de Permisos entre Roles', () => {
  173 | 
  174 |   e2Admin('VENDEDOR no puede acceder a RRHH', async ({ browser }) => {
  175 |     const { page, ctx } = await pageAs(browser, AUDIT_AUTH.vendedor2);
  176 | 
  177 |     await page.goto(`${BASE}/hr/empleados`);
  178 |     await page.waitForLoadState('networkidle');
  179 | 
  180 |     const url = page.url();
  181 |     const es403 = await page.locator('text=403').isVisible().catch(() => false);
  182 |     const redirigido = !url.includes('/hr/empleados');
  183 | 
  184 |     await ss(page, 'e2-perm-01-vendedor-hr-denegado');
  185 |     expect(es403 || redirigido, `Vendedor accedió a RRHH: ${url}`).toBeTruthy();
  186 | 
  187 |     await ctx.close();
  188 |   });
  189 | 
  190 |   e2Admin('TÉCNICO no puede acceder a Contabilidad', async ({ browser }) => {
  191 |     const { page, ctx } = await pageAs(browser, AUDIT_AUTH.tecnico2);
  192 | 
```