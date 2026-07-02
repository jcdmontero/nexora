# AUDITORIA: Eloquent Models and Database Queries - Performance Analysis

**Date:** 2026-07-01
**Scope:** 73 models, ~50 controllers, DashboardDataService, key services
**Stack:** Laravel 13 + PostgreSQL + Spatie Permission (teams)

---

## 1. COMPLETE MODEL INVENTORY

### Core Models (9 files)

**User** (pp/Models/User.php) - Traits: Auditable, HasFactory, HasRoles, Notifiable | Relations: belongsTo Tenant, belongsTo Sede | Boot: conditional tenant global scope | Note: HasRoles adds query overhead for permission checks.

**Tenant** (pp/Core/Models/Tenant.php) - Traits: HasFactory | Relations: hasMany User, hasMany TenantModule | Clean, low cardinality.

**TenantModule** (pp/Core/Models/TenantModule.php) - Junction table, no traits, clean.

**Module** (pp/Core/Models/Module.php) - Scope: scopePublicado | Route key: code | Small catalog.

**Sede** (pp/Core/Models/Sede.php) - Traits: SoftDeletes | Relations: belongsTo Tenant, hasMany User/Bodega/Caja | Tenant scope via booted.

**AuditLog** (pp/Core/Models/AuditLog.php) - UPDATED_AT: null | Relations: belongsTo User, belongsTo Tenant | HIGH GROWTH table. JSON columns (old_values, new_values, metadata) store full row snapshots. Concern: wide models produce several KB per audit entry.

**WidgetLayout** (pp/Core/Models/WidgetLayout.php) - Static helpers bypass model layer. Small table.

**Tax** (pp/Core/Models/Tax.php) - Traits: BelongsToTenant | Scopes: scopeActivos, scopeDeTipo, scopeAplicaA | Clean catalog.

**Configuracion** (pp/Core/Models/Configuracion.php) - Traits: Auditable | Boot: Cache::forget on saved/deleted | CRITICAL: Uses Cache::rememberForever keyed by tenant_id - EXCELLENT pattern. setMany() fires N updateOrCreate in a loop (minor concern for large config sets).

---

### CRM Module (3 files)

**Cliente** (pp/Modules/Crm/Models/Cliente.php) - Traits: BelongsToTenant, SoftDeletes, Auditable | Extends: Authenticatable (notable) | Relations: hasMany Contacto, hasMany Oportunidad, morphMany CuentaPorCobrar | Computed: nombre_completo, documento | Note: morphMany to CuentaPorCobrar is a potential N+1 if not eager-loaded. Computed attributes re-fire on every serialization.

**Contacto** (pp/Modules/Crm/Models/Contacto.php) - Traits: BelongsToTenant, SoftDeletes, Auditable | Clean leaf model.

**Oportunidad** (pp/Modules/Crm/Models/Oportunidad.php) - Traits: BelongsToTenant, SoftDeletes, Auditable | Clean leaf model.

---

### Inventory Module (10 files)

**Producto** (pp/Modules/Inventory/Models/Producto.php) - Traits: BelongsToTenant, SoftDeletes, Auditable | Relations: belongsTo Categoria, belongsTo Marca, hasMany Stock, hasMany ProductPack, hasMany InventoryAdjustment | Computed: stock_bajo accessor | CENTRAL MODEL with 5 relationships. Index controller eager-loads categoria, marca, packs (GOOD) but not stock (acceptable since through() only accesses base model columns).

**Stock** (pp/Modules/Inventory/Models/Stock.php) - NO traits, NO tenant scope | Relations: belongsTo Producto, belongsTo Bodega | TENANT ISOLATION GAP: relies entirely on parent Producto scope. Direct queries bypass filtering.

**Bodega** - Traits: BelongsToTenant, SoftDeletes | Relations: belongsTo Tenant/Sede, hasMany Stock | Clean.

**InventoryAdjustment** - Traits: BelongsToTenant | Relations: belongsTo Producto/Pack/Bodega/User, morphTo referencia | Boot: auto-sets created_by | No SoftDeletes (correct for audit trail).

