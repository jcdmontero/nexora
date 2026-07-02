<?php

namespace Tests\Feature\Modules\Crm;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClienteTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure the 'crm' module exists in the modules catalog
        \DB::table('modules')->insertOrIgnore([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'Crm',
            'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();

        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'crm',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    public function test_cliente_index_requires_auth(): void
    {
        auth()->logout();
        $response = $this->get(route('crm.clientes.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_cliente_store_creates_cliente(): void
    {
        $response = $this->post(route('crm.clientes.store'), [
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'tipo_documento' => 'CC',
            'numero_documento' => '1234567890',
            'email' => 'juan@ejemplo.com',
            'telefono' => '3001234567',
            'ciudad' => 'Bogotá',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('crm_clientes', [
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'numero_documento' => '1234567890',
            'activo' => true,
        ]);
    }

    public function test_cliente_update_modifies_fields(): void
    {
        $cliente = Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'María',
            'apellidos' => 'García',
            'ciudad' => 'Medellín',
        ]);

        $response = $this->put(route('crm.clientes.update', $cliente), [
            'tipo' => 'natural',
            'nombres' => 'María',
            'apellidos' => 'López',
            'ciudad' => 'Cali',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('crm_clientes', [
            'id' => $cliente->id,
            'apellidos' => 'López',
            'ciudad' => 'Cali',
        ]);
    }

    public function test_cliente_tenant_isolation(): void
    {
        // Create a client for tenant A (the current tenant)
        $clienteA = Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Cliente',
            'apellidos' => 'Tenant A',
        ]);

        // Create tenant B with its own module active and user
        $tenantB = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'Crm',
            'version' => '1.0.0',
        ]);

        TenantModule::create([
            'tenant_id' => $tenantB->id,
            'module_code' => 'crm',
            'is_active' => true,
        ]);

        $userB = User::factory()->create([
            'tenant_id' => $tenantB->id,
            'is_superadmin' => true,
        ]);

        // Create a client for tenant B
        $clienteB = Cliente::create([
            'tenant_id' => $tenantB->id,
            'tipo' => 'natural',
            'nombres' => 'Cliente',
            'apellidos' => 'Tenant B',
        ]);

        // Switch to tenant B's user
        $this->actingAs($userB);
        app()->instance('current_tenant', $tenantB);

        // Request the CRM index as tenant B
        $response = $this->get(route('crm.clientes.index'));
        $response->assertStatus(200);

        // Verify that querying as tenant B does NOT return tenant A's client
        // The BelongsToTenant global scope filters by the current tenant
        $clientesVisible = Cliente::all();
        $this->assertTrue($clientesVisible->contains('id', $clienteB->id));
        $this->assertFalse($clientesVisible->contains('id', $clienteA->id));
    }
}
