# DATABASE SCHEMA AUDIT — NEXORA
**Date**: 2026-06-26
**Migrations analyzed**: 61 (16 core + 45 module)

---

## LEGEND
- **PK** = Primary Key (auto-increment bigint)
- **FK** = Foreign Key
- **UQ** = Unique constraint
- **IDX** = Index
- **ten** = has tenant_id column
- **sd** = uses softDeletes
- **DEC(p,s)** = decimal(precision, scale)
- **CONCERN** = data type issue flagged

---

## CORE TABLES

### 1. `users`
**Migrations**: 0001_01_01_000000, 2026_06_19_000002, 2026_06_20_130350

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| name | varchar(255) | NO | | |
| email | varchar(255) | NO | | UQ |
| email_verified_at | timestamp | YES | NULL | |
| password | varchar(255) | NO | | |
| remember_token | varchar(100) | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| tenant_id | bigint | YES | NULL | FK→tenants.id ON DELETE CASCADE |
| is_superadmin | boolean | NO | false | |
| is_active | boolean | NO | true | |
| locale | varchar(255) | NO | 'es' | |
| sede_id | bigint | YES | NULL | FK→core_sedes.id ON DELETE SET NULL |

- **ten**: YES
- **softDeletes**: NO
- **FKs**: tenant_id→tenants, sede_id→core_sedes

---

### 2. `password_reset_tokens`
**Migration**: 0001_01_01_000000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| email | varchar(255) | NO | | PK |
| token | varchar(255) | NO | | |
| created_at | timestamp | YES | NULL | |

- **ten**: NO
- **softDeletes**: NO

---

### 3. `sessions`
**Migration**: 0001_01_01_000000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | varchar(255) | NO | | PK |
| user_id | bigint | YES | NULL | FK→users.id, IDX |
| ip_address | varchar(45) | YES | NULL | |
| user_agent | text | YES | NULL | |
| payload | longText | NO | | |
| last_activity | int | NO | | IDX |

- **ten**: NO
- **softDeletes**: NO

---

### 4. `cache`
**Migration**: 0001_01_01_000001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| key | varchar(255) | NO | | PK |
| value | mediumText | NO | | |
| expiration | bigint | NO | | IDX |

- **ten**: NO
- **softDeletes**: NO

---

### 5. `cache_locks`
**Migration**: 0001_01_01_000001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| key | varchar(255) | NO | | PK |
| owner | varchar(255) | NO | | |
| expiration | bigint | NO | | IDX |

- **ten**: NO
- **softDeletes**: NO

---

### 6. `jobs`
**Migration**: 0001_01_01_000002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| queue | varchar(255) | NO | | IDX |
| payload | longText | NO | | |
| attempts | smallint unsigned | NO | | |
| reserved_at | int unsigned | YES | NULL | |
| available_at | int unsigned | NO | | |
| created_at | int unsigned | NO | | |

- **ten**: NO
- **softDeletes**: NO

---

### 7. `job_batches`
**Migration**: 0001_01_01_000002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | varchar(255) | NO | | PK |
| name | varchar(255) | NO | | |
| total_jobs | int | NO | | |
| pending_jobs | int | NO | | |
| failed_jobs | int | NO | | |
| failed_job_ids | longText | NO | | |
| options | mediumText | YES | NULL | |
| cancelled_at | int | YES | NULL | |
| created_at | int | NO | | |
| finished_at | int | YES | NULL | |

---

### 8. `failed_jobs`
**Migration**: 0001_01_01_000002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| uuid | varchar(255) | NO | | UQ |
| connection | varchar(255) | NO | | |
| queue | varchar(255) | NO | | |
| payload | longText | NO | | |
| exception | longText | NO | | |
| failed_at | timestamp | NO | CURRENT | |

- **IDX**: [connection, queue, failed_at]

---

### 9. `tenants`
**Migration**: 2026_06_19_000001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| name | varchar(255) | NO | | |
| slug | varchar(255) | NO | | UQ |
| domain | varchar(255) | YES | NULL | UQ |
| email | varchar(255) | YES | NULL | |
| logo | varchar(255) | YES | NULL | |
| is_active | boolean | NO | true | |
| plan | varchar(255) | YES | NULL | |
| config | json | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: N/A (this IS the tenant table)
- **softDeletes**: NO

---

### 10. `modules`
**Migration**: 2026_06_19_000003

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| code | varchar(255) | NO | | UQ |
| name | varchar(255) | NO | | |
| class | varchar(255) | NO | | |
| version | varchar(255) | NO | '1.0.0' | |
| description | text | YES | NULL | |
| is_core | boolean | NO | false | |
| dependencies | json | YES | NULL | |
| permissions | json | YES | NULL | |
| is_active_globally | boolean | NO | true | |
| estado | varchar(255) | NO | 'desarrollo' | |
| certificacion | json | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (global catalog)
- **softDeletes**: NO

---

### 11. `tenant_modules`
**Migration**: 2026_06_19_000003

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id ON DELETE CASCADE |
| module_code | varchar(255) | NO | | FK→modules.code ON DELETE CASCADE |
| is_active | boolean | NO | false | |
| settings | json | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **UQ**: [tenant_id, module_code]
- **ten**: YES (via tenant_id)

---

### 12. Permission tables (spatie)
**Migration**: 2026_06_19_062951
**Config**: permission.teams = true → team_foreign_key = tenant_id

#### `permissions`
| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| name | varchar(255) | NO | | |
| guard_name | varchar(255) | NO | | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **UQ**: [name, guard_name]

#### `roles`
| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | YES | NULL | IDX: roles_team_foreign_key_index |
| name | varchar(255) | NO | | |
| guard_name | varchar(255) | NO | | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **UQ**: [tenant_id, name, guard_name] (teams mode)

#### `model_has_permissions`
| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| permission_id | bigint | NO | | FK→permissions.id CASCADE |
| model_type | varchar(255) | NO | | |
| model_id | bigint | NO | | |
| tenant_id | bigint | NO | | IDX: model_has_permissions_team_foreign_key_index |

- **PK**: [tenant_id, permission_id, model_id, model_type]
- **IDX**: [model_id, model_type]

#### `model_has_roles`
| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| role_id | bigint | NO | | FK→roles.id CASCADE |
| model_type | varchar(255) | NO | | |
| model_id | bigint | NO | | |
| tenant_id | bigint | NO | | IDX: model_has_roles_team_foreign_key_index |

- **PK**: [tenant_id, role_id, model_id, model_type]
- **IDX**: [model_id, model_type]

#### `role_has_permissions`
| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| permission_id | bigint | NO | | FK→permissions.id CASCADE |
| role_id | bigint | NO | | FK→roles.id CASCADE |

- **PK**: [permission_id, role_id]

---

### 13. `core_sedes`
**Migration**: 2026_06_20_130348

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| nombre | varchar(255) | NO | | |
| direccion | varchar(255) | YES | NULL | |
| es_principal | boolean | NO | false | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES

---

### 14. `core_configuraciones`
**Migration**: 2026_06_21_000001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| categoria | varchar(40) | NO | 'general' | |
| clave | varchar(80) | NO | | |
| valor | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, clave]
- **IDX**: [tenant_id, categoria]

---