**Recepcion** - Traits: BelongsToTenant, SoftDeletes, Auditable | Relations: belongsTo OrdenCompra/Bodega/CajaSesion, hasMany RecepcionDetalle | Clean.

**RecepcionDetalle, TrasladoDetalle, Traslado, ProductPack, Marca, Categoria** - All clean leaf/detail models.

---

### Sales Module (5 files)

**Factura** (pp/Modules/Sales/Models/Factura.php) - Traits: BelongsToTenant, Auditable | Relations: belongsTo Tenant/Sede/Cliente/User(vendedor)/User(anulador)/OrdenReparacion, hasMany FacturaItem, morphMany AsientoContable, morphOne CuentaPorCobrar | Boot: auto-generates verification_token | Scope: scopeNoAnuladas | HEAVY MODEL with 9 relationships. Show endpoint loads 4 levels deep (asientos.lineas.cuenta) - thorough but potentially slow on large datasets.

**FacturaItem** - Uses guarded=['id'] | Relations: belongsTo Factura, belongsTo Producto | Clean.

**DianEvento** - Leaf model. BelongsTo Factura.

**Resolucion** - Manual tenant() belongsTo, NO global scope.

**Certificado** - Hides password and pfx_path. Manual tenant() exists.

---

### Cash Module (8 files)

**Caja** (pp/Modules/Cash/Models/Caja.php) - Traits: BelongsToTenant, Auditable | Relations: belongsTo Sede, hasMany CajaSesion, hasOne sesionActual (where+latestOfMany) | getSaldoActualAttribute accesses sesionActual lazily. reporteConsolidado eager-loads correctly.

**CajaSesion** - Traits: BelongsToTenant, Auditable | Relations: belongsTo Caja/User, hasMany MovimientoCaja/Arqueo | saldo_sistema accessor is attribute-only (no query). Clean.

**MovimientoCaja** - CRITICAL: getReciboIdAttribute executes a FULL ReciboCaja query on every access. If serialized in a list of N movements, fires N additional queries. This is a SEVERE N+1 disguised as an accessor.

**ReciboCaja** - Traits: BelongsToTenant, Auditable | Relations: belongsTo CajaSesion/User/Cliente, morphTo referencia | Clean.

**Transferencia** - 5 belongsTo relationships (cajaOrigen/Destino, sesionOrigen/Destino, usuario). Needs eager loading.

**Arqueo** - Traits: BelongsToTenant, Auditable | Relations: belongsTo CajaSesion/User, hasMany ArqueoDetalle | Clean.

**ArqueoDetalle** - belongsTo Arqueo/Denominacion | Clean.

**Denominacion** - Traits: BelongsToTenant, Auditable | Simple catalog. No relationships.

---

### Accounting Module (8 files)

**CuentaContable** - Traits: BelongsToTenant, Auditable | Self-referential tree (parent/children). No depth limit. Deep hierarchy traversal without eager loading fires many queries. Should use recursive CTE for large charts.

**AsientoContable** - Traits: BelongsToTenant, Auditable | Relations: hasMany AsientoLinea, belongsTo User/PeriodoContable, self-referential (asientoReversado/reversos), morphTo referencia | 6 relationships. Lineas are the hot path.

**AsientoLinea** - Traits: Auditable | NO BelongsToTenant (comment says relies on parent). =[] AND  both present (contradictory). Direct queries bypass tenant isolation.

**PeriodoContable** - Traits: BelongsToTenant, Auditable | Clean.

**LibroContable** - Traits: BelongsToTenant, Auditable | Catalog with DEFAULT_BOOKS constant. Clean.

**CuentaPorCobrar, CuentaPorPagar** - Both use morphTo for deudor/acreedor and documentoOrigen. Need eager-loading discipline.

**CentroCosto** - Traits: BelongsToTenant, Auditable | Simple catalog.

---

### Purchasing Module (3 files)

**Proveedor** - Traits: BelongsToTenant, SoftDeletes, Auditable | Relations: hasMany OrdenCompra, morphMany CuentaPorPagar | Clean.

**OrdenCompra** - Traits: BelongsToTenant, SoftDeletes, Auditable | Relations: belongsTo Proveedor, hasMany OrdenCompraDetalle | Clean.

