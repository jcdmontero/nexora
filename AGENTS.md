# NEXORA Platform — AI Agent Instructions

## Stack
- Laravel 13 + PHP 8.3, PostgreSQL
- Inertia.js + React 19 + Tailwind CSS v4 + Shadcn/ui (estilo `base-nova`)
- Vite 8, Ziggy (route() global en JS via @routes en Blade), TypeScript estricto
- Multi-tenant por subdominio (single DB + tenant_id), spatie/laravel-permission

## Comandos esenciales
```bash
composer setup          # instalación completa (composer install + .env + key:generate + migrate + npm install + npm build)
composer fresh          # reset BD: config:clear + migrate:fresh --seed + modules:scan
composer dev            # arranca 4 procesos: php artisan serve + queue:listen + pail (logs) + npm run dev (concurrently)
composer test           # php artisan config:clear && php artisan test (PHPUnit con SQLite :memory:)
npm run dev             # solo Vite dev server
php artisan migrate
php artisan db:seed
```

## Arquitectura
- `app/Core/` — Models, Services, Middleware, Controllers, Providers (namespace `App\Core\`)
- `app/Models/User.php` — modelo User (namespace `App\Models`)
- `app/Modules/{ModuleName}/` — módulos con Controllers, Models, Migrations, Services, Routes, Providers
- `app/Http/` — solo controllers genéricos si aplica; la lógica va en `app/Core/`
- `routes/web.php` — todas las rutas en español: `core.usuarios.index`, `core.dashboard`
- `resources/js/app.jsx` — entrypoint Inertia, resuelve páginas de `./Pages/**/*.{jsx,tsx}`
- `resources/js/Pages/` — páginas Inertia/React (21 directorios: Dashboard, Sales, Cash, Crm, Inventory, Accounting, Hr, Payroll, ServiceDesk, Notifications, Purchasing, SuperAdmin, etc.)
- `resources/js/Components/ui/` — componentes Shadcn/ui (33 componentes)
- `resources/js/Components/toasts/` — ToastProvider + ToastItem + toast hook
- `resources/js/Hooks/` — usePermissions, useTheme, useDashboardLayout, useWidgetData, useBreadcrumbs, useRegime, useCaja, useScrollReveal, useDataTable, usePageLoading
- `resources/js/Layouts/` — AuthenticatedLayout, LandingLayout
- `@/` → `resources/js/` (definido en tsconfig.json y vite.config.js)
- `config/` — database.php (pgsql por defecto), session.php (database driver), queue.php (database driver), roles.php

## Convenciones que se desvían del default
- Rutas, controladores, modelos en español (`core.usuarios.index`, `UserController`)
- Queue, cache y session usan driver `database` en lugar de file/redis
- `composer dev` usa `pail` para logs y `concurrently` para orquestar 4 procesos
- TypeScript estricto obligatorio (prohibido `any`)
- Shadcn/ui es la librería primaria de componentes; Tailwind utility classes para layout
- El comando `composer test` siempre ejecuta `config:clear` primero
- SSR configurado en `resources/js/ssr.jsx`

## Idioma de la interfaz (OBLIGATORIO)
- **TODA la UI debe estar en español.** Nunca exponer códigos técnicos en inglés al usuario.
- Los permisos se guardan como código (`users:view`) pero se MUESTRAN traducidos con `@/lib/permissions` (`permissionLabel`, `groupLabel`, `groupPermissions`).
- Al agregar permisos/módulos nuevos, añadir sus etiquetas a `resources/js/lib/permissions.ts`.

## Roles y permisos (modelo híbrido con spatie teams)
- `config('permission.teams') === true`. El `team_id` = `tenant_id` y se fija por request en `IdentifyTenant` (`setPermissionsTeamId`).
- **`superadmin`**: rol global (team null). NO se asigna en BD (model_has_roles.team_id es NOT NULL); su acceso total viene de `Gate::before` (is_superadmin) en `CoreServiceProvider`.
- **Catálogo fijo** de roles empresariales en `config/roles.php` (ADMIN_EMPRESA, GERENTE, CONTADOR, RRHH, VENDEDOR, CAJERO, TECNICO). No se permiten roles de texto libre.
- Cada empresa obtiene SUS instancias de los roles (team_id = tenant_id) vía `App\Core\Services\RoleProvisioner` → permisos del mismo rol pueden diferir por empresa.
- Autorización: rutas protegidas con middleware `permission:` de spatie. Permisos del usuario se exponen a React en `auth.user.permissions`; usar el hook `usePermissions()` (`can`, `canAny`, `hasRole`) para ocultar UI. SuperAdmin → `can()` siempre true.
- Al activar un módulo, `ModuleActivator` valida dependencias y siembra los permisos del manifiesto. Al desactivar, valida que no haya dependientes activos.

## Componentes y hooks reutilizables (usar SIEMPRE, no reinventar)
- `@/Components/ui/data-table` — **DataTable responsive**: tabla en escritorio, tarjetas apiladas en móvil. Columnas con `cell`, `hideOnMobile`, `alignEnd`. Toda tabla nueva debe usarlo (prohibido `<Table>` plano sin adaptación móvil).
- `@/Components/ui/empty-state` — EmptyState (icono + título + descripción + CTA opcional). Prohibido "No records found".
- `@/Components/ui/skeleton` — Skeleton, TableSkeleton, CardGridSkeleton, StatsCardSkeleton para estados de carga.
- `@/Components/toasts/ToastProvider` + `useToast()` — toasts; se alimentan solos de `flash.success`/`flash.error` del backend.
- `@/Hooks/usePermissions` — autorización en frontend.
- `@/Hooks/useTheme` — tema claro/oscuro (persistido en localStorage; default claro).
- `@/lib/permissions` — traducción de permisos a español.
- `app/Core/Services/Auditable.php` (trait) — auditoría automática created/updated/deleted en modelos.

## Multi-tenant: resolución de tenant
- Producción: por subdominio (`empresa.nexora.com`) en `IdentifyTenant`.
- Local/dev (localhost sin subdominio): se resuelve del usuario autenticado (`auth()->user()->tenant_id`). Por eso `IdentifyTenant` corre DESPUÉS de StartSession (appendToGroup, no prepend).
- `LoginController`: con subdominio filtra por `tenant_id`; en localhost autentica por credenciales.

## Trampas de Inertia/Ziggy ya resueltas (no repetir)
- **Casing de imports (CRÍTICO):** usar SIEMPRE el casing real del filesystem: `@/Components/...`, `@/Hooks/...`, `@/Layouts/...`, `@/lib/...` (y subcarpeta `ui` en minúscula: `@/Components/ui/...`). En Windows el FS es case-insensitive, pero Vite trata `@/components` y `@/Components` como módulos DISTINTOS → duplica React/Inertia/ToastProvider → inputs que pierden el foco en cada tecla y contextos vacíos. Nunca mezclar casing.
- `usePage().url` está en la RAÍZ, no en `.props`. Para props compartidas sí: `usePage().props.moduleMenus`.
- Cualquier provider que use `usePage()` debe ir DENTRO de `<App>` (usar el render-prop en `app.jsx`), nunca envolviéndolo por fuera.
- Deferred props (`Inertia::defer`) llegan `undefined` en el primer render → tratar `== null` como "cargando".
- En el sidebar, filtrar items de módulos con `route().has(name)` porque las rutas de módulos no instalados no existen y `route()` lanza error.
- `modules:scan` (`php artisan modules:scan`) re-registra el catálogo desde `app/Modules/*/module.json`.
- `vite.config.js` tiene `dedupe: ['react', 'react-dom', '@inertiajs/react']` para evitar duplicación por casing en Windows.

## Estándares obligatorios (leer antes de codificar)
- `.opencode/docs/modelo-negocio.md` — **modelo gestionado (NO self-service)**: la gestión de módulos vive SOLO en el Portal SuperAdmin; el tenant solo consume sus módulos habilitados, nunca activa/contrata
- `.opencode/docs/ciclo-vida-modulos.md` — **gobernanza de módulos** (marketplace interno): ciclo DESARROLLO→QA→CERTIFICACION→PUBLICADO→DEPRECADO→RETIRADO; solo módulos PUBLICADOS se asignan a clientes; empresa Sandbox NEXORA LAB para experimentales
- `.opencode/docs/roadmap-profesional.md` — prioridades: Design System → Permisos → Auditoría → Estados vacíos → Skeleton → Búsqueda global → API First
- `.opencode/docs/design-premium.md` — diseño tipo Notion/Linear/Stripe; prohibido aspecto Bootstrap
- `.opencode/docs/coding-standards.md` — DRY, separación de capas, nada de `any`, nada hardcodeado, **+ estándar de responsive multidispositivo** (tablas → tarjetas en móvil, formularios 1 columna, áreas táctiles ≥44px)
- `AUDITORIA-CORE.md` — estado y decisiones del Core
- `ANALISIS-REUTILIZACION-LEGACY.md` — qué código del legacy reutilizar por módulo (joyas: NominaService, ContabilidadService, WorkflowService)

## Testing
- `composer test` (PHPUnit + SQLite :memory:) — config en `phpunit.xml`
- Suites: `tests/Unit/`, `tests/Feature/`, `app/Modules/*/Tests/` (suite Modules)
- DB se refresca automáticamente en tests (SQLite in-memory configurado en phpunit.xml)
- **CRÍTICO:** Ejecutar tests limpia la base de datos de desarrollo. Después de terminar cualquier ejecución de tests, se DEBEN restablecer las credenciales del entorno de desarrollo ejecutando `composer fresh` o al menos `php artisan db:seed` para volver a crear los usuarios (`admin@miempresa.com` y `admin@nexora.com`).
- **Playwright E2E**: `npm run test:e2e` (tests en `tests/e2e/`), config en `playwright.config.ts`. Proyectos: setup (auth), chromium, firefox, mobile. Auth por storage state por rol (admin, superadmin, vendedor, tecnico) en `.playwright/.auth/`.
- **Auditoría Playwright**: `npm run auditoria` (config separada `playwright.auditoria.config.ts`, tests en `tests/e2e/auditoria/`).
- **Certificación Playwright**: config en `tests_certificacion/playwright.certificacion.config.ts`, auth por 7 roles en `.playwright.cert/.auth/`.

## Notas
- `servicemanager/` es un proyecto legacy **solo de referencia** (se borrará); ERP en Laravel 13 + PostgreSQL, frontend Blade/Bootstrap/Livewire. NO modificarlo. Ver `ANALISIS-REUTILIZACION-LEGACY.md`.
- `app/Modules/` tiene 10 módulos con código real (crm, inventory, service-desk, sales, cash, purchasing, accounting, hr, payroll, notifications). Cada uno tiene Controllers, Models, Migrations, Routes, Providers. Se activan/desactivan desde la UI (ModuleController). 50+ controllers, 46+ migraciones.
- Orden recomendado para construir módulos (por dependencias): accounting → inventory → crm → sales/cash/purchasing → service-desk → hr → payroll.

## Agentes y skills disponibles (en `.opencode/agents/` y `.opencode/skills/`)
Set propio de Nexora, adaptado a su stack (Laravel 13 multi-tenant + Inertia + React 19 + Tailwind v4 + Shadcn/ui).

**Agentes (9):** `architect` (integridad estructural, capas Controller→Service→Model, aislamiento por tenant) · `backend` (lógica Laravel 13/PHP 8.3, módulos, Auditable) · `frontend` (Inertia + React 19 + Tailwind v4 + Shadcn, TS estricto, responsive premium) · `postgres-dba` (migraciones e índices multi-tenant, evita N+1) · `security` (XSS/SQLi/CSRF/IDOR/Mass Assignment + fugas entre tenants) · `tester` (PHPUnit Feature/Unit, SQLite :memory:) · `documentation` (solo lectura de código) · `accounting-colombia` (NIIF/DIAN, PUC, partida doble) · `payroll-colombia` (nómina Colombia: UGPP/DIAN/MinTrabajo).

**Skills (11):** `accounting-colombia` · `documentation-generator` · `erp-architect` · `frontend-design` · `laravel-expert` · `payroll-colombia` · `postgres-dba` · `postgres-expert` · `tailwind-premium` · `testing-automation` · `ui-premium`.

Nota: `servicemanager/.gemini/` y `servicemanager/.opencode/` contienen un set análogo pero del ERP **legacy** (otro stack); no usar esos como guía para Nexora.
