# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empresa1\02-e1-crm.spec.ts >> E1 — CRM — Clientes >> crear cliente persona natural
- Location: tests\e2e\auditoria\empresa1\02-e1-crm.spec.ts:99:3

# Error details

```
Error: URL actual: http://127.0.0.1:8000/crm/clientes/crear

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
        - generic [ref=e26]:
          - button "CRM" [expanded] [ref=e27]:
            - img [ref=e28]
            - generic [ref=e33]: CRM
            - img [ref=e34]
          - generic [ref=e36]:
            - link "Clientes" [ref=e37] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/crm/clientes
              - img [ref=e39]
              - generic [ref=e44]: Clientes
              - img [ref=e45]
            - link "Oportunidades" [ref=e47] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/crm/oportunidades
              - img [ref=e48]
              - generic [ref=e53]: Oportunidades
              - img [ref=e54]
        - button "VENTAS" [ref=e57]:
          - img [ref=e58]
          - generic [ref=e62]: VENTAS
          - img [ref=e63]
        - button "COMPRAS" [ref=e66]:
          - img [ref=e67]
          - generic [ref=e72]: COMPRAS
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
        - generic [ref=e154]: CRM
        - generic [ref=e155]: /
        - generic [ref=e156]: Clientes
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
            - /url: http://127.0.0.1:8000/crm/clientes
            - img [ref=e190]
          - generic [ref=e192]:
            - heading "Nuevo cliente" [level=2] [ref=e193]
            - paragraph [ref=e194]: Registra un nuevo cliente para gestionar tus relaciones comerciales.
        - generic [ref=e195]:
          - link "Cancelar" [ref=e196] [cursor=pointer]:
            - /url: http://127.0.0.1:8000/crm/clientes
            - button "Cancelar" [ref=e197]
          - button "Creando..." [disabled]
      - generic [ref=e198]:
        - generic [ref=e200]:
          - generic [ref=e201]:
            - button "Persona" [ref=e202]:
              - img [ref=e203]
              - text: Persona
            - button "Empresa" [ref=e206]:
              - img [ref=e207]
              - text: Empresa
          - generic [ref=e211]:
            - generic [ref=e212]:
              - img [ref=e214]
              - generic [ref=e217]:
                - heading "Información general" [level=3] [ref=e218]
                - paragraph [ref=e219]: Datos básicos de la empresa
            - generic [ref=e220]:
              - generic [ref=e221]:
                - generic [ref=e222]:
                  - generic [ref=e223]: Nombres *
                  - generic [ref=e224]:
                    - img [ref=e226]
                    - textbox "Nombres" [ref=e229]: Carlos Auditoría
                - generic [ref=e230]:
                  - generic [ref=e231]: Apellidos *
                  - generic [ref=e232]:
                    - img [ref=e234]
                    - textbox "Apellidos" [ref=e237]: Pérez E2E
              - generic [ref=e238]:
                - generic [ref=e239]:
                  - generic [ref=e240]: Tipo documento *
                  - generic [ref=e241]:
                    - img [ref=e243]
                    - combobox [ref=e246]:
                      - option "—" [selected]
                      - option "CC"
                      - option "CE"
                      - option "Pasaporte"
                - generic [ref=e247]:
                  - generic [ref=e248]: Número documento *
                  - generic [ref=e249]:
                    - img [ref=e251]
                    - textbox "Número" [ref=e254]: "1005971712"
            - generic [ref=e255]:
              - generic [ref=e256]:
                - generic [ref=e257]: Email
                - generic [ref=e258]:
                  - img [ref=e260]
                  - textbox "contacto@empresa.com" [ref=e263]: carlos.audit971712@test.co
              - generic [ref=e264]:
                - generic [ref=e265]: Teléfono
                - generic [ref=e266]:
                  - img [ref=e268]
                  - textbox "Ej. +57 (604) 123 4567" [ref=e270]: "3001971712"
          - generic [ref=e271]:
            - generic [ref=e272]:
              - img [ref=e274]
              - generic [ref=e277]:
                - heading "Ubicación" [level=3] [ref=e278]
                - paragraph [ref=e279]: Información de dirección
            - generic [ref=e280]:
              - generic [ref=e281]:
                - generic [ref=e282]: Dirección
                - generic [ref=e283]:
                  - img [ref=e285]
                  - 'textbox "Ej. Carrera 30 # 45-67" [ref=e288]': "Cll 45 # 12-34, Bogotá"
              - generic [ref=e289]:
                - generic [ref=e290]: Ciudad
                - generic [ref=e291]:
                  - img [ref=e293]
                  - combobox "Escribe o selecciona una ciudad" [ref=e296]
          - generic [ref=e297]:
            - generic [ref=e298]:
              - img [ref=e300]
              - generic [ref=e303]:
                - heading "Información adicional" [level=3] [ref=e304]
                - paragraph [ref=e305]: Notas y observaciones sobre el cliente
            - generic [ref=e306]:
              - generic [ref=e307]: Notas
              - textbox "Información adicional relevante sobre el cliente..." [ref=e308]
          - generic [ref=e310] [cursor=pointer]:
            - checkbox "Cliente activo El cliente podrá ser seleccionado en documentos y operaciones." [checked] [ref=e312]
            - generic [ref=e313]:
              - generic [ref=e314]: Cliente activo
              - text: El cliente podrá ser seleccionado en documentos y operaciones.
        - generic [ref=e316]:
          - img [ref=e319]
          - heading "i Información importante" [level=3] [ref=e323]:
            - generic [ref=e324]: i
            - text: Información importante
          - paragraph [ref=e325]: Completa la información del cliente para ofrecerte una mejor experiencia.
          - list [ref=e326]:
            - listitem [ref=e327]:
              - img [ref=e328]
              - generic [ref=e331]: Los campos marcados con * son obligatorios
            - listitem [ref=e332]:
              - img [ref=e333]
              - generic [ref=e336]: Puedes editar esta información más tarde
            - listitem [ref=e337]:
              - img [ref=e338]
              - generic [ref=e341]: Los datos de contacto son confidenciales
            - listitem [ref=e342]:
              - img [ref=e343]
              - generic [ref=e346]: Asegúrate de verificar el NIT
          - generic [ref=e347]:
            - heading "Consejo" [level=4] [ref=e348]:
              - img [ref=e349]
              - text: Consejo
            - paragraph [ref=e351]: Un cliente bien registrado te ayudará a gestionar mejor tus ventas y ofrecer un servicio más personalizado.
```