**OrdenCompraDetalle** - belongsTo OrdenCompra/Producto | Clean.

---

### ServiceDesk Module (15 files - LARGEST)

**OrdenReparacion** (pp/Modules/ServiceDesk/Models/OrdenReparacion.php) - Traits: BelongsToTenant, SoftDeletes, Auditable | 12 relationships: belongsTo Cliente/Modelo/TipoEquipo/tecnico/Prestador/creador, belongsToMany Servicio/Producto (pivots with timestamps), hasMany OrdenMultimedia/OrdenActividad, hasOne Factura, morphMany ReciboCaja | Boot: verification_token + prestador->tecnico sync on saving | Scope: scopeActivas | MOST COMPLEX MODEL. Pivot-dependent totals (total_repuestos, total_servicios, etc.) trigger lazy loads if accessed without eager loading. Show endpoint loads everything properly. Index endpoint avoids accessing pivot totals.

**Prestador** - NO SoftDeletes, NO BelongsToTenant. Manual tenant() exists but NO global scope. Scopes: scopeContratistas, scopeEmpleados. TENANT ISOLATION GAP.

**Ticket** - Manual tenant() exists, NO global scope. Relations: belongsTo Tenant/User(solicitante)/User(agente)/Cliente, hasMany TicketMensaje.

**TicketMensaje** - belongsTo Ticket/User | No tenant isolation at all.

**Modelo** - Traits: BelongsToTenant, SoftDeletes, Auditable | belongsTo Marca/TipoEquipo | Clean.

**Marca (ServiceDesk)** - Traits: BelongsToTenant, SoftDeletes, Auditable | hasMany Modelo | Clean.

**TipoEquipo** - Traits: BelongsToTenant, SoftDeletes, Auditable | hasMany Modelo | Clean.

**Servicio** - Traits: BelongsToTenant, SoftDeletes, Auditable | belongsTo TipoEquipo | Clean.

**ChecklistItem** - Traits: BelongsToTenant, SoftDeletes, Auditable | 4 scopes: fallas, accesorios, activos, ordenado | Clean.

**FallaBase** - Traits: BelongsToTenant, SoftDeletes, Auditable | belongsTo TipoEquipo | Clean.

**OrdenActividad** - Traits: BelongsToTenant, SoftDeletes, Auditable | belongsTo OrdenReparacion/Prestador/Servicio | Clean.

**OrdenMultimedia** - Traits: SoftDeletes, Auditable | belongsTo OrdenReparacion | No tenant scope.

**ComisionLiquidacion** - Traits: Auditable | Boot: creates verification_token via random_bytes(32) | Relations: belongsTo Tenant/Prestador/User(aprobador), hasMany ComisionDetalle/ComisionPago | No SoftDeletes, no BelongsToTenant.

**ComisionDetalle** - belongsTo ComisionLiquidacion/OrdenReparacion | No tenant isolation.

**ComisionPago** - Manual tenant() exists, NO global scope. belongsTo Liquidacion/Prestador.

---

### HR Module (11 files)

**Empleado** - NO SoftDeletes, NO BelongsToTenant. Manual tenant(). Relations: belongsTo Tenant/User/Sede, hasMany Asistencia/Contrato, hasOne contratoActivo.

**Contrato** - NO tenant isolation at all. belongsTo Empleado/Cargo.

**Cargo** - Manual tenant() exists, NO scope. belongsTo Tenant/Departamento, hasMany Contrato.

**Departamento** - Manual tenant() exists, NO scope. belongsTo Tenant, hasMany Cargo.

**Asistencia** - NO tenant isolation. belongsTo Empleado.

**Incapacidad** - SoftDeletes. NO tenant isolation. belongsTo Empleado.

**Prestamo** - SoftDeletes. NO tenant isolation. belongsTo Empleado, hasMany PrestamoCuota.

**PrestamoCuota** - belongsTo Prestamo/Nomina (cross-module).

**Afiliacion** - NO tenant isolation. belongsTo Empleado/EntidadParafiscal.

