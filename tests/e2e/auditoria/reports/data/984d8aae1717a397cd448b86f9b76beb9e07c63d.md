# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: empresa2\10-e2-contabilidad.spec.ts >> E2 — Contabilidad — Reportes >> libro contable diario carga con asientos
- Location: tests\e2e\auditoria\empresa2\10-e2-contabilidad.spec.ts:293:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('main, table, [class*="libro"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('main, table, [class*="libro"]').first()

```

```yaml
- img
- text: Internal Server Error
- button "Copy as Markdown":
  - img
  - text: Copy as Markdown
- heading "Illuminate\\Database\\QueryException" [level=1]
- text: vendor\laravel\framework\src\Illuminate\Database\Connection.php:843
- paragraph: "SQLSTATE[22P02]: Invalid text representation: 7 ERROR: la sintaxis de entrada no es válida para tipo bigint: «diario» CONTEXT: portal sin nombre, parámetro 1 = '...' (Connection: pgsql, Host: 127.0.0.1, Port: 5432, Database: nexora, SQL: select * from \"libros_contables\" where \"id\" = diario limit 1)"
- text: LARAVEL 13.16.1 PHP 8.4.12
- img
- text: UNHANDLED CODE 22P02
- img
- text: "500"
- img
- text: GET http://127.0.0.1:8000/contabilidad/libros/diario
- button:
  - img
- img
- heading "Exception trace" [level=3]
- link "1 previous exception":
  - /url: "#previous-exceptions"
- img
- text: 58 vendor frames
- button:
  - img
- code: Illuminate\Foundation\Application->handleRequest(object(Illuminate\Http\Request))
- text: public\index.php:20
- button:
  - img
- code: 15 16// Bootstrap Laravel and handle the request... 17/** @var Application $app */ 18$app = require_once __DIR__.'/../bootstrap/app.php'; 19 20$app->handleRequest(Request::capture()); 21
- img
- text: 1 vendor frame
- button:
  - img
- img
- heading "Previous exception" [level=3]
- heading "PDOException" [level=4]
- paragraph: "SQLSTATE[22P02]: Invalid text representation: 7 ERROR: la sintaxis de entrada no es válida para tipo bigint: «diario» CONTEXT: portal sin nombre, parámetro 1 = '...'"
- button:
  - img
- img
- heading "Queries" [level=3]
- text: 1-1 of 1
- img
- text: pgsql
- code: select * from "users" where "id" = 14 limit 1
- text: 102.69ms
- heading "Headers" [level=2]
- text: host 127.0.0.1:8000 connection keep-alive sec-ch-ua "HeadlessChrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24" sec-ch-ua-mobile ?0 sec-ch-ua-platform "Windows" upgrade-insecure-requests 1 user-agent Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.7827.55 Safari/537.36 accept-language es-CO accept text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7 sec-fetch-site none sec-fetch-mode navigate sec-fetch-user ?1 sec-fetch-dest document accept-encoding gzip, deflate, br, zstd cookie XSRF-TOKEN=eyJpdiI6IlU0dUszTGUrbS9VWDlVQjJCU2lTTHc9PSIsInZhbHVlIjoiVmtHZ294MVc2T0RZSlNQSTVkS1pHblVqekpZTGhjUUxaeUJkN2lPbXlrOXhjak1uOS9Qdm9MRnZUalZzd0dYVUdTNWdKNjVsdzlWZmx0S1R4cHZRNFpDUVFMWitBTFltYkJ2M1NTNGJ6Y0k5b2ZZUHl1Y2liQVQrUVZRaElyTjciLCJtYWMiOiJjZmViOTdlNmYxNzM5M2RlNTE3NGQ2MzA0ZGE1MzVjOTJkOWY1MjE0Zjg3ZmVjYmZiMGI4Yzc5NzQ1ZDhmYWFjIiwidGFnIjoiIn0%3D; nexora-session=eyJpdiI6IkZRd2NrRG9BWXdGMjljYTRkNS9lS1E9PSIsInZhbHVlIjoiWlhjZUJ1bGtIUFh5QjQ3L1hXT0ZYWFpmelM5VFFnMUNwUnBjMUYwK3NJY0xXZ1VjME1rV01aNzRWUi9UcW9oNXNQbklLWmVxd3Q2Z20vZzlIM1ZmRmFTR2V6Z0x1M0xPTEVDdER1TXIxWXFSV0ZlUStGSmNBVkM2UDhDdFdQUWwiLCJtYWMiOiI1ZGJjODIyOWQ3MTgwOTY4ZmIxYWUxN2VhYzNlNjkwNjc1MTQ3YjZmODdmZDIxMGZlMTcwMzkwYjk0MDBmNTZkIiwidGFnIjoiIn0%3D
- heading "Body" [level=2]
- text: // No request body
- heading "Routing" [level=2]
- text: controller App\Modules\Accounting\Controllers\LibroController@show route name accounting.libros.show middleware web, auth, tenant, module:accounting, permission:accounting:view
- heading "Routing parameters" [level=2]
- code: "{ \"libro\": \"diario\" }"
- img
- img
```

# Test source

```ts
  198 |     if (await submitBtn.isVisible()) {
  199 |       await submitBtn.click();
  200 |       await page.waitForLoadState('networkidle');
  201 |       await ss(page, 'e2-cont-08-asiento-creado');
  202 |     }
  203 |   });
  204 | });
  205 | 
  206 | // ══════════════════════════════════════════════════════════════════════════════
  207 | // PERÍODOS CONTABLES
  208 | // ══════════════════════════════════════════════════════════════════════════════
  209 | 
  210 | e2.describe('E2 — Contabilidad — Períodos', () => {
  211 | 
  212 |   e2('listar períodos contables @smoke', async ({ page }) => {
  213 |     await page.goto(`${BASE}/contabilidad/periodos`);
  214 |     await page.waitForLoadState('networkidle');
  215 |     await expect(page).not.toHaveURL(/login/);
  216 |     const contenido = page.locator('table, main, [class*="empty"]').first();
  217 |     await expect(contenido).toBeVisible({ timeout: 10_000 });
  218 |     await ss(page, 'e2-cont-09-periodos-contables');
  219 |   });
  220 | 
  221 |   e2('crear período contable', async ({ page }) => {
  222 |     await page.goto(`${BASE}/contabilidad/periodos`);
  223 |     await page.waitForLoadState('networkidle');
  224 | 
  225 |     const btnNuevo = page.locator('button, a').filter({ hasText: /nuevo|crear/i }).first();
  226 |     if (await btnNuevo.isVisible({ timeout: 5_000 }).catch(() => false)) {
  227 |       await btnNuevo.click();
  228 |       await page.waitForTimeout(600);
  229 | 
  230 |       const now = new Date();
  231 |       const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  232 |       const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  233 | 
  234 |       const fechaIniInput = page.locator('input[name="fecha_inicio"]').first();
  235 |       if (await fechaIniInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
  236 |         await fechaIniInput.fill(primerDiaMes);
  237 |       }
  238 | 
  239 |       const fechaFinInput = page.locator('input[name="fecha_fin"]').first();
  240 |       if (await fechaFinInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  241 |         await fechaFinInput.fill(ultimoDiaMes);
  242 |       }
  243 | 
  244 |       const nombreInput = page.locator('input[name="nombre"]').first();
  245 |       if (await nombreInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
  246 |         await nombreInput.fill(`Período Auditoría ${TS}`);
  247 |       }
  248 | 
  249 |       const submitBtn = page.locator('button[type="submit"]').first();
  250 |       if (await submitBtn.isVisible()) {
  251 |         await submitBtn.click();
  252 |         await page.waitForLoadState('networkidle');
  253 |         await ss(page, 'e2-cont-10-periodo-creado');
  254 |       }
  255 |     }
  256 |   });
  257 | });
  258 | 
  259 | // ══════════════════════════════════════════════════════════════════════════════
  260 | // REPORTES CONTABLES
  261 | // ══════════════════════════════════════════════════════════════════════════════
  262 | 
  263 | e2.describe('E2 — Contabilidad — Reportes', () => {
  264 | 
  265 |   const reportes = [
  266 |     { nombre: 'Libro Diario',        url: `${BASE}/contabilidad/reportes?tipo=diario` },
  267 |     { nombre: 'Libro Mayor',         url: `${BASE}/contabilidad/reportes?tipo=mayor` },
  268 |     { nombre: 'Balance de Prueba',   url: `${BASE}/contabilidad/reportes?tipo=balance` },
  269 |     { nombre: 'P&G',                 url: `${BASE}/contabilidad/reportes?tipo=pyg` },
  270 |     { nombre: 'Balance General',     url: `${BASE}/contabilidad/reportes?tipo=balance_general` },
  271 |   ];
  272 | 
  273 |   e2('página de reportes contables carga @smoke', async ({ page }) => {
  274 |     await page.goto(`${BASE}/contabilidad/reportes`);
  275 |     await page.waitForLoadState('networkidle');
  276 |     await expect(page).not.toHaveURL(/login/);
  277 |     const contenido = page.locator('main, [class*="reporte"], form').first();
  278 |     await expect(contenido).toBeVisible({ timeout: 10_000 });
  279 |     await ss(page, 'e2-cont-11-reportes-index');
  280 |   });
  281 | 
  282 |   for (const reporte of reportes) {
  283 |     e2(`reporte "${reporte.nombre}" es accesible`, async ({ page }) => {
  284 |       await page.goto(reporte.url);
  285 |       await page.waitForLoadState('networkidle');
  286 |       await expect(page).not.toHaveURL(/login/);
  287 |       const contenido = page.locator('main, table, [class*="reporte"]').first();
  288 |       await expect(contenido).toBeVisible({ timeout: 10_000 });
  289 |       await ss(page, `e2-cont-reporte-${reporte.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
  290 |     });
  291 |   }
  292 | 
  293 |   e2('libro contable diario carga con asientos', async ({ page }) => {
  294 |     await page.goto(`${BASE}/contabilidad/libros/diario`);
  295 |     await page.waitForLoadState('networkidle');
  296 |     await expect(page).not.toHaveURL(/login/);
  297 |     const contenido = page.locator('main, table, [class*="libro"]').first();
> 298 |     await expect(contenido).toBeVisible({ timeout: 10_000 });
      |                             ^ Error: expect(locator).toBeVisible() failed
  299 |     await ss(page, 'e2-cont-12-libro-diario');
  300 |   });
  301 | });
  302 | 
```