# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empresa2\08-e2-hr.spec.ts >> E2 — HR — Empleados >> crear empleado nuevo con contrato
- Location: tests\e2e\auditoria\empresa2\08-e2-hr.spec.ts:102:3

# Error details

```
Error: URL: http://127.0.0.1:8000/hr/empleados/crear

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
        - generic [ref=e62]:
          - button "RECURSOS HUMANOS" [expanded] [ref=e63]:
            - img [ref=e64]
            - generic [ref=e69]: RECURSOS HUMANOS
            - img [ref=e70]
          - generic [ref=e72]:
            - link "Dashboard" [ref=e73] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/hr/dashboard
              - img [ref=e74]
              - generic [ref=e79]: Dashboard
              - img [ref=e80]
            - link "Empleados" [ref=e82] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/hr/empleados
              - img [ref=e84]
              - generic [ref=e89]: Empleados
              - img [ref=e90]
            - generic [ref=e93]: NÓMINA
            - link "Períodos" [ref=e94] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/payroll/periodos
              - img [ref=e95]
              - generic [ref=e100]: Períodos
              - img [ref=e101]
            - link "Novedades" [ref=e103] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/payroll/novedades
              - img [ref=e104]
              - generic [ref=e109]: Novedades
              - img [ref=e110]
        - button "TESORERÍA" [ref=e113]:
          - img [ref=e114]
          - generic [ref=e117]: TESORERÍA
          - img [ref=e118]
        - button "Inventario" [ref=e121]:
          - img [ref=e122]
          - generic [ref=e126]: Inventario
          - img [ref=e127]
        - button "NOTIFICACIONES" [ref=e130]:
          - img [ref=e131]
          - generic [ref=e135]: NOTIFICACIONES
          - img [ref=e136]
        - button "SERVICIO TÉCNICO" [ref=e139]:
          - img [ref=e140]
          - generic [ref=e142]: SERVICIO TÉCNICO
          - img [ref=e143]
      - generic [ref=e145]:
        - generic [ref=e146]: Sistema
        - button "CONFIGURACIÓN" [ref=e148]:
          - img [ref=e149]
          - generic [ref=e152]: CONFIGURACIÓN
          - img [ref=e153]
    - generic [ref=e155]:
      - generic [ref=e156]:
        - img [ref=e158]
        - heading "Plan Empresarial" [level=4] [ref=e160]
        - generic [ref=e163]: Tu plan está activo
        - button "Ver detalles del plan" [ref=e164]:
          - text: Ver detalles del plan
          - img [ref=e165]
      - link "Ayuda" [ref=e167] [cursor=pointer]:
        - /url: "#"
        - img [ref=e168]
        - text: Ayuda
      - link "Documentación" [ref=e171] [cursor=pointer]:
        - /url: "#"
        - img [ref=e172]
        - text: Documentación
        - img [ref=e175]
      - link "Soporte" [ref=e179] [cursor=pointer]:
        - /url: "#"
        - img [ref=e180]
        - text: Soporte
    - button "Colapsar menú" [ref=e182]:
      - img [ref=e183]
      - generic [ref=e186]: Colapsar
  - main [ref=e187]:
    - generic [ref=e189]:
      - navigation "Breadcrumb" [ref=e190]:
        - generic [ref=e191]: RECURSOS HUMANOS
        - generic [ref=e192]: /
        - generic [ref=e193]: Empleados
      - generic [ref=e194]:
        - button "Buscar o ir a…" [ref=e195]:
          - img [ref=e196]
          - generic [ref=e199]: Buscar en Nexora…
          - generic:
            - generic: ⌘
            - text: K
        - generic [ref=e200]:
          - heading "Buscar en Nexora" [level=2] [ref=e201]
          - paragraph [ref=e202]: Busca clientes, productos, facturas o navega a una sección.
      - generic [ref=e203]:
        - button "Activar modo oscuro" [ref=e204]:
          - img [ref=e205]
        - button "Notificaciones" [ref=e207]:
          - img [ref=e208]
        - button "Ayuda" [ref=e212]:
          - img [ref=e213]
        - button "AC Administrador Comercializadora" [ref=e217] [cursor=pointer]:
          - generic [ref=e218]: AC
          - generic [ref=e220]: Administrador Comercializadora
    - generic [ref=e222]:
      - generic [ref=e223]:
        - button [ref=e224]:
          - img
        - generic [ref=e225]:
          - heading "Nuevo Empleado" [level=2] [ref=e226]:
            - img [ref=e227]
            - text: Nuevo Empleado
          - paragraph [ref=e231]: Registra un nuevo colaborador y su contrato inicial.
      - generic [ref=e232]:
        - generic [ref=e233]:
          - generic [ref=e235]: Datos Personales
          - generic [ref=e236]:
            - generic [ref=e237]:
              - generic [ref=e238]: Documento *
              - textbox "Documento *" [ref=e239]:
                - /placeholder: Cédula o NIT
                - text: "10252813"
            - generic [ref=e240]:
              - generic [ref=e241]: Sede *
              - combobox "Sede *" [ref=e242]:
                - option "Seleccionar sede…"
                - option "Sede Principal" [selected]
                - option "Sede Norte"
                - option "Sede Sur"
            - generic [ref=e243]:
              - generic [ref=e244]: Nombres *
              - textbox "Nombres *" [ref=e245]:
                - /placeholder: Nombres
                - text: Empleado Auditoría
            - generic [ref=e246]:
              - generic [ref=e247]: Apellidos *
              - textbox "Apellidos *" [ref=e248]:
                - /placeholder: Apellidos
                - text: E2E 252813
            - generic [ref=e249]:
              - generic [ref=e250]: Correo electrónico
              - textbox "Correo electrónico" [ref=e251]:
                - /placeholder: correo@ejemplo.com
                - text: empleado.e2e.252813@comercializadora.co
            - generic [ref=e252]:
              - generic [ref=e253]: Teléfono
              - textbox "Teléfono" [ref=e254]: "300125281"
        - generic [ref=e255]:
          - generic [ref=e257]:
            - img [ref=e258]
            - text: Usuario de Sistema
          - generic [ref=e262] [cursor=pointer]:
            - checkbox "Crear usuario para acceso al sistema" [ref=e263]
            - generic [ref=e264]: Crear usuario para acceso al sistema
        - generic [ref=e265]:
          - button "Cancelar" [ref=e266]
          - button "Guardando…" [disabled]:
            - img
            - text: Guardando…
```