# Test source

```ts
  39  |   razonSocial: `Empresa Auditoría ${TS} SAS`,
  40  |   email:       `contacto@empresaauditoria${TS}.co`,
  41  |   telefono:    `6012${TS.slice(0,4)}`,
  42  | };
  43  | 
  44  | // ── Fixture ────────────────────────────────────────────────────────────────────
  45  | const e1 = test.extend<{ page: Page }>({
  46  |   page: async ({ browser }, use) => {
  47  |     const ctx  = await browser.newContext({ storageState: AUDIT_AUTH.empresa1 });
  48  |     const page = await ctx.newPage();
  49  |     await use(page);
  50  |     await ctx.close();
  51  |   },
  52  | });
  53  | 
  54  | // ── Helper: screenshot ─────────────────────────────────────────────────────────
  55  | async function ss(page: Page, name: string) {
  56  |   await page.screenshot({
  57  |     path: `tests/e2e/auditoria/results/screenshots/${name}.png`,
  58  |     fullPage: true,
  59  |   });
  60  | }
  61  | 
  62  | // ── Helper: seleccionar opción en combobox Shadcn/ui ──────────────────────────
  63  | async function selectCombobox(page: Page, trigger: string, optionText: string) {
  64  |   const btn = page.locator(`button, [role="combobox"]`).filter({ hasText: new RegExp(trigger, 'i') }).first();
  65  |   if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  66  |     await btn.click();
  67  |     await page.waitForTimeout(400);
  68  |     const option = page.locator('[role="option"]').filter({ hasText: optionText }).first();
  69  |     if (await option.isVisible({ timeout: 3_000 }).catch(() => false)) {
  70  |       await option.click();
  71  |     }
  72  |   }
  73  | }
  74  | 
  75  | // ══════════════════════════════════════════════════════════════════════════════
  76  | // CLIENTES
  77  | // ══════════════════════════════════════════════════════════════════════════════
  78  | 
  79  | e1.describe('E1 — CRM — Clientes', () => {
  80  | 
  81  |   e1('listado de clientes carga con datos del seeder @smoke', async ({ page }) => {
  82  |     await page.goto(`${BASE}/crm/clientes`);
  83  |     await page.waitForLoadState('networkidle');
  84  | 
  85  |     await expect(page).toHaveURL(/crm\/clientes/);
  86  | 
  87  |     // Debe haber tabla o cards con datos
  88  |     const contenido = page.locator('table, [class*="card"], tr').first();
  89  |     await expect(contenido).toBeVisible({ timeout: 15_000 });
  90  | 
  91  |     // Los 30 clientes del seeder deben estar presentes (puede estar paginado)
  92  |     const filas = await page.locator('tbody tr, [data-testid*="row"]').count();
  93  |     console.log(`  📋 Clientes visibles: ${filas}`);
  94  |     expect(filas).toBeGreaterThan(0);
  95  | 
  96  |     await ss(page, 'e1-crm-01-lista-clientes');
  97  |   });
  98  | 
  99  |   e1('crear cliente persona natural', async ({ page }) => {
  100 |     await page.goto(`${BASE}/crm/clientes/crear`);
  101 |     await page.waitForLoadState('networkidle');
  102 | 
  103 |     await ss(page, 'e1-crm-02-form-crear-natural');
  104 | 
  105 |     // Tipo de persona — busca botón/tab con texto "Persona"
  106 |     const btnNatural = page.locator('button:has-text("Persona"), [role="tab"]:has-text("Persona"), input[value="natural"]').first();
  107 |     if (await btnNatural.isVisible({ timeout: 2_000 }).catch(() => false)) {
  108 |       await btnNatural.click();
  109 |       await page.waitForTimeout(300);
  110 |     }
  111 | 
  112 |     // Campos del formulario
  113 |     const campos = [
  114 |       ['numero_documento', CLIENTE_NATURAL.documento],
  115 |       ['nombres',          CLIENTE_NATURAL.nombres],
  116 |       ['apellidos',        CLIENTE_NATURAL.apellidos],
  117 |       ['email',            CLIENTE_NATURAL.email],
  118 |       ['telefono',         CLIENTE_NATURAL.telefono],
  119 |       ['direccion',        CLIENTE_NATURAL.direccion],
  120 |     ];
  121 | 
  122 |     for (const [name, value] of campos) {
  123 |       const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
  124 |       if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
  125 |         await input.fill(value);
  126 |       }
  127 |     }
  128 | 
  129 |     await ss(page, 'e1-crm-03-form-natural-lleno');
  130 |     await page.locator('button[type="submit"]').first().click();
  131 |     await page.waitForLoadState('networkidle');
  132 | 
  133 |     await ss(page, 'e1-crm-04-cliente-natural-creado');
  134 | 
  135 |     // Verificar éxito: mensaje toast o redirigido a listado/detalle
  136 |     const exito = page.locator('[data-sonner-toast], [role="status"], .toast').filter({ hasText: /creado|éxito|guardado/i }).first();
  137 |     const enListado = page.url().includes('/crm/clientes') && !page.url().includes('/crear');
  138 |     const tieneExito = await exito.isVisible({ timeout: 5_000 }).catch(() => false) || enListado;
> 139 |     expect(tieneExito, `URL actual: ${page.url()}`).toBeTruthy();
      |                                                     ^ Error: URL actual: http://127.0.0.1:8000/crm/clientes/crear
  140 |   });
  141 | 
  142 |   e1('crear cliente persona jurídica', async ({ page }) => {
  143 |     await page.goto(`${BASE}/crm/clientes/crear`);
  144 |     await page.waitForLoadState('networkidle');
  145 | 
  146 |     // Seleccionar tipo jurídico — el form abre en modo jurídico por defecto; aseguramos con botón/tab
  147 |     const btnJur = page.locator('button:has-text("Empresa"), [role="tab"]:has-text("Empresa"), input[value="juridico"]').first();
  148 |     if (await btnJur.isVisible({ timeout: 2_000 }).catch(() => false)) {
  149 |       await btnJur.click();
  150 |       await page.waitForTimeout(300);
  151 |     }
  152 | 
  153 |     // Campos jurídicos
  154 |     const camposJur = [
  155 |       ['nit',          CLIENTE_JURIDICO.nit],
  156 |       ['razon_social', CLIENTE_JURIDICO.razonSocial],
  157 |       ['email',        CLIENTE_JURIDICO.email],
  158 |       ['telefono',     CLIENTE_JURIDICO.telefono],
  159 |     ];
  160 | 
  161 |     for (const [name, value] of camposJur) {
  162 |       const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
  163 |       if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
  164 |         await input.fill(value);
  165 |       }
  166 |     }
  167 | 
  168 |     await ss(page, 'e1-crm-05-form-juridico-lleno');
  169 |     await page.locator('button[type="submit"]').first().click();
  170 |     await page.waitForLoadState('networkidle');
  171 |     await ss(page, 'e1-crm-06-cliente-juridico-creado');
  172 | 
  173 |     const enListado = page.url().includes('/crm/clientes') && !page.url().includes('/crear');
  174 |     expect(enListado || !page.url().includes('/crear'), `URL: ${page.url()}`).toBeTruthy();
  175 |   });
  176 | 
  177 |   e1('buscar cliente por nombre', async ({ page }) => {
  178 |     await page.goto(`${BASE}/crm/clientes`);
  179 |     await page.waitForLoadState('networkidle');
  180 | 
  181 |     const searchInput = page
  182 |       .locator('input[placeholder*="Buscar"], input[type="search"], input[name="search"]')
  183 |       .first();
  184 | 
  185 |     await expect(searchInput).toBeVisible({ timeout: 10_000 });
  186 |     await searchInput.fill('Pérez');
  187 |     await page.keyboard.press('Enter');
  188 |     await page.waitForLoadState('networkidle');
  189 |     await page.waitForTimeout(500);
  190 | 
  191 |     await ss(page, 'e1-crm-07-buscar-perez');
  192 | 
  193 |     // Debe mostrar resultados o estado vacío — el DataTable siempre muestra algún contenido
  194 |     const resultado = page.locator('tbody tr, [class*="empty"], [class*="Empty"], main').first();
  195 |     await expect(resultado).toBeVisible({ timeout: 10_000 });
  196 |   });
  197 | 
  198 |   e1('buscar cliente por documento', async ({ page }) => {
  199 |     await page.goto(`${BASE}/crm/clientes`);
  200 |     await page.waitForLoadState('networkidle');
  201 | 
  202 |     const searchInput = page
  203 |       .locator('input[placeholder*="Buscar"], input[type="search"]')
  204 |       .first();
  205 | 
  206 |     if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  207 |       await searchInput.fill(CLIENTE_NATURAL.documento);
  208 |       await page.keyboard.press('Enter');
  209 |       await page.waitForLoadState('networkidle');
  210 |       await page.waitForTimeout(500);
  211 |       await ss(page, 'e1-crm-08-buscar-por-doc');
  212 |     }
  213 |   });
  214 | 
  215 |   e1('editar datos de un cliente existente', async ({ page }) => {
  216 |     await page.goto(`${BASE}/crm/clientes`);
  217 |     await page.waitForLoadState('networkidle');
  218 | 
  219 |     // Buscar botón de editar en la primera fila
  220 |     const editBtn = page
  221 |       .locator('a[href*="editar"], a[href*="edit"], button')
  222 |       .filter({ hasText: /editar|edit/i })
  223 |       .first();
  224 | 
  225 |     // Alternativa: ícono de lápiz
  226 |     const editIcon = page.locator('a[href*="/editar"]').first();
  227 | 
  228 |     let clicked = false;
  229 |     if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  230 |       await editBtn.click();
  231 |       clicked = true;
  232 |     } else if (await editIcon.isVisible({ timeout: 3_000 }).catch(() => false)) {
  233 |       await editIcon.click();
  234 |       clicked = true;
  235 |     }
  236 | 
  237 |     if (clicked) {
  238 |       await page.waitForLoadState('networkidle');
  239 |       await ss(page, 'e1-crm-09-formulario-editar');
```