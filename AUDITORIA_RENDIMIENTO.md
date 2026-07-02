# AUDITORÍA COMPLETA DE RENDIMIENTO — NEXORA PLATFORM

**Fecha:** 2026-07-01
**Alcance:** Arquitectura, Laravel, PHP, PostgreSQL, Redis, Frontend, Colas, Caché, Seguridad
**Metodología:** Análisis estático de código + configuración + dependencias + patrones de acceso a datos

---

## RESUMEN EJECUTIVO

| Métrica | Valor |
|---------|-------|
| Áreas auditadas | 12 |
| Problemas encontrados | 47 |
| Críticos (P0) | 6 |
| Altos (P1) | 14 |
| Medios (P2) | 16 |
| Bajos (P3) | 11 |
| Beneficio esperado | 40-70% reducción tiempo de respuesta |

---

## HALLAZGOS CRÍTICOS (P0) — Riesgo alto, impacto inmediato

### P0-1: Cero Jobs/Colas implementadas — Todo ejecuta síncrono en HTTP

**Archivo:** No existe `app/Jobs/` — cero archivos
**Impacto:** Operaciones pesadas bloquean el request HTTP completo
**Riesgo:** Timeouts del servidor, request cancellation del cliente, pérdida de datos

Operaciones que deben ser async:
- **DIAN Electrónica** (`DianService.php:97-118`): `sleep()` de 5s entre reintentos. Worst case: 3×30s timeout + 2×5s sleep = **100 segundos bloqueando**
- **Notificaciones** (`NotificacionService.php:124-198`): Email/WhatsApp/Telegram síncronos con timeouts de 20s
- **Nómina** (`NominaService.php:363-431`): Liquidación de 100 empleados = 500-1000 queries en una transacción
- **Cierre Anual** (`CierreAnualService.php:23-61`): 3 GROUP BY pesados sobre todo el año contable
- **POS** (`FacturaService.php:260-348`): Venta incluye emisión DIAN síncrona
- **Multimedia** (`MultimediaService.php:49`): Upload de hasta 50MB síncrono
- **ffprobe** (`MultimediaService.php:89`): `shell_exec()` sin timeout

**Beneficio esperado:** Requests de POS de 15-100s → <200ms. Nómina de 10min → background processing.

---

### P0-2: Caché, Sesión y Colas todos en PostgreSQL — Contención extrema

**Archivos:** `config/cache.php`, `config/session.php`, `config/queue.php`
**Actual:** Todos usan driver `database` (PostgreSQL)
**Impacto:** Cada request ejecuta: 1 session SELECT/UPDATE + N cache SELECT + potencial job polling
**Riesgo:** Tablas `cache`, `sessions`, `jobs` se convierten en puntos de contención bajo carga

**Beneficio esperado:** Con Redis: cache/sesión/sub-5ms vs 5-50ms en PostgreSQL.

---

### P0-3: Bug en config/queue.php — batch y failed jobs apuntan a SQLite

**Archivo:** `config/queue.php` líneas 106, 125
```php
'database' => env('DB_CONNECTION', 'sqlite'),  // BUG: debería ser pgsql
```
**Impacto:** Job batches y failed jobs se pierden si se usa SQLite en lugar de PostgreSQL
**Riesgo:** Pérdida silenciosa de jobs fallidos y batches

---

### P0-4: HandleInertiaRequests ejecuta 5-9 queries por request sin caché

**Archivo:** `app/Http/Middleware/HandleInertiaRequests.php`
**Queries por request:**
1. `TenantModule::where(...)->get()` — activos del tenant (línea 30)
2. `getRoleNames()` — Spatie permission query
3. `getAllPermissions()->pluck('name')` — OTRA Spatie query
4. `Auth::guard('cliente')->check()` — query a clientes table
5. `Configuracion::allForTenant()` — config del tenant

**Beneficio esperado:** Con caché Redis: 5-9 queries → 0-1 por request.

---

