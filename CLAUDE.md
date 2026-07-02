# CLAUDE.md

Este archivo proporciona instrucciones a Claude Code (claude.ai/code) para trabajar en este repositorio.

# NEXORA

## Descripción general

**NEXORA** es una plataforma ERP/multitenant desarrollada con Laravel 13 + Inertia.js + React.

La plataforma está compuesta por dos capas claramente diferenciadas:

1. **Portal SuperAdministrador** (`/superadmin`)
   Permite administrar empresas (tenants), gestionar el ciclo de vida de los módulos y configurar parámetros globales de la plataforma.

2. **Aplicación de Empresa (Tenant)**
   Cada empresa dispone de un espacio de trabajo completamente aislado, con módulos activables según sus necesidades.

---

## Idioma y convenciones

### IMPORTANTE

* Claude Code **DEBE RESPONDER SIEMPRE EN ESPAÑOL**.
* Todo comentario de código, explicación técnica, análisis, documentación y sugerencia debe escribirse exclusivamente en español.
* Si el usuario escribe en otro idioma, Claude debe responder igualmente en español, salvo que el usuario solicite explícitamente otro idioma.
* Nunca mezclar inglés y español innecesariamente.
* Mantener siempre terminología empresarial y técnica en español.

### Convenciones del proyecto

El dominio de negocio está completamente en español.

Por tanto:

* Rutas.
* Nombres de modelos.
* Nombres de tablas.
* Columnas de base de datos.
* Permisos.
* Roles.
* Etiquetas de interfaz.
* Servicios.
* Eventos.
* Enumeraciones.

**Deben mantenerse en español.**

No introducir nombres nuevos en inglés salvo dependencias externas o APIs de terceros.

---

# Stack tecnológico

## Frontend

* Inertia.js 3
* React 19
* shadcn/ui
* Tailwind CSS 4
* Vite 8

## Backend

* Laravel 13
* PHP 8.3
* PostgreSQL
* spatie/laravel-permission con soporte para equipos (teams)

---

# Comandos disponibles

```bash
composer setup
# Instalación inicial:
# dependencias, .env, key:generate, migrate, seed,
# npm build y modules:scan

composer dev
# Ejecuta:
# servidor + queue:listen + pail + vite

composer test
# Limpia configuración y ejecuta pruebas secuencialmente

composer fresh
# migrate:fresh --seed y modules:scan

composer pint
# Formateo de código

php artisan modules:scan
# Escanea app/Modules/*/module.json y registra módulos

php artisan test --filter=NombreTest
# Ejecutar una prueba específica
```

---

# Arquitectura multitenant

* Cada empresa corresponde a un registro en la tabla `tenants`.
* Modelo principal: `App\Core\Models\Tenant`.

## Resolución del tenant

El middleware `IdentifyTenant`:

* Detecta el subdominio en producción.
* En desarrollo (localhost) utiliza el `tenant_id` del usuario autenticado.
* Registra el tenant actual en el contenedor mediante `current_tenant`.

## Aislamiento de datos

Todos los modelos ubicados en `app/Modules/` deben utilizar obligatoriamente el trait:

```php
BelongsToTenant
```

Este trait:

* Asigna automáticamente el `tenant_id`.
* Aplica un Global Scope para filtrar los datos del tenant actual.

## Aislamiento de permisos

Se utiliza:

```php
spatie/laravel-permission
```

con:

```php
'teams' => true
```

Cada tenant posee sus propios roles independientes.

Ejemplo:

```text
ADMIN_EMPRESA
```

puede tener permisos distintos en empresas diferentes.

## Superadministrador

Existe un bypass global:

```php
Gate::before()
```

que concede acceso total cuando:

```php
$user->is_superadmin === true
```

## Helpers globales

```php
tenant()
```

Devuelve el tenant actual.

```php
tenantId()
```

Devuelve el ID del tenant actual.

---

# Usuarios y sedes

* Los usuarios pertenecen a un Tenant.
* Opcionalmente pueden pertenecer a una Sede.
* Una Sede posee:

  * Bodegas.
  * Cajas.

Los SuperAdministradores:

```php
is_superadmin = true
tenant_id = null
```

y no pertenecen a ninguna empresa.

---

# Sistema de módulos

Los módulos se encuentran en:

```text
app/Modules/
```

El núcleo del sistema reside en:

```text
app/Core/
```

---

## Módulos disponibles

| Módulo           | Código        | Propósito                          |
| ---------------- | ------------- | ---------------------------------- |
| Ventas           | sales         | POS y facturación electrónica DIAN |
| Inventario       | inventory     | Productos, stock y kardex          |
| CRM              | crm           | Clientes y oportunidades           |
| Compras          | purchasing    | Proveedores y órdenes              |
| Contabilidad     | accounting    | PUC y asientos                     |
| Caja             | cash          | Cajas y arqueos                    |
| Talento Humano   | hr            | Empleados y contratos              |
| Nómina           | payroll       | Liquidaciones                      |
| Mesa de Servicio | service-desk  | Tickets y reparaciones             |
| Notificaciones   | notifications | WhatsApp, Telegram y Email         |

---

# Estructura de un módulo

```text
app/Modules/{Modulo}/
    module.json
    Controllers/
    Models/
    Migrations/
    Routes/web.php
    Services/
    Providers/
```

Todos los modelos deben implementar:

```php
BelongsToTenant
```

---

# Ciclo de vida de módulos

Estados posibles:

```text
desarrollo
qa
certificacion
publicado
deprecado
retirado
```

Solo los módulos en estado:

```text
publicado
```

pueden activarse.

## Activación

```php
ModuleActivator::activate($tenant, $code)
```

Realiza automáticamente:

* Activación de dependencias.
* Migraciones.
* Creación de permisos.
* Provisionamiento inicial.

## Desactivación

```php
ModuleActivator::deactivate($tenant, $code)
```

No se permite desactivar módulos requeridos por otros módulos activos.

---

# Auditoría

Existen dos mecanismos:

## Trait Auditable

Registra automáticamente:

* Crear.
* Actualizar.
* Eliminar.
* Restaurar.

Incluye:

* Usuario.
* IP.
* URL.
* Valores anteriores y nuevos.

## AuditLogger

Uso manual:

```php
AuditLogger::log(...)
```

---

# Facturación electrónica DIAN

El módulo Ventas implementa una abstracción para DIAN.

Componentes principales:

* `DianProviderInterface`
* `SignatureProviderInterface`
* `MockDianProvider`
* `RealDianProvider`
* `XmlSigner`
* `XmlUBLGenerator`

El proveedor se define mediante:

```env
DIAN_PROVIDER=
```

---

# Flujo de facturación

```text
Creación
↓
Generación PDF
↓
Envío opcional a DIAN
↓
Consulta de estado
```

El servicio principal es:

```php
DianService
```

---

# Gestión de cajas

Las cajas funcionan mediante sesiones:

```text
Apertura
↓
Operación
↓
Arqueo
↓
Cierre
```

Cada caja pertenece a una sede.

---

# Frontend

Las páginas React se encuentran en:

```text
resources/js/Pages/
```

Organizadas por módulo.

Los componentes compartidos residen en:

```text
resources/js/Components/
```

---

# Aplicación heredada: servicemanager

Existe una aplicación Laravel independiente:

```text
servicemanager/
```

Características:

* Utiliza Blade.
* Tiene autenticación propia.
* Posee base de datos independiente.

No comparte:

* Base de datos.
* Rutas.
* Usuarios.
* Autenticación.

No debe confundirse con NEXORA.
