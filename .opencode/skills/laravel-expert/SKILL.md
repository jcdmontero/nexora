---
name: laravel-expert
description: Desarrollo backend avanzado con Laravel 13 y PHP 8.3+ en arquitectura multi-tenant (app/Core + app/Modules).
---

## Buenas prácticas
- Usar `readonly` classes, enums nativos de PHP y constructor property promotion.
- Validar toda entrada con FormRequests.
- Desacoplar la lógica en Services (`app/Core/Services`) o Actions; controllers delgados.
- Aislar siempre por `tenant_id`; usar el team de spatie/laravel-permission (`setPermissionsTeamId`).
- Aplicar el trait `Auditable` en modelos que requieran trazabilidad.
- Exponer rutas con Ziggy; nombrarlas en español (`core.users.index`).

## Roles y permisos (modelo híbrido con spatie teams)
- `config('permission.teams') === true`; `team_id = tenant_id`, fijado por request en `IdentifyTenant` (que corre DESPUÉS de StartSession, por `appendToGroup`).
- `superadmin` = rol global (team null); NO se asigna en BD (model_has_roles.team_id es NOT NULL). Su acceso total viene de `Gate::before(is_superadmin)` en `CoreServiceProvider`.
- Catálogo fijo de roles en `config/roles.php`; instanciados por empresa con `App\Core\Services\RoleProvisioner` (permisos del mismo rol pueden diferir por empresa).
- Proteger rutas con middleware `permission:` de spatie. Al crear roles team-scoped, pasar `team_id` explícito (firstOrCreate NO lo autoasigna).
- `ModuleActivator`: valida dependencias activas al activar y siembra permisos del manifiesto; valida dependientes al desactivar. `php artisan modules:scan` registra el catálogo desde `app/Modules/*/module.json`.
- Login: con subdominio filtra por `tenant_id`; en localhost autentica por credenciales y el tenant se resuelve del usuario autenticado.

## Restricciones
- NUNCA usar funciones deprecadas de PHP ni `$guarded = []` sin cuidado (proteger `tenant_id`, `is_superadmin`).
- NUNCA hacer queries dentro de loops (N+1).
- NUNCA devolver datos de un tenant a usuarios de otro.

## Ejemplos de uso
- "Aplica el patrón Service a esta lógica del controlador respetando el scoping por tenant."
- "Crea el CRUD de un nuevo módulo en `app/Modules/` con su `module.json`."

## Errores comunes a evitar
- Olvidar Eager Loading (`with()`) al consultar relaciones.
- Olvidar `DB::transaction()` al guardar múltiples modelos dependientes.
- Olvidar declarar el middleware `permission:` en rutas sensibles.