### 15. `cash_recibos` (core-level)
**Migration**: 2026_06_25_110000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| numero | varchar(30) | NO | | |
| fecha | timestamp | NO | CURRENT | |
| sesion_id | bigint | NO | | FK→cash_caja_sesiones.id CASCADE |
| user_id | bigint | NO | | FK→users.id CASCADE |
| cliente_id | bigint | YES | NULL | FK→crm_clientes.id SET NULL |
| referencia_type | varchar(255) | YES | NULL | morph |
| referencia_id | bigint | YES | NULL | morph |
| concepto | varchar(255) | NO | | |
| monto | DEC(15,2) | NO | | |
| metodo_pago | varchar(50) | NO | 'efectivo' | |
| estado | varchar(20) | NO | 'activo' | |
| notas | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, numero], [tenant_id, referencia_type, referencia_id]
- **FKs**: tenant_id→tenants, sesion_id→cash_caja_sesiones, user_id→users, cliente_id→crm_clientes

---

### 16. `audit_logs`
**Migration**: 2026_06_26_163956

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | YES | NULL | FK→tenants.id SET NULL |
| user_id | bigint | YES | NULL | FK→users.id SET NULL |
| event | varchar(255) | NO | | |
| auditable_type | varchar(255) | NO | | |
| auditable_id | bigint unsigned | NO | | |
| old_values | json | YES | NULL | |
| new_values | json | YES | NULL | |
| ip_address | varchar(45) | YES | NULL | |
| user_agent | text | YES | NULL | |
| url | text | YES | NULL | |
| description | varchar(255) | YES | NULL | |
| created_at | timestamp | NO | CURRENT | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, auditable_type, auditable_id], [event]
- **NOTE**: No `updated_at` — only `created_at`

---

### 17. `taxes`
**Migrations**: 2026_06_26_181245, 2026_06_26_190001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| codigo | varchar(20) | NO | | UQ (global) |
| nombre | varchar(255) | NO | | |
| porcentaje | DEC(5,2) | NO | 0 | |
| tipo | varchar(255) | NO | 'generado' | |
| aplica_a | varchar(20) | NO | 'ambos' | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, codigo]
- **CONCERN**: `codigo` UQ is global, not per-tenant — could collide across tenants

---

## MODULE: ACCOUNTING

### 18. `centros_costo`
**Migration**: 2026_06_20_000000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| codigo | varchar(20) | NO | | |
| nombre | varchar(100) | NO | | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, codigo]

---

### 19. `cuentas_contables`
**Migrations**: 2026_06_20_000000, 2026_06_20_010000, 2026_06_26_180538

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| codigo | varchar(20) | NO | | |
| nombre | varchar(150) | NO | | |
| tipo | enum | NO | | 'activo','pasivo','patrimonio','ingreso','gasto','costo' |
| naturaleza | enum | NO | 'debito' | 'debito','credito' |
| nivel | tinyint unsigned | NO | 1 | |
| clase | varchar(1) | YES | NULL | |
| acepta_movimientos | boolean | NO | true | |
| requiere_tercero | boolean | NO | false | |
| requiere_centro_costo | boolean | NO | false | |
| parent_id | bigint | YES | NULL | FK→cuentas_contables.id CASCADE |
| descripcion | text | YES | NULL | |
| tipo_regimen | varchar(30) | NO | 'TODOS' | IDX |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, codigo]
- **IDX**: tipo_regimen

---

### 20. `asientos_contables`
**Migrations**: 2026_06_20_000000, 2026_06_20_010000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| periodo_contable_id | bigint | YES | NULL | FK→periodos_contables.id SET NULL |
| fecha | date | NO | | |
| numero | varchar(30) | YES | NULL | |
| concepto | varchar(255) | NO | | |
| estado | enum | NO | 'contabilizado' | 'borrador','contabilizado','reversado' |
| modulo_origen | varchar(50) | YES | NULL | |
| documento_tipo | varchar(50) | YES | NULL | |
| documento_prefijo | varchar(10) | YES | NULL | |
| documento_numero | varchar(50) | YES | NULL | |
| tercero_tipo_documento | varchar(10) | YES | NULL | |
| tercero_numero_documento | varchar(30) | YES | NULL | |
| tercero_nombre | varchar(180) | YES | NULL | |
| referencia_type | varchar(255) | YES | NULL | morph |
| referencia_id | bigint | YES | NULL | morph |
| reverso_de_id | bigint | YES | NULL | FK→asientos_contables.id SET NULL |
| registrado_por | bigint | YES | NULL | FK→users.id |
| contabilizado_at | timestamp | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, numero]
- **IDX**: [tenant_id, fecha], [tenant_id, estado], asientos_documento_idx

---

### 21. `asiento_lineas`
**Migrations**: 2026_06_20_000000, 2026_06_20_010000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| asiento_contable_id | bigint | NO | | FK→asientos_contables.id CASCADE |
| cuenta_contable_id | bigint | NO | | FK→cuentas_contables.id |
| centro_costo_id | bigint | YES | NULL | FK→centros_costo.id SET NULL |
| tercero_tipo_documento | varchar(10) | YES | NULL | |
| tercero_numero_documento | varchar(30) | YES | NULL | |
| tercero_nombre | varchar(180) | YES | NULL | |
| debito | DEC(15,2) | NO | 0 | |
| credito | DEC(15,2) | NO | 0 | |
| base_gravable | DEC(15,2) | YES | NULL | |
| impuesto_tipo | varchar(20) | YES | NULL | |
| impuesto_tarifa | DEC(7,4) | YES | NULL | |
| descripcion | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via asiento_contable)
- **softDeletes**: NO
- **IDX**: [cuenta_contable_id], [centro_costo_id], [tercero_numero_documento]

---

### 22. `periodos_contables`
**Migration**: 2026_06_20_010000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| anio | smallint unsigned | NO | | |
| mes | tinyint unsigned | NO | | |
| fecha_inicio | date | NO | | |
| fecha_fin | date | NO | | |
| estado | enum | NO | 'abierto' | 'abierto','cerrado' |
| cerrado_at | timestamp | YES | NULL | |
| cerrado_por | bigint | YES | NULL | FK→users.id SET NULL |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, anio, mes]
- **IDX**: [tenant_id, estado]

---

### 23. `cuentas_por_cobrar`
**Migration**: 2026_06_20_000000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| deudor_type | varchar(255) | YES | NULL | morph |
| deudor_id | bigint | YES | NULL | morph |
| documento_origen_type | varchar(255) | YES | NULL | morph |
| documento_origen_id | bigint | YES | NULL | morph |
| monto_total | DEC(15,2) | NO | | |
| monto_pagado | DEC(15,2) | NO | 0 | |
| estado | enum | NO | 'pendiente' | 'pendiente','pagado','anulado' |
| fecha_vencimiento | date | YES | NULL | |
| notas | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO

---

### 24. `cuentas_por_pagar`
**Migration**: 2026_06_20_000000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| acreedor_type | varchar(255) | YES | NULL | morph |
| acreedor_id | bigint | YES | NULL | morph |
| documento_origen_type | varchar(255) | YES | NULL | morph |
| documento_origen_id | bigint | YES | NULL | morph |
| monto_total | DEC(15,2) | NO | | |
| monto_pagado | DEC(15,2) | NO | 0 | |
| estado | enum | NO | 'pendiente' | 'pendiente','pagado','anulado' |
| fecha_vencimiento | date | YES | NULL | |
| notas | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO

---

### 25. `libros_contables`
**Migration**: 2026_06_26_170000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| codigo | varchar(10) | NO | | |
| nombre | varchar(100) | NO | | |
| tipo | varchar(30) | NO | | |
| descripcion | varchar(255) | YES | NULL | |
| filtro_cuentas | varchar(100) | YES | NULL | |
| filtro_modulo | varchar(50) | YES | NULL | |
| is_sistema | boolean | NO | false | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, codigo]

---

## MODULE: CASH

