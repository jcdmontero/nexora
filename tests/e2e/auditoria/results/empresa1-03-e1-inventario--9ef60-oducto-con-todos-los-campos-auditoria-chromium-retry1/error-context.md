# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empresa1\03-e1-inventario.spec.ts >> E1 — Inventario — Productos >> crear producto con todos los campos
- Location: tests\e2e\auditoria\empresa1\03-e1-inventario.spec.ts:144:3

# Error details

```
Error: URL tras crear: http://127.0.0.1:8000/inventory/productos/crear

expect(received).toBeTruthy()

Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
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
          - generic [ref=e63]:
            - button "Inventario" [expanded] [ref=e64]:
              - img [ref=e65]
              - generic [ref=e69]: Inventario
              - img [ref=e70]
            - generic [ref=e72]:
              - link "Productos" [ref=e73] [cursor=pointer]:
                - /url: http://127.0.0.1:8000/inventory/productos
                - img [ref=e75]
                - generic [ref=e79]: Productos
                - img [ref=e80]
              - link "Entradas y Salidas" [ref=e82] [cursor=pointer]:
                - /url: http://127.0.0.1:8000/inventory/ajustes/crear
                - img [ref=e83]
                - generic [ref=e87]: Entradas y Salidas
                - img [ref=e88]
              - link "Kardex" [ref=e90] [cursor=pointer]:
                - /url: http://127.0.0.1:8000/inventory/kardex
                - img [ref=e91]
                - generic [ref=e95]: Kardex
                - img [ref=e96]
              - link "Traslados" [ref=e98] [cursor=pointer]:
                - /url: http://127.0.0.1:8000/inventory/traslados
                - img [ref=e99]
                - generic [ref=e103]: Traslados
                - img [ref=e104]
              - link "Categorías" [ref=e106] [cursor=pointer]:
                - /url: http://127.0.0.1:8000/inventory/categorias
                - img [ref=e107]
                - generic [ref=e111]: Categorías
                - img [ref=e112]
              - link "Marcas" [ref=e114] [cursor=pointer]:
                - /url: http://127.0.0.1:8000/inventory/marcas
                - img [ref=e115]
                - generic [ref=e119]: Marcas
                - img [ref=e120]
          - button "NOTIFICACIONES" [ref=e123]:
            - img [ref=e124]
            - generic [ref=e128]: NOTIFICACIONES
            - img [ref=e129]
          - button "SERVICIO TÉCNICO" [ref=e132]:
            - img [ref=e133]
            - generic [ref=e135]: SERVICIO TÉCNICO
            - img [ref=e136]
        - generic [ref=e138]:
          - generic [ref=e139]: Sistema
          - button "CONFIGURACIÓN" [ref=e141]:
            - img [ref=e142]
            - generic [ref=e145]: CONFIGURACIÓN
            - img [ref=e146]
      - generic [ref=e148]:
        - generic [ref=e149]:
          - img [ref=e151]
          - heading "Plan Empresarial" [level=4] [ref=e153]
          - generic [ref=e156]: Tu plan está activo
          - button "Ver detalles del plan" [ref=e157]:
            - text: Ver detalles del plan
            - img [ref=e158]
        - link "Ayuda" [ref=e160] [cursor=pointer]:
          - /url: "#"
          - img [ref=e161]
          - text: Ayuda
        - link "Documentación" [ref=e164] [cursor=pointer]:
          - /url: "#"
          - img [ref=e165]
          - text: Documentación
          - img [ref=e168]
        - link "Soporte" [ref=e172] [cursor=pointer]:
          - /url: "#"
          - img [ref=e173]
          - text: Soporte
      - button "Colapsar menú" [ref=e175]:
        - img [ref=e176]
        - generic [ref=e179]: Colapsar
    - main [ref=e180]:
      - generic [ref=e182]:
        - navigation "Breadcrumb" [ref=e183]:
          - generic [ref=e184]: Inventario
          - generic [ref=e185]: /
          - generic [ref=e186]: Productos
        - generic [ref=e187]:
          - button "Buscar o ir a…" [ref=e188]:
            - img [ref=e189]
            - generic [ref=e192]: Buscar en Nexora…
            - generic:
              - generic: ⌘
              - text: K
          - generic [ref=e193]:
            - heading "Buscar en Nexora" [level=2] [ref=e194]
            - paragraph [ref=e195]: Busca clientes, productos, facturas o navega a una sección.
        - generic [ref=e196]:
          - button "Activar modo oscuro" [ref=e197]:
            - img [ref=e198]
          - button "Notificaciones" [ref=e200]:
            - img [ref=e201]
          - button "Ayuda" [ref=e205]:
            - img [ref=e206]
          - button "AT Administrador TallerTech" [ref=e210] [cursor=pointer]:
            - generic [ref=e211]: AT
            - generic [ref=e213]: Administrador TallerTech
      - generic [ref=e216]:
        - generic [ref=e217]:
          - generic [ref=e218]:
            - link [ref=e219] [cursor=pointer]:
              - /url: http://127.0.0.1:8000/inventory/productos
              - button [ref=e220]:
                - img
            - generic [ref=e221]:
              - heading "Crear Producto" [level=2] [ref=e222]
              - paragraph [ref=e223]: Registra un nuevo artículo en tu catálogo.
          - button "Guardar Producto" [disabled]:
            - img
            - text: Guardar Producto
        - generic [ref=e224]:
          - generic [ref=e225]:
            - generic [ref=e226]:
              - heading "Información Básica" [level=3] [ref=e227]
              - generic [ref=e228]:
                - generic [ref=e229]:
                  - generic [ref=e230]:
                    - generic [ref=e231]: Código / SKU
                    - textbox "Código / SKU" [ref=e232]:
                      - /placeholder: Ej. REF-001
                      - text: AUD-E1-038293
                  - generic [ref=e233]:
                    - generic [ref=e234]: Nombre del Producto
                    - textbox "Nombre del Producto" [ref=e235]:
                      - /placeholder: Ej. Taladro Percutor 1/2'' 800W
                      - text: Producto E2E Auditoría 038293
                    - paragraph [ref=e236]: El nombre comercial con el que aparecerá en ventas.
                - generic [ref=e237]:
                  - generic [ref=e238]: Descripción (Opcional)
                  - textbox "Descripción (Opcional)" [ref=e239]:
                    - /placeholder: Ej. Taladro de uso profesional, incluye 3 brocas y maletín de transporte.
                    - text: Producto creado por suite de auditoría E2E
            - generic [ref=e240]:
              - heading "Precios e Inventario Inicial" [level=3] [ref=e241]
              - generic [ref=e242]:
                - generic [ref=e243]:
                  - generic [ref=e244]: Precio de Venta
                  - generic [ref=e245]:
                    - generic [ref=e246]: $
                    - textbox "Precio de Venta" [ref=e247]:
                      - /placeholder: Ej. 150000
                      - text: "0"
                  - paragraph [ref=e248]: Precio final al público.
                - generic [ref=e249]:
                  - generic [ref=e250]: Costo Promedio (Inicial)
                  - generic [ref=e251]:
                    - generic [ref=e252]: $
                    - textbox "Costo Promedio (Inicial)" [ref=e253]:
                      - /placeholder: Ej. 95000
                      - text: "0"
                  - paragraph [ref=e254]: Cuánto te cuesta a ti este producto.
                - generic [ref=e255]:
                  - generic [ref=e256]: Stock Inicial
                  - spinbutton "Stock Inicial" [ref=e257]: "10"
                  - paragraph [ref=e258]: Cantidad disponible actualmente.
                - generic [ref=e259]:
                  - generic [ref=e260]: Alerta de Stock Mínimo
                  - spinbutton "Alerta de Stock Mínimo" [ref=e261]: "5"
                  - paragraph [ref=e262]: Te avisaremos si el stock baja de este nivel.
            - generic [ref=e263]:
              - generic [ref=e264]:
                - generic [ref=e265]:
                  - heading "Presentaciones / Empaques (Opcional)" [level=3] [ref=e266]
                  - paragraph [ref=e267]: Configura si compras o vendes este producto en docenas, cajas, etc.
                - button "Agregar Empaque" [ref=e268]:
                  - img
                  - text: Agregar Empaque
              - generic [ref=e269]: El inventario se controlará únicamente en la Unidad Base.
          - generic [ref=e270]:
            - generic [ref=e271]:
              - heading "Clasificación" [level=3] [ref=e272]
              - generic [ref=e273]:
                - generic [ref=e274]:
                  - generic [ref=e275]: Categoría
                  - generic [ref=e276]:
                    - combobox "Categoría" [ref=e277]:
                      - option "Seleccione o cree una..."
                      - option "Access Points" [selected]
                      - option "All In One"
                      - option "Baterías"
                      - option "Cabezales"
                      - option "Cables"
                      - option "Cartuchos"
                      - option "Celulares"
                      - option "Componentes"
                      - option "Computadores"
                      - option "Conectores de carga"
                      - option "Consumibles"
                      - option "Dampers"
                      - option "Discos HDD"
                      - option "Discos SSD"
                      - option "Equipos de escritorio"
                      - option "Flex"
                      - option "Fusores"
                      - option "Impresoras"
                      - option "Inyección de tinta"
                      - option "Láser"
                      - option "Memorias RAM"
                      - option "Pantallas"
                      - option "Portátiles"
                      - option "Procesadores"
                      - option "Redes"
                      - option "Repuestos Impresoras"
                      - option "Rodillos"
                      - option "Routers"
                      - option "Switches"
                      - option "Tarjetas lógicas"
                      - option "Tarjetas madre"
                      - option "Térmicas"
                      - option "Tintas"
                      - option "Tóner"
                    - button [ref=e278]:
                      - img
                - generic [ref=e279]:
                  - generic [ref=e280]: Marca
                  - generic [ref=e281]:
                    - combobox "Marca" [ref=e282]:
                      - option "Seleccione o cree una..." [selected]
                      - option "Acer"
                      - option "AMD"
                      - option "Apple"
                      - option "ASUS"
                      - option "Brother"
                      - option "Canon"
                      - option "Crucial"
                      - option "Dell"
                      - option "Epson"
                      - option "HP"
                      - option "Intel"
                      - option "Kingston"
                      - option "Lenovo"
                      - option "Lexmark"
                      - option "Logitech"
                      - option "Samsung"
                      - option "Seagate"
                      - option "TP-Link"
                      - option "Ubiquiti"
                      - option "Western Digital"
                    - button [ref=e283]:
                      - img
                - generic [ref=e284]:
                  - generic [ref=e285]: Unidad Base (de Control)
                  - paragraph [ref=e286]: Elige la unidad más pequeña en la que venderás o controlarás este artículo.
                  - combobox "Unidad Base (de Control)" [ref=e287]:
                    - option "Unidad (Und)" [selected]
                    - option "Pieza (Pz)"
                    - option "Docena (Doc)"
                    - option "Ciento (Cto)"
                    - option "Millar (Mil)"
                    - option "Paquete (Pq)"
                    - option "Caja (Cj)"
                    - option "Bulto (Bl)"
                    - option "Saco (Sc)"
                    - option "Rollo (Rl)"
                    - option "Kit / Combo"
                    - option "Kilogramo (kg)"
                    - option "Gramo (g)"
                    - option "Tonelada (t)"
                    - option "Libra (lb)"
                    - option "Onza (oz)"
                    - option "Litro (L)"
                    - option "Mililitro (ml)"
                    - option "Galón (gal)"
                    - option "Barril (bbl)"
                    - option "Metro (m)"
                    - option "Centímetro (cm)"
                    - option "Pulgada (in)"
                    - option "Metro Cuadrado (m²)"
                    - option "Servicio (Srv)"
                    - option "Hora (hr)"
                    - option "Día (dia)"
                    - option "Mes (mes)"
                    - option "Proyecto (Proy)"
            - generic [ref=e288]:
              - heading "Ajustes" [level=3] [ref=e289]
              - generic [ref=e290]:
                - checkbox "Producto Activo" [checked] [ref=e291]:
                  - img [ref=e293]
                - checkbox [checked] [ref=e295]
                - generic [ref=e296]:
                  - generic [ref=e297] [cursor=pointer]: Producto Activo
                  - paragraph [ref=e298]: Si está inactivo, no se podrá comprar ni vender.
  - generic [ref=e300]:
    - img [ref=e301]
    - paragraph [ref=e304]: Producto creado correctamente.
    - button [ref=e305]:
      - img [ref=e306]
```

