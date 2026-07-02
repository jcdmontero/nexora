<?php

namespace Tests\Feature\Modules\Accounting;

use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\ContabilidadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContabilidadServiceTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private ContabilidadService $service;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Crear Tenant y autenticar
        $this->tenant = Tenant::create([
            'name' => 'Empresa Test',
            'slug' => 'test',
            'domain' => 'test.nexora.com',
        ]);

        app()->instance('current_tenant', $this->tenant);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);

        $this->actingAs($this->user);

        // 2. Instanciar servicio
        $this->service = new ContabilidadService();

        // 3. Crear cuentas base (el global scope inyectará automáticamente tenant_id)
        CuentaContable::create(['codigo' => '1105', 'nombre' => 'Caja', 'tipo' => 'activo']);
        CuentaContable::create(['codigo' => '4135', 'nombre' => 'Ingresos', 'tipo' => 'ingreso']);
    }

    public function test_no_permite_asiento_descuadrado()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Asiento descuadrado');

        $cuentaCaja = $this->service->getCuenta('1105');
        $cuentaIngreso = $this->service->getCuenta('4135');

        $this->service->registrarAsiento(
            ['concepto' => 'Venta Prueba', 'registrado_por' => $this->user->id],
            [
                ['cuenta_contable_id' => $cuentaCaja->id, 'debito' => 1000, 'credito' => 0],
                ['cuenta_contable_id' => $cuentaIngreso->id, 'debito' => 0, 'credito' => 900], // Descuadre de 100
            ]
        );
    }

    public function test_registra_asiento_cuadrado_correctamente()
    {
        $cuentaCaja = $this->service->getCuenta('1105');
        $cuentaIngreso = $this->service->getCuenta('4135');

        $asiento = $this->service->registrarAsiento(
            ['concepto' => 'Venta Prueba', 'registrado_por' => $this->user->id],
            [
                ['cuenta_contable_id' => $cuentaCaja->id, 'debito' => 1000, 'credito' => 0],
                ['cuenta_contable_id' => $cuentaIngreso->id, 'debito' => 0, 'credito' => 1000],
            ]
        );

        $this->assertNotNull($asiento);
        $this->assertDatabaseHas('asientos_contables', [
            'id' => $asiento->id,
            'concepto' => 'Venta Prueba',
            'tenant_id' => $this->tenant->id,
        ]);

        $this->assertCount(2, $asiento->lineas);
        $this->assertEquals(1000, $asiento->lineas->where('cuenta_contable_id', $cuentaCaja->id)->first()->debito);
        $this->assertEquals(1000, $asiento->lineas->where('cuenta_contable_id', $cuentaIngreso->id)->first()->credito);
    }
}
