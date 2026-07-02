<?php

namespace Tests\Feature\Modules\Cash;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Models\Denominacion;
use App\Modules\Cash\Models\MovimientoCaja;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Cash\Services\CashProvisioner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MulticajaTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class]);

        $this->tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'cash',
            'name' => 'Tesorería',
            'class' => 'Cash',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'cash',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    public function test_crear_y_editar_caja(): void
    {
        // Crear
        $response = $this->post(route('cash.cajas.store'), [
            'nombre' => 'Caja Sucursal Norte',
            'activa' => true,
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $this->assertDatabaseHas('cash_cajas', [
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Sucursal Norte',
            'activa' => true,
        ]);

        $caja = Caja::where('nombre', 'Caja Sucursal Norte')->first();

        // Editar
        $this->put(route('cash.cajas.update', $caja), [
            'nombre' => 'Caja Norte Renombrada',
            'activa' => false,
        ], ['X-Inertia' => 'true']);

        $this->assertDatabaseHas('cash_cajas', [
            'id' => $caja->id,
            'nombre' => 'Caja Norte Renombrada',
            'activa' => false,
        ]);
    }

    public function test_no_se_puede_eliminar_caja_con_turno_abierto(): void
    {
        $caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja con Turno',
            'activa' => true,
        ]);

        CajaSesion::create([
            'tenant_id' => $this->tenant->id,
            'caja_id' => $caja->id,
            'user_id' => $this->user->id,
            'saldo_inicial' => 0,
            'estado' => 'abierta',
        ]);

        $response = $this->delete(route('cash.cajas.destroy', $caja), [], ['X-Inertia' => 'true']);

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('cash_cajas', ['id' => $caja->id]);
    }

    public function test_abrir_y_cerrar_turno_calcula_diferencia(): void
    {
        $caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Test',
            'activa' => true,
        ]);

        $service = app(CajaService::class);
        $sesion = $service->abrirCaja($this->user->id, $caja->id, 100000);

        // Registrar un ingreso de 50.000
        $service->registrarMovimiento($sesion, 'ingreso', 50000, 'efectivo', 'Venta de prueba');

        $sesion->refresh();
        $this->assertEquals(50000, (float) $sesion->ingresos_totales);
        $this->assertEquals(150000, $sesion->saldo_sistema); // 100k base + 50k ingreso

        // Cerrar contando exactamente el saldo del sistema
        $service->cerrarSesion($sesion, 150000);
        $sesion->refresh();
        $this->assertEquals('cerrada', $sesion->estado);
        $this->assertEquals(0, (float) $sesion->diferencia);
    }

    public function test_un_usuario_no_puede_abrir_dos_turnos(): void
    {
        $caja1 = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja 1', 'activa' => true]);
        $caja2 = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja 2', 'activa' => true]);

        $service = app(CajaService::class);
        $service->abrirCaja($this->user->id, $caja1->id, 0);

        $this->expectException(\Exception::class);
        $service->abrirCaja($this->user->id, $caja2->id, 0);
    }

    public function test_arqueo_calcula_diferencia_correctamente(): void
    {
        $caja = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja Arqueo', 'activa' => true]);

        // Sembrar denominaciones
        app(CashProvisioner::class)->provisionForTenant($this->tenant);
        $denom50k = Denominacion::where('valor', 50000)->first();
        $denom20k = Denominacion::where('valor', 20000)->first();
        $this->assertNotNull($denom50k);

        $service = app(CajaService::class);
        $sesion = $service->abrirCaja($this->user->id, $caja->id, 0);
        // Saldo sistema = 0

        // Contar 2x50.000 + 1x20.000 = 120.000
        $arqueo = $service->arquearSesion($sesion, [
            ['denominacion_id' => $denom50k->id, 'cantidad' => 2],
            ['denominacion_id' => $denom20k->id, 'cantidad' => 1],
        ]);

        $this->assertEquals(120000, (float) $arqueo->total_contado);
        $this->assertEquals(120000, (float) $arqueo->diferencia); // sobra 120k vs sistema 0

        $sesion->refresh();
        $this->assertTrue($sesion->arqueado);
    }

    public function test_transferencia_entre_cajas(): void
    {
        $cajaOrigen = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Origen', 'activa' => true]);
        $cajaDestino = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Destino', 'activa' => true]);

        $service = app(CajaService::class);

        // Abrir turnos en ambas cajas con dos usuarios distintos
        $user2 = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $sesionOrigen = $service->abrirCaja($this->user->id, $cajaOrigen->id, 100000);

        // Para abrir el destino necesitamos otro usuario (1 sesión por usuario)
        $this->actingAs($user2);
        $sesionDestino = $service->abrirCaja($user2->id, $cajaDestino->id, 0);

        $transferencia = $service->transferirEntreCajas($cajaOrigen->id, $cajaDestino->id, 30000);

        $this->assertEquals('completada', $transferencia->estado);

        $sesionOrigen->refresh();
        $sesionDestino->refresh();
        $this->assertEquals(30000, (float) $sesionOrigen->egresos_totales);
        $this->assertEquals(30000, (float) $sesionDestino->ingresos_totales);
    }

    public function test_no_se_puede_transferir_a_la_misma_caja(): void
    {
        $caja = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Unica', 'activa' => true]);
        $service = app(CajaService::class);
        $service->abrirCaja($this->user->id, $caja->id, 50000);

        $this->expectException(\Exception::class);
        $service->transferirEntreCajas($caja->id, $caja->id, 10000);
    }

    public function test_registro_movimiento_actualiza_totales_sesion(): void
    {
        $caja = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja Totales', 'activa' => true]);
        $service = app(CajaService::class);
        $sesion = $service->abrirCaja($this->user->id, $caja->id, 0);

        $service->registrarMovimiento($sesion, 'ingreso', 30000, 'efectivo', 'Ingreso 1');
        $service->registrarMovimiento($sesion, 'ingreso', 20000, 'tarjeta', 'Ingreso 2');
        $service->registrarMovimiento($sesion, 'egreso', 10000, 'efectivo', 'Gasto');

        $sesion->refresh();
        $this->assertEquals(50000, (float) $sesion->ingresos_totales);
        $this->assertEquals(10000, (float) $sesion->egresos_totales);
        $this->assertEquals(40000, $sesion->saldo_sistema);
    }

    public function test_movimientos_se_registran_con_metodo_pago_correcto(): void
    {
        $caja = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja Métodos', 'activa' => true]);
        $service = app(CajaService::class);
        $sesion = $service->abrirCaja($this->user->id, $caja->id, 0);

        $service->registrarMovimiento($sesion, 'ingreso', 100000, 'tarjeta', 'Pago con tarjeta');
        $service->registrarMovimiento($sesion, 'ingreso', 50000, 'transferencia', 'Transferencia');

        $movimientos = MovimientoCaja::where('sesion_id', $sesion->id)->orderBy('id')->get();
        $this->assertEquals('tarjeta', $movimientos->first()->metodo_pago);
        $this->assertEquals('transferencia', $movimientos->last()->metodo_pago);
    }

    public function test_provisioner_siembra_denominaciones_y_caja_principal(): void
    {
        app(CashProvisioner::class)->provisionForTenant($this->tenant);

        $this->assertDatabaseHas('cash_cajas', [
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Principal',
        ]);

        // 10 denominaciones COP
        $this->assertEquals(10, Denominacion::where('tenant_id', $this->tenant->id)->count());
        $this->assertDatabaseHas('cash_denominaciones', [
            'tenant_id' => $this->tenant->id,
            'valor' => 100000,
            'tipo' => 'billete',
        ]);
    }

    public function test_aislamiento_multi_tenant(): void
    {
        // Caja del tenant A
        Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Tenant A',
            'activa' => true,
        ]);

        // Otro tenant
        $tenantB = Tenant::factory()->create();
        app()->instance('current_tenant', $tenantB);
        Caja::create([
            'tenant_id' => $tenantB->id,
            'nombre' => 'Caja Tenant B',
            'activa' => true,
        ]);

        // El scope solo debe devolver las del tenant B
        $cajas = Caja::all();
        $this->assertCount(1, $cajas);
        $this->assertEquals('Caja Tenant B', $cajas->first()->nombre);
    }

    public function test_reporte_consolidado_agrupa_por_caja(): void
    {
        $caja1 = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja 1', 'activa' => true]);
        $caja2 = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja 2', 'activa' => true]);

        $service = app(CajaService::class);

        $user2 = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $s1 = $service->abrirCaja($this->user->id, $caja1->id, 0);
        $service->registrarMovimiento($s1, 'ingreso', 80000, 'efectivo', 'Venta');

        $this->actingAs($user2);
        $s2 = $service->abrirCaja($user2->id, $caja2->id, 0);
        $service->registrarMovimiento($s2, 'ingreso', 60000, 'tarjeta', 'Venta');

        $reporte = $service->reporteConsolidado();

        $this->assertCount(2, $reporte['cajas']);
        $this->assertEquals(140000, $reporte['totales']['ingresos']);
    }
}
