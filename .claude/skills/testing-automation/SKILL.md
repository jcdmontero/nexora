---
name: testing-automation
description: Suites de pruebas robustas y deterministas con PHPUnit en Laravel (SQLite :memory:), con foco en multi-tenant y permisos.
---

## Buenas prácticas
- Priorizar Feature Tests sobre Unit Tests para validar el flujo completo.
- Usar Factories y Seeders para preparar un estado conocido.
- Probar explícitamente el aislamiento entre tenants y los accesos denegados por permiso.
- Aislar terceros con `Mockery`, `Queue::fake()`, `Http::fake()`, `Event::fake()`.
- Ejecutar siempre `composer test` (corre `config:clear` + `php artisan test`).

## Restricciones
- NUNCA depender de registros hardcodeados en la BD de desarrollo.
- NUNCA ignorar warnings de deprecación durante las pruebas.

## Ejemplos de uso
- "Genera el Feature Test del endpoint de creación de usuarios verificando el permiso `users:create`."
- "Escribe un test que confirme que un usuario no puede leer datos de otro tenant."

## Errores comunes a evitar
- Crear "flaky tests" por concurrencia o tiempos.
- Probar métodos privados en vez de la interfaz pública.
