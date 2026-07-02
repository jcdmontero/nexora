<?php

namespace Database\Seeders;

use App\Core\Models\Module;
use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Core\Services\RoleProvisioner;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $registrar = app(PermissionRegistrar::class);
        $provisioner = app(RoleProvisioner::class);

        // ──────────────────────────────────────────
        // 1. Módulo Core
        // ──────────────────────────────────────────
        Module::firstOrCreate(
            ['code' => 'core'],
            [
                'name' => 'Core',
                'class' => 'Core',
                'version' => '1.0.0',
                'description' => 'Módulo base del sistema',
                'is_core' => true,
                'is_active_globally' => true,
            ]
        );

        // ──────────────────────────────────────────
        // 2. Permisos base del Core (globales)
        // ──────────────────────────────────────────
        $corePermissions = [
            'users:view', 'users:create', 'users:edit', 'users:delete',
            'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
            'audit:view',
            'tenant:edit',
        ];

        foreach ($corePermissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // ──────────────────────────────────────────
        // 3. Rol global de plataforma (superadmin)
        // ──────────────────────────────────────────
        $provisioner->provisionSystemRole();

        // ──────────────────────────────────────────
        // 4. Tenant por defecto + roles del catálogo
        // ──────────────────────────────────────────
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'mi-empresa'],
            [
                'name' => 'Mi Empresa',
                'email' => 'admin@miempresa.com',
            ]
        );

        TenantModule::firstOrCreate([
            'tenant_id' => $tenant->id,
            'module_code' => 'core',
        ], [
            'is_active' => true,
        ]);

        $provisioner->provisionForTenant($tenant);

        // ──────────────────────────────────────────
        // 5. SuperAdmin (rol global de plataforma)
        // ──────────────────────────────────────────
        // No se le asigna rol en BD: con teams, model_has_roles.team_id es NOT NULL
        // y el rol superadmin es global (team null). El acceso total se concede vía
        // Gate::before (is_superadmin) en CoreServiceProvider.
        User::firstOrCreate(
            ['email' => 'admin@nexora.com'],
            [
                'name' => 'Super Admin',
                'password' => bcrypt('admin123'),
                'is_superadmin' => true,
                'is_active' => true,
            ]
        );

        // ──────────────────────────────────────────
        // 6. Admin del tenant por defecto (rol team-scoped)
        // ──────────────────────────────────────────
        $registrar->setPermissionsTeamId($tenant->id);

        $admin = User::firstOrCreate(
            ['email' => 'admin@miempresa.com'],
            [
                'name' => 'Admin Mi Empresa',
                'tenant_id' => $tenant->id,
                'password' => bcrypt('password'),
                'is_superadmin' => false,
                'is_active' => true,
            ]
        );
        $admin->assignRole(config('roles.default_tenant_admin', 'ADMIN_EMPRESA'));

        // ──────────────────────────────────────────
        // 7. Catálogo de módulos: registrar, publicar y activar en la empresa demo
        // ──────────────────────────────────────────
        // Registra los módulos desde app/Modules/*/module.json
        app(\App\Core\Services\ModuleRegistry::class)->scanAndRegister();

        // Publica solo los módulos listos
        Module::whereIn('code', ['core', 'inventory', 'accounting', 'purchasing', 'crm', 'sales', 'cash', 'service-desk', 'hr', 'payroll', 'notifications'])->update(['estado' => 'publicado']);
        Module::whereNotIn('code', ['core', 'inventory', 'accounting', 'purchasing', 'crm', 'sales', 'cash', 'service-desk', 'hr', 'payroll', 'notifications'])->update(['estado' => 'desarrollo']);

        // Activa módulos en la empresa demo
        app(\App\Core\Services\ModuleActivator::class)->syncModules($tenant, ['accounting', 'inventory', 'purchasing', 'crm', 'sales', 'cash', 'service-desk', 'hr', 'payroll']);

        $this->command?->info('Seed completado: tenant + todos los módulos publicados y activos en la empresa demo.');

        // ──────────────────────────────────────────
        // 8. Datos demo del taller de soporte técnico (solo entorno local/dev)
        // ──────────────────────────────────────────
        if (app()->environment(['local', 'development', 'testing'])) {
            $this->call(DemoDataSeeder::class);
        }
    }
}
