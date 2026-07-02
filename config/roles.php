<?php

/*
|--------------------------------------------------------------------------
| Catálogo de Roles del Sistema (modelo híbrido)
|--------------------------------------------------------------------------
| - 'superadmin' es un rol GLOBAL (team_id = null): administra la plataforma,
|   nunca pertenece a una empresa. Bypassa permisos vía Gate::before.
| - 'tenant' es el CATÁLOGO FIJO de roles que una empresa puede usar.
|   Cada empresa obtiene SUS PROPIAS instancias (team_id = tenant_id), de modo
|   que el mismo rol puede tener permisos distintos en cada empresa.
| - Los permisos por defecto aquí son solo del Core; los permisos de módulos
|   se añaden a los roles cuando la empresa activa cada módulo.
*/

return [

    // Rol global de plataforma (no pertenece a ninguna empresa)
    'system' => 'superadmin',

    // Catálogo de roles empresariales: nombre => permisos por defecto (Core)
    'tenant' => [
        'ADMIN_EMPRESA' => [
            'users:view', 'users:create', 'users:edit', 'users:delete',
            'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
            'audit:view',
            'tenant:edit',
        ],
        'GERENTE' => [
            'users:view',
            'audit:view',
            'tenant:edit',
        ],
        'CONTADOR' => [
            'audit:view',
        ],
        'RRHH' => [
            'users:view',
        ],
        'VENDEDOR' => [],
        'CAJERO' => [],
        'TECNICO' => [],
    ],

    // Rol que se asigna al administrador al registrar una empresa nueva
    'default_tenant_admin' => 'ADMIN_EMPRESA',

    /*
    | Permisos de MÓDULO que reciben roles operativos al activar el módulo.
    | El ADMIN_EMPRESA siempre recibe todos los permisos del módulo; aquí se
    | definen permisos adicionales para otros roles (ej. el técnico del taller).
    */
    'module_role_permissions' => [
        'service-desk' => [
            'TECNICO' => ['service-desk:view', 'service-desk:edit'],
            'GERENTE' => ['service-desk:view', 'service-desk:assign'],
        ],
        'sales' => [
            'VENDEDOR' => ['sales:view', 'sales:create'],
            'CAJERO' => ['sales:view', 'sales:create'],
            'GERENTE' => ['sales:anular'],
        ],
        'cash' => [
            'CAJERO'   => ['cash:view', 'cash:create', 'cash:close', 'cash:edit', 'cash:receipts'],
            'GERENTE'  => ['cash:view', 'cash:manage', 'cash:transfer'],
            'CONTADOR' => ['cash:view', 'cash:transfer'],
        ],
        'purchasing' => [
            'CONTADOR' => ['purchasing:view', 'purchasing:edit'],
            'GERENTE'  => ['purchasing:view'],
        ],
        'inventory' => [
            'TECNICO'  => ['inventory:view', 'inventory:edit'],
            'GERENTE'  => ['inventory:view'],
        ],
        'crm' => [
            'VENDEDOR' => ['crm:view', 'crm:create', 'crm:edit'],
            'GERENTE'  => ['crm:view'],
        ],
        'accounting' => [
            'CONTADOR' => ['accounting:view', 'accounting:create', 'accounting:edit', 'accounting:report'],
            'GERENTE'  => ['accounting:view', 'accounting:report'],
        ],
        'hr' => [
            'RRHH'     => ['hr:view', 'hr:create', 'hr:edit'],
            'GERENTE'  => ['hr:view'],
        ],
        'payroll' => [
            'RRHH'     => ['payroll:view', 'payroll:create', 'payroll:edit'],
            'CONTADOR' => ['payroll:view'],
            'GERENTE'  => ['payroll:view'],
        ],
        'notifications' => [
            'GERENTE'  => ['notifications:view'],
        ],
    ],
];