### P0-5: Zero configuración de servidor de producción

**Archivos ausentes:** Dockerfile, docker-compose.yml, nginx.conf, php-fpm.conf, supervisor.conf, opcache.ini
**Impacto:** No hay deployment reproducible, no hay optimización PHP/OPcache, no hay process manager
**Riesgo:** Configuración inconsistente entre entornos, sin monitoreo

---

### P0-6: SearchController — 4 ILIKE con wildcard líder = full table scan

**Archivo:** `app/Core/Controllers/SearchController.php` líneas 44-126
**Impacto:** `%query%` impide uso de índices. Con 10K clientes + 5K productos = 4 full scans secuenciales
**Beneficio esperado:** Con GIN + tsvector: O(log n) vs O(n×4)

---

## HALLAZGOS ALTOS (P1) — Importantes, optimizar pronto

### P1-1: IdentifyTenant sin caché — query por cada request

**Archivo:** `app/Core/Http/Middleware/IdentifyTenant.php` línea 27
`Tenant::where('slug', $subdomain)->first()` ejecuta en cada request sin caché.
Los datos de tenant cambian extremadamente raramente.
**Beneficio:** Cache de 5 min elimina esta query.

---

### P1-2: ModuleRegistry lee N archivos module.json del disco por request

**Archivo:** `app/Core/Services/ModuleRegistry.php` línea 79
`getManifest()` lee `module.json` vía `File::get()` en un loop por cada módulo activo.
El `$manifestCache` es por-request, no cross-request.
**Beneficio:** Cache en Redis de manifestos elimina lecturas de disco.

---

### P1-3: Doble wrapping de middleware en módulos

**Archivo:** `app/Core/Providers/CoreServiceProvider.php` líneas 53-55
`loadModuleRoutes()` agrega `web` + `auth` a rutas que ya lo incluyen internamente.
**Impacto:** El stack de middleware web se ejecuta dos veces por request de módulo.

---

### P1-4: 29 modelos sin BelongsToTenant — riesgo de fuga de datos cross-tenant

**Módulos afectados:** HR (11 modelos), Payroll (7 modelos), y otros 11 dispersos
**Riesgo:** Un solo controller que olvide `->where('tenant_id', ...)` expone datos de otros tenants.

---

### P1-5: MovimientoCaja::getReciboIdAttribute — N+1 en serialización

**Archivo:** `app/Modules/Cash/Models/MovimientoCaja.php`
Dispara `ReciboCaja::where()->first()` por cada propiedad accedida. Serializar 20 movimientos = 20 queries extra.

---

### P1-6: ContabilidadNominaService — loops anidados con queries internas

**Archivo:** `app/Modules/Accounting/Services/ContabilidadNominaService.php`
Con 50 empleados × 10 líneas de detalle = 500+ queries redundantes de búsqueda de cuentas.

---

### P1-7: OrdenReparacion boot — find() en cada save

**Archivo:** `app/Modules/ServiceDesk/Models/OrdenReparacion.php`
El evento `saving` ejecuta `Prestador::find()` en cada save, incluso cuando `prestador_id` no cambia.

---

### P1-8: Dashboard carga ~30+ queries sin caché parcial

**Archivo:** `app/Core/Http/Controllers/Core/DashboardController.php`
`getPendingTasks()` y `getPersonalTasks()` NO usan caché, aunque el resto sí.

---

### P1-9: PosController carga TODO sin paginación

**Archivo:** `app/Modules/Sales/Controllers/PosController.php` líneas 27-39
`Producto::where(...)->get()` y `Cliente::where(...)->get()` sin límite.

---

### P1-10: after_commit: false en queue config — riesgo de integridad

**Archivo:** `config/queue.php` línea 44
Jobs se procesan antes del commit de la transacción. Para operaciones financieras esto puede causar inconsistencias.

---

### P1-11: usleep() en generación de números únicos — bloquea HTTP

