<?php

namespace Tests\Feature\Modules\Sales;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Sales\Models\Factura;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacturaAnulacionTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'sales', 'name' => 'Ventas', 'class' => 'Sales', 'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();
        TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'sales', 'is_active' => true]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => true]);
        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    // ─── Anulación ───────────────────────────────────────────────────────

    public function test_anular_requiere_autenticacion(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
        ]);

        auth()->logout();
        $this->post(route('sales.facturas.anular', $factura), ['motivo' => 'Prueba'])
            ->assertRedirect(route('core.login'));
    }

    public function test_anular_requiere_motivo(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'estado'    => 'pagada',
        ]);

        $this->post(route('sales.facturas.anular', $factura), ['motivo' => ''])
            ->assertSessionHasErrors('motivo');
    }

    public function test_anular_requiere_motivo_minimo_5_caracteres(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'estado'    => 'pagada',
        ]);

        $this->post(route('sales.facturas.anular', $factura), ['motivo' => 'X'])
            ->assertSessionHasErrors('motivo');
    }

    public function test_anular_bloquea_factura_de_otro_tenant(): void
    {
        $tenantB  = Tenant::factory()->create();
        $userB    = User::factory()->create(['tenant_id' => $tenantB->id]);
        $facturaB = Factura::factory()->create([
            'tenant_id' => $tenantB->id,
            'user_id'   => $userB->id,
        ]);

        // El route model binding filtra por tenant (BelongsToTenant global scope),
        // por lo que la factura ajena devuelve 404 en lugar de 403.
        $this->post(route('sales.facturas.anular', $facturaB), [
            'motivo' => 'Intento de acceso cruzado',
        ])->assertStatus(404);
    }

    public function test_anular_factura_pagada_cambia_estado(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'estado'    => 'pagada',
            'total'     => 100000,
        ]);

        $this->post(route('sales.facturas.anular', $factura), [
            'motivo' => 'Error en los datos del cliente registrado',
        ])->assertSessionMissing('error');

        $this->assertDatabaseHas('sales_facturas', [
            'id'     => $factura->id,
            'anulada' => true,
        ]);
    }

    public function test_anular_ya_anulada_devuelve_error(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id'   => $this->user->id,
            'estado'    => 'anulada',
            'anulada'   => true,
        ]);

        $this->post(route('sales.facturas.anular', $factura), [
            'motivo' => 'Intento de doble anulación de factura',
        ])->assertSessionHas('error');
    }

    // ─── Tenant isolation en show/pdf ────────────────────────────────────

    public function test_show_bloquea_factura_de_otro_tenant(): void
    {
        $tenantB  = Tenant::factory()->create();
        $userB    = User::factory()->create(['tenant_id' => $tenantB->id]);
        $facturaB = Factura::factory()->create(['tenant_id' => $tenantB->id, 'user_id' => $userB->id]);

        $this->get(route('sales.facturas.show', $facturaB))->assertStatus(404);
    }

    public function test_index_solo_muestra_facturas_del_tenant(): void
    {
        $tenantB  = Tenant::factory()->create();
        $userB    = User::factory()->create(['tenant_id' => $tenantB->id]);
        Factura::factory()->create(['tenant_id' => $tenantB->id, 'user_id' => $userB->id, 'numero' => 'INTRUSO-001']);

        Factura::factory()->create(['tenant_id' => $this->tenant->id, 'user_id' => $this->user->id, 'numero' => 'MIA-001']);

        $facturas = Factura::all();
        $this->assertTrue($facturas->contains('numero', 'MIA-001'));
        $this->assertFalse($facturas->contains('numero', 'INTRUSO-001'));
    }
}