### 26. `cash_cajas`
**Migration**: 2026_06_20_140000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| sede_id | bigint | YES | NULL | FK→core_sedes.id SET NULL |
| nombre | varchar(100) | NO | | |
| activa | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, sede_id]

---

### 27. `cash_caja_sesiones`
**Migrations**: 2026_06_20_140000, 2026_06_24_100000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | YES | NULL | FK→tenants.id SET NULL (added in extend) |
| caja_id | bigint | NO | | FK→cash_cajas.id CASCADE |
| user_id | bigint | NO | | FK→users.id CASCADE |
| fecha_apertura | timestamp | NO | CURRENT | |
| saldo_inicial | DEC(15,2) | NO | 0 | |
| ingresos_totales | DEC(15,2) | NO | 0 | |
| egresos_totales | DEC(15,2) | NO | 0 | |
| fecha_cierre | timestamp | YES | NULL | |
| saldo_final | DEC(15,2) | YES | NULL | |
| diferencia | DEC(15,2) | YES | NULL | |
| estado | varchar(20) | NO | 'abierta' | |
| notas | text | YES | NULL | |
| observaciones_cierre | text | YES | NULL | |
| arqueado | boolean | NO | false | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, caja_id, estado]

---

### 28. `cash_movimientos`
**Migration**: 2026_06_20_140000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| sesion_id | bigint | NO | | FK→cash_caja_sesiones.id CASCADE |
| tipo | varchar(20) | NO | | |
| monto | DEC(15,2) | NO | | |
| metodo_pago | varchar(50) | NO | 'efectivo' | |
| concepto | varchar(255) | NO | | |
| referencia_type | varchar(255) | YES | NULL | morph |
| referencia_id | bigint | YES | NULL | morph |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, sesion_id, tipo]

---

### 29. `cash_denominaciones`
**Migration**: 2026_06_24_100000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| tipo | varchar(10) | NO | | |
| valor | DEC(15,2) | NO | | |
| orden | smallint unsigned | NO | 0 | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, valor]
- **IDX**: [tenant_id, orden]

---

### 30. `cash_arqueos`
**Migration**: 2026_06_24_100000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| sesion_id | bigint | NO | | FK→cash_caja_sesiones.id CASCADE |
| user_id | bigint | NO | | FK→users.id CASCADE |
| total_sistema | DEC(15,2) | NO | 0 | |
| total_contado | DEC(15,2) | NO | 0 | |
| diferencia | DEC(15,2) | NO | 0 | |
| observaciones | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, sesion_id]

---

### 31. `cash_arqueo_detalles`
**Migration**: 2026_06_24_100000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| arqueo_id | bigint | NO | | FK→cash_arqueos.id CASCADE |
| denominacion_id | bigint | NO | | FK→cash_denominaciones.id CASCADE |
| cantidad | int unsigned | NO | 0 | |
| subtotal | DEC(15,2) | NO | 0 | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via arqueo)
- **softDeletes**: NO
- **UQ**: [arqueo_id, denominacion_id]

---

### 32. `cash_transferencias`
**Migration**: 2026_06_24_100000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| caja_origen_id | bigint | NO | | FK→cash_cajas.id CASCADE |
| caja_destino_id | bigint | NO | | FK→cash_cajas.id CASCADE |
| sesion_origen_id | bigint | YES | NULL | FK→cash_caja_sesiones.id SET NULL |
| sesion_destino_id | bigint | YES | NULL | FK→cash_caja_sesiones.id SET NULL |
| user_id | bigint | NO | | FK→users.id CASCADE |
| monto | DEC(15,2) | NO | | |
| concepto | varchar(255) | YES | NULL | |
| estado | varchar(20) | NO | 'completada' | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, created_at]

---

## MODULE: CRM

### 33. `crm_clientes`
**Migrations**: 2026_06_19_210001, 2026_06_26_190000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| tipo | varchar(20) | NO | 'natural' | |
| regimen_tributario | varchar(30) | NO | 'simplificado' | IDX |
| porcentaje_retencion_fuente | DEC(5,2) | NO | 0 | |
| porcentaje_retencion_iva | DEC(5,2) | NO | 0 | |
| porcentaje_retencion_ica | DEC(5,2) | NO | 0 | |
| tipo_documento | varchar(20) | YES | NULL | |
| numero_documento | varchar(40) | YES | NULL | |
| nombres | varchar(120) | YES | NULL | |
| apellidos | varchar(120) | YES | NULL | |
| razon_social | varchar(200) | YES | NULL | |
| nit | varchar(40) | YES | NULL | |
| nombre_contacto | varchar(120) | YES | NULL | |
| telefono_contacto | varchar(30) | YES | NULL | |
| cargo_contacto | varchar(100) | YES | NULL | |
| email | varchar(255) | YES | NULL | |
| telefono | varchar(30) | YES | NULL | |
| direccion | varchar(255) | YES | NULL | |
| ciudad | varchar(120) | YES | NULL | |
| notas | text | YES | NULL | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, numero_documento], [tenant_id, nit]
- **IDX**: [tenant_id, tipo], [regimen_tributario]
- **CONCERN**: Unique on [tenant_id, nit] where nit can be NULL — in PostgreSQL this allows multiple NULLs per tenant (good), but unique index on nullable column is non-standard

---

### 34. `crm_contactos`
**Migration**: 2026_06_20_200000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| cliente_id | bigint | NO | | FK→crm_clientes.id CASCADE |
| nombre | varchar(150) | NO | | |
| cargo | varchar(100) | YES | NULL | |
| email | varchar(150) | YES | NULL | |
| telefono | varchar(50) | YES | NULL | |
| is_principal | boolean | NO | false | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO

---

### 35. `crm_oportunidades`
**Migration**: 2026_06_20_200000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| cliente_id | bigint | NO | | FK→crm_clientes.id CASCADE |
| titulo | varchar(150) | NO | | |
| valor_estimado | DEC(15,2) | NO | 0 | |
| etapa | varchar(50) | NO | 'prospecto' | |
| fecha_cierre_esperada | date | YES | NULL | |
| probabilidad | int | NO | 10 | |
| notas | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **CONCERN**: `probabilidad` is plain int with no CHECK constraint for 0-100 range

---

## MODULE: HR

### 36. `hr_empleados`
**Migrations**: 2026_06_20_000001, 2026_06_20_000002 (drops cargo/salario/fechas)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| user_id | bigint | YES | NULL | FK→users.id SET NULL |
| sede_id | bigint | NO | | FK→core_sedes.id CASCADE |
| documento | varchar(50) | NO | | UQ |
| nombres | varchar(100) | NO | | |
| apellidos | varchar(100) | NO | | |
| email | varchar(150) | YES | NULL | |
| telefono | varchar(50) | YES | NULL | |
| estado | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, estado]
- **CONCERN**: `documento` UQ is global, not per-tenant — could collide across tenants

---

### 37. `hr_asistencias`
**Migration**: 2026_06_20_000001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| empleado_id | bigint | NO | | FK→hr_empleados.id CASCADE |
| fecha | date | NO | | |
| tipo | varchar(50) | NO | 'asistencia' | |
| hora_entrada | time | YES | NULL | |
| hora_salida | time | YES | NULL | |
| notas | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via empleado)
- **softDeletes**: NO
- **UQ**: [empleado_id, fecha]

---

