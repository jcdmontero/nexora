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