**EntidadParafiscal** - Manual tenant() exists, NO scope. hasMany Afiliacion.

**ConfiguracionLegal** - Manual tenant() exists, NO scope. 11 decimal casts.

---

### Payroll Module (7 files)

**Nomina** - NO SoftDeletes, NO BelongsToTenant. Manual tenant(). Relations: belongsTo Tenant/PeriodoNomina/Empleado/Contrato/User(creador), hasMany NominaDetalle/Novedad.

**NominaDetalle** - NO tenant isolation. belongsTo Nomina/ConceptoNomina/Empleado/Contrato (4 relationships).

**Novedad** - NO tenant isolation. belongsTo Empleado/Contrato/Nomina/ConceptoNomina/PeriodoNomina, morphTo referencia (6 relationships).

**PeriodoNomina** - Manual tenant() exists. hasMany Nomina, belongsTo User(creador).

**ConceptoNomina** - Manual tenant() exists. belongsTo Tenant/CuentaContable.

**ParametroContable** - Manual tenant() exists. belongsTo Tenant/ConceptoNomina/CuentaContable(debito)/CuentaContable(credito)/CentroCosto (5 relationships).

**ProvisionAcumulada** - Manual tenant() exists. belongsTo Tenant/Empleado.

---

### Notifications Module (2 files)

**Notificacion** - Traits: BelongsToTenant | morphTo referencia, belongsTo User(enviador) | Scope: scopePendientes

**PlantillaNotificacion** - Traits: BelongsToTenant | Simple template model.

---

## 2. TENANT ISOLATION GAP ANALYSIS

### Models with automatic BelongsToTenant scope (39 models):
All module models using the trait get automatic tenant filtering and auto-assignment on create.

### Models MISSING automatic scope (29 models):
HR module: Empleado, Contrato, Cargo, Departamento, Asistencia, Incapacidad, Prestamo, PrestamoCuota, Afiliacion, EntidadParafiscal, ConfiguracionLegal
Payroll module: Nomina, NominaDetalle, Novedad, PeriodoNomina, ConceptoNomina, ParametroContable, ProvisionAcumulada
ServiceDesk: Prestador, Ticket, TicketMensaje, ComisionPago, ComisionDetalle, OrdenMultimedia
Sales: Resolucion, Certificado, FacturaItem, DianEvento
Accounting: AsientoLinea
Inventory: Stock

**RISK:** A single controller oversight that forgets manual tenant_id filtering will leak cross-tenant data. The HR and Payroll modules are entirely unprotected at the model level.

---

## 3. AUDITABLE TRAIT OVERHEAD

Used on ~40 models. On each create/update/delete event, it:
1. Reads auth()->user() and app('current_tenant')
2. Extracts tax metadata from changed attributes
3. INSERTs into audit_logs with full old/new values as JSON

**Concern:** For wide models (OrdenReparacion: 34+ fields), JSON payloads can be several KB per entry. Writes are synchronous within the same transaction. No queue mechanism. Under high write volume, this adds measurable latency.

---

## 4. N+1 QUERY PATTERNS

### CRITICAL

**4a. MovimientoCaja::getReciboIdAttribute** (Cash/Models/MovimientoCaja.php:47-58)
Fires ReciboCaja::where(...)->first() on every property access. 20 serialized movements = 20 extra queries.
**Fix:** Replace with a hasOne relationship or move the logic to the controller.

### HIGH

**4b. ContabilidadNominaService::contabilizarPeriodo** (Payroll/Services/ContabilidadNominaService.php:40-135)
Inside nested loops (nominas x detalles), lines 53 and 93 call CuentaContable::withoutGlobalScopes()->where()->value('id'). For 50 employees x 10 details = 500+ queries for constant account lookups.
**Fix:** Cache account IDs before the loop.

**4c. OrdenReparacion boot saving event** (ServiceDesk/Models/OrdenReparacion.php:62-70)
Calls Prestador::find() on EVERY save, even when prestador_id has not changed.
**Fix:** Check if prestador_id is dirty before fetching.

### MEDIUM