### 38. `hr_contratos`
**Migrations**: 2026_06_20_000002, 2026_06_20_000003

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| empleado_id | bigint | NO | | FK→hr_empleados.id CASCADE |
| cargo_id | bigint | YES | NULL | FK→hr_cargos.id SET NULL |
| tipo_contrato | varchar(100) | NO | | |
| cargo | varchar(100) | NO | | |
| salario_base | DEC(15,2) | NO | | |
| fecha_inicio | date | NO | | |
| fecha_fin | date | YES | NULL | |
| estado | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via empleado)
- **softDeletes**: NO

---

### 39. `hr_departamentos`
**Migration**: 2026_06_20_000003

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| nombre | varchar(100) | NO | | |
| descripcion | text | YES | NULL | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, nombre]

---

### 40. `hr_cargos`
**Migration**: 2026_06_20_000003

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| departamento_id | bigint | NO | | FK→hr_departamentos.id CASCADE |
| nombre | varchar(100) | NO | | |
| categoria_laboral | varchar(50) | NO | 'Operativo' | |
| salario_base_sugerido | DEC(15,2) | YES | NULL | |
| es_productivo | boolean | NO | false | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, nombre]

---

### 41. `hr_configuracion_legal`
**Migration**: 2026_06_20_000004

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| ano_vigencia | int | NO | | |
| salario_minimo | DEC(15,2) | NO | | |
| auxilio_transporte | DEC(15,2) | NO | | |
| tope_auxilio_transporte_salarios | DEC(5,2) | NO | 2 | |
| valor_uvt | DEC(15,2) | NO | | |
| horas_semanales | int | NO | 46 | |
| aporte_salud_empleado | DEC(5,2) | NO | 4 | |
| aporte_pension_empleado | DEC(5,2) | NO | 4 | |
| aporte_salud_patronal | DEC(5,2) | NO | 8.5 | |
| aporte_pension_patronal | DEC(5,2) | NO | 12 | |
| caja_compensacion | DEC(5,2) | NO | 4 | |
| sena | DEC(5,2) | NO | 2 | |
| icbf | DEC(5,2) | NO | 3 | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, ano_vigencia]

---

### 42. `hr_entidades_parafiscales`
**Migration**: 2026_06_20_000004

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| tipo_entidad | varchar(20) | NO | | |
| nombre | varchar(200) | NO | | |
| nit | varchar(50) | YES | NULL | |
| codigo_pila | varchar(50) | YES | NULL | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, tipo_entidad]

---

### 43. `hr_afiliaciones`
**Migration**: 2026_06_20_000004

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| empleado_id | bigint | NO | | FK→hr_empleados.id CASCADE |
| entidad_id | bigint | NO | | FK→hr_entidades_parafiscales.id CASCADE |
| fecha_afiliacion | date | NO | | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via empleado)
- **softDeletes**: NO
- **UQ**: [empleado_id, entidad_id]

---

### 44. `hr_prestamos`
**Migration**: 2026_06_20_000005

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| empleado_id | bigint | NO | | FK→hr_empleados.id CASCADE |
| monto_total | DEC(15,2) | NO | | |
| cuotas_pactadas | int | NO | | |
| monto_cuota | DEC(15,2) | NO | | |
| saldo_pendiente | DEC(15,2) | NO | | |
| fecha_prestamo | date | NO | | |
| estado | varchar(30) | NO | 'ACTIVO' | |
| observaciones | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: NO (inherits via empleado)
- **softDeletes**: YES
- **IDX**: [empleado_id, estado]

---

### 45. `hr_prestamo_cuotas`
**Migration**: 2026_06_20_000005

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| prestamo_id | bigint | NO | | FK→hr_prestamos.id CASCADE |
| numero_cuota | int | NO | | |
| monto | DEC(15,2) | NO | | |
| fecha_vencimiento | date | NO | | |
| estado | varchar(30) | NO | 'PENDIENTE' | |
| nomina_id | bigint | YES | NULL | IDX (no FK defined!) |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO
- **softDeletes**: NO
- **IDX**: [prestamo_id, estado], [nomina_id]
- **CONCERN**: `nomina_id` has no FK constraint despite being indexed

---

### 46. `hr_incapacidades`
**Migration**: 2026_06_20_000005

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| empleado_id | bigint | NO | | FK→hr_empleados.id CASCADE |
| tipo | varchar(50) | NO | | |
| fecha_inicio | date | NO | | |
| fecha_fin | date | NO | | |
| dias | int | NO | | |
| porcentaje_pago | DEC(5,2) | NO | 0 | |
| observaciones | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: NO (inherits via empleado)
- **softDeletes**: YES
- **IDX**: [empleado_id, fecha_inicio, fecha_fin]

---

## MODULE: INVENTORY

### 47. `inventory_categorias`
**Migration**: 2026_06_20_100000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| nombre | varchar(100) | NO | | |
| descripcion | text | YES | NULL | |
| is_active | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, nombre]

---

### 48. `inventory_marcas`
**Migration**: 2026_06_20_100000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| nombre | varchar(100) | NO | | |
| is_active | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, nombre]

---

### 49. `inventory_productos`
**Migrations**: 2026_06_20_100000, 2026_06_26_200000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| codigo | varchar(50) | NO | | |
| nombre | varchar(150) | NO | | |
| imagen_url | varchar(500) | YES | NULL | |
| descripcion | text | YES | NULL | |
| categoria_id | bigint | YES | NULL | FK→inventory_categorias.id SET NULL |
| marca_id | bigint | YES | NULL | FK→inventory_marcas.id SET NULL |
| unidad_medida | varchar(20) | NO | 'unidad' | |
| precio_venta | DEC(15,2) | NO | 0 | |
| costo_promedio | DEC(15,2) | NO | 0 | |
| stock_actual | DEC(15,4) | NO | 0 | |
| stock_minimo | DEC(15,4) | NO | 0 | |
| is_active | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, codigo]

---

### 50. `inventory_product_packs`
**Migration**: 2026_06_20_100000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| producto_id | bigint | NO | | FK→inventory_productos.id CASCADE |
| nombre | varchar(100) | NO | | |
| unidad_medida | varchar(20) | NO | | |
| factor_conversion | DEC(10,4) | NO | | |
| codigo_barras | varchar(100) | YES | NULL | |
| precio_venta | DEC(15,2) | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO

---

### 51. `inventory_adjustments`
**Migrations**: 2026_06_20_100000, 2026_06_20_100006

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| producto_id | bigint | NO | | FK→inventory_productos.id CASCADE |
| pack_id | bigint | YES | NULL | FK→inventory_product_packs.id SET NULL |
| bodega_id | bigint | NO | | FK→inventory_bodegas.id (nullable=false after backfill) |
| tipo | enum | NO | | 'entrada','salida','ajuste','inicial' |
| cantidad | DEC(15,4) | NO | | |
| factor_conversion | DEC(10,4) | NO | 1 | |
| cantidad_base | DEC(15,4) | NO | | |
| costo_unitario | DEC(15,2) | YES | NULL | |
| observaciones | text | YES | NULL | |
| referencia_type | varchar(255) | YES | NULL | morph |
| referencia_id | bigint | YES | NULL | morph |
| created_by | bigint | YES | NULL | FK→users.id SET NULL |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, producto_id], [tenant_id, tipo]

---

### 52. `inventory_bodegas`
**Migrations**: 2026_06_20_100003, 2026_06_20_130351

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| sede_id | bigint | YES | NULL | FK→core_sedes.id SET NULL |
| nombre | varchar(255) | NO | | |
| direccion | varchar(255) | YES | NULL | |
| es_principal | boolean | NO | false | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES

---

