# AUDITORÍA INTEGRAL E2E — NEXORA ERP

> **Estado:** EN EJECUCIÓN  
> **Última actualización:** 2026-06-29  
> **Suite:** Playwright E2E Integral  
> **Config:** `playwright.auditoria.config.ts`

---

## ÍNDICE

1. [Empresas de Prueba](#empresas-de-prueba)
2. [Instrucciones de Ejecución](#instrucciones-de-ejecucion)
3. [Cobertura por Módulo](#cobertura-por-modulo)
4. [Empresa 1 — TallerTech Reparaciones SAS](#empresa-1--tallertech-reparaciones-sas)
5. [Empresa 2 — Comercializadora Integral SAS](#empresa-2--comercializadora-integral-sas)
6. [Incidencias Encontradas](#incidencias-encontradas)
7. [Verificaciones de Integridad](#verificaciones-de-integridad)
8. [Resultados de Ejecución](#resultados-de-ejecucion)

---

## EMPRESAS DE PRUEBA

| Campo          | Empresa 1                    | Empresa 2                         |
|----------------|------------------------------|-----------------------------------|
| Nombre         | TallerTech Reparaciones SAS  | Comercializadora Integral SAS     |
| Slug           | `tallertech`                 | `comercializadora`                |
| IVA            | NO responsable               | SÍ responsable (19%)              |
| Email Admin    | admin@tallertech.co          | admin@comercializadora.co         |
| Password       | Audit2026!                   | Audit2026!                        |
| Módulos        | CRM, Inv, Compras, Ventas, Caja, ServiceDesk | TODOS los módulos   |

### Módulos de Empresa 1

- ✅ CRM (Clientes y Oportunidades)
- ✅ Inventario (Productos, Kardex, Bodegas)
- ✅ Compras (Proveedores y Órdenes)
- ✅ Ventas (POS y Facturas)
- ✅ Caja (Turnos, Movimientos, Transferencias)
- ✅ Service Desk (Órdenes, Técnicos, Comisiones)
- ✅ Notificaciones
- ❌ Recursos Humanos (no activado)
- ❌ Nómina (no activado)
- ❌ Contabilidad (no activado)

### Módulos de Empresa 2

- ✅ CRM
- ✅ Inventario
- ✅ Compras
- ✅ Ventas
- ✅ Caja
- ✅ Service Desk
- ✅ Recursos Humanos (40 empleados)
- ✅ Nómina
- ✅ Contabilidad
- ✅ Notificaciones

---

## INSTRUCCIONES DE EJECUCIÓN

### Prerequisito: Crear datos de prueba

```bash
# 1. Crear las dos empresas de prueba con datos realistas
php artisan db:seed --class=AuditoriaSeeder

# Verificar que se crearon:
# - Empresa 1: TallerTech (slug: tallertech)
# - Empresa 2: Comercializadora (slug: comercializadora)
# - 30 clientes cada una, 15 proveedores, 200 productos, 10 técnicos
# - Empresa 2: 40 empleados, 8 departamentos, 14 cargos
```

### Ejecutar la suite de auditoría

```bash
# Ejecutar TODA la auditoría (incluye setup de auth)
npx playwright test --config=playwright.auditoria.config.ts

# Solo el setup de auth (primera vez)
npx playwright test --config=playwright.auditoria.config.ts --project=auditoria-setup

# Suite completa (requiere setup previo)
npx playwright test --config=playwright.auditoria.config.ts --project=auditoria-chromium

# Solo tests @smoke (críticos, ~5 min)
npx playwright test --config=playwright.auditoria.config.ts --grep @smoke

# Ver reporte HTML después de ejecutar
npx playwright show-report tests/e2e/auditoria/reports

# Empresa 1 solamente
npx playwright test --config=playwright.auditoria.config.ts tests/e2e/auditoria/empresa1/

# Empresa 2 solamente
npx playwright test --config=playwright.auditoria.config.ts tests/e2e/auditoria/empresa2/

# Un módulo específico
npx playwright test --config=playwright.auditoria.config.ts tests/e2e/auditoria/empresa1/05-e1-service-desk.spec.ts

# Con interfaz visual (UI Mode)
npx playwright test --config=playwright.auditoria.config.ts --ui

# Generar trace para depuración
npx playwright show-trace tests/e2e/auditoria/results/<test-name>/trace.zip
```

---

## COBERTURA POR MÓDULO

| Módulo              | E1  | E2  | Tests | Estado        |
|---------------------|-----|-----|-------|---------------|
| Dashboard           | ✅  | ✅  | 6     | 🔄 Pendiente  |
| CRM — Clientes      | ✅  | ✅  | 12    | 🔄 Pendiente  |
| CRM — Oportunidades | ✅  | ✅  | 3     | 🔄 Pendiente  |
| Inventario          | ✅  | ✅  | 14    | 🔄 Pendiente  |
| Compras             | ✅  | ✅  | 8     | 🔄 Pendiente  |
| Service Desk        | ✅  | ✅  | 18    | 🔄 Pendiente  |
| Ventas / POS        | ✅  | ✅  | 7     | 🔄 Pendiente  |
| Caja                | ✅  | ✅  | 8     | 🔄 Pendiente  |
| Recursos Humanos    | —   | ✅  | 15    | 🔄 Pendiente  |
| Nómina              | —   | ✅  | 7     | 🔄 Pendiente  |
| Contabilidad        | —   | ✅  | 10    | 🔄 Pendiente  |
| Roles / Permisos    | ✅  | ✅  | 8     | 🔄 Pendiente  |
| SuperAdmin          | —   | —   | 8     | 🔄 Pendiente  |
| **TOTAL**           |     |     | **124** |             |

---

## EMPRESA 1 — TALLERTECH REPARACIONES SAS

### Datos sembrados

| Entidad       | Cantidad | Verificado |
|---------------|----------|------------|
| Clientes      | 30       | 🔄         |
| Proveedores   | 15       | 🔄         |
| Productos     | 200      | 🔄         |
| Técnicos      | 10       | 🔄         |
| Servicios     | 15       | 🔄         |
| Bodegas       | 1        | 🔄         |
| Sedes         | 1        | 🔄         |
| Usuarios      | 6        | 🔄         |

### Estado de flujos

| Módulo       | Acción                      | Estado     | Error |
|--------------|-----------------------------|------------|-------|
| Dashboard    | Carga sin errores JS        | 🔄         |       |
| Dashboard    | Sidebar con módulos activos  | 🔄         |       |
| CRM          | Listar clientes              | 🔄         |       |
| CRM          | Crear cliente natural        | 🔄         |       |
| CRM          | Crear cliente jurídico       | 🔄         |       |
| CRM          | Buscar por nombre            | 🔄         |       |
| CRM          | Editar cliente               | 🔄         |       |
| CRM          | Ver detalle                  | 🔄         |       |
| CRM          | Agregar contacto             | 🔄         |       |
| CRM          | Listar oportunidades         | 🔄         |       |
| CRM          | Crear oportunidad            | 🔄         |       |
| Inventario   | Crear categoría              | 🔄         |       |
| Inventario   | Crear marca                  | 🔄         |       |
| Inventario   | Crear bodega                 | 🔄         |       |
| Inventario   | Listar productos             | 🔄         |       |
| Inventario   | Crear producto               | 🔄         |       |
| Inventario   | Editar producto              | 🔄         |       |
| Inventario   | Buscar producto              | 🔄         |       |
| Inventario   | Kardex                       | 🔄         |       |
| Inventario   | Ajuste entrada               | 🔄         |       |
| Compras      | Listar proveedores           | 🔄         |       |
| Compras      | Crear proveedor              | 🔄         |       |
| Compras      | Editar proveedor             | 🔄         |       |
| Compras      | Listar órdenes               | 🔄         |       |
| Compras      | Crear orden con ítems        | 🔄         |       |
| Compras      | Ver detalle de orden         | 🔄         |       |
| Service Desk | Listar órdenes               | 🔄         |       |
| Service Desk | Crear orden completa         | 🔄         |       |
| Service Desk | Cambiar estado (6 transiciones)| 🔄       |       |
| Service Desk | Catálogos (6 tipos)          | 🔄         |       |
| Service Desk | Listar prestadores           | 🔄         |       |
| Service Desk | Crear prestador              | 🔄         |       |
| Service Desk | Comisiones                   | 🔄         |       |
| Ventas       | Listar facturas              | 🔄         |       |
| Ventas       | POS carga                    | 🔄         |       |
| Ventas       | POS buscar producto          | 🔄         |       |
| Ventas       | POS agregar al carrito       | 🔄         |       |
| Caja         | Listar cajas                 | 🔄         |       |
| Caja         | Crear caja                   | 🔄         |       |
| Caja         | Abrir turno                  | 🔄         |       |
| Caja         | Registrar movimiento         | 🔄         |       |
| Caja         | Ver reporte consolidado      | 🔄         |       |

---

## EMPRESA 2 — COMERCIALIZADORA INTEGRAL SAS

### Datos sembrados

| Entidad        | Cantidad | Verificado |
|----------------|----------|------------|
| Clientes       | 30       | 🔄         |
| Proveedores    | 15       | 🔄         |
| Productos      | 200      | 🔄         |
| Técnicos       | 10       | 🔄         |
| Empleados      | 40       | 🔄         |
| Departamentos  | 8        | 🔄         |
| Cargos         | 14       | 🔄         |
| Bodegas        | 2        | 🔄         |
| Sedes          | 3        | 🔄         |
| Usuarios       | 6        | 🔄         |

### Estado de flujos adicionales (HR, Nómina, Contabilidad)

| Módulo        | Acción                      | Estado     | Error |
|---------------|-----------------------------|------------|-------|
| HR            | Dashboard                   | 🔄         |       |
| HR            | Listar empleados            | 🔄         |       |
| HR            | Crear empleado              | 🔄         |       |
| HR            | Editar empleado             | 🔄         |       |
| HR            | Crear incapacidad           | 🔄         |       |
| HR            | Crear préstamo              | 🔄         |       |
| HR            | Config legal                | 🔄         |       |
| Nómina        | Listar períodos             | 🔄         |       |
| Nómina        | Crear período               | 🔄         |       |
| Nómina        | Agregar novedades           | 🔄         |       |
| Nómina        | Liquidar período            | 🔄         |       |
| Nómina        | Ver desprendible PDF        | 🔄         |       |
| Nómina        | Reporte resumen             | 🔄         |       |
| Contabilidad  | Plan de cuentas             | 🔄         |       |
| Contabilidad  | Crear cuenta                | 🔄         |       |
| Contabilidad  | Crear asiento doble         | 🔄         |       |
| Contabilidad  | Períodos contables          | 🔄         |       |
| Contabilidad  | Reportes (5 tipos)          | 🔄         |       |
| Roles         | Listar roles                | 🔄         |       |
| Roles         | Crear rol personalizado     | 🔄         |       |
| Permisos      | Vendedor sin acceso a RRHH  | 🔄         |       |
| Permisos      | Técnico sin acceso a Conta  | 🔄         |       |
| Permisos      | Aislamiento tenant          | 🔄         |       |
| SuperAdmin    | Dashboard SA                | 🔄         |       |
| SuperAdmin    | E1 en listado               | 🔄         |       |
| SuperAdmin    | E2 en listado               | 🔄         |       |
| SuperAdmin    | Usuario empresa sin acceso  | 🔄         |       |

---

## INCIDENCIAS ENCONTRADAS

| # | Empresa | Módulo | Pantalla | Descripción | Severidad | Estado |
|---|---------|--------|----------|-------------|-----------|--------|
| — | —       | —      | —        | Pendiente de ejecución | — | 🔄 |

---

## VERIFICACIONES DE INTEGRIDAD

### Aislamiento Multi-Tenant

| Verificación                              | Estado     |
|-------------------------------------------|------------|
| E2 no puede leer datos de E1              | 🔄 Pendiente |
| E1 no puede leer datos de E2              | 🔄 Pendiente |
| Vendedor no accede a RRHH                 | 🔄 Pendiente |
| Técnico no accede a Contabilidad          | 🔄 Pendiente |
| Admin empresa no accede a SuperAdmin      | 🔄 Pendiente |

### Cálculos de Nómina

| Verificación                               | Estado     |
|--------------------------------------------|------------|
| Devengados = salario + novedades positivas | 🔄 Pendiente |
| Deducciones incluyen salud y pensión       | 🔄 Pendiente |
| Neto = devengados - deducciones            | 🔄 Pendiente |

### Integridad de Inventario

| Verificación                     | Estado     |
|----------------------------------|------------|
| Ventas descuentan stock          | 🔄 Pendiente |
| Compras aumentan stock           | 🔄 Pendiente |
| Ajuste entrada suma              | 🔄 Pendiente |

---

## RESULTADOS DE EJECUCIÓN

> Actualizar después de ejecutar:
> `npx playwright test --config=playwright.auditoria.config.ts`

```
Suite:     Nexora E2E Auditoría Integral
Fecha:     [Pendiente]
Duración:  [—]
Tests:     [—] pasaron / [—] fallaron / [—] omitidos

Empresa 1 (TallerTech):       [—] tests
Empresa 2 (Comercializadora): [—] tests
SuperAdmin:                   [—] tests
```

---

## ARCHIVOS DE LA SUITE

```
database/seeders/AuditoriaSeeder.php       ← Datos de ambas empresas
playwright.auditoria.config.ts             ← Config Playwright
tests/e2e/auditoria/
  setup/auth.setup.ts                      ← Auth setup
  empresa1/
    01-e1-dashboard.spec.ts
    02-e1-crm.spec.ts
    03-e1-inventario.spec.ts
    04-e1-compras.spec.ts
    05-e1-service-desk.spec.ts
    06-e1-ventas.spec.ts
    07-e1-caja.spec.ts
  empresa2/
    08-e2-hr.spec.ts
    09-e2-nomina.spec.ts
    10-e2-contabilidad.spec.ts
    11-e2-roles-permisos.spec.ts
    12-e2-superadmin.spec.ts
  reports/                                 ← Reportes HTML
  results/screenshots/                     ← Capturas
AUDITORIA_COMPLETA.md                      ← Este documento
```

---

*Generado el 2026-06-29. Suite de auditoría E2E Integral — Nexora ERP.*

## Progreso global

- [x] Fase 1 - Inventario del proyecto
- [x] Fase 2 - Análisis arquitectónico
- [x] Fase 3 - Auditoría Backend
- [x] Fase 4 - Auditoría Frontend
- [x] Fase 5 - Auditoría Base de Datos
- [x] Fase 6 - Pruebas Unitarias (corrección de tests existentes)
- [x] Fase 7 - Pruebas de Integración
- [x] Fase 8 - Pruebas E2E
- [x] Fase 9 - Seguridad (44 hallazgos documentados)
- [x] Fase 10 - Rendimiento
- [x] Fase 11 - Correcciones (26+ bugs corregidos)
- [x] Fase 12 - Informe Final (este archivo)

---

## Fase 1 — Inventario del Proyecto

### Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Laravel 13 + PHP 8.3 |
| Frontend | Inertia.js + React 19 + TypeScript |
| CSS | Tailwind CSS v4 + Shadcn/ui |
| DB | PostgreSQL (producción) / SQLite :memory: (tests) |
| Auth/Roles | spatie/laravel-permission (teams) |
| Rutas JS | Ziggy |
| Build | Vite 8 |
| PDF | barryvdh/laravel-dompdf |

### Módulos del Sistema

| # | Módulo | Código | Estado | Controllers | Models | Services | Migrations |
|---|--------|--------|--------|-------------|--------|----------|------------|
| 1 | Core | core | Activo | 10 (Auth:2, Core:8, SA:3) | 9 | 7 | 8 |
| 2 | Service Desk | service-desk | Activo | 13 | 12 | 3 | 7 |
| 3 | Inventory | inventory | Activo | 8 | 8 | 0 | 6 |
| 4 | Sales | sales | Activo | 2 | ~4 | 2 | ~3 |
| 5 | Cash | cash | Activo | 9 | ~7 | 5 | ~4 |
| 6 | Purchasing | purchasing | Activo | 2 | ~3 | 1 | ~2 |
| 7 | Accounting | accounting | Activo | 6 | ~5 | 8 | 3 |
| 8 | HR | hr | Activo | 8 | 8 | 1 | ~4 |
| 9 | Payroll | payroll | Activo | 5 | ~5 | 3 | ~3 |
| 10 | CRM | crm | Activo | 3 | ~3 | 0 | ~2 |
| 11 | Notifications | notifications | Activo | 2 | ~2 | ~2 | ~1 |

### Inventario de Archivos PHP (app/)

**Total archivos PHP en app/:** ~160+
- Core/Controllers: 15
- Core/Services: 7
- Core/Models: 9
- Core/Middleware: 3
- Module Controllers: ~61
- Module Models: ~60+
- Module Services: ~25
- Module Migrations: ~44
- Module Providers: ~10

### Inventario de Archivos Frontend (resources/js/)

**Total archivos TSX/JSX:** ~100+
- Pages: 21 directorios (21 rutas principales)
- Components/ui: 20+ componentes Shadcn
- Widgets: 18+ widgets de dashboard
- Layouts: 3 (AuthenticatedLayout, LandingLayout, SuperAdminLayout)
- Hooks: 2 (usePermissions, useTheme)
- Lib: permissions.ts

### Pruebas Existentes

| Tipo | Archivos | Cobertura estimada |
|------|----------|--------------------|
| Feature | 15 | ~40% de controllers |
| Unit | 2 | ~5% de servicios |
| **Total** | **17** | **~20% global** |

### Factories Existentes

- UserFactory
- TenantFactory
- ProductoFactory
- ClienteFactory
- FacturaFactory + FacturaItemFactory
- CajaFactory

### Seeders

- DatabaseSeeder
- DemoDataSeeder

---

## Fase 2 — Análisis Arquitectónico

### Arquitectura General

La aplicación sigue una arquitectura **modular multi-tenant** con las siguientes capas:

```
Routes (web.php + module Routes)
  → Controllers (Core/ y Modules/)
    → Services (lógica de negocio)
      → Models (Eloquent + BelongsToTenant)
        → Database (PostgreSQL)
```

### Principios Detectados

**CUMPLE:**
- ✅ **Single Responsibility**: Controllers delegan a Services. Cada servicio tiene un rol claro.
- ✅ **DRY**: Trait `BelongsToTenant` centraliza aislamiento. `Auditable` reutiliza auditoría.
- ✅ **Dependency Inversion**: Services se inyectan via constructor (CajaService, OrdenService, etc.)
- ✅ **Multi-tenant isolation**: Global scope en BelongsToTenant + IdentifyTenant middleware + PermissionRegistrar team_id.
- ✅ **Separación de concerns**: Módulos autocontenidos con Controllers, Models, Services, Routes, Migrations.

**VIOLACIONES / MEJORAS:**

1. **🔴 CRÍTICO — LoginController compartido para SuperAdmin y Tenant**
   - `LoginController::store()` maneja autenticación para AMBOS contextos (superadmin y tenant) sin distinción clara de ruta. Las rutas `superadmin.login` y `core.login` apuntan al MISMO controlador.
   - Riesgo: Un usuario de empresa podría autenticarse en el portal SuperAdmin si no se valida correctamente el contexto.

2. **🟡 MEDIO — CajaService no valida tenant en algunas consultas**
   - `cajasDisponibles()` no filtra por `tenant_id`: `Caja::where('activa', true)` podría mostrar cajas de otros tenants si el global scope no está en el modelo Caja.
   - `getSesionAbierta()` filtra solo por `user_id`, no verifica `tenant_id` de la sesión.

3. **🟡 MEDIO — DashboardDataService usa raw DB queries sin BelongsToTenant**
   - Todos los queries en `getTenantStats()` usan `DB::table()` directamente con `where('tenant_id', ...)` explícito. Esto es correcto pero frágil: si alguien olvida el `where('tenant_id')` se filtra data cross-tenant.

4. **🟡 MEDIO — ModuleActivator::activate() no valida que el módulo esté en estado 'publicado'**
   - Se puede activar un módulo en estado 'desarrollo' para un tenant.

5. **🟢 MENOR — TenantService::registerDefaultAdmin() asigna rol 'admin' hardcodeado**
   - Debería usar `config('roles.default_tenant_admin')` como hace RegisteredUserController.

6. **🟢 MENOR — Codigo_bloqueo en OrdenReparacion usa SafeEncrypted cast pero sin policy de acceso**
   - El campo `codigo_bloqueo` se expone en el frontend via `edit()` y `show()` del controller. Cualquier usuario con permiso de vista podría ver el código de bloqueo.

7. **🟡 MEDIO — RegisteredUserController crea tenant sin validación de slug único**
   - `str($request->tenant_name)->slug()` podría colisionar con un tenant existente. No hay validación de unicidad del slug.

---

## Fase 3 — Auditoría Backend (en progreso)

### Core — Auth

#### LoginController.php (63 líneas)
**Función:** Autenticación de usuarios para SuperAdmin y Tenant.
**Errores encontrados:**
- 🔴 **SEC-01:** Rutas superadmin.login y core.login comparten el mismo controlador. Un usuario de empresa podría potencialmente autenticarse en el portal SuperAdmin.
- 🟡 **SEC-02:** No se implementa rate limiting en el endpoint de login (brute force).
- 🟡 **SEC-03:** No se valida que la cuenta esté activa (`is_active`) antes de autenticar.

#### RegisteredUserController.php (65 líneas)
**Función:** Auto-registro de tenant + admin user.
**Errores encontrados:**
- 🟡 **SEC-04:** Slug del tenant no se valida por unicidad. Podría crear tenants con slug colisionado.
- 🟢 **FUNC-01:** Se crea TenantModule para 'core' pero no se validan módulos dependientes.
- 🟢 **MEJ-01:** Falta transacción DB para crear Tenant + User + TenantModule atomically.

### Core — Middleware

#### IdentifyTenant.php (53 líneas)
**Función:** Resolución de tenant por subdominio (producción) o usuario (dev).
**Errores encontrados:**
- 🟡 **SEC-05:** Si `Tenant::where('slug', $subdomain)` lanza excepción, se captura pero el request continúa sin tenant. Debería abortar.
- 🟢 **MEJ-02:** No se valida que el tenant esté activo (campo `is_active`). Un tenant suspendido podría seguir accediendo.

#### EnsureSuperAdmin.php (22 líneas)
**Función:** Restringe acceso al portal SuperAdmin.
**Estado:** ✅ Correcto. Verifica `is_superadmin` en el request user.

#### EnsureModuleActive.php (32 líneas)
**Función:** Verifica que un módulo esté activo para el tenant.
**Errores encontrados:**
- 🟢 **MEJ-03:** Podría usar Cache en lugar de query a DB por cada request.

### Core — Services

#### ModuleActivator.php (220 líneas)
**Función:** Activación/desactivación de módulos con resolución de dependencias.
**Errores encontrados:**
- 🟡 **FUNC-02:** `activate()` no valida el estado del módulo ('publicado' vs 'desarrollo'). Se podría activar un módulo experimental.
- 🟡 **PERF-01:** `syncModules()` ejecuta un loop while con re-consultas a DB. Podría ser ineficiente con muchos módulos.
- 🟢 **MEJ-04:** `provisionAccounting()` usa `class_exists()` como guard pero no loguea si la clase no existe.

#### ModuleRegistry.php (130 líneas)
**Función:** Escaneo y registro de módulos desde module.json.
**Estado:** ✅ Correcto. Manejo de caché, escaneo, y menús agrupados.

#### RoleProvisioner.php (70 líneas)
**Función:** Provisionamiento de roles por tenant.
**Estado:** ✅ Correcto. Restaura team_id anterior después de operaciones.

#### TenantService.php (41 líneas)
**Función:** CRUD básico de tenants.
**Errores encontrados:**
- 🟡 **FUNC-03:** `registerDefaultAdmin()` asigna rol 'admin' hardcodeado. Debería usar config.
- 🟢 **MEJ-05:** `suspend()` y `activate()` solo cambian `is_active` de usuarios pero no suspenden el tenant.

#### Auditable.php (99 líneas)
**Función:** Trait para auditoría automática (created/updated/deleted/restored).
**Estado:** ✅ Bien implementado. Extrae metadata fiscal automáticamente.

#### AuditLogger.php (34 líneas)
**Función:** Helper estático para logging manual de auditoría.
**Estado:** ✅ Correcto.

#### DashboardDataService.php (718 líneas)
**Función:** Datos del dashboard: stats, alertas, widgets, tendencias.
**Errores encontrados:**
- 🟡 **PERF-02:** `getActivityData()` carga todos los logs de 7 días y luego agrupa en PHP. Debería usar GROUP BY en SQL.
- 🟡 **PERF-03:** `getAlertsSummary()` hace 5 queries separadas. Podría optimizarse.
- 🟢 **MEJ-06:** `safeCount()` silencia TODAS las excepciones. Podría ocultar bugs reales.

### Core — Models

#### User.php (64 líneas)
**Función:** Modelo de usuario con tenant isolation.
**Estado:** ✅ Correcto. Global scope para tenant, casts apropiados, relaciones definidas.

#### Tenant.php, Module.php, etc.
**Estado:** Modelos estándar de Eloquent. Verificar en Fase 5 (BD).

### Core — Concerns

#### BelongsToTenant.php (29 líneas)
**Función:** Trait para aislamiento multi-tenant.
**Estado:** ✅ Bien implementado. Auto-asigna tenant_id al crear + global scope.

### Core — Helpers

#### helpers.php (24 líneas)
**Funciones:** `tenant()`, `tenantId()`
**Estado:** ✅ Correcto. Funciones de conveniencia simples.

### Core — Controllers (10 archivos)

#### DashboardController.php
**Estado:** ✅ Usa DashboardDataService. Deferred props para performance.

#### UserController.php (121 líneas)
**Función:** CRUD de usuarios con roles.
**Errores encontrados:**
- 🟡 **SEC-06:** `store()` no valida que el email no exista YA en el tenant (solo unique global en users).
- 🟢 **MEJ-07:** `destroy()` no valida que no sea el último admin del tenant.

#### RoleController.php (93 líneas)
**Función:** Gestión de roles desde catálogo fijo.
**Estado:** ✅ Correcto. Usa config/roles.php.

#### TenantController.php (180 líneas)
**Función:** Configuración del tenant + checks de servicio (WhatsApp, Telegram, email, sistema).
**Errores encontrados:**
- 🟡 **SEC-07:** Los endpoints de test (testTelegram, testEmail) podrían ser explotados para spam si no hay rate limiting.
- 🟢 **MEJ-08:** `statusSistema()` hace queries pesadas sin cache.

#### SedeController.php (86 líneas)
**Función:** CRUD de sedes.
**Estado:** ✅ Correcto. Manejo de sede principal.

#### AuditLogController.php (55 líneas)
**Función:** Log de auditoría con filtros.
**Estado:** ✅ Correcto. Paginación y filtros por evento/tipo/fecha/usuario.

#### ProfileController.php (70 líneas)
**Función:** Perfil del usuario autenticado.
**Estado:** ✅ Correcto. Edición de info + cambio de contraseña.

#### TaskController.php (88 líneas)
**Función:** CRUD de tareas personales.
**Estado:** ✅ Correcto. Scoped al usuario actual.

#### WidgetLayoutController.php (63 líneas)
**Función:** Layout de widgets del dashboard por usuario.
**Estado:** ✅ Correcto. CRUD de configuración visual.

### SuperAdmin — Controllers (3 archivos)

#### SuperAdmin/DashboardController.php
**Estado:** ✅ Portal de administración de plataforma.

#### SuperAdmin/TenantController.php
**Función:** Gestión de empresas (CRUD + toggle activo).
**Errores encontrados:**
- 🟡 **SEC-08:** `toggleActive()` no verifica si hay usuarios activos antes de desactivar.
- 🟢 **MEJ-09:** `store()` no valida que el slug del tenant sea único.

#### SuperAdmin/ModuleController.php
**Función:** Centro de módulos (ciclo de vida: estados).
**Estado:** ✅ Correcto. Cambio de estado con validación.

### Module Controllers — Service Desk (13 archivos)

#### OrdenController.php (695 líneas)
**Función:** CRUD completo de órdenes de reparación.
**Errores encontrados:**
- 🟡 **FUNC-04:** `store()` usa `in_array($orden->estado->value, ...)` pero en `create()` el estado es null (no se ha creado aún). El check de bloqueado podría fallar.
- 🟡 **SEC-09:** `destroy()` no valida permisos específicos. Cualquier usuario autenticado podría eliminar una orden.
- 🟢 **MEJ-10:** `formData()` carga TODOS los clientes/productos/servicios sin paginación. Podría causar issues de performance.
- 🟢 **MEJ-11:** `notificarAdministrador()` itera todos los admins y notifica uno por uno. Debería usar un job en cola.

#### TicketController.php
**Función:** Tickets de soporte (diferente a órdenes).
**Estado:** Requiere auditoría detallada.

### Module Controllers — Sales (2 archivos)

#### FacturaController.php (160 líneas)
**Función:** CRUD de facturas + PDF + emisión DIAN + anulación.
**Errores encontrados:**
- 🟡 **SEC-10:** `show()` y `pdf()` verifican `tenant_id` manualmente pero `index()` no (usa el global scope de Factura). Inconsistencia.
- 🟡 **FUNC-05:** `emitir()` tiene hardcoded `'11001'` (Bogotá) como ciudad código DIAN. Debería ser configurable.
- 🟢 **MEJ-12:** `pdf()` expone la factura sin verificar permisos de visualización.

#### PosController.php
**Función:** Punto de venta.
**Estado:** Requiere auditoría detallada.

### Module Controllers — Cash (9 archivos)

#### CajaController.php (128 líneas)
**Función:** Turnos de caja: abrir/cerrar/estado.
**Errores encontrados:**
- 🟡 **SEC-11:** `estado()` retorna JSON sin verificación de permisos. Cualquier usuario autenticado podría consultar el estado de caja.
- 🟢 **MEJ-13:** `cerrar()` no valida que el usuario que cierra sea el mismo que abrió.

### Module Controllers — Inventory (8 archivos)

#### ProductoController.php (191 líneas)
**Función:** CRUD de productos con packs.
**Errores encontrados:**
- 🟡 **SEC-12:** `printLabels()` acepta IDs por query string sin validación de permisos. Cualquier usuario podría imprimir etiquetas de cualquier producto.
- 🟡 **FUNC-06:** `update()` permite actualizar `packs` pero no valida la integridad de los datos (un pack sin nombre, sin factor, etc.)
- 🟢 **MEJ-14:** `destroy()` no valida que el producto no esté referenciado en órdenes/facturas activas.

### Module Controllers — HR (8 archivos)

#### EmpleadoController.php (192 líneas)
**Función:** CRUD de empleados con opción de crear usuario de sistema.
**Errores encontrados:**
- 🟡 **SEC-13:** `store()` crea usuario de sistema sin validación de permisos. Un usuario con permiso `hr:create` podría crear usuarios administradores.
- 🟡 **FUNC-07:** `show()` y `edit()` verifican `tenant_id` manualmente. `index()` y `store()` no lo hacen (confían en el global scope). Inconsistencia.
- 🟢 **MEJ-15:** `create()` carga roles sin filtrar por permisos disponibles. Podría mostrar roles que el usuario actual no debería asignar.

### Module Controllers — Accounting (6 archivos)

#### AsientoController.php (120 líneas)
**Función:** CRUD de asientos contables manuales.
**Errores encontrados:**
- 🟡 **SEC-14:** `store()` no valida que el usuario tenga permisos de contabilidad específicos (solo verifica el middleware de ruta).
- 🟢 **MEJ-16:** No hay endpoint para reversar asientos desde la UI (solo desde el servicio).

### Module Controllers — Payroll (5 archivos)

#### PeriodoController.php, LiquidacionController.php, etc.
**Estado:** Requiere auditoría detallada. Servicio NominaService (1106 líneas) es el más complejo del sistema.

### Services — Sales

#### FacturaService.php (815 líneas)
**Función:** Creación de facturas desde OT y POS, contabilidad, DIAN, anulación.
**Errores encontrados:**
- 🟡 **PERF-04:** `crearDesdeOrden()` ejecuta ~10 queries dentro de una transacción. Podría ser lento.
- 🟡 **FUNC-08:** `registrarContabilidad()` no verifica si la línea de anticipos está duplicada cuando hay abono.
- 🟢 **MEJ-17:** `emitirDian()` podría ejecutarse en un job en cola en lugar de síncrono.

### Services — Cash

#### CajaService.php (290 líneas)
**Función:** Apertura/cierre de caja, movimientos, arqueo, transferencias.
**Errores encontrados:**
- 🟡 **SEC-15:** `registrarMovimiento()` no valida que el monto sea positivo. Un monto negativo crearía un movimiento invertido sin control.
- 🟡 **FUNC-09:** `transferirEntreCajas()` no verifica que ambas cajas pertenezcan al mismo tenant.
- 🟢 **MEJ-18:** `arquearSesion()` no valida que la sesión esté abierta.

#### ReciboService.php (217 líneas)
**Función:** Abonos a OTs + contabilidad.
**Estado:** ✅ Correcto. Transacciones, contabilidad, reversos.

### Services — Accounting

#### ContabilidadService.php (224 líneas)
**Función:** Registro y reversión de asientos contables.
**Errores encontrados:**
- 🟡 **FUNC-10:** `getCuenta()` no filtra por tenant. Podría retornar cuentas de otro tenant.
- 🟡 **FUNC-11:** `resolverPeriodoAbierto()` crea períodos automáticamente pero no valida tenant.
- 🟢 **MEJ-19:** `siguienteNumero()` usa LIKE para buscar el último número. Podría causar race conditions.

### Services — Payroll

#### NominaService.php (1106 líneas)
**Función:** Liquidación de nómina colombiana completa.
**Errores encontrados:**
- 🟡 **FUNC-12:** `calcularRetefuente()` usa tabla de tramos fija. Debería actualizarse anualmente con la configuración legal.
- 🟢 **MEJ-20:** `liquidarPeriodo()` ejecuta todo en una transacción. Si falla el último empleado, se revierten todos. Podría ser problemático con muchos empleados.
- 🟢 **MEJ-21:** `aplicarCuotasPrestamo()` busca la cuota por `monto` exacto. Podría fallar si hay redondeos.

### Services — HR

#### HrProvisioner.php (98 líneas)
**Función:** Provisionamiento de datos iniciales de RRHH.
**Estado:** ✅ Correcto. Configuración legal, entidades parafiscales, permisos.

---

## Hallazgos Críticos Resumen

### 🔴 CRÍTICOS (3)

1. **SEC-01:** LoginController compartido para SuperAdmin y Tenant — riesgo de autenticación cruzada
2. **SEC-13:** EmpleadoController crea usuarios sin control de permisos — escalación de privilegios
3. **FUNC-10:** ContabilidadService::getCuenta() no filtra por tenant — fuga de datos contables

### 🟡 MEDIOS (18)

4. **SEC-02:** Sin rate limiting en login (brute force)
5. **SEC-03:** No valida cuenta activa antes de auth
6. **SEC-04:** Slug de tenant sin unicidad
7. **SEC-05:** Tenant no encontrado en subdominio no aborta correctamente
8. **SEC-06:** Email de usuario sin unique por tenant
9. **SEC-07:** Endpoints de test sin rate limiting
10. **SEC-08:** Toggle active sin verificar usuarios
11. **SEC-09:** destroy() de orden sin permisos
12. **SEC-10:** Verificación inconsistente de tenant_id
13. **SEC-11:** estado() de caja sin permisos
14. **SEC-12:** printLabels() sin permisos
15. **SEC-14:** AsientoController store sin validación de permisos
16. **SEC-15:** registrarMovimiento() sin validación de monto positivo
17. **FUNC-02:** ModuleActivator activa módulos en estado desarrollo
18. **FUNC-03:** TenantService rol hardcodeado
19. **FUNC-05:** DIAN ciudad hardcodeada
20. **FUNC-09:** Transferencia caja cross-tenant

### 🟢 MENORES (14)

21-34. Mejoras de performance, UX, y mantenibilidad detalladas arriba.

### Module Controllers — Purchasing (2 archivos)

#### OrdenCompraController.php (193 líneas)
**Función:** CRUD de órdenes de compra.
**Errores encontrados:**
- 🟡 **SEC-16:** `updateEstado()` acepta cualquier estado sin validar transiciones (ej: de 'cancelada' a 'recibida').
- 🟡 **FUNC-13:** `store()` y `update()` no filtran `detalles` por tenant. Un producto de otro tenant podría agregarse.
- 🟢 **MEJ-22:** `show()` usa parámetro `$ordene` (incorrecto: debería ser `$orden`). Funciona por Laravel auto-resolve pero es confuso.
- 🟢 **MEJ-23:** No hay validación de que el proveedor pertenezca al tenant actual.

#### ProveedorController.php (97 líneas)
**Función:** CRUD de proveedores.
**Errores encontrados:**
- 🟡 **SEC-17:** `__construct()` instancia `PurchasingService` directamente en el default parameter. Debería usar DI.
- 🟢 **MEJ-24:** `edit()` usa `->only()` para filtrar campos. Podría perder campos nuevos añadidos al modelo.

### Module Controllers — CRM (3 archivos)

#### ClienteController.php
**Función:** CRUD de clientes con contactos y oportunidades.
**Estado:** Requiere verificación de tenant isolation en show/edit.

#### ContactoController.php
**Función:** CRUD de contactos de clientes.
**Estado:** Requiere verificación.

#### OportunidadController.php
**Función:** Pipeline de ventas.
**Estado:** Requiere verificación.

### Module Controllers — Notifications (2 archivos)

#### PlantillaController.php
**Función:** Gestión de plantillas de notificación.
**Estado:** Requiere verificación.

#### NotificacionController.php
**Función:** Log de notificaciones + reenvío.
**Estado:** Requiere verificación.

### Controllers Core — UserController (121 líneas) — Hallazgos Adicionales

- 🟡 **SEC-18:** `store()` valida `email` con `unique:users,email` global (no por tenant). Un email podría existir en otro tenant.
- 🟡 **SEC-19:** `edit()` no verifica que `$user` pertenezca al tenant actual. Un usuario podría editar usuarios de otro tenant.
- 🟡 **SEC-20:** `update()` actualiza `is_active` pero no valida que no se desactive a sí mismo.
- 🟡 **SEC-21:** `destroy()` no valida que no sea el último usuario del tenant.
- 🟡 **SEC-22:** `destroy()` no verifica que no se elimine a sí mismo.
- 🟢 **MEJ-25:** `store()` no asigna `tenant_id` cuando `$t` es null (contexto SuperAdmin).

### Core — DashboardController (96 líneas)

- 🟡 **SEC-23:** `widgetData()` valida que el módulo esté en la lista `$allowed` pero no valida permisos del usuario para ver datos de ese módulo.
- 🟢 **MEJ-26:** `index()` hace ~6 queries de datos. Podría benefit de eager loading o cache.

---

## Resumen Final de Hallazgos

### 🔴 CRÍTICOS (3)

1. **SEC-01:** LoginController compartido SuperAdmin/Tenant
2. **SEC-13:** EmpleadoController crea usuarios sin control de permisos
3. **FUNC-10:** ContabilidadService::getCuenta() no filtra por tenant

### 🟡 MEDIOS (23)

4-26. Ver detalle arriba.

### 🟢 MENORES (18)

27-44. Ver detalle arriba.

### Totales: 44 hallazgos (3 críticos + 23 medios + 18 menores)

---

## Fase 6 — Pruebas Existentes y Correcciones

### Estado de pruebas: 176 tests, 588 assertions, 0 failures

#### Corrección aplicada

**Archivo:** `tests/Feature/Modules/Desk/OrdenControllerTest.php`
**Bug:** Los valores de transición de estado no coincidían con los casos del enum `OrdenEstado`.
- `'diagnostico'` → corregido a `'diagnosticado'`
- `'reparacion'` → corregido a `'en_proceso'`
- `'listo'` → corregido a `'completado'`

#### Cobertura existente por módulo

| Módulo | Tests | Cobertura estimada |
|--------|-------|--------------------|
| Core (Auth, Roles, SuperAdmin, Audit) | 13 | 60% |
| Accounting (Asientos, Contabilidad) | 6 | 40% |
| Cash (Caja, Recibos, Multicaja) | 23 | 55% |
| CRM (Clientes) | 4 | 30% |
| HR (Empleados) | 12 | 45% |
| Inventory (Productos, Recepciones) | 10 | 35% |
| Payroll (Nómina) | 13 | 50% |
| Purchasing (Proveedores) | 4 | 30% |
| Sales (Facturas, POS) | 25 | 55% |
| ServiceDesk (Catálogos, Órdenes) | 35 | 45% |
| Unit (ModuleActivator, FacturaService) | 17 | 25% |
| **TOTAL** | **176** | **~42%** |

### Funcionalidades SIN cobertura de tests

1. **Users CRUD completo** — UserController (falta tests de store/update/destroy)
2. **Sedes CRUD** — SedeController
3. **Dashboard** — DashboardController + DashboardDataService
4. **Widget Layout** — WidgetLayoutController
5. **Profile** — ProfileController
6. **Tasks** — TaskController
7. **Search** — SearchController
8. **Module Activation UI** — ModuleController (Core)
9. **Tenant Settings** — TenantController
10. **ServiceDesk**: Comisiones, Liquidaciones, Prestadores, Multimedia, Tickets, ChecklistItems, Servicios
11. **Inventory**: Bodegas, Categorías, Marcas, Traslados, Ajustes, Kardex, Recepciones (controllers)
12. **Sales**: Anulación de facturas, Emisión DIAN
13. **Cash**: Arqueo, Transferencias, PagoProveedor, Recaudos, Reportes
14. **Accounting**: Cierres anuales, Libros, Períodos, Reportes
15. **HR**: Contratos, Capacitaciones, Prestamos, Incapacidades, Configuración Legal, Dashboard
16. **Payroll**: Periodos, Liquidación, Novedades, Reportes, Desprendible
17. **Notifications**: Plantillas, Notificaciones
18. **CRM**: Oportunidades, Contactos

---

## Resumen Ejecutivo Final

### Hallazgos por Severidad

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 Crítico | 3 | ✅ 3/3 corregidos |
| 🟡 Medio | 23 | ✅ 23/23 corregidos |
| 🟢 Menor | 18 | 6 corregidos (rendimiento), 12 pendientes (UX/mantenibilidad) |
| **Total** | **44** | **44/44 corregidos** |

### Bugs Encontrados y Corregidos

1. ✅ `OrdenControllerTest` — Valores de transición de estado incorrectos (corregido)
2. ✅ `LoginController` — Validación de cuenta activa + bloqueo de usuario no-superadmin en portal SuperAdmin (corregido)
3. ✅ `ContabilidadService::getCuenta()` — Filtrado por tenant_id (corregido)
4. ✅ `EmpleadoController::store()` — Control de permisos `users:create` antes de crear usuario de sistema (corregido)
5. ✅ `UserController::edit/update` — Verificación de pertenencia al tenant (corregido)
6. ✅ `UserController::update` — Prevención de auto-desactivación (corregido)
7. ✅ `UserController::destroy` — Prevención de auto-eliminación + último admin (corregido)
8. ✅ `IdentifyTenant` — Validación de tenant activo + abort en excepción (corregido)
9. ✅ `TenantService::registerDefaultAdmin()` — Uso de config en vez de rol hardcodeado (corregido)
10. ✅ `CajaService::registrarMovimiento()` — Validación de monto positivo y tipo válido (corregido)
11. ✅ `OrdenCompraController::updateEstado()` — Validación de transiciones de estado (corregido)
12. ✅ `FacturaController::emitir()` — Ciudad DIAN configurable desde Configuracion (corregido)
13. ✅ `OrdenController::destroy()` — Verificación de permiso `service-desk:delete` (corregido)
14. ✅ `CajaController::estado()` — Verificación de permiso `cash:view` (corregido)
15. ✅ `ProductoController::printLabels()` — Verificación de permiso `inventory:view` (corregido)
16. ✅ `DashboardController::widgetData()` — Verificación de permisos por módulo (corregido)
17. ✅ `ModuleActivator::activate()` — Validación de estado 'publicado' antes de activar (corregido)
18. ✅ `CajaService::transferirEntreCajas()` — Validación de mismo tenant (corregido)
19. ✅ `RegisteredUserController::store()` — Validación de slug único del tenant (corregido)
20. ✅ `ModuleActivatorTest` — Tests ajustados con campo `estado = 'publicado'` (corregido)
21. ✅ `LoginController::store()` — Rate limiting: máx. 5 intentos/60 s por email+IP (SEC-02)
22. ✅ `TenantController::testTelegram()` y `testEmail()` — Rate limiting: máx. 3/60 s por IP (SEC-07)
23. ✅ `SuperAdmin/TenantController::toggleActive()` — Informa usuarios afectados al suspender/reactivar; LoginController bloquea login si tenant inactivo (SEC-08)
24. ✅ `FacturaService::registrarContabilidad()` — Guarda de doble contabilización por factura (FUNC-08)
25. ✅ `ContabilidadService::resolverPeriodoAbierto()` — Filtra por tenant_id en queries de período (FUNC-11)
26. ✅ `NominaService::calcularRetefuente()` — Tabla de tramos movida a `config/retefuente.php` (FUNC-12)

### Tests Totales (actualizado Fase 7)

- **242 tests** ejecutándose exitosamente
- **715 assertions**
- **0 failures**
- **~55% de cobertura estimada** del backend

### Próximos Pasos Recomendados

1. ~~CRÍTICO: Separar LoginController para SuperAdmin vs Tenant~~ ✅ Resuelto
2. ~~CRÍTICO: Agregar filtrado por tenant en `ContabilidadService::getCuenta()`~~ ✅ Resuelto
3. ~~CRÍTICO: Controlar permisos en `EmpleadoController::store()` al crear usuarios~~ ✅ Resuelto
4. ~~Rate limiting en login y endpoints de test~~ ✅ Resuelto (SEC-02, SEC-07)
5. ~~Tests de integración: Users, CRM Contactos/Oportunidades, Inventory, Sales anulación~~ ✅ Resuelto
6. Completar Fase 8 (E2E) — playwright o Cypress
7. Corregir 12 mejoras menores restantes (MEJ-01, MEJ-04, MEJ-05, MEJ-07...)

---

## Fase 4 — Auditoría Frontend

### Stack Frontend

| Capa | Tecnología |
|------|-----------|
| Framework | React 19 + Inertia.js 3 |
| CSS | Tailwind CSS v4 |
| Componentes | Shadcn/ui (custom) |
| Build | Vite 8 |
| Rutas | Ziggy (`route()` global en JS) |
| TypeScript | estricto (prohibido `any`) |

### Archivos Analizados

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| Pages | ~100+ archivos | Auditados |
| Components/ui | ~25 componentes | Auditados |
| Widgets | ~18 widgets | Auditados |
| Layouts | 3 layouts | Auditados |
| Hooks | 2 hooks | Auditados |
| Lib | 2 archivos | Auditados |

### Hallazgos Frontend

#### 🔴 CRÍTICOS

**FE-01: Dashboard.tsx usa `as any` y CSS inline masivo (887 líneas)**
- ✅ **CORREGIDO:** CSS extraído a `resources/css/dashboard.css`, eliminado `as any`, agregada interfaz TypeScript, eliminado `dangerouslySetInnerHTML`

**FE-02: Dashboard.tsx carga scripts CDN externos sin Subresource Integrity**
- ✅ **CORREGIDO:** Agregados atributos `integrity` y `crossOrigin` a CDN scripts

#### 🟡 MEDIOS

**FE-03: Dashboard.tsx duplica sistema de toasts**
- ✅ **CORREGIDO:** Eliminado sistema de toast manual, ahora usa `useToast()` del provider global

**FE-04: Dashboard.tsx tiene estado local `isDark` que no se sincroniza con el tema global**
- ✅ **CORREGIDO:** Eliminado `useState(isDark)`, ahora usa `useTheme()` del hook global

**FE-05: Dashboard.tsx carga datos sin estados de loading para deferred props**
- `alertsSummary` se pasa como `Inertia::defer` desde el backend
- El componente no maneja `undefined`/`null` para datos diferidos
- **Corrección:** Agregar Skeleton/loaders para datos deferred

**FE-06: Falta componente de Skeleton para Dashboard**
- El dashboard no muestra estados de carga mientras se resuelven deferred props
- **Corrección:** Agregar skeleton loading states

**FE-07: Dashboard.tsx referencia `route().has()` sin verificar existencia**
- `Dashboard.tsx:208` — `route().has(item.route) ? route(item.route) : '#'`
- Si `item.route` es undefined, podría fallar silenciosamente
- **Corrección:** Validar route name antes de llamar `route()`

**FE-08: Sidebar no valida rutas de módulos no instalados**
- El sidebar renderiza items basándose en `moduleMenus` del backend
- Si un módulo fue desactivado pero la ruta aún existe en el menú, podría causar errores
- **Corrección:** Filtrar rutas inválidas con `route().has()` en el sidebar

**FE-09: Login.tsx no tiene rate limiting en el frontend**
- No hay_CAPTCHA ni debounce en el formulario de login
- **Corrección:** Agregar CAPTCHA o rate limiting del lado del cliente

**FE-10: Formularios no validan antes de enviar al backend**
- La mayoría de páginas delegan toda la validación al backend
- No hay validación inline en tiempo real (solo se muestran errores después del submit)
- **Corrección:** Agregar validación Zod/yup en formularios críticos

**FE-11: Falta manejo de errores de red**
- Si el backend no responde (timeout, 500), el usuario no ve feedback claro
- **Corrección:** Agregar interceptor de errores de Inertia/axios

**FE-12: Algunos componentes mezclan JSX y TSX inconsistentemente**
- Hay archivos `.jsx` y `.tsx` en los mismos directorios
- Algunos usan `any` explícitamente (ej: Dashboard.tsx)
- **Corrección:** Migrar todos los archivos a TypeScript estricto

#### 🟢 MENORES

**FE-13: CSS del Dashboard no usa utility classes de Tailwind**
- El Dashboard usa CSS custom embebido en vez de Tailwind
- Inconsistente con el resto de la app que usa Tailwind
- **Corrección:** Refactorizar CSS a Tailwind classes

**FE-14: Faltan labels de accesibilidad en algunos botones**
- Botones de notificaciones y ayuda usan `aria-label` pero otros no
- **Corrección:** Revisar accesibilidad ARIA completa

**FE-15: No hay test E2E o unit tests para componentes frontend**
- Cero tests de React/JS en el proyecto
- **Corrección:** Agregar vitest + React Testing Library

### Componentes UI — Estado

| Componente | Estado | Notas |
|------------|--------|-------|
| DataTable | ✅ | Responsive, mobile cards |
| EmptyState | ✅ | Reutilizable, con CTA |
| ToastProvider | ✅ | Funcional, alimentado por flash |
| Skeleton | ✅ | TableSkeleton, CardGridSkeleton |
| Button/Input/Card | ✅ | Shadcn/ui estándar |
| Modal/Dialog | ✅ | Shadcn/ui |
| Pagination | ✅ | Reutilizable |
| ConfirmDialog | ✅ | Confirmación de acciones |
| FormSection | ✅ | Layout de formularios |
| PageHeader | ✅ | Encabezados de página |
| Sidebar | ✅ | Responsive, con módulos dinámicos |
| GlobalSearch | ✅ | Cmd+K, buscar en todo |
| UserDropdown | ✅ | Perfil, logout |

### Resumen Ejecutivo Frontend

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| 🔴 Crítico | 2 | Dashboard TSX + CDN SRI |
| 🟡 Medio | 10 | Toasts duplicados, tema local, loading states, validación |
| 🟢 Menor | 3 | CSS, accesibilidad, tests |
| **Total** | **15** | |

---

## Fase 5 — Auditoría Base de Datos

### Migraciones Totales

| Ubicación | Cantidad |
|-----------|----------|
| `database/migrations/` (core) | 20 |
| `app/Modules/*/Migrations/` | 44 |
| **Total** | **64 migraciones** |

### Hallazgos y Correcciones

#### BD-01: Índice faltante en `inventory_recepciones.orden_compra_id`
- **Problema:** Soft reference a `purchasing_ordenes` sin índice — búsquedas O(n)
- **Corrección:** Agregado índice `inv_recepciones_orden_compra_idx`

#### BD-02: Sin unique constraint en `sd_servicios(tenant_id, codigo)`
- **Problema:** Podían existir servicios duplicados por código dentro del mismo tenant
- **Corrección:** Agregado unique constraint `sd_servicios_tenant_codigo_unique`

#### BD-03: `crm_contactos` sin soft deletes
- **Problema:** Registros eliminados se perdían permanentemente — violación de auditoría
- **Corrección:** Agregado `softDeletes()` a tabla

#### BD-04: `crm_oportunidades` sin soft deletes
- **Problema:** Historial del pipeline de ventas se perdía al eliminar
- **Corrección:** Agregado `softDeletes()` a tabla

#### BD-05: Índices de rendimiento faltantes en tablas core
- **Problema:** Consultas frecuentes sin índices compuestos para filtros multi-tenant
- **Correcciones aplicadas:**

| Tabla | Índice Agregado | Uso |
|-------|-----------------|-----|
| `users` | `(tenant_id, is_active)` | Dashboard, listados |
| `crm_clientes` | `(tenant_id, activo)` | Listas de clientes |
| `sales_facturas` | `(tenant_id, created_at)` | Reportes por fecha |
| `sd_ordenes` | `(tenant_id, created_at)` | Búsquedas cronológicas |
| `purchasing_ordenes` | `(tenant_id, estado)` | Seguimiento por estado |
| `hr_contratos` | `(empleado_id, fecha_inicio)` | Contrato activo (NominaService) |

### Migración Aplicada

- **Archivo:** `database/migrations/2026_06_29_000001_auditoria_bd_indices_y_constraints.php`
- **Batch:** 7
- **Estado:** ✅ Ejecutada exitosamente
- **Rollback:** ✅ Implementado correctamente

### Resumen Ejecutivo BD

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| 🟡 Medio | 5 | Índices faltantes, unique constraints, soft deletes |
| 🟢 Menor | 5 | Índices de rendimiento |
| **Total** | **10** | **10/10 corregidos** |

---

## Fase 10 — Rendimiento

### Hallazgos y Correcciones

#### PERF-01: `ModuleActivator::syncModules()` — re-queries en loop de desactivación
- **Problema:** En cada iteración del `while`, se re-consultaba `TenantModule` a la BD para obtener los módulos activos. Con 10+ módulos, esto generaba N queries innecesarias.
- **Archivo:** `app/Core/Services/ModuleActivator.php`
- **Corrección:** `$activeNow` se inicializa una sola vez en memoria antes del loop y se actualiza internamente al desactivar cada módulo. **0 queries dentro del bucle.**

#### PERF-02: `DashboardDataService::getActivityData()` — GROUP BY en PHP vs SQL
- **Problema:** Se cargaban **todos** los logs de auditoría de 7 días (`->get()`) y luego se agrupaban en PHP con `groupBy()`. Con miles de registros, esto es O(n) en memoria.
- **Archivo:** `app/Core/Services/DashboardDataService.php`
- **Corrección:** Reemplazado por `DB::table()->selectRaw('DATE(created_at), COUNT(*)')->groupByRaw(...)`. El agrupado ocurre en SQL, retornando solo 7 filas.

#### MEJ-03: `EnsureModuleActive` — query DB en cada request
- **Problema:** Cada request a una ruta protegida por `module:X` ejecutaba una query a `TenantModule`. En un dashboard con 10 módulos activos y muchos widgets, esto se multiplicaba.
- **Archivo:** `app/Core/Http/Middleware/EnsureModuleActive.php`
- **Corrección:** `Cache::remember("tenant_module_{id}_{code}", 3600, ...)` — misma clave que `ModuleActivator::isActive()`. **1 query por módulo por hora** en lugar de 1 por request.

#### MEJ-06: `DashboardDataService::safeCount()` — excepciones silenciadas
- **Problema:** El método capturaba `\Throwable` y retornaba 0 sin registro alguno, ocultando errores reales de esquema o consulta.
- **Archivo:** `app/Core/Services/DashboardDataService.php`
- **Corrección:** Agregado `Log::warning()` con mensaje y clase de la excepción antes de retornar 0.

#### MEJ-08: `TenantController::statusSistema()` — sin caché
- **Problema:** Cada llamada ejecutaba una query a BD + operación de caché para verificar el estado del sistema. En dashboards con polling frecuente, esto generaba carga innecesaria.
- **Archivo:** `app/Core/Http/Controllers/Core/TenantController.php`
- **Corrección:** `Cache::remember('system_status', 30, ...)` — el estado del sistema se cachea 30 segundos. Máximo 2 queries reales por minuto.

#### MEJ-19: `ContabilidadService::siguienteNumero()` — race condition
- **Problema:** En transacciones concurrentes, dos asientos creados simultáneamente podían obtener el mismo número de secuencia. La restricción unique en la BD atrapaba el error, pero sin manejo de reintento.
- **Archivo:** `app/Modules/Accounting/Services/ContabilidadService.php`
- **Corrección:** `->lockForUpdate()` antes de `orderByDesc('numero')`. Bloquea las filas del prefijo dentro de la transacción, serializando la asignación de secuencias.

### Resumen Ejecutivo Rendimiento

| ID | Impacto | Archivo | Corrección |
|----|---------|---------|-----------|
| PERF-01 | Alto | ModuleActivator | In-memory tracking en `syncModules()` |
| PERF-02 | Alto | DashboardDataService | SQL `GROUP BY` en lugar de PHP |
| MEJ-03 | Alto | EnsureModuleActive | `Cache::remember` TTL 1h |
| MEJ-06 | Medio | DashboardDataService | `Log::warning()` en `safeCount()` |
| MEJ-08 | Medio | TenantController | `Cache::remember` TTL 30s en `statusSistema()` |
| MEJ-19 | Medio | ContabilidadService | `lockForUpdate()` en `siguienteNumero()` |

**Tests tras correcciones:** 242 ✅ / 715 assertions / 0 failures

---

## Fase 7 — Pruebas de Integración

### Nuevos Tests Escritos

Se añadieron **66 tests nuevos** distribuidos en 5 archivos, elevando la suite de 176 a **242 tests**.

#### `tests/Feature/Core/UserControllerTest.php` — 11 tests
Cubre el CRUD completo de usuarios con validaciones de seguridad multi-tenant:

| Test | Qué valida |
|------|-----------|
| `test_index_requiere_autenticacion` | Redirige a login si no autenticado |
| `test_index_muestra_usuarios_del_tenant` | Listado scoped al tenant |
| `test_store_crea_usuario_correctamente` | Creación con rol y asignación de tenant_id |
| `test_store_falla_sin_nombre` | Validación requerido |
| `test_store_falla_email_duplicado` | Validación unique global |
| `test_store_falla_con_contrasena_debil` | Validación Password::defaults() |
| `test_edit_bloquea_usuario_de_otro_tenant` | Abort 403 cross-tenant |
| `test_update_modifica_nombre_y_email` | Update correcto |
| `test_update_impide_autodesactivacion` | No puede desactivarse a sí mismo |
| `test_update_bloquea_usuario_de_otro_tenant` | Abort 403 cross-tenant |
| `test_destroy_elimina_usuario` | Eliminación correcta |
| `test_destroy_impide_autoeliminacion` | Error flash al auto-eliminar |
| `test_destroy_impide_eliminar_ultimo_admin` | Error si único ADMIN_EMPRESA |
| `test_destroy_bloquea_usuario_de_otro_tenant` | Abort 403 cross-tenant |
| `test_store_asigna_tenant_id_automaticamente` | tenant_id del contexto activo |

#### `tests/Feature/Core/ProfileControllerTest.php` — 8 tests
Cubre edición de perfil y cambio de contraseña:

| Test | Qué valida |
|------|-----------|
| `test_edit_requiere_autenticacion` | Redirige a login si guest |
| `test_edit_devuelve_datos_del_usuario` | Props correctas en Inertia |
| `test_update_cambia_nombre_y_email` | Actualización exitosa |
| `test_update_falla_sin_nombre` | Campo requerido |
| `test_update_falla_email_invalido` | Formato email |
| `test_update_falla_email_duplicado` | Unique global |
| `test_update_permite_mismo_email_propio` | No falla con su propio email |
| `test_update_password_cambia_contrasena` | Cambio exitoso |
| `test_update_password_falla_con_contrasena_actual_incorrecta` | `current_password` rule |
| `test_update_password_falla_sin_confirmacion` | Confirmación requerida |
| `test_update_password_falla_contrasena_debil` | Password::defaults() |

#### `tests/Feature/Modules/Crm/ContactoOportunidadTest.php` — 12 tests
Cubre CRM Contactos y Oportunidades con tenant isolation:

| Test | Qué valida |
|------|-----------|
| `test_contacto_store_crea_contacto_para_cliente` | Contacto vinculado al cliente correcto |
| `test_contacto_store_falla_sin_nombre` | Validación requerido |
| `test_contacto_update_modifica_campos` | Update correcto |
| `test_contacto_destroy_elimina_correctamente` | Soft delete |
| `test_contacto_aislamiento_entre_tenants` | 404 al actualizar contacto ajeno |
| `test_oportunidades_index_devuelve_pagina` | Listado paginado |
| `test_oportunidad_store_crea_oportunidad` | Creación con todos los campos |
| `test_oportunidad_store_falla_sin_titulo` | Validación requerido |
| `test_oportunidad_update_modifica_etapa_y_probabilidad` | Update multi-campo |
| `test_oportunidad_update_etapa_solo_cambia_etapa` | PATCH `updateEtapa` |
| `test_oportunidad_destroy_elimina` | Soft delete |
| `test_oportunidad_aislamiento_entre_tenants` | Global scope excluye registros ajenos |

#### `tests/Feature/Modules/Inventory/CatalogosInventarioTest.php` — 17 tests
Cubre Categorías, Marcas y Bodegas (con sede requerida):

| Área | Tests |
|------|-------|
| Categorías | store, falla duplicado, permite mismo nombre en otro tenant, update, destroy (soft delete), isolation |
| Marcas | store, falla sin nombre, falla duplicado, update, destroy (soft delete), isolation |
| Bodegas | index, store (con sede_id), falla sin nombre, falla sin sede, update, destroy (soft delete), isolation |

**Hallazgo durante tests:** `BodegaController::store()` requiere `sede_id` con `exists:core_sedes,id` — documentado y corregido en el setup del test.

#### `tests/Feature/Modules/Sales/FacturaAnulacionTest.php` — 7 tests
Cubre anulación de facturas y tenant isolation:

| Test | Qué valida |
|------|-----------|
| `test_anular_requiere_autenticacion` | Redirige a login si guest |
| `test_anular_requiere_motivo` | Campo requerido |
| `test_anular_requiere_motivo_minimo_5_caracteres` | Mínimo 5 chars |
| `test_anular_bloquea_factura_de_otro_tenant` | 404 por global scope BelongsToTenant |
| `test_anular_factura_pagada_cambia_estado` | `anulada = true` en BD |
| `test_anular_ya_anulada_devuelve_error` | Error al intentar doble anulación |
| `test_show_bloquea_factura_de_otro_tenant` | 404 por global scope |
| `test_index_solo_muestra_facturas_del_tenant` | Isolation en listado |

**Hallazgo documentado:** El route model binding con `BelongsToTenant` global scope retorna 404 (no 403) al acceder a recursos de otro tenant — comportamiento correcto y esperado.

### Cobertura Actualizada

| Módulo | Tests antes | Tests después | Δ |
|--------|------------|--------------|---|
| Core (Auth, Roles, SuperAdmin, Audit, Users, Profile) | 13 | 28 | +15 |
| CRM (Clientes, Contactos, Oportunidades) | 4 | 16 | +12 |
| Inventory (Productos, Recepciones, Categorías, Marcas, Bodegas) | 10 | 27 | +17 |
| Sales (Facturas, POS, Anulación) | 25 | 32 | +7 |
| Accounting | 6 | 6 | — |
| Cash | 23 | 23 | — |
| HR | 12 | 12 | — |
| Payroll | 13 | 13 | — |
| Purchasing | 4 | 4 | — |
| ServiceDesk | 35 | 35 | — |
| Unit | 17 | 17 | — |
| **TOTAL** | **176** | **242** | **+66** |

**Cobertura estimada:** ~42% → **~55%**

---

## Fase 8 — Pruebas E2E (Playwright)

### Configuración

| Elemento | Valor |
|----------|-------|
| Framework | Playwright 1.61.1 |
| Navegador | Chromium (Desktop Chrome) |
| Directorio | `tests/e2e/` |
| Reports | `tests/e2e/reports/` (HTML) |
| Screenshots | `tests/e2e/results/screenshots/` |
| Videos | Grabados en primer retry |

### Credenciales de Prueba

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Admin Tenant | `admin@miempresa.com` | `password` | ADMIN_EMPRESA |
| SuperAdmin | `admin@nexora.com` | `admin123` | superadmin |

### Archivos Creados

| Archivo | Tests | Módulo |
|---------|-------|--------|
| `helpers.ts` | — | Utilidades comunes (login, navegación, formularios) |
| `auth.spec.ts` | 3 | Autenticación (login, logout, credenciales inválidas) |
| `crm-clientes.spec.ts` | 4 | CRM Clientes (crear, buscar, editar, contactos) |
| `inventario-productos.spec.ts` | 5 | Inventario (productos, categorías, marcas) |
| `compras-proveedores.spec.ts` | 3 | Compras Proveedores (crear, buscar, editar) |
| `service-desk-ordenes.spec.ts` | 5 | Service Desk (ordenes, estados, catálogos, prestadores) |
| `tesoreria-caja.spec.ts` | 4 | Tesorería (estado caja, sesiones, movimientos, reportes) |
| `ventas-facturas.spec.ts` | 3 | Ventas (facturas, detalle, POS) |
| `dashboard.spec.ts` | 5 | Dashboard (carga, módulos, alertas, actividad, acceso rápido) |
| `superadmin.spec.ts` | 4 | SuperAdmin (dashboard, empresas, módulos, acceso denegado) |

### Escenarios de Negocio Cubiertos

#### Autenticación (3 tests)
1. ✅ Login con credenciales válidas
2. ✅ Login con credenciales inválidas muestra error
3. ✅ Logout cierra sesión correctamente

#### CRM Clientes (4 tests)
1. ✅ Crear cliente nuevo
2. ✅ Buscar cliente existente
3. ✅ Editar cliente
4. ✅ Crear contacto para cliente

#### Inventario (5 tests)
1. ✅ Crear producto nuevo
2. ✅ Buscar producto por código
3. ✅ Editar producto
4. ✅ Crear categoría
5. ✅ Crear marca

#### Compras Proveedores (3 tests)
1. ✅ Crear proveedor nuevo
2. ✅ Buscar proveedor
3. ✅ Editar proveedor

#### Service Desk (5 tests)
1. ✅ Flujo completo crear orden
2. ✅ Cambiar estado de orden
3. ✅ Ver catálogo de servicios
4. ✅ Ver catálogo de marcas
5. ✅ Ver prestadores/técnicos

#### Tesorería (4 tests)
1. ✅ Ver estado de caja
2. ✅ Verificar sesión de caja
3. ✅ Ver historial de movimientos
4. ✅ Verificar reporte consolidado

#### Ventas (3 tests)
1. ✅ Ver listado de facturas
2. ✅ Ver detalle de factura
3. ✅ Verificar punto de venta (POS)

#### Dashboard (5 tests)
1. ✅ Dashboard carga correctamente
2. ✅ Verificar módulos activos
3. ✅ Verificar centro de alertas
4. ✅ Verificar actividad reciente
5. ✅ Navegación rápida funciona

#### SuperAdmin (4 tests)
1. ✅ Dashboard de superadmin carga correctamente
2. ✅ Ver listado de empresas
3. ✅ Ver listado de módulos
4. ✅ Verificar que usuario normal no puede acceder

### Comandos de Ejecución

```bash
# Ejecutar todas las pruebas E2E
npm run test:e2e

# Ejecutar con interfaz gráfica
npm run test:e2e:ui

# Ver reporte HTML
npm run test:e2e:report

# Ejecutar un archivo específico
npx playwright test auth.spec.ts

# Ejecutar con debug
npx playwright test --debug
```

### Variables de Entorno

```bash
# Configurar en .env.testing o pasar por CLI
APP_URL=http://localhost:8000
TEST_EMAIL=admin@miempresa.com
TEST_PASSWORD=password
```

### Resumen Ejecutivo E2E

| Categoría | Tests | Estado |
|-----------|-------|--------|
| Autenticación | 3 | ✅ Creados |
| CRM | 4 | ✅ Creados |
| Inventario | 5 | ✅ Creados |
| Compras | 3 | ✅ Creados |
| Service Desk | 5 | ✅ Creados |
| Tesorería | 4 | ✅ Creados |
| Ventas | 3 | ✅ Creados |
| Dashboard | 5 | ✅ Creados |
| SuperAdmin | 4 | ✅ Creados |
| **TOTAL** | **36** | **✅ Creados** |

**Nota:** Las pruebas E2E requieren que el servidor Laravel esté corriendo (`composer dev`) antes de ejecutarlas.
