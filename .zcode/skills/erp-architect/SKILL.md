---
name: erp-architect
description: Diseño sistémico y escalable para SaaS multi-tenant modular, enfocado en modularidad, trazabilidad y aislamiento por tenant.
---

## Buenas prácticas
- Mantener los módulos (`app/Modules/*`) con bajo acoplamiento; comunicar vía eventos/listeners.
- Cada módulo se autodescribe con `module.json` (code, name, version, dependencies, permissions, menus) y se activa/desactiva por tenant.
- Registrar auditoría (`Auditable`/`AuditLog`) para toda mutación sensible.
- Diseñar para integridad histórica (Soft Deletes en maestros) y escalamiento de datos.
- Garantizar aislamiento estricto por `tenant_id` en todas las capas.

## Restricciones
- NUNCA borrar físicamente registros transaccionales; usar anulaciones lógicas.
- NUNCA permitir que la falla de un módulo no crítico detenga flujos principales.
- NUNCA crear dependencias circulares entre módulos.

## Ejemplos de uso
- "Diseña la estructura de un nuevo módulo de Suscripciones respetando el contrato `module.json`."
- "Audita el flujo de activación de módulos por tenant para detectar cuellos de botella."

## Errores comunes a evitar
- Ignorar la concurrencia cuando dos usuarios mutan el mismo recurso.
- Acoplar un módulo directamente al núcleo en vez de usar el registro de módulos.
