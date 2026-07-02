---
name: postgres-expert
description: Diseño, optimización y mantenimiento de bases de datos PostgreSQL para Nexora (multi-tenant single-DB).
---

## Buenas prácticas
- Usar tipos nativos de PostgreSQL (`JSONB`, `UUID`, `TEXT` sobre `VARCHAR(255)`).
- Implementar llaves foráneas con `ON DELETE` apropiado.
- Indexar adecuadamente: B-Tree para igualdad/rango, GIN + `pg_trgm` para búsqueda de texto.
- Crear índices compuestos que incluyan `tenant_id` para consultas multi-tenant.
- Usar `lockForUpdate()` en transacciones de alta concurrencia.

## Restricciones
- NUNCA escribir SQL con sintaxis exclusiva de MySQL (backticks, `DATE_FORMAT`).
- NUNCA modificar el esquema de una tabla migrada directamente; generar nueva migración.

## Ejemplos de uso
- "Audita esta migración para garantizar compatibilidad 100% con PostgreSQL."
- "Optimiza esta query de Eloquent filtrada por tenant con el índice adecuado."

## Errores comunes a evitar
- Confiar en índices sin analizar el `EXPLAIN`.
- Olvidar incluir `tenant_id` en los índices de tablas multi-tenant.
