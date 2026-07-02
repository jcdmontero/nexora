<?php

namespace Tests\Feature\Modules\Accounting;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AsientoControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'accounting',
            'name' => 'Contabilidad',
            'class' => 'Accounting',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'accounting',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    public function test_asiento_index_requires_auth(): void
    {
        auth()->logout();
        $response = $this->get(route('accounting.asientos.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_asiento_store_creates_balanced_entry(): void
    {
        $cuentaDebito = CuentaContable::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => '1105',
            'nombre' => 'Caja',
            'tipo' => 'activo',
            'acepta_movimientos' => true,
        ]);

        $cuentaCredito = CuentaContable::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => '4135',
            'nombre' => 'Ingresos por Servicios',
            'tipo' => 'ingreso',
            'acepta_movimientos' => true,
        ]);

        $response = $this->post(route('accounting.asientos.store'), [
            'fecha' => now()->toDateString(),
            'concepto' => 'Asiento de prueba',
            'lineas' => [
                [
                    'cuenta_contable_id' => $cuentaDebito->id,
                    'debito' => 100000,
                    'credito' => 0,
                ],
                [
                    'cuenta_contable_id' => $cuentaCredito->id,
                    'debito' => 0,
                    'credito' => 100000,
                ],
            ],
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('asientos_contables', [
            'tenant_id' => $this->tenant->id,
            'concepto' => 'Asiento de prueba',
        ]);

        $asiento = AsientoContable::where('tenant_id', $this->tenant->id)
            ->where('concepto', 'Asiento de prueba')
            ->first();

        $this->assertNotNull($asiento);
        $this->assertEquals(2, $asiento->lineas()->count());
    }

    public function test_asiento_store_rejects_unbalanced(): void
    {
        $cuentaDebito = CuentaContable::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => '1105',
            'nombre' => 'Caja',
            'tipo' => 'activo',
            'acepta_movimientos' => true,
        ]);

        $cuentaCredito = CuentaContable::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => '4135',
            'nombre' => 'Ingresos por Servicios',
            'tipo' => 'ingreso',
            'acepta_movimientos' => true,
        ]);

        $response = $this->post(route('accounting.asientos.store'), [
            'fecha' => now()->toDateString(),
            'concepto' => 'Asiento descuadrado',
            'lineas' => [
                [
                    'cuenta_contable_id' => $cuentaDebito->id,
                    'debito' => 100000,
                    'credito' => 0,
                ],
                [
                    'cuenta_contable_id' => $cuentaCredito->id,
                    'debito' => 0,
                    'credito' => 50000,
                ],
            ],
        ]);

        // The service throws "Asiento descuadrado" which is caught → back() redirect
        $response->assertStatus(302);

        $this->assertDatabaseMissing('asientos_contables', [
            'tenant_id' => $this->tenant->id,
            'concepto' => 'Asiento descuadrado',
        ]);
    }

    public function test_asiento_store_validates_account_exists(): void
    {
        $response = $this->post(route('accounting.asientos.store'), [
            'fecha' => now()->toDateString(),
            'concepto' => 'Cuenta inexistente',
            'lineas' => [
                [
                    'cuenta_contable_id' => 99999,
                    'debito' => 100000,
                    'credito' => 0,
                ],
                [
                    'cuenta_contable_id' => 99998,
                    'debito' => 0,
                    'credito' => 100000,
                ],
            ],
        ]);

        // Validation fails because cuenta_contable_id 99999 doesn't exist for this tenant.
        // Inertia converts POST validation errors to a 302 redirect with error flash.
        $response->assertStatus(302);

        // No asiento should have been created
        $this->assertDatabaseMissing('asientos_contables', [
            'tenant_id' => $this->tenant->id,
            'concepto' => 'Cuenta inexistente',
        ]);
    }
}