# Test source

```ts
  35  | async function ss(page: Page, name: string) {
  36  |   await page.screenshot({ path: `tests/e2e/auditoria/results/screenshots/${name}.png`, fullPage: true });
  37  | }
  38  | 
  39  | // ══════════════════════════════════════════════════════════════════════════════
  40  | // DASHBOARD HR
  41  | // ══════════════════════════════════════════════════════════════════════════════
  42  | 
  43  | e2.describe('E2 — HR — Dashboard y Organización', () => {
  44  | 
  45  |   e2('dashboard HR carga @smoke', async ({ page }) => {
  46  |     await page.goto(`${BASE}/hr/dashboard`);
  47  |     await page.waitForLoadState('networkidle');
  48  |     await expect(page).not.toHaveURL(/login/);
  49  |     const contenido = page.locator('main, [class*="dashboard"], h1').first();
  50  |     await expect(contenido).toBeVisible({ timeout: 15_000 });
  51  |     await ss(page, 'e2-hr-01-dashboard');
  52  |   });
  53  | 
  54  |   e2('crear departamento nuevo', async ({ page }) => {
  55  |     await page.goto(`${BASE}/hr/catalogos`);
  56  |     await page.waitForLoadState('networkidle');
  57  |     await ss(page, 'e2-hr-02-catalogos');
  58  | 
  59  |     // Buscar sección de departamentos
  60  |     const deptBtn = page.locator('button, a, h2, h3').filter({ hasText: /departamento/i }).first();
  61  |     if (await deptBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
  62  |       const btnNuevo = page.locator('button').filter({ hasText: /nuevo|crear/i }).first();
  63  |       if (await btnNuevo.isVisible({ timeout: 3_000 }).catch(() => false)) {
  64  |         await btnNuevo.click();
  65  |         await page.waitForTimeout(500);
  66  | 
  67  |         const nombreInput = page.locator('input[name="nombre"]').first();
  68  |         if (await nombreInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  69  |           await nombreInput.fill(`Departamento E2E ${TS}`);
  70  |           await page.locator('button[type="submit"]').first().click();
  71  |           await page.waitForLoadState('networkidle');
  72  |           await ss(page, 'e2-hr-03-departamento-creado');
  73  |         }
  74  |       }
  75  |     }
  76  |   });
  77  | 
  78  |   e2('ver organigrama', async ({ page }) => {
  79  |     await page.goto(`${BASE}/hr/catalogos`);
  80  |     await page.waitForLoadState('networkidle');
  81  |     await expect(page).not.toHaveURL(/login/);
  82  |     await ss(page, 'e2-hr-04-organigrama');
  83  |   });
  84  | });
  85  | 
  86  | // ══════════════════════════════════════════════════════════════════════════════
  87  | // EMPLEADOS
  88  | // ══════════════════════════════════════════════════════════════════════════════
  89  | 
  90  | e2.describe('E2 — HR — Empleados', () => {
  91  | 
  92  |   e2('listado de empleados con datos del seeder @smoke', async ({ page }) => {
  93  |     await page.goto(`${BASE}/hr/empleados`);
  94  |     await page.waitForLoadState('networkidle');
  95  |     await expect(page).toHaveURL(/hr\/empleados/);
  96  |     const filas = await page.locator('tbody tr').count();
  97  |     console.log(`  👥 Empleados visibles: ${filas}`);
  98  |     expect(filas).toBeGreaterThan(0);
  99  |     await ss(page, 'e2-hr-05-lista-empleados');
  100 |   });
  101 | 
  102 |   e2('crear empleado nuevo con contrato', async ({ page }) => {
  103 |     await page.goto(`${BASE}/hr/empleados/crear`);
  104 |     await page.waitForLoadState('networkidle');
  105 |     await ss(page, 'e2-hr-06-form-crear-empleado');
  106 | 
  107 |     // Campos que realmente existen en el formulario HR
  108 |     const campos = [
  109 |       ['documento', `10${TS}`],
  110 |       ['nombres',   `Empleado Auditoría`],
  111 |       ['apellidos', `E2E ${TS}`],
  112 |       ['email',     `empleado.e2e.${TS}@comercializadora.co`],
  113 |       ['telefono',  `3001${TS.slice(0,5)}`],
  114 |     ];
  115 | 
  116 |     for (const [name, value] of campos) {
  117 |       const input = page.locator(`input[name="${name}"]`).first();
  118 |       if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
  119 |         await input.fill(value);
  120 |       }
  121 |     }
  122 | 
  123 |     // Sede — campo requerido
  124 |     const sedeSelect = page.locator('select[name="sede_id"]').first();
  125 |     if (await sedeSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
  126 |       await sedeSelect.selectOption({ index: 1 });
  127 |     }
  128 | 
  129 |     await ss(page, 'e2-hr-07-form-empleado-lleno');
  130 |     await page.locator('button[type="submit"]').first().click();
  131 |     await page.waitForLoadState('networkidle');
  132 |     await ss(page, 'e2-hr-08-empleado-creado');
  133 | 
  134 |     const exito = !page.url().includes('/crear');
> 135 |     expect(exito, `URL: ${page.url()}`).toBeTruthy();
      |                                         ^ Error: URL: http://127.0.0.1:8000/hr/empleados/crear
  136 |   });
  137 | 
  138 |   e2('ver detalle de empleado', async ({ page }) => {
  139 |     await page.goto(`${BASE}/hr/empleados`);
  140 |     await page.waitForLoadState('networkidle');
  141 | 
  142 |     const viewLink = page.locator('a[href*="/hr/empleados/"]').filter({ hasNotText: /crear|nuevo/i }).first();
  143 |     if (await viewLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
  144 |       await viewLink.click();
  145 |       await page.waitForLoadState('networkidle');
  146 |       await ss(page, 'e2-hr-09-detalle-empleado');
  147 |       await expect(page).toHaveURL(/hr\/empleados\/\d+/);
  148 |     }
  149 |   });
  150 | 
  151 |   e2('editar empleado — cambiar salario', async ({ page }) => {
  152 |     await page.goto(`${BASE}/hr/empleados`);
  153 |     await page.waitForLoadState('networkidle');
  154 | 
  155 |     const editLink = page.locator('a[href*="/hr/empleados/"][href*="editar"]').first();
  156 |     if (await editLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
  157 |       await editLink.click();
  158 |       await page.waitForLoadState('networkidle');
  159 |       await ss(page, 'e2-hr-10-editar-empleado');
  160 | 
  161 |       const salarioInput = page.locator('input[name="salario"]').first();
  162 |       if (await salarioInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  163 |         await salarioInput.clear();
  164 |         await salarioInput.fill('2200000');
  165 |         await page.locator('button[type="submit"]').first().click();
  166 |         await page.waitForLoadState('networkidle');
  167 |         await ss(page, 'e2-hr-11-empleado-actualizado');
  168 |       }
  169 |     }
  170 |   });
  171 | 
  172 |   e2('buscar empleado por nombre', async ({ page }) => {
  173 |     await page.goto(`${BASE}/hr/empleados`);
  174 |     await page.waitForLoadState('networkidle');
  175 | 
  176 |     const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
  177 |     if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
  178 |       await searchInput.fill('María');
  179 |       await page.keyboard.press('Enter');
  180 |       await page.waitForLoadState('networkidle');
  181 |       await ss(page, 'e2-hr-12-buscar-empleado');
  182 |     }
  183 |   });
  184 | });
  185 | 
  186 | // ══════════════════════════════════════════════════════════════════════════════
  187 | // INCAPACIDADES
  188 | // ══════════════════════════════════════════════════════════════════════════════
  189 | 
  190 | e2.describe('E2 — HR — Incapacidades', () => {
  191 | 
  192 |   e2('listar incapacidades @smoke', async ({ page }) => {
  193 |     await page.goto(`${BASE}/hr/incapacidades`);
  194 |     await page.waitForLoadState('networkidle');
  195 |     await expect(page).not.toHaveURL(/login/);
  196 |     const contenido = page.locator('table, main, [class*="empty"]').first();
  197 |     await expect(contenido).toBeVisible({ timeout: 10_000 });
  198 |     await ss(page, 'e2-hr-13-incapacidades');
  199 |   });
  200 | 
  201 |   e2('crear incapacidad para un empleado', async ({ page }) => {
  202 |     await page.goto(`${BASE}/hr/incapacidades`);
  203 |     await page.waitForLoadState('networkidle');
  204 | 
  205 |     const btnNueva = page.locator('button, a').filter({ hasText: /nueva|crear|registrar/i }).first();
  206 |     if (await btnNueva.isVisible({ timeout: 5_000 }).catch(() => false)) {
  207 |       await btnNueva.click();
  208 |       await page.waitForTimeout(600);
  209 |       await ss(page, 'e2-hr-14-form-incapacidad');
  210 | 
  211 |       // Empleado
  212 |       const empSelect = page.locator('select[name="empleado_id"]').first();
  213 |       if (await empSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
  214 |         await empSelect.selectOption({ index: 1 });
  215 |       }
  216 | 
  217 |       // Fecha inicio
  218 |       const fechaIni = page.locator('input[name="fecha_inicio"], input[type="date"]').first();
  219 |       if (await fechaIni.isVisible({ timeout: 2_000 }).catch(() => false)) {
  220 |         await fechaIni.fill(new Date().toISOString().split('T')[0]);
  221 |       }
  222 | 
  223 |       // Días
  224 |       const diasInput = page.locator('input[name="dias"]').first();
  225 |       if (await diasInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  226 |         await diasInput.fill('5');
  227 |       }
  228 | 
  229 |       // Tipo
  230 |       const tipoSelect = page.locator('select[name="tipo"]').first();
  231 |       if (await tipoSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
  232 |         await tipoSelect.selectOption({ index: 1 });
  233 |       }
  234 | 
  235 |       const submitBtn = page.locator('button[type="submit"]').first();
```