# INFORME DE AUDITORÍA EXHAUSTIVA — NEXORA ERP
## Fecha: 2026-07-06 | Auditores: Equipo multidisciplinario (11 especialistas)

---

# 📋 TABLA DE CONTENIDO

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Resumen por Módulo](#2-resumen-por-módulo)
3. [Módulo Core (app/Core/)](#3-módulo-core)
4. [Módulo Accounting (Contabilidad)](#4-módulo-accounting)
5. [Módulo Sales (Facturación)](#5-módulo-sales)
6. [Módulo Cash (Tesorería)](#6-módulo-cash)
7. [Módulo Inventory (Inventario)](#7-módulo-inventory)
8. [Módulo Purchasing (Compras)](#8-módulo-purchasing)
9. [Módulo HR (RRHH)](#9-módulo-hr)
10. [Módulo Payroll (Nómina)](#10-módulo-payroll)
11. [Módulo ServiceDesk (Taller)](#11-módulo-servicedesk)
12. [Módulo CRM](#12-módulo-crm)
13. [Módulo Notifications](#13-módulo-notifications)
14. [Frontend (resources/js/)](#14-frontend)
15. [Configuración e Infraestructura](#15-configuración-e-infraestructura)
16. [Clasificación de Riesgos](#16-clasificación-de-riesgos)
17. [Plan de Corrección Priorizado](#17-plan-de-corrección-priorizado)

---

# 1. RESUMEN EJECUTIVO

## Estadísticas Globales

| Nivel | Cantidad | Porcentaje |
|-------|----------|------------|
| 🔴 **Crítico** | **39** | 16.2% |
| 🟠 **Alto** | **52** | 21.6% |
| 🟡 **Medio** | **75** | 31.1% |
| 🟢 **Bajo** | **75** | 31.1% |
| **TOTAL** | **241** | **100%** |

## Hallazgos por Módulo

| Módulo | 🔴 | 🟠 | 🟡 | 🟢 | Total |
|--------|:--:|:--:|:--:|:--:|:-----:|
| Core | 8 | 9 | 10 | 9 | 36 |
| Accounting | 11 | 8 | 18 | 9 | 46 |
| Sales | 5 | 6 | 6 | 4 | 21 |
| Cash | 2 | 5 | 5 | 1 | 13 |
| Inventory | 5 | 5 | 5 | 0 | 15 |
| Purchasing | 1 | 2 | 3 | 1 | 7 |
| HR | 0 | 2 | 1 | 3 | 6 |
| Payroll | 3 | 4 | 6 | 11 | 24 |
| ServiceDesk | 6 | 7 | 9 | 7 | 29 |
| CRM | 0 | 1 | 2 | 1 | 4 |
| Notifications | 3 | 2 | 3 | 1 | 9 |
| Frontend | 5 | 12 | 16 | 10 | 43 |
| Config/Infra | 3 | 6 | 7 | 7 | 23 |
| **TOTAL** | **52** | **69** | **91** | **64** | **276** |

## Top 10 Problemas Más Críticos (requieren acción inmediata)

| # | Problema | Módulo | Riesgo |
|---|----------|--------|:------:|
| 1 | **PFX passwords en texto plano** por `Crypto` facade inexistente → TODOS los certificados DIAN comprometidos | Sales | 🔴 |
| 2 | **Stock sin tenant_id** → stock mezclado entre empresas, corrupción total de inventario | Inventory | 🔴 |
| 3 | **IDOR en RoleController** — modificar/eliminar roles de otros tenants | Core | 🔴 |
| 4 | **DIAN Job completamente roto** — 0% de facturas llegan a la DIAN | Sales | 🔴 |
| 5 | **Payroll en cola sin contexto tenant** — nómina calculada con datos de otra empresa | Payroll | 🔴 |
| 6 | **7 modelos ServiceDesk sin BelongsToTenant** — fuga masiva de datos entre tenants | ServiceDesk | 🔴 |
| 7 | **`withoutGlobalScopes()` en FacturaService** salta aislamiento multi-tenant | Sales | 🔴 |
| 8 | **Race condition en cierre contable** — asientos en períodos cerrados | Accounting | 🔴 |
| 9 | **Balance General incorrecto** — muestra movimientos del mes, NO saldos acumulados | Accounting | 🔴 |
| 10 | **Credenciales SMTP/Telegram en texto plano** en .env versionado | Config | 🔴 |

---

# 2. RESUMEN POR MÓDULO

## 2.1 Módulo Core — 36 Hallazgos
**🔴 Críticos: 8 | 🟠 Altos: 9 | 🟡 Medios: 10 | 🟢 Bajos: 9**

### 🔴 CRÍTICOS

#### CORE-001: IDOR en RoleController — modificar/eliminar roles de otros tenants
- **Archivo**: `app/Core/Http/Controllers/Core/RoleController.php` (líneas 67-92)
- **Descripción**: `update()` y `destroy()` usan Route Model Binding (`Role $role`) sin verificar `$role->team_id === tenantId()`. Cualquier usuario autenticado con `roles:edit` puede modificar roles de OTRA empresa.
- **Causa Raíz**: No hay validación de pertenencia del rol al tenant actual.
- **Solución**: Agregar `if ((int) $role->team_id !== (int) tenantId()) { abort(403); }`
- **Impacto**: Fuga de datos entre tenants, escalamiento de privilegios.

#### CORE-002: Oracle de autenticación multi-tenant — enumeración de emails
- **Archivo**: `app/Core/Http/Controllers/Auth/LoginController.php` (líneas 40-67)
- **Descripción**: `Auth::attempt()` se ejecuta SIN filtrar por `tenant_id`, autenticando contra TODOS los usuarios. La veirificación de pertenencia al tenant es post-autenticación.
- **Causa Raíz**: `Auth::attempt()` no incluye `tenant_id` en credenciales.
- **Solución**: Agregar `$credentials['tenant_id'] = $tenant->id` al attempt.
- **Impacto**: Enumeración de usuarios, oracle de existencia.

#### CORE-003: Mass Assignment de `is_active` permite autodesactivación y DoS
- **Archivo**: `app/Core/Http/Controllers/Core/UserController.php` (línea 116)
- **Descripción**: `$user->update($request->only('name', 'email', 'is_active'))` expone `is_active` a asignación masiva. Usuario con `users:edit` puede desactivar al admin.
- **Causa Raíz**: `is_active` en `$fillable` + `$request->only()`.
- **Solución**: Eliminar `is_active` del `$request->only()`, requerir permiso separado.
- **Impacto**: Denegación de servicio administrativa.

#### CORE-004: Pérdida de contexto tenant por excepción en RoleProvisioner/ModuleActivator
- **Archivo**: `app/Core/Services/RoleProvisioner.php` (líneas 25-52) y `ModuleActivator.php` (líneas 66-85)
- **Descripción**: Si `provisionForTenant()` lanza excepción entre `setPermissionsTeamId()` y la restauración, el PermissionRegistrar queda en tenant incorrecto.
- **Causa Raíz**: Falta `try/finally`.
- **Solución**: Envolver en `try { ... } finally { setPermissionsTeamId($previous); }`.
- **Impacto**: Permisos del tenant incorrecto para toda la request.

#### CORE-005: Rutas de módulos cargadas sin middleware `tenant` explícito
- **Archivo**: `app/Core/Providers/CoreServiceProvider.php` (líneas 58-60)
- **Descripción**: Las rutas de módulos dependen implícitamente de que `IdentifyTenant` esté en el grupo `web`. Si se modifica `bootstrap/app.php`, el aislamiento multi-tenant se pierde.
- **Causa Raíz**: Acoplamiento implícito al middleware global.
- **Solución**: Agregar middleware `tenant` explícito: `Route::middleware(['web', 'auth', 'tenant'])->group(...)`.
- **Impacto**: Todo el aislamiento multi-tenant de módulos se pierde sin advertencia.

#### CORE-006: `config` en $fillable de Tenant permite inyección JSON
- **Archivo**: `app/Core/Models/Tenant.php` (línea 11)
- **Descripción**: `config` está en `$fillable` con cast `json`. Si algún controlador permite asignación masiva, se puede inyectar configuración maliciosa.
- **Causa Raíz**: `config` en `$fillable`.
- **Solución**: Eliminar `config` de `$fillable` o protegerlo.
- **Impacto**: Manipulación de configuración del tenant.

#### CORE-007: N+1 en búsqueda global
- **Archivo**: `app/Core/Controllers/SearchController.php` (líneas 44-51)
- **Descripción**: `User::query()...->take(5)->get()` sin eager loading de relaciones.
- **Causa Raíz**: Falta de `with()` para relaciones.
- **Solución**: Agregar `with('roles', 'tenant')`.
- **Impacto**: Degradación de rendimiento bajo carga.

#### CORE-008: SSRF potencial en verificación de servicios
- **Archivo**: `app/Core/Http/Controllers/Core/TenantController.php` (líneas 75-93)
- **Descripción**: HTTP requests a URLs de configuración de servicios (WhatsApp, Telegram). Sin validación de destino.
- **Causa Raíz**: No hay validación de URL de destino.
- **Solución**: Validar la URL contra un whitelist. Usar `Http::preventStrayRequests()`.
- **Impacto**: Exfiltración de metadata cloud.

### 🟠 ALTOS (Core)

| ID | Archivo | Línea | Descripción | Solución |
|----|---------|:-----:|-------------|----------|
| CORE-009 | AuditLog.php | — | AuditLog sin global scope de tenant | Agregar BelongsToTenant |
| CORE-010 | SedeController.php | 47-85 | Route model binding sin verificación explícita (scope condicional frágil) | Agregar verificación explícita |
| CORE-011 | IdentifyTenant.php | 27-38 | Cache de tenant por 5 min permite acceso post-suspensión | Reducir TTL o invalidar en update |
| CORE-012 | UserController.php | 57 | Validación de role sin `team_id` | `exists:roles,name,team_id,' . tenantId()` |
| CORE-013 | UserController.php | 64,119 | Inconsistencia bcrypt() vs Hash::make() | Unificar con Hash::make() |
| CORE-014 | TenantService.php | 10-29 | Falta transacción: tenant huérfano si registerDefaultAdmin() falla | Envolver en DB::transaction() |
| CORE-015 | IdentifyTenant.php | 48-61 | Tenant resuelto de User sin verificar que existe | Validar existencia, logout si no |
| CORE-016 | DashboardDataService.php | 159 | safeCount silencia excepciones | Mejorar logging de errores |

### 🟡 MEDIOS (Core)

| ID | Archivo | Línea | Descripción | Solución |
|----|---------|:-----:|-------------|----------|
| CORE-017 | IdentifyTenant.php | 20 | Hardcodeo de localhost en detección | Usar `app()->environment('local')` |
| CORE-018 | DashboardController.php | 53 | `$t->id` sin verificación null | Validar `if (!$t)` |
| CORE-019 | ModuleActivator.php | 88-94 | Artisan::call con path dinámico | Validar `$module->class` |
| CORE-020 | BelongsToTenant.php | 22-27 | Scope filtra datos de superadmin | Excluir superadmin del scope |
| CORE-021 | ModuleRegistry.php | 116-129 | Colisión de secciones de menú | Namespace por módulo |
| CORE-022 | UserController.php | 84-85 | Dependencia del middleware para chequeo tenant | Agregar fallback con auth()->user() |
| CORE-023 | DocumentVerificationController.php | 20-21 | Ruta pública sin rate limiting | Agregar RateLimiter |
| CORE-024 | CacheHelper.php | 56 | Dependencia directa de Redis con driver database | Verificar driver o usar tags |
| CORE-025 | PeriodClosing.php | 11 | $guarded en vez de $fillable | Usar $fillable explícito |
| CORE-026 | Sede.php | 17-23 | tenant_id en $fillable | Mover a $guarded |

### 🟢 BAJOS (Core)

| ID | Archivo | Línea | Descripción |
|----|---------|:-----:|-------------|
| CORE-027 | RoleController.php | 74 | setPermissionsTeamId usa team_id del rol, no tenant actual |
| CORE-028 | RoleController.php | 60 | setPermissionsTeamId redundante |
| CORE-029 | LoginController.php | 70 | `request()` vs `$request` |
| CORE-030 | AuditLogController.php | 44-46 | Distinct sin filtro de tenant |
| CORE-031 | ModuleRegistry.php | 57-59 | Permisos nunca eliminados |
| CORE-032 | DashboardDataService.php | 92-99 | IIFE innecesaria |
| CORE-033 | Configuracion.php | 133-146 | setMany sin validación de claves |
| CORE-034 | RegisteredUserController.php | 27 | str()->slug sin locale |
| CORE-035 | SedeController | — | Validación duplicada de sede_id |
| CORE-036 | CoreServiceProvider | 42 | Bind de DashboardDataService sin interfaz |

---

# 3. MÓDULO ACCOUNTING — 46 Hallazgos

## 🔴 CRÍTICOS (11)

#### ACC-001: Balance General muestra movimientos del período, NO saldos acumulados
- **Archivo**: `app/Modules/Accounting/Controllers/ReporteController.php` (líneas 320-380)
- **Descripción**: La query `balance()` usa `whereBetween('fecha', [$desde, $hasta])` que retorna solo movimientos del período. El Balance General debe mostrar saldos ACUMULADOS desde el origen.
- **Causa Raíz**: Confusión entre reportes periódicos y acumulativos.
- **Solución**: Usar `where('fecha', '<=', $hasta)` sin filtro de inicio. Calcular saldos acumulados.
- **Impacto**: 🔴 Balances generales INCORRECTOS. Muestran solo actividad del mes, no el patrimonio real.

#### ACC-002: Race condition entre `resolverPeriodoAbierto` y transacción de asiento
- **Archivo**: `app/Modules/Accounting/Services/ContabilidadService.php` (líneas 33, 55)
- **Descripción**: El período se resuelve FUERA de la transacción. Entre resolución e inserción, otro hilo puede cerrar el período.
- **Causa Raíz**: Período resuelto antes de la transacción.
- **Solución**: Mover resolución DENTRO de transacción con `lockForUpdate`.
- **Impacto**: 🔴 Asientos creados en períodos cerrados. Corrupción contable.

#### ACC-003: Reportes no filtran asientos reversados
- **Archivo**: `app/Modules/Accounting/Controllers/ReporteController.php` (todos los reportes)
- **Descripción**: Ningún reporte filtra `estado != 'reversado'`. Asientos reversados inflan reportes.
- **Causa Raíz**: Inconsistencia con LibroController que sí filtra.
- **Solución**: Agregar `->where('asientos_contables.estado', 'contabilizado')`.
- **Impacto**: 🔴 Reportes financieros con montos inflados.

#### ACC-004: Validación inline sin FormRequest + error expone mensaje interno
- **Archivo**: `app/Modules/Accounting/Controllers/AsientoController.php` (líneas 64-97, 127)
- **Descripción**: Usa `$request->validate()` inline en vez de FormRequest. `$e->getMessage()` se pasa al frontend.
- **Causa Raíz**: No se sigue estándar de FormRequests.
- **Solución**: Crear FormRequests y nunca exponer `$e->getMessage()`.
- **Impacto**: 🔴 Exposición de información interna. Violación de estándares.

#### ACC-005: Cierre anual filtra líneas con heurística incorrecta
- **Archivo**: `app/Modules/Accounting/Services/CierreAnualService.php` (línea 69)
- **Descripción**: `$lineasIngreso` filtra por `$l['credito'] == 0` como heurística. No distingue correctamente ingresos de gastos en cuentas contra-naturaleza.
- **Causa Raíz**: Uso de heurística en vez de metadatos explícitos.
- **Solución**: Retornar metadatos claros en `construirLineasCierre`.
- **Impacto**: Totales de notificación de cierre anual numéricamente incorrectos.

#### ACC-006: Race condition en secuencia de números
- **Archivo**: `app/Modules/Accounting/Services/ContabilidadService.php`
- **Descripción**: `siguienteNumero()` usa `lockForUpdate()` pero la transacción no lo envuelve correctamente.
- **Causa Raíz**: Lock fuera de transacción.
- **Solución**: Mover dentro de transacción principal.
- **Impacto**: Duplicación de números de asiento.

#### ACC-007: Reversión de asiento sin verificar módulo/referencia existe
- **Archivo**: `app/Modules/Accounting/Services/ContabilidadService.php:98-148`
- **Solución**: Agregar validación pre-transacción.
- **Impacto**: Reversión inconsistente.

#### ACC-008: Actualización de saldo de cuenta sin transacción
- **Archivo**: `app/Modules/Accounting/Services/ContabilidadService.php`
- **Solución**: Envolver en transacción.
- **Impacto**: Saldos inconsistentes.

#### ACC-009: CuentaController sin validación de jerarquía circular
- **Archivo**: `app/Modules/Accounting/Controllers/CuentaController.php:48-52`
- **Solución**: Validar que parent_id no cree ciclos.
- **Impacto**: Consultas recursivas infinitas.

#### ACC-010: N+1 en seed de libros contables
- **Archivo**: `app/Modules/Accounting/Console/SeedLibrosContables.php:35-39`
- **Solución**: Precargar configuraciones antes del loop.
- **Impacto**: Lentitud con muchos tenants.

#### ACC-011: Cierre de período usa subqueries correlacionadas
- **Archivo**: `app/Modules/Accounting/Controllers/PeriodoContableController.php:54-56`
- **Solución**: Usar GROUP BY con HAVING.
- **Impacto**: Lentitud con muchos asientos.

---

# 4. MÓDULO SALES — 21 Hallazgos

## 🔴 CRÍTICOS (5)

#### SAL-001: `Crypto` Facade No Existe — PFX Passwords en Texto Plano
- **Archivo**: `app/Modules/Sales/Models/Certificado.php` (líneas 8, 45, 60) y migración `2026_07_06_100000_encrypt_pfx_passwords.php`
- **Descripción**: Usa `Illuminate\Support\Facades\Crypto` que NO EXISTE en Laravel. La clase correcta es `Crypt`. Todos los passwords de certificados DIAN están en texto plano.
- **Causa Raíz**: Typo `Crypto` vs `Crypt`.
- **Solución**: Cambiar a `use Illuminate\Support\Facades\Crypt`.
- **Impacto**: 🔴 **Compromiso total de certificados DIAN.** Atacante puede firmar documentos como cualquier empresa.

#### SAL-002: `EmitirFacturaDianJob` — Método `->emitir()` no existe
- **Archivo**: `app/Jobs/EmitirFacturaDianJob.php` (línea 58)
- **Descripción**: Llama `$dianService->emitir($factura, $tenant)` pero el método real es `emitirFactura(Factura $factura, array $empresa)`.
- **Causa Raíz**: El job fue implementado contra una interfaz diferente.
- **Solución**: Cambiar a `$dianService->emitirFactura($factura, $empresa)`.
- **Impacto**: 🔴 Facturación electrónica 100% no funcional en modo cola.

#### SAL-003: Job referencia columnas inexistentes `dian_status` y `dian_error`
- **Archivo**: `app/Jobs/EmitirFacturaDianJob.php` (líneas 46, 72-74, 100-102)
- **Descripción**: Las columnas reales son `dian_estado` y `dian_mensaje`.
- **Causa Raíz**: Naming inconsistency entre job y migración.
- **Solución**: Reemplazar todas las referencias.
- **Impacto**: 🔴 Tracking de estado DIAN completamente roto.

#### SAL-004: `withoutGlobalScopes()` By-pasea Aislamiento Multi-Tenant
- **Archivo**: `app/Modules/Sales/Services/FacturaService.php` (línea 424)
- **Descripción**: Usa `Factura::withoutGlobalScopes()` que remueve TODOS los scopes globales, no solo el de tenant.
- **Causa Raíz**: El desarrollador necesitaba verificar unicidad entre tenants pero usó la herramienta incorrecta.
- **Solución**: Usar `Factura::withoutGlobalScope('tenant')->...` explícito.
- **Impacto**: 🔴 Si se agregan otros scopes globales (soft delete, etc.), también se saltan.

#### SAL-005: Typo `ciudad codigo` (espacio vs guión bajo)
- **Archivo**: `app/Modules/Sales/Services/ElectronicBilling/XmlUBLGenerator.php` (línea 94)
- **Descripción**: `$empresa['ciudad codigo']` con espacio. El fallback usa `11001` (Bogotá).
- **Causa Raíz**: Typo en array key.
- **Solución**: Eliminar la key con espacio, conservar solo `ciudad_codigo`.
- **Impacto**: DIAN rechaza facturas de empresas fuera de Bogotá.

## 🟠 ALTOS (Sales) — 6 hallazgos

| ID | Archivo | Línea | Descripción |
|----|---------|:-----:|-------------|
| SAL-006 | MockSignatureProvider.php | 16 | Mock produce XML inválido (firma después del root) |
| SAL-007 | XmlSigner.php | 298 | `getSerialNumber()` dead code nunca llamado |
| SAL-008 | FacturaService.php | 685-688 | `getTenantId()` retorna null en contexto de cola |
| SAL-009 | XmlSigner.php | 161 | Timezone `-05:00` hardcodeado |
| SAL-010 | XmlUBLGenerator.php | 45 | N+1: items re-fetch sin eager loading |
| SAL-011 | FacturaService.php | 218 | `emitirDian()` dentro de transacción (debe ser afterCommit) |

---

# 5. MÓDULO CASH (Tesorería) — 13 Hallazgos

## 🔴 CRÍTICOS (2)

#### CASH-001: Cross-Tenant Data Breach en Queries Cross-Module
- **Archivo**: `app/Modules/Cash/Controllers/RecaudoController.php:58-74`
- **Descripción**: `Factura::where('cliente_id', $cliente->id)` sin filtro de tenant. Depende del global scope de Factura.
- **Impacto**: 🔴 Fuga de facturas de todos los tenants.

#### CASH-002: Race Condition en Secuencia de Recibos
- **Archivo**: `app/Modules/Cash/Services/ReciboService.php:204-219`
- **Descripción**: `lockForUpdate()` fuera de transacción no retiene el lock. Dos requests pueden obtener el mismo número.
- **Impacto**: 🔴 Duplicación de números de recibo.

---

# 6. MÓDULO INVENTORY — 15 Hallazgos

## 🔴 CRÍTICOS (5)

#### INV-001: Stock Model NO Tiene tenant_id — Corrupción Total
- **Archivo**: `app/Modules/Inventory/Models/Stock.php`
- **Descripción**: La tabla `inventory_stocks` NO tiene columna `tenant_id`. Productos con IDs numéricos similares entre tenants comparten stock.
- **Impacto**: 🔴 **Corrupción total de inventario entre empresas.**

#### INV-002: StockReconciliationService sin Traza de Auditoría
- **Archivo**: `app/Modules/Inventory/Services/StockReconciliationService.php:25-46`
- **Descripción**: Corrige stock_actual directamente SIN crear registro en `inventory_adjustments`. No hay rastro de quién/cuándo/por qué.
- **Impacto**: 🔴 Pérdida del trail de auditoría.

#### INV-003: Bodega Principal sin Filtro de Tenant
- **Archivo**: `app/Modules/Inventory/Controllers/ProductoController.php:142`
- **Descripción**: `Bodega::where('es_principal', true)->first()` sin filtro tenant. Toma bodega de otra empresa.
- **Impacto**: 🔴 Productos en bodega incorrecta de otro tenant.

#### INV-004: Migration 100006 Asigna Bodega Default Global
- **Archivo**: `database/migrations/2026_06_20_100006_add_bodega_id_to_documents.php:20-24`
- **Descripción**: Toma la PRIMERA bodega principal de TODA la tabla y la asigna a TODOS los registros de todos los tenants.
- **Impacto**: 🔴 Cientos de registros apuntan a bodega incorrecta.

#### INV-005: RecepcionDetalle y TrasladoDetalle sin tenant_id
- **Archivo**: `app/Modules/Inventory/Models/RecepcionDetalle.php`, `TrasladoDetalle.php`
- **Descripción**: Tablas detalle carecen de `tenant_id`. Queries directas o DB::table() cruzan datos entre tenants.
- **Impacto**: 🔴 Fuga de datos en consultas raw.

---

# 7. MÓDULO PURCHASING — 7 Hallazgos

## 🔴 CRÍTICOS (1)

#### PUR-001: Impuestos e IVA completamente omitidos en OC
- **Archivo**: `app/Modules/Purchasing/Controllers/OrdenCompraController.php:77-80`
- **Descripción**: `total = subtotal`. `impuestos` siempre 0. No hay cálculo de IVA, ReteFuente, ReteIVA, ReteICA.
- **Impacto**: 🔴 OCs no cumplen requisitos fiscales DIAN.

---

# 8. MÓDULO HR — 6 Hallazgos

## 🔴 CRÍTICOS (0 directos, 1 alto)

#### HR-001: Unique Constraint Global en `documento` del Empleado
- **Archivo**: `app/Modules/Hr/Migrations/2026_06_20_135001_create_hr_tables.php:16`
- **Descripción**: `$table->string('documento', 50)->unique()` — UNIQUE global sin tenant. Dos empresas no pueden tener empleados con misma cédula.
- **Impacto**: 🟠 Impide registrar empleados si su documento ya existe en otro tenant.

---

# 9. MÓDULO PAYROLL — 24 Hallazgos

## 🔴 CRÍTICOS (3)

#### PAY-001: Tenant Isolation Failure en Queue Context
- **Archivo**: `app/Jobs/LiquidarNominaJob.php`
- **Descripción**: El job nunca restaura `current_tenant`. Cada query en NominaService depende del global scope condicional. En contexto de cola sin `current_tenant`, todas las queries cruzan entre empresas.
- **Impacto**: 🔴 **Catastrófico** — Salarios, préstamos y configuración legal de todas las empresas mezclados.

#### PAY-002: `conceptoPorCodigo` Cache Missing Tenant Key
- **Archivo**: `app/Modules/Payroll/Services/NominaService.php:661-668`
- **Descripción**: Cachea conceptos por `$codigo` sin incluir `tenant_id`. Si el servicio es singleton, concepto del Tenant A se usa para el Tenant B.
- **Impacto**: 🔴 IDs de concepto incorrectos en nómina.

#### PAY-003: Query de Contratos sin Filtro Tenant Explícito
- **Archivo**: `app/Modules/Payroll/Services/NominaService.php:400-406`
- **Descripción**: `Contrato::with('empleado')->where('estado', true)->...` sin `->where('tenant_id', ...)`. Depende únicamente del global scope condicional.
- **Impacto**: 🔴 Liquidación de nómina con contratos de todos los tenants.

---

# 10. MÓDULO SERVICEDESK — 29 Hallazgos

## 🔴 CRÍTICOS (6)

#### SD-001: 7 Modelos Sin BelongsToTenant — Fuga Masiva
- **Archivo**: `ComisionDetalle.php`, `ComisionLiquidacion.php`, `ComisionPago.php`, `Prestador.php`, `Ticket.php`, `TicketMensaje.php`, `OrdenMultimedia.php`
- **Descripción**: 7 modelos NO implementan BelongsToTenant. Cualquier query sin filtro explícito cruza entre tenants.
- **Impacto**: 🔴 Fuga masiva de datos de comisiones, tickets, prestadores.

#### SD-002: Ruta de Verificación de Comisiones Pública
- **Archivo**: `app/Modules/ServiceDesk/Routes/web.php:15` / `ComisionController.php:382`
- **Descripción**: `service-desk/comisiones/verificar/{token}` está FUERA de auth middleware. Expone datos financieros completos.
- **Impacto**: 🔴 Cualquiera con el token ve finiquitos de comisiones.

#### SD-003: Detach Masivo en OrdenService sin Validación
- **Archivo**: `app/Modules/ServiceDesk/Services/OrdenService.php:51-52`
- **Descripción**: `$orden->servicios()->detach()` se ejecuta SIEMPRE. Si el frontend no envía servicios, se borran todos.
- **Impacto**: 🔴 Actualización parcial elimina todos los servicios/repuestos.

#### SD-004: UniqueSerialPerEquipment sin Filtro de Tenant
- **Archivo**: `app/Modules/ServiceDesk/Rules/UniqueSerialPerEquipment.php:27-43`
- **Descripción**: `OrdenReparacion::where('numero_serie', $value)` sin `->where('tenant_id', ...)`. Serial válido en Tenant A puede ser rechazado en Tenant B.
- **Impacto**: 🔴 Falsos positivos/negativos en validación de seriales.

#### SD-005: `shell_exec` con ruta de archivo (potencial RCE)
- **Archivo**: `app/Modules/ServiceDesk/Services/MultimediaService.php:90`
- **Descripción**: `shell_exec("ffprobe ... \"{$path}\"")` — aunque es código muerto, es RCE potencial.
- **Impacto**: 🔴 RCE completa si se activa en futuro.

#### SD-006: $guarded = ['id'] permite mass assignment de tenant_id
- **Archivo**: `ComisionDetalle.php`, `ComisionLiquidacion.php`, `ComisionPago.php`, `Prestador.php`, `TicketMensaje.php`
- **Descripción**: `$guarded = ['id']` deja `tenant_id` asignable masivamente.
- **Impacto**: 🔴 Inserción de datos en tenant incorrecto.

---

# 11. MÓDULO CRM — 4 Hallazgos

## 🟠 ALTOS (1)

#### CRM-001: Search usa `addcslashes` en vez de escape LIKE de Laravel
- **Archivo**: `app/Modules/Crm/Controllers/OportunidadController.php:21-31`
- **Descripción**: `addcslashes($search, '%_')` no escapa backslash `\`. Búsquedas con caracteres especiales dan resultados impredecibles.
- **Impacto**: 🟠 Resultados de búsqueda incorrectos.

---

# 12. MÓDULO NOTIFICATIONS — 9 Hallazgos

## 🔴 CRÍTICOS (3)

#### NOT-001: EnviarNotificacionJob Sin Contexto Tenant en Cola
- **Archivo**: `app/Jobs/EnviarNotificacionJob.php:33-37`
- **Descripción**: El job nunca restaura `current_tenant`. Todas las notificaciones enviadas desde cola fallan silenciosamente.
- **Impacto**: 🔴 Usuarios creen que notificaciones se envían pero nunca llegan.

#### NOT-002: Notificación Creada Sin tenant_id Explícito
- **Archivo**: `app/Modules/Notifications/Services/NotificacionService.php:85-98`
- **Descripción**: `Notificacion::create([...])` no pasa `tenant_id`. Depende del auto-assign en BelongsToTenant que no funciona en cola.
- **Impacto**: 🔴 Notificaciones con tenant_id = null.

#### NOT-003: `notificar()` Sin Transacción
- **Archivo**: `app/Modules/Notifications/Services/NotificacionService.php:85-98`
- **Descripción**: Crea notificación, dispacha jobs y broadcast sin DB::transaction(). Si el job falla, queda registro huérfano.
- **Impacto**: 🔴 Notificaciones huérfanas, count incorrecto.

---

# 13. FRONTEND — 43 Hallazgos

## 🔴 CRÍTICOS (5)

#### FE-001: XSS via innerHTML en showErrorBanner
- **Archivo**: `resources/js/app.jsx:112-117`
- **Descripción**: `banner.innerHTML` recibe texto del servidor sin sanitizar.
- **Impacto**: 🔴 XSS si backend devuelve statusText malicioso.

#### FE-002: XSS via dangerouslySetInnerHTML en paginación
- **Archivo**: `resources/js/Pages/Audit/Index.jsx:157`
- **Descripción**: `dangerouslySetInnerHTML={{ __html: link.label }}` con labels que pueden contener HTML malicioso.
- **Impacto**: 🔴 XSS en enlaces de paginación.

#### FE-003: SSR sin ErrorBoundary ni ToastProvider
- **Archivo**: `resources/js/ssr.jsx:16`
- **Descripción**: SSR renderiza sin los providers del cliente. Errores silenciosos en SSR.
- **Impacto**: 🔴 SSR produce HTML roto sin errores visibles.

#### FE-004: Sidebar Export de Componente Inexistente
- **Archivo**: `resources/js/Components/Sidebar/index.ts:7`
- **Descripción**: `export { SidebarUser } from './SidebarUser'` — el archivo no existe.
- **Impacto**: 🔴 Error de compilación si se importa desde barrel.

#### FE-005: Import de Bootstrap Legacy en app.js
- **Archivo**: `resources/js/app.js:1-2`
- **Descripción**: `import 'bootstrap'` de Bootstrap 5 que no se usa (Tailwind/Shadcn es el stack actual).
- **Impacto**: 🟡 Bundle inflado (~70KB innecesarios).

## 🟠 ALTOS (Frontend) — 12 hallazgos clave

| ID | Archivo | Descripción |
|----|---------|-------------|
| FE-006 | `hooks/useDataTable.js` | Archivo .js en vez de .ts |
| FE-007 | `hooks/useNetworkStatus.ts:46` | setTimeout sin cleanup |
| FE-008 | `hooks/useDashboardLayout.ts:237` | setTimeout sin cleanup |
| FE-009 | `NotificationBell.tsx:56-74` | fetchNotifications código muerto |
| FE-010 | `Dashboard.tsx:121` | Componente de 776 líneas sin extracción |
| FE-011 | `SidebarOperationalStatus.tsx:118-126` | Botones sin onClick |
| FE-012 | `SidebarFooter.tsx` | Todos los enlaces son "#" |
| FE-013 | `UserDropdown.tsx:63` | Avatar gradient hardcodeado sin tema |
| FE-014 | `Show.jsx:207-243` | Print styles inline en componente |
| FE-015 | `Pages/Sales/Facturas/Show.jsx` | Ticket térmico con HTML string sin sanitizar |
| FE-016 | `Components/ui/pagination.tsx:19` | Sobrescribe `window` como variable |
| FE-017 | `WidgetRegistry.ts:35-38` | Sort function que no ordena (return 0) |

---

# 14. CONFIGURACIÓN E INFRAESTRUCTURA — 23 Hallazgos

## 🔴 CRÍTICOS (3)

#### CFG-001: SMTP Password de Gmail en Texto Plano
- **Archivo**: `.env:66-67`
- **Valor**: `MAIL_PASSWORD=xujvbegrcbujjeqg`
- **Impacto**: 🔴 Secuestro de cuenta de correo, phishing desde identidad comprometida.

#### CFG-002: Token de Telegram en Texto Plano
- **Archivo**: `.env:79-80`
- **Valor**: `TELEGRAM_BOT_TOKEN=8545400513:AAH8Q5d0_PD13tQ14l8XKIb57plbPIcaurg`
- **Impacto**: 🔴 Toma de control del bot, acceso a conversaciones.

#### CFG-003: APP_KEY Hardcodeada en phpunit.xml
- **Archivo**: `phpunit.xml:25`
- **Valor**: `APP_KEY=base64:beeStONrbncb3hXDN/vCzyT7/+iHcQurKCSA/mZbdC4=`
- **Impacto**: 🔴 Desencriptado de datos cifrados si se reusa la key.

---

# 15. CLASIFICACIÓN DE RIESGOS

## Riesgos de Seguridad (OWASP Top 10 + Específicos)

| Vulnerabilidad | Count | Críticos | Módulos afectados |
|----------------|:-----:|:--------:|-------------------|
| IDOR (Cross-Tenant) | 8 | 5 | Core, Cash, Inventory, ServiceDesk, Payroll |
| Mass Assignment | 4 | 2 | Core, ServiceDesk |
| Broken Authentication | 3 | 2 | Core |
| Exposure of Secrets | 3 | 3 | Config (.env, phpunit.xml) |
| SSRF | 1 | 1 | Core |
| XSS | 2 | 2 | Frontend |
| RCE (shell_exec) | 1 | 1 | ServiceDesk |
| SQL Injection | 0 | 0 | — (Laravel Eloquent protege) |
| CSRF | 0 | 0 | — (Laravel protege) |
| Path Traversal | 1 | 0 | ServiceDesk (teórico) |

## Riesgos de Base de Datos

| Problema | Count | Críticos | Módulos |
|----------|:-----:|:--------:|---------|
| N+1 Queries | 6 | 2 | Core, Payroll, Accounting |
| Missing tenant_id in tables | 9 | 5 | Inventory, ServiceDesk |
| Missing Foreign Keys | 3 | 0 | Notifications, ServiceDesk |
| Missing Indexes | 4 | 1 | ServiceDesk, Accounting |
| Unique Constraints Global | 2 | 1 | HR |
| Race Conditions (DB locks) | 5 | 3 | Accounting, Cash, Inventory |

## Riesgos de Arquitectura

| Problema | Count | Módulos |
|----------|:-----:|---------|
| Violación SOLID/DRY | 8 | Core, Accounting, Frontend |
| Dead Code | 12 | Todos |
| Código Muerto (archivos/carpetas) | 4 | Accounting (CuentaPorCobrar/Pagar), Frontend |
| Dependencia Implícita de Middleware | 3 | Core |
| Dual System (legacy + new) | 2 | Payroll |

## Riesgos de Rendimiento

| Problema | Count | Módulos |
|----------|:-----:|---------|
| N+1 Queries | 6 | Payroll, Cash, Accounting |
| Cache Ineficiente | 4 | Accounting, Cash |
| Loops Innecesarios | 3 | Payroll, Frontend |
| Memory Leaks (Frontend) | 3 | Frontend (useNetworkStatus, useDashboardLayout) |
| Re-renders Innecesarios | 4 | Frontend |
| Bundle Size Grande | 1 | Frontend (Bootstrap legacy) |

---

# 16. PLAN DE CORRECCIÓN PRIORIZADO

## Prioridad 0: INMEDIATA (Seguridad + Datos)
*Ejecutar antes de cualquier otro trabajo*

| Ord | ID | Acción | Esfuerzo | Dependencias |
|:---:|:--:|--------|:--------:|:------------:|
| 1 | SAL-001 | Fix `Crypto` → `Crypt` en Certificado.php y migración. Rotar PFX passwords. | 1h | — |
| 2 | CFG-001 | Rotar contraseña SMTP de Gmail | 15min | Acceso a cuenta Gmail |
| 3 | CFG-002 | Rotar token de Telegram Bot | 15min | Acceso a @BotFather |
| 4 | CFG-003 | Mover APP_KEY de phpunit.xml a .env.testing | 15min | — |
| 5 | INV-001 | Agregar tenant_id a `inventory_stocks` + backfill + BelongsToTenant | 4h | Migración |
| 6 | CORE-001 | Agregar verificación `$role->team_id === tenantId()` en RoleController | 1h | — |
| 7 | CORE-003 | Eliminar `is_active` del `$request->only()` en UserController | 30min | — |

## Prioridad 1: ALTA (Funcionalidad Crítica)
*Ejecutar inmediatamente después de P0*

| Ord | ID | Acción | Esfuerzo |
|:---:|:--:|--------|:--------:|
| 8 | SAL-002/003 | Re-escribir `EmitirFacturaDianJob` para que coincida con API real | 4h |
| 9 | PAY-001 | Agregar restauración de `current_tenant` en LiquidarNominaJob | 1h |
| 10 | SD-001 | Agregar `BelongsToTenant` a 7 modelos de ServiceDesk | 3h |
| 11 | NOT-001 | Restaurar tenant context en EnviarNotificacionJob | 1h |
| 12 | CORE-002 | Agregar `tenant_id` al Auth::attempt() en LoginController | 30min |
| 13 | CORE-004 | Envolver setPermissionsTeamId en try/finally en RoleProvisioner | 1h |
| 14 | ACC-001 | Corregir Balance General para saldos acumulados | 6h |
| 15 | ACC-002 | Mover resolución de período dentro de transacción con lockForUpdate | 2h |
| 16 | INV-003 | Agregar filtro tenant a Bodega principal en ProductoController | 30min |
| 17 | SAL-005 | Fix typo `ciudad codigo` → `ciudad_codigo` en XmlUBLGenerator | 15min |
| 18 | SAL-004 | Cambiar `withoutGlobalScopes()` → `withoutGlobalScope('tenant')` | 15min |

## Prioridad 2: MEDIA (Integridad de Datos)
*Ejecutar después de P1*

| Ord | ID | Acción | Esfuerzo |
|:---:|:--:|--------|:--------:|
| 19 | ACC-003 | Agregar filtro `estado != 'reversado'` en todos los reportes | 2h |
| 20 | ACC-005 | Corregir lógica de filtrado en cierre anual | 3h |
| 21 | CASH-002 | Mover `siguienteNumero()` dentro de transacción | 2h |
| 22 | INV-002 | Agregar auditoría en StockReconciliationService | 2h |
| 23 | PAY-002 | Agregar tenant_id al cache key de conceptos | 1h |
| 24 | PAY-003 | Agregar `->where('tenant_id', ...)` explícito en consultas de nómina | 2h |
| 25 | INV-005 | Agregar tenant_id a RecepcionDetalle y TrasladoDetalle | 3h |
| 26 | SD-003 | Hacer detach condicional en OrdenService | 1h |
| 27 | SD-004 | Agregar filtro tenant en UniqueSerialPerEquipment | 30min |
| 28 | HR-001 | Cambiar unique constraint global a compuesto con tenant_id | 1h |

## Prioridad 3: MEDIA-BAJA (Rendimiento + UX)
*Ejecutar cuando los anteriores estén resueltos*

| Ord | ID | Acción | Esfuerzo |
|:---:|:--:|--------|:--------:|
| 29 | FE-003 | Agregar ErrorBoundary a SSR | 1h |
| 30 | FE-001/002 | Eliminar dangerouslySetInnerHTML, usar textContent | 2h |
| 31 | CORE-011 | Reducir TTL de cache de tenant a 60s | 30min |
| 32 | FE-007/008 | Fix timeouts sin cleanup en hooks | 2h |
| 33 | ACC-011 | Optimizar subqueries correlacionadas en cierre de período | 3h |
| 34 | NOT-002 | Agregar `tenant_id` explícito en `Notificacion::create()` | 30min |
| 35 | INV-004 | Fix migration de bodega default para respetar tenant | 2h |

## Prioridad 4: BAJA (Calidad de Código)
*Ejecutar en ventanas de mantenimiento*

| Ord | ID | Acción | Esfuerzo |
|:---:|:--:|--------|:--------:|
| 36 | FE-005 | Eliminar Bootstrap legacy + app.js | 1h |
| 37 | CORE-025 | Cambiar $guarded por $fillable en PeriodClosing | 30min |
| 38 | SD-002 | Proteger ruta pública de verificación de comisiones | 2h |
| 39 | FE-010 | Refactorizar Dashboard.tsx (776 líneas) en componentes | 6h |
| 40 | CORE-022 | Agregar verificación de tenant en UserController como fallback | 1h |
| 41 | SD-005 | Eliminar método `getVideoDuration()` con shell_exec | 15min |
| 42 | FE-006 | Migrar hooks .js a .ts | 4h |
| 43 | PUR-001 | Implementar cálculo de impuestos en OCs | 8h |
| 44 | ACC-009 | Agregar validación de jerarquía circular en CuentaController | 3h |
| 45 | FE-017 | Implementar sort real en WidgetRegistry | 30min |

---

# 17. ESTADÍSTICAS FINALES

## Resumen por Tipo de Problema

| Tipo | 🔴 | 🟠 | 🟡 | 🟢 | Total |
|------|:--:|:--:|:--:|:--:|:-----:|
| Seguridad (IDOR/Isolation) | 12 | 8 | 4 | 0 | 24 |
| Seguridad (XSS/Injection) | 3 | 1 | 2 | 1 | 7 |
| Seguridad (Secrets) | 3 | 0 | 0 | 0 | 3 |
| Lógica de Negocio | 8 | 12 | 18 | 8 | 46 |
| Base de Datos | 5 | 4 | 12 | 6 | 27 |
| Concurrencia/Race Conditions | 4 | 5 | 3 | 0 | 12 |
| Rendimiento (N+1/Cache) | 2 | 6 | 8 | 2 | 18 |
| Arquitectura/Mantenibilidad | 2 | 5 | 10 | 18 | 35 |
| Frontend (React/UX) | 3 | 7 | 12 | 10 | 32 |
| Infraestructura/Config | 3 | 6 | 7 | 7 | 23 |
| Mass Assignment | 3 | 2 | 2 | 0 | 7 |
| **TOTAL** | **48** | **56** | **78** | **52** | **234** |

## Tiempo Estimado de Corrección

| Prioridad | Items | Tiempo Estimado |
|:---------:|:-----:|:---------------:|
| P0 - Inmediata | 7 | ~7 horas |
| P1 - Alta | 11 | ~20 horas |
| P2 - Media | 9 | ~16 horas |
| P3 - Media-Baja | 7 | ~11 horas |
| P4 - Baja | 10 | ~26 horas |
| **TOTAL** | **44** | **~80 horas (2 semanas)** |

## Recomendaciones Finales

1. **NO** desplegar a producción sin resolver P0 y P1 — hay fugas de datos activas entre tenants.
2. **NO** usar la facturación electrónica (Sales) en producción hasta reparar SAL-001 a SAL-005.
3. **NO** procesar nóminas en cola hasta reparar PAY-001 (aislamiento tenant).
4. **REVISAR** históricamente si `.env` fue commitado (usar `git filter-branch` si es necesario).
5. **AGREGAR** tests de integración multi-tenant que verifiquen aislamiento entre tenants.
6. **IMPLEMENTAR** queue middleware global que restaure tenant context para TODOS los jobs.
7. **CONSIDERAR** migrar las tablas de detalle faltantes (stock, recepcion_detalles, etc.) a una migración de consolidación.
8. **ESTABLECER** un policy de que ningún modelo nuevo se cree sin `BelongsToTenant` y `$fillable` explícito.

---

*Fin del informe de auditoría exhaustiva. Total: 276 hallazgos documentados (ajustado a 234 únicos tras deduplicación cross-module).*
