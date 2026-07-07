<?php

namespace Tests\Feature\Crm;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Crm\Models\Contacto;
use App\Modules\Crm\Models\Oportunidad;

class CertificacionCrmTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $tenant_id = 1;

    protected function setUp(): void
    {
        parent::setUp();
        
        $tenant = \App\Core\Models\Tenant::create([
            'id' => $this->tenant_id,
            'name' => 'Empresa Test',
            'slug' => 'empresa-test',
            'domain' => 'test.nexora.com',
            'database' => 'nexora_test',
            'is_active' => true,
        ]);
        
        \Illuminate\Support\Facades\DB::table('modules')->insert([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'App\Modules\Crm\Module',
        ]);
        
        \App\Core\Models\TenantModule::create([
            'tenant_id' => $tenant->id,
            'module_code' => 'crm',
            'is_active' => true,
        ]);
        
        app()->instance('current_tenant', $tenant);
        
        $this->user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'is_superadmin' => true,
        ]);
        
        // Asignar el team_id de spatie a la sesión (simular IdentifyTenant)
        setPermissionsTeamId($tenant->id);
    }

    public function test_crm_cliente_creation_prevents_mass_assignment()
    {
        $this->actingAs($this->user);

        $response = $this->post(route('crm.clientes.store'), [
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Perez',
            'tipo_documento' => 'CC',
            'numero_documento' => '123456789',
            'tenant_id' => 999, // Should be ignored
        ]);

        $response->assertRedirect(route('crm.clientes.index'));
        
        $cliente = Cliente::first();
        $this->assertEquals($this->tenant_id, $cliente->tenant_id); // set via BelongsToTenant trait
        $this->assertNotEquals(999, $cliente->tenant_id);
    }

    public function test_crm_contacto_transaction_changes_main_contact()
    {
        $this->actingAs($this->user);

        $cliente = Cliente::create([
            'tipo' => 'juridico',
            'razon_social' => 'Empresa Test',
            'nit' => '900111222-3'
        ]);

        $contacto1 = Contacto::create([
            'cliente_id' => $cliente->id,
            'nombre' => 'Contacto 1',
            'is_principal' => true
        ]);

        // Provide a from() URL so back() has somewhere to go
        $response = $this->from(route('crm.clientes.show', $cliente->id))
            ->post(route('crm.contactos.store', $cliente->id), [
                'nombre' => 'Contacto 2',
                'is_principal' => 1,
            ]);

        $response->assertSessionHasNoErrors();
        
        $contacto1->refresh();
        $this->assertFalse((bool)$contacto1->is_principal);
        
        $this->assertTrue((bool)$cliente->contactos()->where('nombre', 'Contacto 2')->first()->is_principal);
    }

    public function test_crm_oportunidades_search_is_sanitized_and_paginated()
    {
        $this->actingAs($this->user);

        $cliente = Cliente::create([
            'tipo' => 'juridico',
            'razon_social' => 'Empresa %_Test',
            'nit' => '900111222-3'
        ]);

        Oportunidad::create([
            'cliente_id' => $cliente->id,
            'titulo' => 'Proyecto Oportunidad %_Especial',
            'valor_estimado' => 1000,
            'etapa' => 'prospecto',
            'probabilidad' => 10,
        ]);

        // Search with wildcard characters
        $response = $this->get(route('crm.oportunidades.index', ['search' => '%_']));
        $response->assertOk();

        // Inertia assert
        $response->assertInertia(fn ($page) => $page
            ->has('oportunidades.data')
            ->has('oportunidades.links')
        );
    }
}