### 53. `inventory_stocks`
**Migration**: 2026_06_20_100003

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| producto_id | bigint | NO | | FK→inventory_productos.id CASCADE |
| bodega_id | bigint | NO | | FK→inventory_bodegas.id CASCADE |
| cantidad | DEC(15,4) | NO | 0 | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via producto)
- **softDeletes**: NO
- **UQ**: [producto_id, bodega_id]
- **CONCERN**: No tenant_id — relies on producto for tenant scoping

---

### 54. `inventory_traslados`
**Migration**: 2026_06_20_100004

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| bodega_origen_id | bigint | NO | | FK→inventory_bodegas.id |
| bodega_destino_id | bigint | NO | | FK→inventory_bodegas.id |
| numero | varchar(50) | NO | | |
| fecha | date | NO | | |
| estado | varchar(20) | NO | 'completado' | |
| notas | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES

---

### 55. `inventory_traslado_detalles`
**Migration**: 2026_06_20_100004

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| traslado_id | bigint | NO | | FK→inventory_traslados.id CASCADE |
| producto_id | bigint | NO | | FK→inventory_productos.id |
| cantidad | DEC(10,4) | NO | | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via traslado)
- **softDeletes**: NO

---

### 56. `inventory_recepciones`
**Migrations**: 2026_06_20_100001, 2026_06_20_100006, 2026_06_25_000000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| orden_compra_id | bigint unsigned | YES | NULL | soft reference (NO FK!) |
| bodega_id | bigint | NO | | FK→inventory_bodegas.id |
| numero | varchar(50) | NO | | |
| fecha | date | NO | | |
| metodo_pago | varchar(20) | NO | 'efectivo' | |
| monto_total | DEC(15,2) | NO | 0 | |
| caja_sesion_id | bigint | YES | NULL | FK→cash_caja_sesiones.id SET NULL |
| notas | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, numero]
- **CONCERN**: `orden_compra_id` is a soft reference with no FK — data integrity risk

---

### 57. `inventory_recepcion_detalles`
**Migration**: 2026_06_20_100002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| recepcion_id | bigint | NO | | FK→inventory_recepciones.id CASCADE |
| producto_id | bigint | NO | | FK→inventory_productos.id |
| cantidad | DEC(10,4) | NO | | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via recepcion)
- **softDeletes**: NO

---

## MODULE: NOTIFICATIONS

### 58. `notif_plantillas`
**Migration**: 2026_06_20_000001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| evento | varchar(50) | NO | | |
| nombre | varchar(120) | NO | | |
| asunto | varchar(200) | YES | NULL | |
| contenido | text | NO | | |
| canales | json | YES | NULL | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, evento]

---

### 59. `notif_notificaciones`
**Migration**: 2026_06_20_000001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| evento | varchar(50) | NO | | |
| referencia_type | varchar(255) | YES | NULL | morph |
| referencia_id | bigint | YES | NULL | morph |
| cliente_id | bigint | YES | NULL | (no FK defined!) |
| destinatario_nombre | varchar(150) | YES | NULL | |
| destinatario_email | varchar(150) | YES | NULL | |
| destinatario_telefono | varchar(40) | YES | NULL | |
| titulo | varchar(200) | YES | NULL | |
| mensaje | text | NO | | |
| canales | json | NO | | |
| canal_estados | json | YES | NULL | |
| estado | varchar(20) | NO | 'pendiente' | |
| error | text | YES | NULL | |
| enviado_por | bigint | YES | NULL | FK→users.id SET NULL |
| fecha_envio | timestamp | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, estado], [tenant_id, evento]
- **CONCERN**: `cliente_id` has no FK constraint

---

## MODULE: PAYROLL

### 60. `pay_nominas`
**Migrations**: 2026_06_20_000001, 2026_06_20_000002 (extends)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| periodo_id | bigint | YES | NULL | FK→pay_periodos_nomina.id SET NULL |
| mes | varchar(7) | NO | | |
| fecha_inicio | date | NO | | |
| fecha_fin | date | NO | | |
| estado | varchar(50) | NO | 'borrador' | |
| empleado_id | bigint | NO | | FK→hr_empleados.id CASCADE (from _detalles) |
| contrato_id | bigint | YES | NULL | FK→hr_contratos.id SET NULL |
| dias_laborados | int | NO | 30 | |
| salario_base | DEC(15,2) | NO | | |
| auxilio_transporte | DEC(15,2) | NO | 0 | |
| ibc_seguridad_social | DEC(15,2) | NO | 0 | |
| ibc_parafiscales | DEC(15,2) | NO | 0 | |
| total_provisiones | DEC(15,2) | NO | 0 | |
| total_aportes_patronales | DEC(15,2) | NO | 0 | |
| costo_laboral_total | DEC(15,2) | NO | 0 | |
| created_by | bigint | YES | NULL | FK→users.id SET NULL |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **NOTE**: This table is extended across 2 migrations — final schema combines fields from both

---

### 61. `pay_nomina_detalles`
**Migrations**: 2026_06_20_000001, 2026_06_20_000002 (restructures)

Final schema after all migrations:

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| nomina_id | bigint | NO | | FK→pay_nominas.id CASCADE |
| empleado_id | bigint | NO | | FK→hr_empleados.id CASCADE |
| contrato_id | bigint | YES | NULL | FK→hr_contratos.id SET NULL |
| concepto_id | bigint | YES | NULL | FK→pay_conceptos_nomina.id SET NULL |
| cantidad | DEC(10,2) | NO | 1 | |
| valor | DEC(15,2) | NO | 0 | |
| base_calculo | DEC(15,2) | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via nomina)
- **softDeletes**: NO

---

### 62. `pay_novedades`
**Migrations**: 2026_06_20_000001, 2026_06_20_000002 (extends)

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| empleado_id | bigint | NO | | FK→hr_empleados.id CASCADE |
| concepto_id | bigint | YES | NULL | FK→pay_conceptos_nomina.id SET NULL |
| nomina_id | bigint | YES | NULL | FK→pay_nominas.id SET NULL |
| periodo_id | bigint | YES | NULL | FK→pay_periodos_nomina.id SET NULL |
| tipo | varchar(50) | NO | | |
| concepto | varchar(150) | NO | | |
| valor | DEC(15,2) | NO | | |
| fecha_registro | date | NO | | |
| estado | varchar(50) | NO | 'pendiente' | |
| referencia_type | varchar(255) | YES | NULL | morph |
| referencia_id | bigint | YES | NULL | morph |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via empleado)
- **softDeletes**: NO

---

### 63. `pay_conceptos_nomina`
**Migration**: 2026_06_20_000002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| codigo | varchar(20) | NO | | |
| nombre | varchar(200) | NO | | |
| tipo | varchar(30) | NO | | |
| cuenta_contable_id | bigint | YES | NULL | IDX (no FK!) |
| base_seguridad_social | boolean | NO | false | |
| base_parafiscales | boolean | NO | false | |
| base_prestaciones | boolean | NO | false | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, codigo]
- **CONCERN**: `cuenta_contable_id` indexed but has no FK constraint

---

### 64. `pay_periodos_nomina`
**Migration**: 2026_06_20_000002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| codigo | varchar(30) | NO | | |
| fecha_inicio | date | NO | | |
| fecha_fin | date | NO | | |
| mes_contable | varchar(7) | NO | | |
| estado | varchar(30) | NO | 'BORRADOR' | |
| total_devengado | DEC(15,2) | NO | 0 | |
| total_deducciones | DEC(15,2) | NO | 0 | |
| total_provisiones | DEC(15,2) | NO | 0 | |
| total_aportes_patronales | DEC(15,2) | NO | 0 | |
| neto_pagar | DEC(15,2) | NO | 0 | |
| observaciones | text | YES | NULL | |
| created_by | bigint | YES | NULL | FK→users.id SET NULL |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, codigo]
- **IDX**: [tenant_id, estado]

