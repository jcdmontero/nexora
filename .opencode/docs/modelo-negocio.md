# Modelo de Negocio — NEXORA (OBLIGATORIO)

> Define quién administra qué. Es la regla que gobierna toda la arquitectura de módulos,
> portales y permisos. Leer antes de tocar módulos, tenants o el sidebar.

## NEXORA NO es un SaaS self-service

NEXORA es un modelo **gestionado / "producto terminado"**, NO un self-service donde el cliente
contrata o activa funcionalidades.

```
NEXORA (nosotros)
   ↓ Crea la empresa
   ↓ Configura la empresa
   ↓ Activa los módulos vendidos
   ↓ Entrega el producto terminado
Cliente (empresa)
   ↓ Solo administra su operación diaria
```

- El cliente **NO** administra licencias.
- El cliente **NO** administra módulos.
- El cliente **NO** ve botones de "Activar / Contratar / Comprar módulo".
- El cliente solo usa las funcionalidades que ya le habilitamos.
- Si quiere un módulo nuevo → nos contacta → lo activamos desde el Portal SuperAdmin.

## Los dos portales

### 1. Portal SuperAdmin (plataforma) — `admin@nexora.com`
Aquí **SÍ** existe la gestión de módulos. Único lugar donde se puede cambiar qué tiene cada empresa.

Capacidades:
- Crear / editar / suspender / reactivar empresas (tenants).
- Activar y desactivar módulos por empresa (= lo que se le vende a cada cliente).
- Crear el administrador inicial de cada empresa.
- Ver métricas globales de la plataforma.

```
Empresa ABC
  ✓ CRM
  ✓ Inventario
  ✓ Ventas
  ✗ Nómina
  ✗ RRHH
  ✓ Servicio Técnico
```
**Solo el SuperAdmin puede modificar esto.**

### 2. Portal Empresa (tenant) — `ADMIN_EMPRESA` y usuarios
La empresa **nunca** ve activar/contratar/comprar. Solo ve el menú de lo que ya tiene habilitado.

```
Menú disponible
  ├── CRM
  ├── Inventario
  ├── Ventas
  └── Servicio Técnico   (solo los módulos habilitados)
```

Opcional (solo lectura, sin botones/switches):
- **"Mi Plan"**: muestra el plan y las **capacidades habilitadas** (✓ CRM, ✓ Inventario...).
- Nunca llamarlo "Módulos contratados" dentro de la empresa (da sensación de que los administra).
  Usar "Capacidades habilitadas" o no mostrarlo.

## Arquitectura de datos

- `modules` — catálogo global de módulos (no cambia por empresa).
- `tenant_modules` (empresa_id/tenant_id, module_code, is_active, ...) — qué módulos tiene cada empresa.

**Regla de oro de la gestión:**
- `tenant_modules` solo lo modifica el **SuperAdmin** (vía `ModuleActivator::syncModules`).
- La **empresa solo consulta** (sus menús activos), **nunca modifica**.

## Implicaciones para el código

1. La app del tenant **NO** tiene rutas ni pantallas de activar/desactivar módulos.
2. Las rutas `core.modules.*` (activar/desactivar) quedan **eliminadas** del Portal Empresa.
3. El sidebar del tenant **NO** muestra "Módulos".
4. La activación/desactivación vive en el Portal SuperAdmin (`superadmin.tenants.*`).
5. Los permisos `modules:view` / `modules:manage` NO aplican al tenant (son del SuperAdmin).
6. El sidebar del tenant se arma solo con los menús de los módulos activos (vía `module.json`).

## Resumen

> "Nosotros configuramos la solución y entregamos el producto terminado al cliente."
> Por tanto, toda la gestión de módulos vive EXCLUSIVAMENTE en el Portal SuperAdmin.
> La empresa únicamente ve y trabaja con las funcionalidades ya habilitadas.

*Documento creado: 2026-06-19*