**Archivos:** `FacturaService.php:409`, `OrdenService.php:160`
Hasta 500ms bloqueando para generar números únicos.

---

### P1-12: XmlSigner lee certificado PFX dos veces del disco

**Archivo:** `app/Modules/Sales/Services/ElectronicBilling/XmlSigner.php` líneas 111, 123
`openssl_pkcs12_read(file_get_contents(...))` ejecuta dos veces por emisión.

---

### P1-13: 3 módulos sin Service Provider registrado

**Módulos:** HR, Payroll, Notifications — no tienen provider en `bootstrap/providers.php`
Aunque cargan rutas vía glob, no pueden registrar bindings.

---

### P1-14: config/permission.php — events_enabled: false

**Archivo:** `config/permission.php` línea 203
Los cambios de permisos no invalidan caché inmediatamente, esperan 24h de TTL.

---

## HALLAZGOS MEDIOS (P2) — Optimizaciones significativas

| # | Hallazgo | Archivo | Beneficio |
|---|----------|---------|-----------|
| P2-1 | laravel/tinker en require (debería ser require-dev) | composer.json | Reducir producción deps |
| P2-2 | lodash y openai sin imports en frontend | package.json | ~270KB menos en node_modules |
| P2-3 | Doble stack de charting (Chart.js CDN + recharts npm) | Dashboard.tsx | ~400KB menos |
| P2-4 | App chunk principal 367KB sin manualChunks | vite.config.js | Mejor caching del browser |
| P2-5 | Dashboard chunk 336KB | Dashboard.tsx | Splitting por componente |
| P2-6 | 160+ iconos Lucide en chunks individuales | Lucide imports | Consolidar en vendor chunk |
| P2-7 | SSR usa createRoot en vez de hydrateRoot | ssr.jsx | Fix hydration mismatch |
| P2-8 | 5 fuentes Geist, solo 2 necesarias (latin/latin-ext) | Geist fonts | ~45KB menos |
| P2-9 | 100+ inline style objects en Dashboard | Dashboard.tsx | Mejor reconciliación React |
| P2-10 | Zero React.lazy() en 142 pages | resources/js/ | Code splitting por componente |
| P2-11 | CajaService::reporteConsolidado — N+1 en map() | CajaService.php | Eager loading |
| P2-12 | PeriodoContableController — subquery correlacionada | PeriodoContableController.php | Reescribir como JOIN |
| P2-13 | Configuracion::setMany — N updateOrCreate en loop | Configuracion.php | Batch update |
| P2-14 | OrdenController::formData() — 8 queries sin caché | OrdenController.php | Cache form data |
| P2-15 | shell_exec("ffprobe") sin timeout | MultimediaService.php | Agregar timeout |
| P2-16 | CDN loads en Dashboard (Tabler Icons, Chart.js) | Dashboard.tsx | Migrar a npm |

---

## HALLAZGOS BAJOS (P3) — Mejoras menores

| # | Hallazgo | Beneficio |
|---|----------|-----------|
| P3-1 | app()->has() two-step pattern (8 archivos) | Usar helper tenant() |
| P3-2 | Auditable trait escribe en cada mutación | Costo adicional por write |
| P3-3 | Doble middleware wrapping en rutas de módulos | Eliminar duplicación |
| P3-4 | CLIENTE guard check innecesario en HandleInertiaRequests | Conditional check |
| P3-5 | SESSION_DRIVER=file en .env vs database en .env.example | Reconciliar config |
| P3-6 | APP_DEBUG=true en .env | Configurar por entorno |
| P3-7 | Sin OPcache preload para módulos pesados | Cold-start reduction |
| P3-8 | Sin scheduled session cleanup para DB sessions | Limpieza periódica |
| P3-9 | LOG_CHANNEL single (crece indefinidamente) | Usar daily |
| P3-10 | Sin build.target en vite.config.js | Definir browser targets |
| P3-11 | Sin cssCodeSplit en Vite | Mejor CSS loading |

---