---

### 65. `pay_provisiones_acumuladas`
**Migration**: 2026_06_20_000002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| empleado_id | bigint | NO | | FK→hr_empleados.id CASCADE |
| tipo_provision | varchar(30) | NO | | |
| ano | int | NO | | |
| saldo_inicial | DEC(15,2) | NO | 0 | |
| movimiento_mes | DEC(15,2) | NO | 0 | |
| saldo_final | DEC(15,2) | NO | 0 | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [empleado_id, tipo_provision, ano]

---

### 66. `pay_parametros_contables`
**Migration**: 2026_06_20_000002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| concepto_id | bigint | NO | | FK→pay_conceptos_nomina.id CASCADE |
| categoria_laboral | varchar(50) | NO | | |
| cuenta_debito_id | bigint | YES | NULL | IDX (no FK!) |
| cuenta_credito_id | bigint | YES | NULL | IDX (no FK!) |
| centro_costo_id | bigint | YES | NULL | IDX (no FK!) |
| fecha_inicio | date | NO | | |
| fecha_fin | date | YES | NULL | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [concepto_id, categoria_laboral], [cuenta_debito_id], [cuenta_credito_id], [centro_costo_id]
- **CONCERN**: 3 FK-eligible columns (cuenta_debito_id, cuenta_credito_id, centro_costo_id) indexed but missing actual FK constraints

---

## MODULE: PURCHASING

### 67. `purchasing_proveedores`
**Migrations**: 2026_06_20_000000, 2026_06_26_190000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| tipo_documento | varchar(20) | YES | NULL | |
| numero_documento | varchar(40) | YES | NULL | |
| razon_social | varchar(200) | NO | | |
| regimen_tributario | varchar(30) | NO | 'simplificado' | IDX |
| porcentaje_retencion_fuente | DEC(5,2) | NO | 0 | |
| porcentaje_retencion_iva | DEC(5,2) | NO | 0 | |
| porcentaje_retencion_ica | DEC(5,2) | NO | 0 | |
| nombre_contacto | varchar(120) | YES | NULL | |
| email | varchar(255) | YES | NULL | |
| telefono | varchar(30) | YES | NULL | |
| direccion | varchar(255) | YES | NULL | |
| ciudad | varchar(120) | YES | NULL | |
| notas | text | YES | NULL | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **IDX**: [regimen_tributario]

---

### 68. `purchasing_ordenes`
**Migration**: 2026_06_20_000001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| proveedor_id | bigint | NO | | FK→purchasing_proveedores.id |
| numero | varchar(50) | NO | | |
| estado | varchar(20) | NO | 'borrador' | |
| fecha_emision | date | NO | | |
| fecha_esperada | date | YES | NULL | |
| subtotal | DEC(15,2) | NO | 0 | |
| impuestos | DEC(15,2) | NO | 0 | |
| total | DEC(15,2) | NO | 0 | |
| notas | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, numero]

---

### 69. `purchasing_orden_detalles`
**Migration**: 2026_06_20_110000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| orden_compra_id | bigint | NO | | FK→purchasing_ordenes.id CASCADE |
| producto_id | bigint | NO | | FK→inventory_productos.id |
| cantidad | DEC(10,4) | NO | | |
| precio_unitario | DEC(15,2) | NO | | |
| subtotal | DEC(15,2) | NO | | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via orden)
- **softDeletes**: NO

---

## MODULE: SALES

### 70. `sales_facturas`
**Migrations**: 2026_06_20_142001, 2026_06_20_142002, 2026_06_23_120000, 2026_06_26_160000

Final schema:

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| sede_id | bigint | YES | NULL | FK→core_sedes.id SET NULL |
| cliente_id | bigint | YES | NULL | FK→crm_clientes.id SET NULL |
| orden_id | bigint | YES | NULL | FK→sd_ordenes.id SET NULL |
| user_id | bigint | NO | | FK→users.id CASCADE |
| numero | varchar(50) | NO | | UQ |
| tipo_documento | varchar(50) | NO | 'factura' | |
| subtotal | DEC(15,2) | NO | 0 | |
| impuestos | DEC(15,2) | NO | 0 | |
| descuento | DEC(15,2) | NO | 0 | |
| total | DEC(15,2) | NO | 0 | |
| estado | varchar(20) | NO | 'pagada' | |
| anulada | boolean | NO | false | |
| anulada_at | timestamp | YES | NULL | |
| anulada_por | bigint | YES | NULL | FK→users.id SET NULL |
| motivo_anulacion | text | YES | NULL | |
| metodo_pago | varchar(50) | NO | 'efectivo' | |
| notas | text | YES | NULL | |
| cufe | varchar(255) | YES | NULL | |
| qr_code | text | YES | NULL | |
| dian_estado | varchar(50) | NO | 'borrador' | |
| dian_mensaje | text | YES | NULL | |
| dian_fecha_envio | timestamp | YES | NULL | |
| dian_track_id | varchar(255) | YES | NULL | |
| resolucion_id | bigint | YES | NULL | FK→sales_resoluciones.id SET NULL |
| factura_origen_id | bigint | YES | NULL | FK→sales_facturas.id SET NULL |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: numero (global — not per-tenant!)
- **IDX**: [tenant_id, estado], [tenant_id, numero], [tenant_id, dian_estado], [tenant_id, orden_id]
- **CONCERN**: `numero` has a global UNIQUE, not scoped to tenant — could collide

---

### 71. `sales_factura_items`
**Migration**: 2026_06_20_142001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| factura_id | bigint | NO | | FK→sales_facturas.id CASCADE |
| producto_id | bigint | YES | NULL | FK→inventory_productos.id SET NULL |
| descripcion | varchar(255) | NO | | |
| cantidad | DEC(10,2) | NO | | |
| precio_unitario | DEC(15,2) | NO | | |
| tasa_impuesto | DEC(5,2) | NO | 0 | |
| subtotal | DEC(15,2) | NO | | |
| impuesto_total | DEC(15,2) | NO | | |
| total | DEC(15,2) | NO | | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via factura)
- **softDeletes**: NO

---

### 72. `sales_certificados`
**Migration**: 2026_06_20_142002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| nombre_archivo | varchar(255) | NO | | |
| pfx_path | text | NO | | |
| password | text | NO | | |
| fecha_vencimiento | date | YES | NULL | |
| is_active | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **CONCERN**: `password` stored as plaintext text — should be encrypted at app level

---

### 73. `sales_resoluciones`
**Migration**: 2026_06_20_142002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| tipo_documento | varchar(50) | NO | 'factura' | |
| numero_resolucion | varchar(100) | NO | | |
| prefijo | varchar(10) | YES | NULL | |
| rango_desde | bigint unsigned | NO | | |
| rango_hasta | bigint unsigned | NO | | |
| consecutivo_actual | bigint unsigned | NO | | |
| fecha_desde | date | NO | | |
| fecha_hasta | date | NO | | |
| clave_tecnica | varchar(255) | YES | NULL | |
| is_active | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO

---

### 74. `sales_dian_eventos`
**Migration**: 2026_06_20_142002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| factura_id | bigint | NO | | FK→sales_facturas.id CASCADE |
| estado | varchar(50) | NO | | |
| mensaje | text | YES | NULL | |
| xml_enviado | text | YES | NULL | |
| xml_respuesta | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via factura)
- **softDeletes**: NO

---

## MODULE: SERVICE DESK

