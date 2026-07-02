<?php

namespace Tests\Feature\Modules\Cash;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Models\ReciboCaja;
use App\Modules\Cash\Services\ReciboService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReciboTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Caja $caja;
    private CajaSesion $sesion;
    private Cliente $cliente;

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

        // Also need service-desk module for cancelar_orden test
        \DB::table('modules')->insertOrIgnore([
            'code' => 'service-desk',
            'name' => 'Servicio Técnico',
            'class' => 'ServiceDesk',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'service-desk',
            'is_active' => true,
        ]);

        // Also need crm module for Cliente factory
        \DB::table('modules')->insertOrIgnore([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'Crm',
            'version' => '1.0.0',
        ]);
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

        $this->caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Test',
            'activa' => true,
        ]);

        $this->sesion = CajaSesion::create([
            'tenant_id' => $this->tenant->id,
            'caja_id' => $this->caja->id,
            'user_id' => $this->user->id,
            'saldo_inicial' => 100000,
            'estado' => 'abierta',
            'ingresos_totales' => 0,
            'egresos_totales' => 0,
        ]);

        $this->cliente = Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'tipo_documento' => 'CC',
            'numero_documento' => '1234567890',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'activo' => true,
        ]);
    }

    private function crearOrden(array $overrides = []): OrdenReparacion
    {
        return OrdenReparacion::create(array_merge([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OR-' . now()->format('YmdHis') . '-' . rand(100, 999),
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Diagnostico->value,
            'abono_inicial' => 0,
            'created_by' => $this->user->id,
        ], $overrides));
    }

    public function test_registrar_abono_crea_recibo(): void
    {
        $orden = $this->crearOrden();

        $response = $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 50000,
            'metodo_pago' => 'efectivo',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('cash_recibos', [
            'tenant_id' => $this->tenant->id,
            'referencia_id' => $orden->id,
            'monto' => 50000,
            'estado' => 'activo',
        ]);
    }

    public function test_abono_actualiza_orden(): void
    {
        $orden = $this->crearOrden(['abono_inicial' => 0]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 75000,
            'metodo_pago' => 'efectivo',
        ]);

        $orden->refresh();
        $this->assertEquals(75000, (float) $orden->abono_inicial);
    }

    public function test_registrar_abono_sin_caja_abierta_falla(): void
    {
        $this->sesion->update(['estado' => 'cerrada']);
        $orden = $this->crearOrden();

        $response = $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 50000,
            'metodo_pago' => 'efectivo',
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('cash_recibos', ['referencia_id' => $orden->id]);
    }

    public function test_abono_crea_movimiento_de_caja(): void
    {
        $orden = $this->crearOrden();

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 100000,
            'metodo_pago' => 'transferencia',
        ]);

        $this->assertDatabaseHas('cash_movimientos', [
            'sesion_id' => $this->sesion->id,
            'tipo' => 'ingreso',
            'monto' => 100000,
            'metodo_pago' => 'transferencia',
        ]);
    }

    public function test_abono_con_monto_cero_falla(): void
    {
        $orden = $this->crearOrden();

        $response = $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 0,
            'metodo_pago' => 'efectivo',
        ]);

        $response->assertSessionHasErrors('monto');
    }

    public function test_multiples_abonos_acumulan_en_orden(): void
    {
        $orden = $this->crearOrden(['abono_inicial' => 0]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 50000,
            'metodo_pago' => 'efectivo',
        ]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 30000,
            'metodo_pago' => 'tarjeta',
        ]);

        $orden->refresh();
        $this->assertEquals(80000, (float) $orden->abono_inicial);

        $count = ReciboCaja::where('referencia_id', $orden->id)
            ->where('estado', 'activo')
            ->count();
        $this->assertEquals(2, $count);
    }

    public function test_anular_recibo_reversa_monto_orden(): void
    {
        $orden = $this->crearOrden(['abono_inicial' => 0]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 100000,
            'metodo_pago' => 'efectivo',
        ]);

        $recibo = ReciboCaja::where('referencia_id', $orden->id)->first();
        $reciboService = app(ReciboService::class);
        $reciboService->anularRecibo($recibo);

        $orden->refresh();
        $this->assertEquals(0, (float) $orden->abono_inicial);
        $this->assertEquals('anulado', $recibo->fresh()->estado);
    }

    public function test_numero_recibo_secuencial(): void
    {
        $orden = $this->crearOrden();

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 10000,
            'metodo_pago' => 'efectivo',
        ]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 20000,
            'metodo_pago' => 'efectivo',
        ]);

        $recibos = ReciboCaja::where('tenant_id', $this->tenant->id)->orderBy('numero')->get();
        $this->assertCount(2, $recibos);
        $this->assertNotEquals($recibos[0]->numero, $recibos[1]->numero);
    }

    public function test_cancelar_orden_revierte_abonos(): void
    {
        $orden = $this->crearOrden(['abono_inicial' => 0]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 100000,
            'metodo_pago' => 'efectivo',
        ]);

        $orden->refresh();
        $this->assertEquals(100000, (float) $orden->abono_inicial);

        // Cancelar la orden
        $this->put(route('service-desk.ordenes.estado', $orden->id), [
            'estado' => 'cancelado',
        ]);

        $orden->refresh();
        $this->assertEquals(0, (float) $orden->abono_inicial);

        $recibosAnulados = ReciboCaja::where('referencia_id', $orden->id)
            ->where('estado', 'anulado')
            ->count();
        $this->assertGreaterThanOrEqual(1, $recibosAnulados);

        // Verificar que se registró un egreso en caja
        $this->assertDatabaseHas('cash_movimientos', [
            'sesion_id' => $this->sesion->id,
            'tipo' => 'egreso',
        ]);
    }
}
