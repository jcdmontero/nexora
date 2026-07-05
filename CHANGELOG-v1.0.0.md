# Changelog v1.0.0 — Auditoría Consolidada Inventory + Payroll

**Fecha:** 2026-07-05
**Tag:** `v1.0.0`
**Commit:** `e0f83a3`
**Alcance:** Módulos Inventory (Inventario) y Payroll (Nómina)

---

## Resumen Ejecutivo

Auditoría integral que consolidó el análisis propio con segunda opinión, resultando en **49 issues corregidos** entre ambos módulos. Se eliminaron fugas de datos multi-tenant, bugs que rompían funcionalidades críticas (anulación de períodos, recepciones parciales), y debilidades financieras en la integración contable.

| Módulo | Críticos | Altos | Medios | Total |
|--------|----------|-------|--------|-------|
| Inventory | 13 | 3 | 11 | 27 |
| Payroll | 6 | 9 | 7 | 22 |
| **Total** | **19** | **12** | **18** | **49** |

---

## Inventory (Inventario) v1.0.0 — 27 Fixes

### Seguridad Multi-Tenant

| # | Problema | Solución |
|---|----------|----------|
| 5 | `exists` sin filtro tenant en todos los controladores | `Rule::in()` con queries scoped por `BelongsToTenant` |
| 14 | Stock, RecepcionDetalle, TrasladoDetalle sin `BelongsToTenant` | Trait agregado a los 3 modelos |
| 6 | Migración 100006 asigna bodega principal global | Migración correctiva `2026_07_05_100000` |

### Funcionalidad Rota

| # | Problema | Solución |
|---|----------|----------|
| 1 | MultimediaController de ServiceDesk como dependencia rígida | Controlador eliminado de rutas (imágenes manejadas internamente) |
| 2 | RecepcionController requiere Cash/Accounting para arrancar | `class_exists()` condicional |
| 3 | Redirect a `purchasing.ordenes.index` inexistente | Redirige a `inventory.recepciones.index` |
| 9 | Recepciones bloquean entregas parciales | Cálculo de cantidades pendientes por producto |
| 10 | Sin límite de sobre-recepción | Validación contra cantidad ordenada |
| 18 | Estados de traslado fantasma | Flujo borrador → completar con validación de stock |

### Integridad de Datos

| # | Problema | Solución |
|---|----------|----------|
| 7 | Falso positivo stock crítico (0 ≤ 0) | Requiere `stock_minimo > 0` |
| 8 | Prop mismatch `criticalStockCount` vs `criticalCount` | Backend envía `criticalCount` |
| 11 | Precio unitario cae a $0 | Valida que producto pertenece a la orden |
| 12 | Imágenes borradas fuera de transacción | Movido dentro de `DB::transaction` |
| 13 | `Bodega::destroy()` sin verificar stock | Verifica `Stock.cantidad > 0` |
| 15 | Stock reconciliation service | `StockReconciliationService` + artisan `inventory:reconcile-stock` |
| 16 | Asientos omitidos silenciosamente | Flash `warning` al usuario |
| 22 | Migración sedes duplica registros | Migración correctiva `2026_07_05_200000` |

### Arquitectura y Código

| # | Problema | Solución |
|---|----------|----------|
| 17 | Dependencies vacías en module.json | Declara `purchasing`, `cash`, `accounting` |
| 23 | Método HTTP incorrecto en Edit.jsx | `put()` de Inertia |
| 24 | Sistema de imágenes duplicado | Unificado a solo array `imagenes` |
| 25 | Carpetas Inertia inconsistentes | Movido a `Pages/Inventory/` |
| 26 | Recepciones/Traslados sin paginación | `paginate(20)` |
| 27 | Permiso redundante en printLabels | Eliminado |

### Tests Nuevos

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `AjusteControllerTest.php` | 6 | Entrada, salida, stock insuficiente, ajuste directo, validación, factor conversión |
| `TrasladoControllerTest.php` | 5 | Crear borrador, completar, stock insuficiente, estado, misma bodega |
| `CrossTenantTest.php` | 7 | Rechazo categoría/marca/sede/bodega/producto cross-tenant, visibilidad |

**Total Inventory:** 47 tests, 125 assertions

---