## PATRONES POSITIVOS (Mantener)

| Patrón | Dónde | Por qué es bueno |
|--------|-------|-------------------|
| DashboardDataService usa DB::table() raw | DashboardDataService.php | Evita overhead de hidratación Eloquent |
| Cache::remember en stats del dashboard | DashboardDataService.php | TTL de 5 min evita queries repetidas |
| Configuracion usa Cache::rememberForever | Configuracion.php | Invalidation en boot events |
| ModuleActivator invalidación precisa | ModuleActivator.php | Solo olvida cache cuando cambia estado |
| BelongsToTenant trait | 29 modelos | Aislamiento cross-tenant |
| manual paginación en controllers | 29 controllers | paginate(10-20) |
| Eager loading profundo en show/edit | Controllers CRUD | Hasta 4 niveles |
| lockForUpdate en stock | FacturaService.php | Previene race conditions |
| dedupe en vite.config.js | vite.config.js | Previene React duplicado |
| Self-hosted fonts | @fontsource-variable/geist | Evita Google Fonts RTT |
| import.meta.glob sin eager | app.jsx | Code splitting automático |
| 57 useMemo/useCallback | Hooks | Memoización adecuada |
| Empty states + skeletons | Components/ui/ | UX de carga |

---

## MATRIZ DE IMPACTO

| Categoría | Antes (estimado) | Después (objetivo) | Reducción |
|-----------|------------------|-------------------|-----------|
| Queries por request (middleware) | 5-9 | 0-1 | ~90% |
| Queries por request (dashboard) | 30+ | 5-8 | ~75% |
| Tiempo POST venta (POS) | 15-100s | <200ms | ~99% |
| Tiempo liquidación nómina (100 emp) | ~10min | Background async | N/A |
| Tiempo búsqueda global | O(n×4) full scan | O(log n) GIN index | ~95% |
| Tamaño JS bundle inicial | ~367KB app + ~336KB dashboard | ~120KB + split chunks | ~65% |
| RAM por worker (OPcache) | Sin OPcache configurado | 256MB OPcache | ~40% cold start |
| Tiempo de caché lookup | 5-50ms (PostgreSQL) | <1ms (Redis) | ~98% |

---

## PLAN DE IMPLEMENTACIÓN

### Fase 1: Infraestructura (Redis + Docker + Nginx)
1. Crear docker-compose.yml con Redis, Nginx, PHP-FPM
2. Configurar Redis para cache, sesiones, colas, permisos
3. Configurar Nginx con HTTP/2, gzip, brotli, cache headers
4. Configurar OPcache para producción

### Fase 2: Laravel Core
5. Configurar `php artisan config:cache`, `route:cache`, `event:cache`, `view:cache`
6. Migrar cache/sesión/colas a Redis
7. Optimizar HandleInertiaRequests con caché
8. Optimizar IdentifyTenant con caché
9. Fix config/queue.php bugs

### Fase 3: Jobs y Async
10. Crear jobs para DIAN, Notificaciones, Nómina, Cierre Anual, Multimedia
11. Configurar Supervisor para workers
12. Configurar Horizon

### Fase 4: Base de datos
13. Crear índices faltantes (composite, GIN para búsqueda)
14. Eliminar índices redundantes (unique global innecesarios)
15. Resolver N+1 queries (MovimientoCaja, ContabilidadNomina, etc.)
16. Agregar eager loading donde falta

### Fase 5: Frontend
17. Configurar manualChunks en vite.config.js
18. Eliminar dependencias muertas (lodash, openai)
19. Consolidar charting (Chart.js O recharts)
20. Implementar React.lazy() para componentes pesados
21. Migrar CDN loads a npm packages
22. Fix SSR hydration

### Fase 6: Monitoreo y Benchmark
23. Implementar middleware de timing
24. Configurar Horizon dashboard
25. Generar reporte antes/después

---

*Informe generado por auditoría automatizada del código fuente Nexora.*
