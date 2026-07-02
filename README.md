# NEXORA Platform

Plataforma SaaS multi-tenant con arquitectura modular. Construida con **Laravel 13**, **Inertia.js + React 19**, **Tailwind CSS v4** y **Shadcn/ui**.

## Requisitos

- PHP 8.3+
- PostgreSQL 16+
- Node.js 20+
- Composer 2
- (Opcional) Laragon

## Quickstart

```bash
# 1. Clonar e instalar
git clone <repo> nexora
cd nexora
composer setup
```

El comando `composer setup` ejecuta automaticamente:

1. `composer install`
2. Crea `.env` desde `.env.example`
3. `php artisan key:generate`
4. Migra la base de datos
5. **Seeds los datos iniciales** (tenant por defecto, roles, permisos, usuarios)
6. Compila assets frontend

Luego inicia el servidor de desarrollo:

```bash
composer dev
```

Visita **http://nexora.test** (o http://127.0.0.1:8000).

## Credenciales por Defecto

| Rol | Email | Password |
|---|---|---|
| SuperAdmin | admin@nexora.com | admin123 |
| Admin Tenant | admin@miempresa.com | password |

## Comandos

```bash
composer setup       # Instalación completa (instalar + migrar + seed + build)
composer dev         # Servidor + queue + logs + Vite (4 procesos concurrentes)
composer test        # Ejecutar tests (PHPUnit con SQLite :memory:)
npm run dev           # Solo Vite dev server
php artisan db:seed   # Re-ejecutar seeders
php artisan migrate    # Ejecutar migraciones pendientes
```

## Arquitectura

```
app/
├── Core/               # Código base del sistema
│   ├── Models/         # Tenant, Module, TenantModule
│   ├── Services/       # ModuleRegistry, ModuleActivator, AuditLogger
│   ├── Middleware/     # IdentifyTenant, EnsureModuleActive
│   └── Http/Controllers/Core/  # CRUDs base
├── Modules/            # Módulos instalables (CRM, Inventory, Sales, etc.)
├── Models/User.php     # Modelo User
└── Http/Middleware/    # HandleInertiaRequests, VerifyCsrfToken

resources/js/
├── Pages/              # Páginas Inertia/React
├── Components/ui/      # Componentes Shadcn/ui
└── Layouts/            # AuthenticatedLayout, LandingLayout
```

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Laravel 13 + PHP 8.3 |
| Base de datos | PostgreSQL (sesiones, cache y colas en DB) |
| Frontend | Inertia.js + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + Shadcn/ui |
| Auth | spatie/laravel-permission + multi-tenant |
| Assets | Vite 8, Ziggy (rutas en JS), Lucide (iconos) |

## Docs

- `AGENTS.md` — Instrucciones para asistentes IA
- `PROGRESO.md` — Tracking de hitos del proyecto
- `.opencode/docs/roadmap-profesional.md` — Roadmap y prioridades
- `.opencode/docs/design-premium.md` — Guía de diseño
- `.opencode/docs/coding-standards.md` — Estándares de código
- `SETUP-DATABASE.md` — Setup detallado de PostgreSQL
