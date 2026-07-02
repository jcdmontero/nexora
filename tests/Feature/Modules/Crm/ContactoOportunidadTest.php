<?php

namespace Tests\Feature\Modules\Crm;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Crm\Models\Contacto;
use App\Modules\Crm\Models\Oportunidad;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactoOportunidadTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Cliente $cliente;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'crm', 'name' => 'CRM', 'class' => 'Crm', 'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();
        TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'crm', 'is_active' => true]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => true]);
        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        $this->cliente = Cliente::create([
            'tenant_id'       => $this->tenant->id,
            'tipo'            => 'natural',
            'nombres'         => 'Pedro',
            'apellidos'       => 'Ramírez',
            'numero_documento' => '99887766',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CONTACTOS
    // ═══════════════════════════════════════════════════════════════

    public function test_contacto_store_crea_contacto_para_cliente(): void
    {
        $response = $this->post(route('crm.contactos.store', ['cliente' => $this->cliente->id]), [
            'nombre'   => 'Ana Martínez',
            'cargo'    => 'Gerente',
            'email'    => 'ana@empresa.com',
            'telefono' => '3100001111',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('crm_contactos', [
            'tenant_id'  => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'nombre'     => 'Ana Martínez',
            'email'      => 'ana@empresa.com',
        ]);
    }

    public function test_contacto_store_falla_sin_nombre(): void
    {
        $this->post(route('crm.contactos.store', ['cliente' => $this->cliente->id]), [
            'email' => 'x@x.com',
        ])->assertSessionHasErrors('nombre');
    }

    public function test_contacto_update_modifica_campos(): void
    {
        $contacto = Contacto::create([
            'tenant_id'  => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'nombre'     => 'Original',
        ]);

        $this->put(route('crm.contactos.update', $contacto), [
            'nombre' => 'Actualizado',
            'cargo'  => 'Director',
        ])->assertRedirect();

        $this->assertDatabaseHas('crm_contactos', [
            'id'     => $contacto->id,
            'nombre' => 'Actualizado',
            'cargo'  => 'Director',
        ]);
    }

    public function test_contacto_destroy_elimina_correctamente(): void
    {
        $contacto = Contacto::create([
            'tenant_id'  => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'nombre'     => 'A Eliminar',
        ]);

        $this->delete(route('crm.contactos.destroy', $contacto))->assertRedirect();

        $this->assertSoftDeleted('crm_contactos', ['id' => $contacto->id]);
    }

    public function test_contacto_aislamiento_entre_tenants(): void
    {
        $tenantB  = Tenant::factory()->create();
        $clienteB = Cliente::create([
            'tenant_id' => $tenantB->id,
            'tipo'      => 'natural',
            'nombres'   => 'B',
        ]);
        $contactoB = Contacto::create([
            'tenant_id'  => $tenantB->id,
            'cliente_id' => $clienteB->id,
            'nombre'     => 'Tenant B Contacto',
        ]);

        // Intentar actualizar un contacto de otro tenant → 404 o 403
        $this->put(route('crm.contactos.update', $contactoB), ['nombre' => 'Hack'])
            ->assertStatus(404);
    }

    // ═══════════════════════════════════════════════════════════════
    //  OPORTUNIDADES
    // ═══════════════════════════════════════════════════════════════

    public function test_oportunidades_index_devuelve_pagina(): void
    {
        $this->get(route('crm.oportunidades.index'))->assertStatus(200);
    }

    public function test_oportunidad_store_crea_oportunidad(): void
    {
        $response = $this->post(route('crm.oportunidades.store'), [
            'cliente_id'           => $this->cliente->id,
            'titulo'               => 'Venta de equipos',
            'valor_estimado'       => 5000000,
            'etapa'                => 'prospecto',
            'probabilidad'         => 30,
            'fecha_cierre_esperada' => now()->addMonths(2)->toDateString(),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('crm_oportunidades', [
            'tenant_id'      => $this->tenant->id,
            'titulo'         => 'Venta de equipos',
            'valor_estimado' => 5000000,
            'etapa'          => 'prospecto',
        ]);
    }

    public function test_oportunidad_store_falla_sin_titulo(): void
    {
        $this->post(route('crm.oportunidades.store'), [
            'cliente_id'     => $this->cliente->id,
            'valor_estimado' => 100000,
            'etapa'          => 'prospecto',
        ])->assertSessionHasErrors('titulo');
    }

    public function test_oportunidad_update_modifica_etapa_y_probabilidad(): void
    {
        $op = Oportunidad::create([
            'tenant_id'      => $this->tenant->id,
            'cliente_id'     => $this->cliente->id,
            'titulo'         => 'Op Original',
            'valor_estimado' => 1000,
            'etapa'          => 'prospecto',
            'probabilidad'   => 10,
        ]);

        $this->put(route('crm.oportunidades.update', $op), [
            'titulo'         => 'Op Original',
            'valor_estimado' => 2000,
            'etapa'          => 'propuesta',
            'probabilidad'   => 60,
        ])->assertRedirect();

        $this->assertDatabaseHas('crm_oportunidades', [
            'id'           => $op->id,
            'etapa'        => 'propuesta',
            'probabilidad' => 60,
        ]);
    }

    public function test_oportunidad_update_etapa_solo_cambia_etapa(): void
    {
        $op = Oportunidad::create([
            'tenant_id'      => $this->tenant->id,
            'cliente_id'     => $this->cliente->id,
            'titulo'         => 'Op Etapa',
            'valor_estimado' => 500,
            'etapa'          => 'prospecto',
            'probabilidad'   => 10,
        ]);

        $this->patch(route('crm.oportunidades.updateEtapa', $op), [
            'etapa' => 'ganado',
        ])->assertRedirect();

        $this->assertDatabaseHas('crm_oportunidades', ['id' => $op->id, 'etapa' => 'ganado']);
    }

    public function test_oportunidad_destroy_elimina(): void
    {
        $op = Oportunidad::create([
            'tenant_id'      => $this->tenant->id,
            'cliente_id'     => $this->cliente->id,
            'titulo'         => 'A Eliminar',
            'valor_estimado' => 0,
            'etapa'          => 'perdido',
        ]);

        $this->delete(route('crm.oportunidades.destroy', $op))->assertRedirect();

        $this->assertSoftDeleted('crm_oportunidades', ['id' => $op->id]);
    }

    public function test_oportunidad_aislamiento_entre_tenants(): void
    {
        $tenantB  = Tenant::factory()->create();
        $clienteB = Cliente::create(['tenant_id' => $tenantB->id, 'tipo' => 'natural', 'nombres' => 'B']);
        $opB      = Oportunidad::create([
            'tenant_id'      => $tenantB->id,
            'cliente_id'     => $clienteB->id,
            'titulo'         => 'Op Tenant B',
            'valor_estimado' => 100,
            'etapa'          => 'prospecto',
        ]);

        // No debe ser visible en el índice del tenant A
        $oportunidades = Oportunidad::all();
        $this->assertFalse($oportunidades->contains('id', $opB->id));
    }
}