# Test source

```ts
  85  |       const nombreInput = page.locator('input[name="nombre"]').first();
  86  |       if (await nombreInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  87  |         await nombreInput.fill(`MarcaTest ${TS}`);
  88  | 
  89  |         const submitBtn = page.locator('button[type="submit"]').first();
  90  |         await submitBtn.click();
  91  |         await page.waitForLoadState('networkidle');
  92  |         await ss(page, 'e1-inv-05-marca-creada');
  93  |       }
  94  |     }
  95  |   });
  96  | 
  97  |   e1('listar bodegas @smoke', async ({ page }) => {
  98  |     await page.goto(`${BASE}/inventory/bodegas`);
  99  |     await page.waitForLoadState('networkidle');
  100 |     await expect(page).toHaveURL(/inventory\/bodegas/);
  101 |     const contenido = page.locator('table, [class*="card"], main > *').first();
  102 |     await expect(contenido).toBeVisible({ timeout: 10_000 });
  103 |     await ss(page, 'e1-inv-06-bodegas');
  104 |   });
  105 | 
  106 |   e1('crear bodega nueva', async ({ page }) => {
  107 |     await page.goto(`${BASE}/inventory/bodegas/crear`);
  108 |     await page.waitForLoadState('networkidle');
  109 |     await ss(page, 'e1-inv-07-form-bodega');
  110 | 
  111 |     const nombreInput = page.locator('input[name="nombre"]').first();
  112 |     if (await nombreInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
  113 |       await nombreInput.fill(`Bodega Auditoría ${TS}`);
  114 | 
  115 |       const dirInput = page.locator('input[name="direccion"], textarea[name="direccion"]').first();
  116 |       if (await dirInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  117 |         await dirInput.fill('Cra 45 # 12-34, Bogotá');
  118 |       }
  119 | 
  120 |       await page.locator('button[type="submit"]').first().click();
  121 |       await page.waitForLoadState('networkidle');
  122 |       await ss(page, 'e1-inv-08-bodega-creada');
  123 |     }
  124 |   });
  125 | });
  126 | 
  127 | // ══════════════════════════════════════════════════════════════════════════════
  128 | // PRODUCTOS
  129 | // ══════════════════════════════════════════════════════════════════════════════
  130 | 
  131 | e1.describe('E1 — Inventario — Productos', () => {
  132 | 
  133 |   e1('listado de productos con datos del seeder @smoke', async ({ page }) => {
  134 |     await page.goto(`${BASE}/inventory/productos`);
  135 |     await page.waitForLoadState('networkidle');
  136 | 
  137 |     await expect(page).toHaveURL(/inventory\/productos/);
  138 |     const filas = await page.locator('tbody tr').count();
  139 |     console.log(`  📦 Productos visibles: ${filas}`);
  140 |     expect(filas).toBeGreaterThan(0);
  141 |     await ss(page, 'e1-inv-09-lista-productos');
  142 |   });
  143 | 
  144 |   e1('crear producto con todos los campos', async ({ page }) => {
  145 |     await page.goto(`${BASE}/inventory/productos/crear`);
  146 |     await page.waitForLoadState('networkidle');
  147 |     await ss(page, 'e1-inv-10-form-crear-producto');
  148 | 
  149 |     const campos = [
  150 |       ['nombre',        `Producto E2E Auditoría ${TS}`],
  151 |       ['codigo',        `AUD-E1-${TS}`],
  152 |       ['descripcion',   'Producto creado por suite de auditoría E2E'],
  153 |       ['precio_venta',  '150000'],
  154 |       ['costo_promedio','100000'],
  155 |       ['stock_actual',  '10'],
  156 |       ['stock_minimo',  '5'],
  157 |     ];
  158 | 
  159 |     for (const [name, value] of campos) {
  160 |       const input = page.locator(`input[name="${name}"], textarea[name="${name}"]`).first();
  161 |       if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) {
  162 |         await input.clear();
  163 |         await input.fill(value);
  164 |       }
  165 |     }
  166 | 
  167 |     // Seleccionar categoría si hay selector
  168 |     const catSelect = page.locator('select[name="categoria_id"]').first();
  169 |     if (await catSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
  170 |       await catSelect.selectOption({ index: 1 });
  171 |     }
  172 | 
  173 |     // Unidad de medida
  174 |     const udSelect = page.locator('select[name="unidad_medida"]').first();
  175 |     if (await udSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
  176 |       await udSelect.selectOption('unidad');
  177 |     }
  178 | 
  179 |     await ss(page, 'e1-inv-11-form-producto-lleno');
  180 |     await page.locator('button[type="submit"]').first().click();
  181 |     await page.waitForLoadState('networkidle');
  182 |     await ss(page, 'e1-inv-12-producto-creado');
  183 | 
  184 |     const exito = !page.url().includes('/crear');
> 185 |     expect(exito, `URL tras crear: ${page.url()}`).toBeTruthy();
      |                                                    ^ Error: URL tras crear: http://127.0.0.1:8000/inventory/productos/crear
  186 |   });
  187 | 
  188 |   e1('buscar producto por nombre', async ({ page }) => {
  189 |     await page.goto(`${BASE}/inventory/productos`);
  190 |     await page.waitForLoadState('networkidle');
  191 | 
  192 |     const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
  193 |     if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
  194 |       await searchInput.fill('Epson');
  195 |       await page.keyboard.press('Enter');
  196 |       await page.waitForLoadState('networkidle');
  197 |       await page.waitForTimeout(500);
  198 |       await ss(page, 'e1-inv-13-buscar-epson');
  199 |     }
  200 |   });
  201 | 
  202 |   e1('buscar producto por código', async ({ page }) => {
  203 |     await page.goto(`${BASE}/inventory/productos`);
  204 |     await page.waitForLoadState('networkidle');
  205 | 
  206 |     const searchInput = page.locator('input[placeholder*="Buscar"], input[type="search"]').first();
  207 |     if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
  208 |       await searchInput.fill('AUD-E1-');
  209 |       await page.keyboard.press('Enter');
  210 |       await page.waitForLoadState('networkidle');
  211 |       await page.waitForTimeout(500);
  212 |       await ss(page, 'e1-inv-14-buscar-por-codigo');
  213 |     }
  214 |   });
  215 | 
  216 |   e1('editar producto — cambiar precio y stock mínimo', async ({ page }) => {
  217 |     await page.goto(`${BASE}/inventory/productos`);
  218 |     await page.waitForLoadState('networkidle');
  219 | 
  220 |     const editLink = page.locator('a[href*="/editar"]').first();
  221 |     if (await editLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
  222 |       await editLink.click();
  223 |       await page.waitForLoadState('networkidle');
  224 |       await ss(page, 'e1-inv-15-editar-producto');
  225 | 
  226 |       const precioInput = page.locator('input[name="precio_venta"]').first();
  227 |       if (await precioInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  228 |         await precioInput.clear();
  229 |         await precioInput.fill('165000');
  230 |       }
  231 | 
  232 |       const stockMinInput = page.locator('input[name="stock_minimo"]').first();
  233 |       if (await stockMinInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  234 |         await stockMinInput.clear();
  235 |         await stockMinInput.fill('8');
  236 |       }
  237 | 
  238 |       await page.locator('button[type="submit"]').first().click();
  239 |       await page.waitForLoadState('networkidle');
  240 |       await ss(page, 'e1-inv-16-producto-actualizado');
  241 |     }
  242 |   });
  243 | });
  244 | 
  245 | // ══════════════════════════════════════════════════════════════════════════════
  246 | // KARDEX Y AJUSTES
  247 | // ══════════════════════════════════════════════════════════════════════════════
  248 | 
  249 | e1.describe('E1 — Inventario — Kardex y Ajustes', () => {
  250 | 
  251 |   e1('ver kardex de productos @smoke', async ({ page }) => {
  252 |     await page.goto(`${BASE}/inventory/kardex`);
  253 |     await page.waitForLoadState('networkidle');
  254 |     await expect(page).not.toHaveURL(/login/);
  255 |     const contenido = page.locator('table, main, [class*="empty"]').first();
  256 |     await expect(contenido).toBeVisible({ timeout: 10_000 });
  257 |     await ss(page, 'e1-inv-17-kardex');
  258 |   });
  259 | 
  260 |   e1('crear ajuste de entrada de inventario', async ({ page }) => {
  261 |     await page.goto(`${BASE}/inventory/ajustes/crear`);
  262 |     await page.waitForLoadState('networkidle');
  263 |     await ss(page, 'e1-inv-18-form-ajuste');
  264 | 
  265 |     // Tipo de ajuste
  266 |     const tipoSelect = page.locator('select[name="tipo"]').first();
  267 |     if (await tipoSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
  268 |       await tipoSelect.selectOption('entrada');
  269 |     }
  270 | 
  271 |     // Producto
  272 |     const prodSelect = page.locator('select[name="producto_id"]').first();
  273 |     if (await prodSelect.isVisible({ timeout: 2_000 }).catch(() => false)) {
  274 |       await prodSelect.selectOption({ index: 1 });
  275 |     }
  276 | 
  277 |     // Cantidad
  278 |     const cantInput = page.locator('input[name="cantidad"]').first();
  279 |     if (await cantInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  280 |       await cantInput.fill('10');
  281 |     }
  282 | 
  283 |     // Observaciones
  284 |     const obsInput = page.locator('textarea[name="observaciones"], input[name="observaciones"]').first();
  285 |     if (await obsInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
```