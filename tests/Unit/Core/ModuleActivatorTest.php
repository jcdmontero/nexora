<?php

namespace Tests\Unit\Core;

use App\Core\Models\Module;
use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Core\Services\ModuleActivator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModuleActivatorTest extends TestCase
{
    use RefreshDatabase;

    public function test_activate_automatically_activates_dependencies(): void
    {
        $tenant = Tenant::factory()->create();

        Module::create([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'Crm',
            'version' => '1.0.0',
            'is_core' => false,
            'dependencies' => [],
            'estado' => 'publicado',
        ]);

        Module::create([
            'code' => 'service-desk',
            'name' => 'Servicio Técnico',
            'class' => 'ServiceDesk',
            'version' => '1.0.0',
            'is_core' => false,
            'dependencies' => ['crm'],
            'estado' => 'publicado',
        ]);

        $activator = app(ModuleActivator::class);

        $activator->activate($tenant, 'service-desk');

        $this->assertTrue($activator->isActive($tenant, 'crm'));
        $this->assertTrue($activator->isActive($tenant, 'service-desk'));
    }

    public function test_activate_succeeds_when_dependencies_are_active(): void
    {
        $tenant = Tenant::factory()->create();

        Module::create([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'Crm',
            'version' => '1.0.0',
            'is_core' => false,
            'dependencies' => [],
            'estado' => 'publicado',
        ]);

        Module::create([
            'code' => 'service-desk',
            'name' => 'Servicio Técnico',
            'class' => 'ServiceDesk',
            'version' => '1.0.0',
            'is_core' => false,
            'dependencies' => ['crm'],
            'estado' => 'publicado',
        ]);

        $activator = app(ModuleActivator::class);
        $activator->activate($tenant, 'crm');
        $activator->activate($tenant, 'service-desk');

        $this->assertTrue(
            TenantModule::where('tenant_id', $tenant->id)
                ->where('module_code', 'service-desk')
                ->where('is_active', true)
                ->exists()
        );
    }

    public function test_activate_seeds_permissions(): void
    {
        $tenant = Tenant::factory()->create();

        Module::create([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'Crm',
            'version' => '1.0.0',
            'is_core' => false,
            'dependencies' => [],
            'permissions' => ['crm:view', 'crm:create', 'crm:edit', 'crm:delete'],
            'estado' => 'publicado',
        ]);

        $activator = app(ModuleActivator::class);
        $activator->activate($tenant, 'crm');

        $this->assertDatabaseHas('permissions', ['name' => 'crm:view']);
        $this->assertDatabaseHas('permissions', ['name' => 'crm:create']);
    }

    public function test_sync_modules_expands_dependencies_and_removes_extras(): void
    {
        $tenant = Tenant::factory()->create();

        Module::create(['code' => 'core', 'name' => 'Core', 'class' => 'Core', 'version' => '1.0.0', 'is_core' => true, 'dependencies' => [], 'estado' => 'publicado']);
        Module::create(['code' => 'crm', 'name' => 'CRM', 'class' => 'Crm', 'version' => '1.0.0', 'is_core' => false, 'dependencies' => [], 'estado' => 'publicado']);
        Module::create(['code' => 'inventory', 'name' => 'Inventario', 'class' => 'NoExisteDir', 'version' => '1.0.0', 'is_core' => false, 'dependencies' => [], 'estado' => 'publicado']);
        Module::create(['code' => 'sales', 'name' => 'Ventas', 'class' => 'NoExisteDir', 'version' => '1.0.0', 'is_core' => false, 'dependencies' => ['crm', 'inventory'], 'estado' => 'publicado']);

        $activator = app(ModuleActivator::class);

        // Seleccionar solo 'sales' debe activar también sus dependencias + core
        $activator->syncModules($tenant, ['sales']);
        foreach (['core', 'crm', 'inventory', 'sales'] as $code) {
            $this->assertTrue(
                TenantModule::where('tenant_id', $tenant->id)->where('module_code', $code)->where('is_active', true)->exists(),
                "Esperaba {$code} activo"
            );
        }

        // Quitar todo: core permanece, el resto se desactiva (dependientes primero)
        $activator->syncModules($tenant, []);
        foreach (['crm', 'inventory', 'sales'] as $code) {
            $this->assertFalse(
                TenantModule::where('tenant_id', $tenant->id)->where('module_code', $code)->where('is_active', true)->exists(),
                "Esperaba {$code} inactivo"
            );
        }
        $this->assertTrue(
            TenantModule::where('tenant_id', $tenant->id)->where('module_code', 'core')->where('is_active', true)->exists(),
            'Core debe permanecer activo'
        );
    }
}