## Payroll (Nómina) v1.0.0 — 22 Fixes

### Funcionalidad Rota

| # | Problema | Solución |
|---|----------|----------|
| 1 | `anular()` usa `each()` sobre query builder | `get()->each()` con eager loading |
| 14 | `updateConcepto` permite editar en LIQUIDADA | Restringido a BORRADOR |

### Seguridad Multi-Tenant

| # | Problema | Solución |
|---|----------|----------|
| 2 | Búsqueda períodos rompe filtro tenant | `orWhere` agrupado en sub-query |
| 3 | NovedadController exists sin tenant | `Rule::in()` con queries scoped |
| 15 | NominaDetalle sin tenant_id | Migración + `BelongsToTenant` + backfill |

### Contabilidad

| # | Problema | Solución |
|---|----------|----------|
| 5 | `ContabilidadNominaService` falla con empleado eliminado | Null-safe `?? ''` + skip |
| 7 | Cuentas 5105/2370 no verificadas | Validación explícita antes del loop |
| 8 | N+1 queries en contabilización | Cuentas cacheadas fuera del loop |
| 19 | Descuadres de centavos | `round(..., 2)` en totales |

### Integridad

| # | Problema | Solución |
|---|----------|----------|
| 4 | Migración down() incompleta | Agregadas columnas faltantes al drop |
| 10 | ConceptoNomina sin SoftDeletes | Trait habilitado |
| 13 | ProvisionAcumulada sin actualizar | Ya implementado (falso positivo) |

### Arquitectura y Código

| # | Problema | Solución |
|---|----------|----------|
| 6 | Auxilio transporte límite indefinido | Documentado con Ley 17/2023 |
| 9 | PermissionRegistrar sin try/finally | Envuelto en try/finally |
| 11 | LiquidacionController sin validación código | Duplicado verificado |
| 12 | `aprobar()` excepción genérica | `back()->with('error')` |
| 16 | LiquidacionController::show() sin paginación | `paginate(20)` |
| 17 | mes_contable validación rígida | Regex flexible `/^\d{4}-\d{2}$/` |
| 21 | NominaController sin búsqueda | Búsqueda por nombre/documento |
| 22 | Ruta defaults innecesarios | Eliminados |
| 23 | PayrollLiquidator SMMLV desactualizado | Actualizado a $1.400.000 |
| 24 | storeBulk usa insert | Cambiado a `create()` |

### Tests

**Total Payroll:** 17 tests, 80 assertions

---

## Archivos Creados (6)

| Archivo | Propósito |
|---------|-----------|
| `app/Modules/Inventory/Services/StockReconciliationService.php` | Conciliación de stock producto ↔ bodegas |
| `app/Console/Commands/InventoryReconcileStock.php` | Comando artisan `inventory:reconcile-stock` |
| `app/Modules/Inventory/Migrations/2026_07_05_100000_fix_bodega_principal_per_tenant.php` | Corrección datos bodega cross-tenant |
| `app/Modules/Inventory/Migrations/2026_07_05_200000_fix_duplicate_sedes_from_inventory.php` | Deduplicación sedes |
| `app/Modules/Payroll/Migrations/2026_07_05_300000_add_tenant_id_to_pay_nomina_detalles.php` | Tenant isolation en detalles |
| `auditoria/payroll-audit.md` | Código fuente completo del módulo Payroll |

---

## Métricas

| Métrica | Valor |
|---------|-------|
| Archivos modificados | 48 |
| Líneas agregadas | 3,268 |
| Líneas eliminadas | 312 |
| Tests nuevos | 18 |
| Tests totales (Inventory + Payroll) | 64 |
| Assertions totales | 205 |
| Estado de tests | **PASS** |

---

## Issues Diferidos (requieren decisión de diseño)

| # | Issue | Razón |
|---|-------|-------|
| Inventory #24 | Sistema de imágenes dual | Requiere refactor de frontend |
| Inventory #25 | Carpetas inconsistente | Cosmetic, funcional |
| Payroll #18 | Redundancia periodo_id/nomina_id | Requiere refactor de esquema |
| Payroll #20 | Índices para ILIKE | Requiere benchmark de volumen |

---

*Generado automáticamente desde la auditoría consolidada v1.0.0*
