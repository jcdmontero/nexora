<?php
namespace App\Core\Services;

use App\Core\Models\Module;
use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ModuleActivator
{
    /**
     * Registro de provisioners por módulo.
     * Cada entrada mapea un código de módulo a [clase, método] que se ejecuta
     * al activar el módulo para sembrar datos base del tenant.
     *
     * Para agregar un módulo nuevo con provisioner, basta con añadir una entrada aquí.
     * La lógica de accounting se maneja por separado en {@see provisionAccounting()}.
     */
    private const PROVISIONERS = [
        'service-desk'  => [\App\Modules\ServiceDesk\Services\CatalogoTallerProvisioner::class, 'provisionForTenant'],
        'notifications' => [\App\Modules\Notifications\Services\PlantillasProvisioner::class, 'provisionForTenant'],
        'hr'            => [\App\Modules\Hr\Services\HrProvisioner::class, 'provisionForTenant'],
        'payroll'       => [\App\Modules\Payroll\Services\PayrollProvisioner::class, 'provisionForTenant'],
        'cash'          => [\App\Modules\Cash\Services\CashProvisioner::class, 'provisionForTenant'],
    ];

    public function activate(Tenant $tenant, string $moduleCode): void
    {
        $module = Module::where('code', $moduleCode)->firstOrFail();

        // Solo se pueden activar módulos en estado 'publicado' (excepto 'core')
        if ($module->code !== 'core' && ($module->estado ?? 'desarrollo') !== 'publicado') {
            throw new \RuntimeException(
                "No se puede activar el módulo \"{$module->code}\": su estado es \"{$module->estado}\". Debe estar en estado \"publicado\"."
            );
        }

        // Activar automáticamente las dependencias que falten (en cascada hacia abajo).
        // Ej: activar "service-desk" activa también "crm", "inventory", etc.
        $deps = $module->dependencies ?? [];
        foreach ($deps as $dep) {
            if (!$this->isActive($tenant, $dep)) {
                $this->activate($tenant, $dep);
            }
        }

        TenantModule::updateOrCreate(
            ['tenant_id' => $tenant->id, 'module_code' => $moduleCode],
            ['is_active' => true]
        );

        // Sembrar permisos del manifiesto (globales) y otorgarlos al rol
        // ADMIN_EMPRESA de esta empresa (el admin puede usar lo que le habilitaron).
        $manifest = app(\App\Core\Services\ModuleRegistry::class)->getManifest($moduleCode);
        $perms = $manifest['permissions'] ?? [];
        foreach ($perms as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        if (!empty($perms)) {
            $registrar = app(PermissionRegistrar::class);
            $previous = $registrar->getPermissionsTeamId();
            $registrar->setPermissionsTeamId($tenant->id);

            $adminRole = Role::where('team_id', $tenant->id)
                ->where('name', config('roles.default_tenant_admin', 'ADMIN_EMPRESA'))
                ->first();
            if ($adminRole) {
                $adminRole->givePermissionTo($perms);
            }

            // Permisos del módulo para roles operativos (ej. TECNICO en el taller).
            $rolesExtra = config('roles.module_role_permissions', [])[$moduleCode] ?? [];
            foreach ($rolesExtra as $rolNombre => $permisos) {
                $rol = Role::where('team_id', $tenant->id)->where('name', $rolNombre)->first();
                if ($rol) {
                    $rol->givePermissionTo($permisos);
                }
            }

            $registrar->setPermissionsTeamId($previous);
        }

        $path = "app/Modules/{$module->class}/Migrations";
        if (is_dir(base_path($path))) {
            Artisan::call('migrate', [
                '--path' => $path,
                '--force' => true,
            ]);
        }

        // Provisionar datos base del módulo para el tenant.
        // Accounting tiene lógica especial (régimen fiscal), el resto usa el registry.
        if ($moduleCode === 'accounting') {
            $this->provisionAccounting($tenant);
        }

        foreach (self::PROVISIONERS as $code => [$class, $method]) {
            if ($moduleCode === $code && class_exists($class)) {
                app($class)->$method($tenant);
            }
        }

        Cache::forget("tenant_modules_{$tenant->id}");
        Cache::forget("tenant_module_{$tenant->id}_{$moduleCode}");
    }

    public function deactivate(Tenant $tenant, string $moduleCode): void
    {
        // Validar que ningún módulo activo dependa de éste
        $activeCodes = TenantModule::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->pluck('module_code')
            ->all();

        $dependents = Module::whereIn('code', $activeCodes)
            ->get()
            ->filter(fn ($m) => in_array($moduleCode, $m->dependencies ?? []));

        if ($dependents->isNotEmpty()) {
            $names = $dependents->pluck('name')->implode(', ');
            throw new \RuntimeException(
                "No se puede desactivar \"{$moduleCode}\": los módulos [{$names}] dependen de él."
            );
        }

        TenantModule::where('tenant_id', $tenant->id)
            ->where('module_code', $moduleCode)
            ->update(['is_active' => false]);

        Cache::forget("tenant_modules_{$tenant->id}");
        Cache::forget("tenant_module_{$tenant->id}_{$moduleCode}");
    }

    public function isActive(Tenant $tenant, string $moduleCode): bool
    {
        return Cache::remember("tenant_module_{$tenant->id}_{$moduleCode}", 3600, function () use ($tenant, $moduleCode) {
            return TenantModule::where('tenant_id', $tenant->id)
                ->where('module_code', $moduleCode)
                ->where('is_active', true)
                ->exists();
        });
    }

    /**
     * Provisiona el módulo contable según el régimen fiscal del tenant.
     *
     * - Régimen simplificado → PUC Simplificado
     * - Régimen común / otro → PUC Colombia completo
     * - En ambos casos se crean los libros contables por defecto.
     */
    private function provisionAccounting(Tenant $tenant): void
    {
        $regimen = \App\Core\Models\Configuracion::get('regimen_fiscal', 'simplificado', $tenant->id);

        if ($regimen === 'simplificado' && class_exists(\App\Modules\Accounting\Services\PucSimplificadoProvisioner::class)) {
            app(\App\Modules\Accounting\Services\PucSimplificadoProvisioner::class)->provisionForTenant($tenant);
        } elseif (class_exists(\App\Modules\Accounting\Services\PucColombiaProvisioner::class)) {
            app(\App\Modules\Accounting\Services\PucColombiaProvisioner::class)->provisionForTenant($tenant);
        }

        if (class_exists(\App\Modules\Accounting\Services\LibroContableProvisioner::class)) {
            app(\App\Modules\Accounting\Services\LibroContableProvisioner::class)->provisionForTenant($tenant);
        }
    }

    /**
     * Sincroniza los módulos activos de una empresa con el conjunto deseado.
     * Expande automáticamente las dependencias y respeta el orden de activación/desactivación.
     * 'core' siempre permanece activo.
     */
    public function syncModules(Tenant $tenant, array $codes): void
    {
        $deps = Module::pluck('dependencies', 'code')->map(fn ($d) => $d ?? [])->all();

        // Expandir el objetivo incluyendo dependencias (orden: dependencias primero)
        $target = [];
        $visited = [];
        $expand = function (string $code) use (&$expand, &$target, &$visited, $deps) {
            if (in_array($code, $target, true) || !array_key_exists($code, $deps) || in_array($code, $visited, true)) {
                return;
            }
            $visited[] = $code;
            foreach ($deps[$code] as $dep) {
                $expand($dep);
            }
            $target[] = $code;
        };
        foreach (array_merge(['core'], $codes) as $c) {
            $expand($c);
        }

        // Activar en orden de dependencias
        foreach ($target as $code) {
            $this->activate($tenant, $code);
        }

        // Desactivar lo que sobra (dependientes primero para no violar restricciones)
        $current = TenantModule::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->pluck('module_code')
            ->reject(fn ($c) => $c === 'core')
            ->values()
            ->all();

        $remove = array_values(array_diff($current, $target));
        // activeNow se mantiene en memoria para evitar re-queries por iteración
        $activeNow = array_merge($target, $current);
        $guard = 0;
        while ($remove && $guard++ < 50) {
            foreach ($remove as $i => $code) {
                $hasDependent = collect($activeNow)
                    ->first(fn ($c) => in_array($code, $deps[$c] ?? [], true));
                if (!$hasDependent) {
                    $this->deactivate($tenant, $code);
                    $activeNow = array_values(array_filter($activeNow, fn ($c) => $c !== $code));
                    unset($remove[$i]);
                }
            }
            $remove = array_values($remove);
        }
    }
}
