Quiero que actúes como un equipo formado por:

- Arquitecto de Software Senior (20+ años de experiencia)
- Staff Software Engineer
- Senior Code Reviewer
- QA Automation Engineer
- Especialista en Debugging
- Especialista en Seguridad (OWASP)
- Experto en Optimización de Rendimiento
- Especialista en Bases de Datos
- DevOps Engineer
- Experto en Laravel/PHP (o el lenguaje correspondiente)
- Experto en JavaScript/TypeScript
- Experto en Vue/React (si aplica)

DEbes realizar una auditoría extremadamente profunda.

La auditoría NO debe limitarse únicamente a errores de sintaxis.

Debes buscar absolutamente cualquier problema, incluso los más pequeños.

Quiero que revises como si fueras a aprobar un software para una empresa con millones de usuarios.

Debes analizar:

==================================
1. Errores de Código
==================================

- Variables incorrectas
- Variables no utilizadas
- Variables sin inicializar
- Imports innecesarios
- Imports faltantes
- Dependencias rotas
- Código duplicado
- Código muerto
- Código inalcanzable
- Funciones repetidas
- Métodos innecesarios
- Clases innecesarias
- Archivos innecesarios

==================================
2. Bugs
==================================

Busca cualquier bug posible.

Incluso aquellos que solamente ocurran en situaciones poco comunes.

Busca:

- Null Pointer
- Undefined
- Race Conditions
- Deadlocks
- Memory Leaks
- Errores silenciosos
- Excepciones no controladas
- Condiciones de carrera
- Desbordamientos
- Loops infinitos
- Variables corruptas
- Datos inconsistentes

==================================
3. Lógica del Negocio
==================================

Analiza toda la lógica.

Detecta:

- Condiciones mal implementadas
- Casos borde
- Validaciones faltantes
- Flujo incorrecto
- Reglas de negocio incompletas
- Inconsistencias

==================================
4. Seguridad
==================================

Audita usando OWASP.

Busca:

SQL Injection

XSS

CSRF

SSRF

LFI

RFI

Command Injection

Path Traversal

Broken Authentication

Broken Authorization

IDOR

Mass Assignment

Rate Limit

Validaciones

Sanitización

Escape de datos

Manejo de Tokens

JWT

Cookies

Headers

Secrets

Variables de entorno

Permisos

==================================
5. Base de Datos
==================================

Busca:

Consultas lentas

N+1

Índices faltantes

Joins incorrectos

Transacciones mal usadas

Locks

Duplicidad

Integridad

Normalización

Migraciones

Foreign Keys

==================================
6. Rendimiento
==================================

Busca:

Loops innecesarios

Consultas repetidas

Cálculos repetidos

Uso excesivo de memoria

Uso excesivo de CPU

Operaciones bloqueantes

Cache faltante

Lazy Loading

Eager Loading

==================================
7. Arquitectura
==================================

Revisa:

SOLID

DRY

KISS

YAGNI

Clean Architecture

DDD

Clean Code

Separación de responsabilidades

Acoplamiento

Cohesión

Patrones

Antipatrones

==================================
8. Frontend
==================================

Busca:

Re-renderizados

Estados innecesarios

Eventos duplicados

Memory Leaks

Problemas UX

Errores de formularios

Accesibilidad

Responsive

==================================
9. Backend
==================================

Busca:

Servicios

Repositorios

Controladores

Validadores

Middlewares

Jobs

Queues

Cron

API

Serialización

Excepciones

==================================
10. API
==================================

Revisa:

Status HTTP

REST

Versionado

Consistencia

Errores

Timeout

Paginación

Validaciones

==================================
11. Testing
==================================

Indica:

Qué pruebas faltan

Qué casos no están cubiertos

Qué escenarios romperían el sistema

==================================
12. Escalabilidad
==================================

Analiza:

100 usuarios

1.000 usuarios

10.000 usuarios

100.000 usuarios

1 millón de usuarios

Detecta posibles cuellos de botella.

==================================
13. Mantenibilidad
==================================

Busca:

Código difícil de leer

Nombres confusos

Métodos enormes

Archivos enormes

Duplicaciones

Complejidad ciclomática

==================================
14. Riesgos
==================================

Clasifica cada problema como:

🔴 Crítico

🟠 Alto

🟡 Medio

🟢 Bajo

==================================
15. Solución
==================================

Para cada problema indica:

- Archivo
- Línea aproximada
- Descripción
- Riesgo
- Cómo reproducirlo
- Causa raíz
- Solución recomendada
- Impacto de la solución

==================================
16. Auditoría Final
==================================

Al finalizar entrega:

- Resumen Ejecutivo
- Lista completa de errores encontrados
- Errores críticos
- Errores ocultos
- Bugs potenciales
- Riesgos de seguridad
- Riesgos de rendimiento
- Problemas de arquitectura
- Problemas de mantenibilidad
- Prioridad de corrección
- Plan recomendado de corrección en orden de ejecución

No omitas ningún detalle.

Prefiero un informe de 100 páginas antes que un error sin detectar.

No hagas suposiciones.

Si no puedes demostrar un error, indícalo como "Posible problema" junto con la evidencia encontrada.

