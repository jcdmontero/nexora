<?php

namespace Tests\Feature\Core;

use App\Core\Models\Tenant;
use App\Core\Services\RoleProvisioner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_can_add_catalog_role(): void
    {
        $user = User::factory()->create(['is_superadmin' => true]);
        $this->actingAs($user);
        $this->withoutMiddleware();

        // 'VENDEDOR' existe en el catálogo config/roles.php
        $this->post(route('core.roles.store'), [
            'name' => 'VENDEDOR',
            'permissions' => [],
        ]);

        $this->assertDatabaseHas('roles', ['name' => 'VENDEDOR']);
    }

    public function test_cannot_create_role_outside_catalog(): void
    {
        $user = User::factory()->create(['is_superadmin' => true]);
        $this->actingAs($user);
        $this->withoutMiddleware();

        $this->post(route('core.roles.store'), [
            'name' => 'rol-inventado',
        ]);

        // El rol fuera del catálogo no debe crearse
        $this->assertDatabaseMissing('roles', ['name' => 'rol-inventado']);
    }

    public function test_cannot_delete_admin_empresa_role(): void
    {
        Role::create(['name' => 'ADMIN_EMPRESA', 'guard_name' => 'web']);

        $user = User::factory()->create(['is_superadmin' => true]);
        $this->actingAs($user);
        $this->withoutMiddleware();

        $role = Role::where('name', 'ADMIN_EMPRESA')->first();
        $this->delete(route('core.roles.destroy', $role));

        $this->assertDatabaseHas('roles', ['name' => 'ADMIN_EMPRESA']);
    }

    public function test_provisioner_creates_catalog_roles_per_tenant(): void
    {
        $tenant = Tenant::factory()->create();

        app(RoleProvisioner::class)->provisionForTenant($tenant);

        // Cada rol del catálogo debe existir con team_id = tenant->id
        foreach (array_keys(config('roles.tenant')) as $name) {
            $this->assertDatabaseHas('roles', [
                'name' => $name,
                'team_id' => $tenant->id,
            ]);
        }
    }
}