### 75. `sd_tickets`
**Migrations**: 2026_06_20_141001, 2026_06_20_141002

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| user_id | bigint | NO | | FK→users.id CASCADE |
| cliente_id | bigint | YES | NULL | FK→crm_clientes.id SET NULL |
| agente_id | bigint | YES | NULL | FK→users.id SET NULL |
| tipo | varchar(50) | NO | 'orden_trabajo' | |
| asunto | varchar(255) | NO | | |
| equipo_descripcion | varchar(255) | YES | NULL | |
| descripcion | text | NO | | |
| estado | varchar(50) | NO | 'abierto' | |
| prioridad | varchar(20) | NO | 'media' | |
| costo_estimado | DEC(12,2) | YES | NULL | |
| fecha_resolucion | timestamp | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, estado]

---

### 76. `sd_mensajes`
**Migration**: 2026_06_20_141001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| ticket_id | bigint | NO | | FK→sd_tickets.id CASCADE |
| user_id | bigint | NO | | FK→users.id CASCADE |
| mensaje | text | NO | | |
| es_interno | boolean | NO | false | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via ticket)
- **softDeletes**: NO

---

### 77. `sd_tipos_equipo`
**Migration**: 2026_06_20_141003

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| nombre | varchar(120) | NO | | |
| slug | varchar(120) | YES | NULL | |
| familia | varchar(120) | YES | NULL | |
| descripcion | text | YES | NULL | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, nombre]

---

### 78. `sd_marcas`
**Migration**: 2026_06_20_141003

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| nombre | varchar(120) | NO | | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, nombre]

---

### 79. `sd_modelos`
**Migration**: 2026_06_20_141003

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| marca_id | bigint | YES | NULL | FK→sd_marcas.id SET NULL |
| tipo_equipo_id | bigint | YES | NULL | FK→sd_tipos_equipo.id SET NULL |
| nombre | varchar(150) | NO | | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **IDX**: [tenant_id, marca_id], [tenant_id, tipo_equipo_id]

---

### 80. `sd_servicios`
**Migrations**: 2026_06_20_141004, 2026_06_26_200000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| tipo_equipo_id | bigint | YES | NULL | FK→sd_tipos_equipo.id SET NULL |
| nombre | varchar(150) | NO | | |
| imagen_url | varchar(500) | YES | NULL | |
| codigo | varchar(50) | YES | NULL | |
| descripcion | text | YES | NULL | |
| precio_base | DEC(15,2) | NO | 0 | |
| costo_tecnico_base | DEC(15,2) | NO | 0 | |
| tipo_comision_tecnico | varchar(20) | NO | 'fijo' | |
| tiempo_estimado | int | YES | NULL | |
| requiere_repuestos | boolean | NO | false | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **IDX**: [tenant_id, tipo_equipo_id]

---

### 81. `sd_fallas_base`
**Migration**: 2026_06_20_141004

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| tipo_equipo_id | bigint | YES | NULL | FK→sd_tipos_equipo.id SET NULL |
| nombre | varchar(150) | NO | | |
| descripcion | text | YES | NULL | |
| solucion_sugerida | text | YES | NULL | |
| tiempo_estimado | int | YES | NULL | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **IDX**: [tenant_id, tipo_equipo_id]

---

### 82. `sd_checklist_items`
**Migration**: 2026_06_20_141004

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| tipo_equipo_id | bigint | YES | NULL | FK→sd_tipos_equipo.id SET NULL |
| categoria | varchar(20) | NO | | |
| subtipo | varchar(50) | YES | NULL | |
| nombre | varchar(150) | NO | | |
| icono | varchar(50) | YES | NULL | |
| descripcion | text | YES | NULL | |
| orden | int | NO | 0 | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **IDX**: [tenant_id, tipo_equipo_id, categoria]

---

### 83. `sd_ordenes`
**Migrations**: 2026_06_20_141005, 2026_06_20_141006, 2026_06_20_141008, 2026_06_20_141009, 2026_06_23_003514

Final schema:

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| numero_orden | varchar(50) | NO | | |
| cliente_id | bigint | NO | | FK→crm_clientes.id |
| modelo_id | bigint | YES | NULL | FK→sd_modelos.id SET NULL |
| tipo_equipo_id | bigint | YES | NULL | FK→sd_tipos_equipo.id SET NULL |
| tipo_equipo_manual | varchar(150) | YES | NULL | |
| numero_serie | varchar(100) | YES | NULL | |
| accesorios_equipo | text | YES | NULL | |
| observaciones_equipo | text | YES | NULL | |
| condicion_inicial | text | YES | NULL | |
| fallas_checklist | json | YES | NULL | |
| accesorios_checklist | json | YES | NULL | |
| fallas_otras | text | YES | NULL | |
| accesorios_otros | text | YES | NULL | |
| bloqueado | boolean | NO | false | |
| bloqueado_en | timestamp | YES | NULL | |
| tipo_bloqueo | varchar(20) | YES | NULL | |
| codigo_bloqueo | text | YES | NULL | |
| estado | varchar(20) | NO | 'recibido' | |
| notas_fases | json | YES | NULL | |
| fecha_recibido | timestamp | NO | CURRENT | |
| fecha_entregado | timestamp | YES | NULL | |
| tecnico_id | bigint | YES | NULL | (FK dropped — now bare integer) |
| prestador_id | bigint | YES | NULL | FK→sd_prestadores.id SET NULL |
| tipo_comision | varchar(20) | NO | 'FIJO' | |
| valor_comision_fijo | DEC(15,2) | YES | NULL | |
| porcentaje_comision | DEC(5,2) | YES | NULL | |
| tipo_mano_obra | varchar(30) | YES | NULL | |
| mano_obra_descripcion | text | YES | NULL | |
| precio_cliente | DEC(15,2) | NO | 0 | |
| descuento | DEC(12,2) | NO | 0 | |
| costo_tecnico | DEC(15,2) | NO | 0 | |
| costo_tecnico_manual | boolean | NO | false | |
| costo_diagnostico | DEC(15,2) | NO | 0 | |
| costo_revision | DEC(15,2) | NO | 0 | |
| total_final | DEC(15,2) | NO | 0 | |
| abono_inicial | DEC(15,2) | NO | 0 | |
| created_by | bigint | YES | NULL | FK→users.id SET NULL |
| updated_by | bigint | YES | NULL | FK→users.id SET NULL |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **UQ**: [tenant_id, numero_orden]
- **IDX**: [tenant_id, estado], [tenant_id, cliente_id]
- **CONCERN**: `tecnico_id` lost its FK constraint in migration 2026_06_20_141008 — orphan risk

---

### 84. `sd_orden_servicio`
**Migration**: 2026_06_20_141005

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| orden_id | bigint | NO | | FK→sd_ordenes.id CASCADE |
| servicio_id | bigint | YES | NULL | FK→sd_servicios.id SET NULL |
| descripcion | varchar(200) | YES | NULL | |
| cantidad | DEC(10,2) | NO | 1 | |
| precio_aplicado | DEC(15,2) | NO | 0 | |
| costo_tecnico_aplicado | DEC(15,2) | NO | 0 | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via orden)
- **softDeletes**: NO

---

### 85. `sd_orden_repuesto`
**Migration**: 2026_06_20_141005

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| orden_id | bigint | NO | | FK→sd_ordenes.id CASCADE |
| producto_id | bigint | YES | NULL | FK→inventory_productos.id SET NULL |
| descripcion | varchar(200) | YES | NULL | |
| cantidad | DEC(10,2) | NO | 1 | |
| precio_unitario | DEC(15,2) | NO | 0 | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via orden)
- **softDeletes**: NO