**4d. CajaService::reporteConsolidado** (Cash/Services/CajaService.php:275-278)
The map() closure calls \->sesiones()->whereBetween()->get() for each caja. 10 cajas = 10 extra queries.
**Fix:** Aggregate sessions in a single query before the map.

**4e. PeriodoContableController::index** (Accounting/Controllers/PeriodoContableController.php:51)
Correlated subquery: whereRaw with (SELECT SUM(debito) FROM asiento_lineas WHERE ... id = asientos_contables.id). Fires a subquery per row.
**Fix:** Replace with JOIN or CTE.

---

## 5. RAW QUERIES AND QUERY BUILDER

### DashboardDataService (EXCELLENT)
40+ direct DB::table() calls with explicit select(), LEFT JOINs, DB::raw() aggregations, and 5-minute caching. This bypasses model hydration for dashboard speed -- the right approach.

### FacturaService lockForUpdate() (CORRECT)
6 occurrences for stock decrementing and tenant locking. Prevents race conditions. Holds locks for transaction duration -- monitor under heavy concurrent invoicing.

### FacturaController SQLite Compatibility (CLEVER)
Dynamic driver detection switches between 'like' and 'ilike'. Adds a schema query per request -- could be cached.

### Configuracion::setMany (MINOR)
Fires N updateOrCreate queries in a loop for N config keys. Acceptable for typical config sizes (< 30 keys) but could be optimized with bulk upsert.

---

## 6. PAGINATION AND DATA LIMITS

### Well-paginated (29 controllers):
All major index endpoints use paginate(10-20). This is excellent.

### Unpaginated list endpoints (POTENTIAL ISSUE):

| Controller | Query Pattern | Risk |
|---|---|---|
| ClienteController::index | ->get() with Inertia::defer | HIGH -- all clients loaded at once |
| OrdenController::index | ->get() with Inertia::defer | HIGH -- all orders loaded at once |
| NotificacionController::index | ->get() unbounded | HIGH -- notifications grow unbounded |
| UserController::index | ->get() | MEDIUM -- bounded by tenant user count |
| ProveedorController::index | ->get() | LOW -- catalogs are small |
| SedeController::index | ->get() | LOW -- typically < 20 records |
| Catalog controllers (8+) | ->get() | LOW -- small catalogs |

---

## 7. SOFTDELETES USAGE

23 models use SoftDeletes. Every query adds WHERE deleted_at IS NULL. Without composite indexes on (tenant_id, deleted_at), these queries perform sequential scans on multi-tenant tables. Verify migrations include these composite indexes.

---

## 8. CRITICAL FINDINGS SUMMARY

| Severity | Finding | Location |
|---|---|---|
| CRITICAL | 29 models missing tenant scope | HR, Payroll,部分 ServiceDesk/Sales |
| CRITICAL | MovimientoCaja accessor fires query per access | Cash/Models/MovimientoCaja.php |
| HIGH | ContabilidadNominaService query-in-nested-loop | Payroll/Services/ContabilidadNominaService.php |
| HIGH | Cliente index loads all records unpaginated | Crm/Controllers/ClienteController.php |
| HIGH | Orden index loads all records unpaginated | ServiceDesk/Controllers/OrdenController.php |
| HIGH | OrdenReparacion boot queries on every save | ServiceDesk/Models/OrdenReparacion.php |
| MEDIUM | CajaService reporteConsolidado N+1 | Cash/Services/CajaService.php |
| MEDIUM | PeriodoContableController correlated subquery | Accounting/Controllers/PeriodoContableController.php |
| MEDIUM | Configuracion::setMany loop of updateOrCreate | Core/Models/Configuracion.php |

---

## 9. POSITIVE PATTERNS TO PRESERVE

1. DashboardDataService raw DB queries with caching
2. Configuracion Cache::rememberForever with boot invalidation
3. Consistent paginate() across 29 controllers
4. Proper eager loading in show/edit endpoints
5. BelongsToTenant trait design (scope + auto-create)
6. lockForUpdate() for stock operations in FacturaService
7. Inertia::defer() on heavy list endpoints
8. Column projection with select() in multiple controllers
9. SafeEncrypted cast on OrdenReparacion::codigo_bloqueo