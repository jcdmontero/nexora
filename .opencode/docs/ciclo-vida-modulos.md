# Ciclo de Vida y Gobernanza de Módulos — NEXORA

> Complementa `modelo-negocio.md`. Define cómo un módulo pasa de "en desarrollo" a
> "vendible a clientes". Es un **marketplace interno de módulos** con control de calidad.
> Regla central: un cliente JAMÁS recibe un módulo que no esté PUBLICADO.

## Separar "módulo en desarrollo" de "módulo comercializable"

No todo módulo que existe en el código puede venderse. Hay dos planos distintos:
- **Laboratorio** (desarrollo/pruebas): visible solo para SuperAdmin / Devs / QA.
- **Catálogo de producción**: módulos listos, los únicos asignables a empresas.

## Niveles

### Nivel 1 — Laboratorio (Desarrollo)
Módulos en construcción o prueba. **NO pueden asignarse a clientes.**
Solo acceden: SuperAdmin, Desarrolladores, QA.
```
CRM V2        Estado: Desarrollo
Inventario    Estado: QA
Nómina        Estado: Pendiente
IA Asistente  Estado: Experimental
```

### Nivel 2 — Certificación
Antes de llegar a clientes, el módulo pasa un checklist obligatorio:
```
✓ Migraciones verificadas
✓ Permisos definidos
✓ Auditoría implementada
✓ Responsive validado
✓ Pruebas completadas
✓ Documentación creada
✓ Rendimiento validado
✓ Multiempresa (multi-tenant) validado
```
Mientras no cumpla todo → `estado = CERTIFICACION` y **no puede venderse**.

### Nivel 3 — Catálogo de Producción
Solo aquí aparecen los módulos asignables a empresas. Son los únicos que el SuperAdmin
puede habilitar para un cliente.
```
CRM         Estado: Publicado
Inventario  Estado: Publicado
Compras     Estado: Publicado
Nómina      Estado: Publicado
```

## Ciclo de vida (estados)

```
DESARROLLO → QA → CERTIFICACION → PUBLICADO → DEPRECADO → RETIRADO
```

| Estado | ¿Asignable a clientes? | Quién lo ve |
|---|---|---|
| DESARROLLO | No | SuperAdmin / Dev |
| QA | No | SuperAdmin / Dev / QA |
| CERTIFICACION | No | SuperAdmin / QA |
| **PUBLICADO** | **Sí** | SuperAdmin (para asignar) |
| DEPRECADO | No para nuevas; sigue en quien ya lo tiene | SuperAdmin |
| RETIRADO | No | SuperAdmin (histórico) |

## Portal SuperAdmin: "Centro de Módulos" (Marketplace)

Sección dedicada donde el SuperAdmin ve y gobierna todo el catálogo:

| Módulo | Versión | Estado |
|---|---|---|
| CRM | 1.0.0 | Publicado |
| Inventario | 1.2.0 | Publicado |
| Nómina | 0.8.0 | QA |
| IA | 0.2.0 | Desarrollo |

Desde aquí: ver módulos, probarlos, auditarlos, correr su checklist y, al certificarlos,
moverlos a **PUBLICADO** para que entren al catálogo asignable a empresas.

## Empresa especial: NEXORA LAB (Sandbox)

Una empresa interna donde se instalan automáticamente los módulos experimentales, para
probar cómo se comportan dentro de una empresa real **sin afectar clientes**.
```
Empresa: NEXORA LAB
  ✓ CRM
  ✓ Inventario
  ✓ Compras
  ✓ Nómina Beta
  ✓ IA Experimental
  ✓ RRHH V2
```

## Lo que NUNCA se permite
- Un cliente activando un módulo beta/experimental.
- Asignar a un cliente un módulo que no esté en estado PUBLICADO.
Razón: genera tickets de soporte, datos dañados y funcionalidades incompletas.

## Arquitectura resultante

```
SUPERADMIN
   ↓ Centro de Módulos
   ↓ [Desarrollo] [QA] [Certificación] [Publicado]
   ↓ Empresas
   ↓ Asignar SOLO módulos publicados
   ↓ Cliente final
```

## Implicaciones de datos (para implementar)

Tabla `modules` (catálogo global) necesita gobernanza de estado:
- `estado` enum/string: `desarrollo | qa | certificacion | publicado | deprecado | retirado`
  (reemplaza/precisa el actual `is_active_globally`).
- Opcional: `certificacion` (JSON) con el checklist y su resultado.
- `version` ya existe.

Reglas:
- `ModuleActivator::syncModules` / el catálogo asignable en el Portal SuperAdmin debe
  filtrar **solo `estado = publicado`** (salvo para la empresa Sandbox NEXORA LAB, que
  puede recibir módulos en cualquier estado).
- La galería que ve el SuperAdmin para asignar a una empresa = módulos PUBLICADOS.
- El "Centro de Módulos" muestra TODOS los estados (gobernanza).

*Documento creado: 2026-06-19*