---

### 86. `sd_orden_multimedia`
**Migrations**: 2026_06_20_141005, 2026_06_26_200000

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| orden_id | bigint | NO | | FK→sd_ordenes.id CASCADE |
| ruta | varchar(255) | NO | | |
| tipo | varchar(20) | NO | 'imagen' | |
| fase | varchar(30) | YES | NULL | |
| mime_type | varchar(50) | YES | NULL | |
| tamaño | bigint unsigned | YES | NULL | |
| duracion | DEC(8,2) | YES | NULL | |
| nombre_original | varchar(255) | YES | NULL | |
| descripcion | varchar(200) | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via orden)
- **softDeletes**: NO

---

### 87. `sd_prestadores`
**Migration**: 2026_06_20_141007

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| tipo_documento | varchar(20) | NO | 'CC' | |
| numero_documento | varchar(50) | YES | NULL | |
| nombre_completo | varchar(200) | NO | | |
| email | varchar(150) | YES | NULL | |
| telefono | varchar(50) | YES | NULL | |
| tipo_vinculacion | varchar(30) | NO | 'CONTRATISTA' | |
| porcentaje_comision | DEC(5,2) | YES | NULL | |
| empleado_id | bigint unsigned | YES | NULL | FK→hr_empleados.id SET NULL (conditional) |
| user_id | bigint | YES | NULL | FK→users.id SET NULL |
| es_gratuito | boolean | NO | false | |
| activo | boolean | NO | true | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, activo]

---

### 88. `sd_comisiones_liquidaciones`
**Migrations**: 2026_06_20_141008, 2026_06_26_164250

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| codigo | varchar(30) | NO | | |
| verification_token | varchar(64) | YES | NULL | UQ |
| prestador_id | bigint | NO | | FK→sd_prestadores.id CASCADE |
| periodo_inicio | date | NO | | |
| periodo_fin | date | NO | | |
| total_comisiones | DEC(15,2) | NO | 0 | |
| estado | varchar(30) | NO | 'BORRADOR' | |
| observaciones | text | YES | NULL | |
| aprobado_por | bigint | YES | NULL | FK→users.id SET NULL |
| fecha_aprobacion | timestamp | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **UQ**: [tenant_id, codigo], [verification_token]
- **IDX**: [tenant_id, prestador_id, estado]

---

### 89. `sd_comisiones_detalles`
**Migrations**: 2026_06_20_141008, 2026_06_20_141009

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| liquidacion_id | bigint | NO | | FK→sd_comisiones_liquidaciones.id CASCADE |
| orden_id | bigint | NO | | FK→sd_ordenes.id CASCADE |
| tipo_comision | varchar(20) | YES | NULL | |
| concepto | varchar(200) | NO | | |
| base_calculo | DEC(15,2) | NO | | |
| porcentaje_comision | DEC(5,2) | YES | NULL | |
| valor_comision | DEC(15,2) | NO | | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: NO (inherits via liquidacion)
- **softDeletes**: NO

---

### 90. `sd_comisiones_pagos`
**Migration**: 2026_06_20_141008

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| liquidacion_id | bigint | NO | | FK→sd_comisiones_liquidaciones.id CASCADE |
| prestador_id | bigint | NO | | FK→sd_prestadores.id CASCADE |
| monto | DEC(15,2) | NO | | |
| metodo_pago | varchar(50) | YES | NULL | |
| referencia_pago | varchar(100) | YES | NULL | |
| fecha_pago | timestamp | YES | NULL | |
| estado | varchar(30) | NO | 'PENDIENTE' | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |

- **ten**: YES
- **softDeletes**: NO
- **IDX**: [tenant_id, estado]

---

### 91. `sd_orden_actividades`
**Migration**: 2026_06_22_000001

| Column | Type | Nullable | Default | Constraints |
|---|---|---|---|---|
| id | bigint | NO | auto | PK |
| tenant_id | bigint | NO | | FK→tenants.id CASCADE |
| orden_id | bigint | NO | | FK→sd_ordenes.id CASCADE |
| prestador_id | bigint | YES | NULL | FK→sd_prestadores.id SET NULL |
| servicio_id | bigint | YES | NULL | FK→sd_servicios.id SET NULL |
| resultado | varchar(30) | NO | 'exitoso' | |
| horas_invertidas | DEC(8,2) | NO | 0 | |
| costo_hora | DEC(15,2) | NO | 0 | |
| costo_total | DEC(15,2) | NO | 0 | |
| comision_tipo | varchar(20) | YES | NULL | |
| comision_valor | DEC(15,2) | NO | 0 | |
| descripcion | text | YES | NULL | |
| created_at | timestamp | YES | NULL | |
| updated_at | timestamp | YES | NULL | |
| deleted_at | timestamp | YES | NULL | softDeletes |

- **ten**: YES
- **softDeletes**: YES
- **IDX**: [tenant_id, orden_id], [tenant_id, prestador_id]

---

## SUMMARY OF CONCERNS

### Critical Data Type Issues
| Table | Column | Issue |
|---|---|---|
| sales_facturas | numero | **Global UQ** (not per-tenant) — will collide if two tenants share a number sequence |
| hr_empleados | documento | **Global UQ** — same collision risk across tenants |
| taxes | codigo | **Global UQ** — same collision risk |
| sales_certificados | password | **Plaintext** — must encrypt at app level |
| sd_ordenes | tecnico_id | **FK dropped** — now bare nullable bigint, orphan risk |
| inventory_recepciones | orden_compra_id | **Soft reference** — no FK constraint |
| notif_notificaciones | cliente_id | **No FK** — orphan risk |
| hr_prestamo_cuotas | nomina_id | **No FK** — indexed but unconstrained |
| pay_conceptos_nomina | cuenta_contable_id | **No FK** — indexed but unconstrained |
| pay_parametros_contables | cuenta_debito_id, cuenta_credito_id, centro_costo_id | **No FKs** — all indexed but unconstrained |
| crm_oportunidades | probabilidad | **No CHECK** — should be 0-100 range |
| inventory_stocks | (no tenant_id) | Relies on producto FK for tenant scoping — fragile |

### Missing tenant_id Tables (inheriting via FK only)
These tables have no `tenant_id` column and rely entirely on parent table FK for tenant scoping:
- `hr_asistencias`, `hr_contratos`, `hr_afiliaciones`, `hr_prestamos`, `hr_prestamo_cuotas`, `hr_incapacidades`
- `inventory_stocks`, `inventory_traslado_detalles`, `inventory_recepcion_detalles`
- `cash_arqueo_detalles`
- `sales_factura_items`, `sales_dian_eventos`
- `sd_mensajes`, `sd_orden_servicio`, `sd_orden_repuesto`, `sd_orden_multimedia`, `sd_comisiones_detalles`
- `pay_nomina_detalles`, `pay_novedades`

### Tables with softDeletes
`core_sedes`, `crm_clientes`, `hr_prestamos`, `hr_incapacidades`, `inventory_categorias`, `inventory_marcas`, `inventory_productos`, `inventory_bodegas`, `inventory_recepciones`, `inventory_traslados`, `purchasing_proveedores`, `purchasing_ordenes`, `sd_tipos_equipo`, `sd_marcas`, `sd_modelos`, `sd_servicios`, `sd_fallas_base`, `sd_checklist_items`, `sd_ordenes`, `sd_orden_actividades`, `pay_conceptos_nomina`

### Tables WITHOUT tenant_id
`password_reset_tokens`, `sessions`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs`, `modules` (global catalog)

---

**Files touched**: (none — read-only audit)
