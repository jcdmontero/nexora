---
name: documentation-generator
description: Documentación técnica automatizada, diagramas Mermaid y manuales estandarizados para Nexora.
---

## Buenas prácticas
- Escribir en Markdown limpio y estructurado, con bloques de código resaltados.
- Mantener los documentos "vivos", actualizados junto al código.
- Incluir diagramas Mermaid (flowcharts, ERD) para procesos complejos (ej. resolución de tenant, activación de módulos).
- Documentar el contrato `module.json` y las props compartidas de Inertia.

## Restricciones
- NUNCA inventar el funcionamiento de un flujo; basarse en lectura estricta del código.
- Evitar terminología ambigua; definir glosarios si hace falta.

## Ejemplos de uso
- "Genera el diagrama Mermaid del flujo del middleware `IdentifyTenant`."
- "Actualiza el README con las instrucciones de un nuevo módulo."

## Errores comunes a evitar
- Documentar el "qué" en lugar del "por qué".
- Dejar documentación obsoleta tras una refactorización.
