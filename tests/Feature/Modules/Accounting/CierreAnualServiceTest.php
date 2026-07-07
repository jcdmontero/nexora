<?php

namespace Tests\Feature\Modules\Accounting;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\CierreAnualService;
use App\Modules\Accounting\Services\ContabilidadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CierreAnualServiceTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private CuentaContable $ctaEfectivo;
    private CuentaContable $ctaIngreso;
    private CuentaContable $ctaGasto;
    private CuentaContable $ctaCosto;
    private CuentaContable $ctaUtilidad;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        app()->instance('current_tenant', $this->tenant);

        \DB::table('modules')->insertOrIgnore([
            'code' => 'accounting', 'name' => 'Contabilidad',
            'class' => 'Accounting', 'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'accounting', 'is_active' => true,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);
        $this->actingAs($user);

        $this->ctaEfectivo = CuentaContable::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => '1105', 'nombre' => 'Caja General', 'naturaleza' => 'debito',
            'tipo' => 'activo', 'nivel' => 2, 'acepta_movimientos' => true, 'activa' => true,
        ]);
        $this->ctaIngreso = CuentaContable::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => '4135', 'nombre' => 'Ingresos', 'naturaleza' => 'credito',
            'tipo' => 'ingreso', 'nivel' => 2, 'acepta_movimientos' => true, 'activa' => true,
        ]);
        $this->ctaGasto = CuentaContable::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => '5105', 'nombre' => 'Gastos', 'naturaleza' => 'debito',
            'tipo' => 'gasto', 'nivel' => 2, 'acepta_movimientos' => true, 'activa' => true,
        ]);
        $this->ctaCosto = CuentaContable::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => '6105', 'nombre' => 'Costos', 'naturaleza' => 'debito',
            'tipo' => 'costo', 'nivel' => 2, 'acepta_movimientos' => true, 'activa' => true,
        ]);
        $this->ctaUtilidad = CuentaContable::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => '3610', 'nombre' => 'Utilidades Retenidas', 'naturaleza' => 'credito',
            'tipo' => 'patrimonio', 'nivel' => 2, 'acepta_movimientos' => true, 'activa' => true,
        ]);
    }

    public function test_calcula_saldos_ingresos_gastos(): void
    {
        $this->crearAsiento(2026, 'Venta', [
            [$this->ctaEfectivo->id, 1000000, 0],
            [$this->ctaIngreso->id, 0, 1000000],
        ]);
        $this->crearAsiento(2026, 'Gastos', [
            [$this->ctaGasto->id, 600000, 0],
            [$this->ctaCosto->id, 200000, 0],
            [$this->ctaEfectivo->id, 0, 800000],
        ]);

        $ingresos = $this->invocarPrivate($service = app(CierreAnualService::class), 'calcularSaldosPorGrupo', [2026, '4']);
        $gastos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '5']);
        $costos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '6']);

        $this->assertCount(1, $ingresos);
        $this->assertEqualsWithDelta(1000000, $ingresos->first()['saldo'], 0.01);
        $this->assertCount(1, $gastos);
        $this->assertEqualsWithDelta(600000, $gastos->first()['saldo'], 0.01);
        $this->assertCount(1, $costos);
        $this->assertEqualsWithDelta(200000, $costos->first()['saldo'], 0.01);
    }

    public function test_construir_lineas_cierre_cuadra(): void
    {
        $this->crearAsiento(2026, 'Venta', [
            [$this->ctaEfectivo->id, 1000000, 0],
            [$this->ctaIngreso->id, 0, 1000000],
        ]);
        $this->crearAsiento(2026, 'Gastos', [
            [$this->ctaGasto->id, 600000, 0],
            [$this->ctaCosto->id, 200000, 0],
            [$this->ctaEfectivo->id, 0, 800000],
        ]);

        $service = app(CierreAnualService::class);
        $saldosIngresos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '4']);
        $saldosGastos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '5']);
        $saldosCostos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '6']);

        $lineas = $this->invocarPrivate($service, 'construirLineasCierre', [$saldosIngresos, $saldosGastos, $saldosCostos]);

        $totalDebito = collect($lineas)->sum('debito');
        $totalCredito = collect($lineas)->sum('credito');
        $this->assertEqualsWithDelta($totalDebito, $totalCredito, 0.01, 'Débitos = Créditos');

        // Verificar línea de utilidad neta (1M - 600K - 200K = 200K)
        $lineaUtilidad = collect($lineas)->firstWhere('cuenta_contable_id', $this->ctaUtilidad->id);
        $this->assertNotNull($lineaUtilidad, 'Debe tener línea de utilidades retenidas');
        $this->assertEqualsWithDelta(200000, $lineaUtilidad['credito'], 0.01);
    }

    public function test_construir_lineas_con_perdida(): void
    {
        $this->crearAsiento(2026, 'Venta', [
            [$this->ctaEfectivo->id, 500000, 0],
            [$this->ctaIngreso->id, 0, 500000],
        ]);
        $this->crearAsiento(2026, 'Gastos', [
            [$this->ctaGasto->id, 800000, 0],
            [$this->ctaEfectivo->id, 0, 800000],
        ]);

        $service = app(CierreAnualService::class);
        $saldosIngresos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '4']);
        $saldosGastos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '5']);
        $saldosCostos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '6']);

        $lineas = $this->invocarPrivate($service, 'construirLineasCierre', [$saldosIngresos, $saldosGastos, $saldosCostos]);

        // Pérdida: 500K - 800K = -300K → débito a 3610
        $lineaPerdida = collect($lineas)->firstWhere('cuenta_contable_id', $this->ctaUtilidad->id);
        $this->assertNotNull($lineaPerdida);
        $this->assertEqualsWithDelta(300000, $lineaPerdida['debito'], 0.01);
        $this->assertEquals(0, $lineaPerdida['credito']);
    }

    public function test_falla_sin_cuenta_3610(): void
    {
        $this->ctaUtilidad->delete();

        $this->crearAsiento(2026, 'Venta', [
            [$this->ctaEfectivo->id, 1000, 0],
            [$this->ctaIngreso->id, 0, 1000],
        ]);

        $service = app(CierreAnualService::class);
        $saldosIngresos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '4']);
        $saldosGastos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '5']);
        $saldosCostos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '6']);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('La cuenta 3610 (Utilidades Retenidas) no existe');
        $this->invocarPrivate($service, 'construirLineasCierre', [$saldosIngresos, $saldosGastos, $saldosCostos]);
    }

    public function test_sin_movimientos_no_genera_saldos(): void
    {
        $service = app(CierreAnualService::class);
        $ingresos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '4']);
        $gastos = $this->invocarPrivate($service, 'calcularSaldosPorGrupo', [2026, '5']);

        $this->assertCount(0, $ingresos);
        $this->assertCount(0, $gastos);
    }

    private function crearAsiento(int $anio, string $concepto, array $lineas): AsientoContable
    {
        $contabilidad = $this->app->make(ContabilidadService::class);
        return $contabilidad->registrarAsiento([
            'tenant_id' => $this->tenant->id,
            'fecha' => "{$anio}-06-15",
            'concepto' => $concepto,
            'modulo_origen' => 'test',
        ], array_map(fn ($l) => [
            'cuenta_contable_id' => $l[0],
            'debito' => $l[1],
            'credito' => $l[2],
            'descripcion' => 'Línea de prueba',
        ], $lineas));
    }

    private function invocarPrivate(object $objeto, string $metodo, array $args = []): mixed
    {
        $ref = new \ReflectionMethod($objeto, $metodo);
        $ref->setAccessible(true);
        return $ref->invoke($objeto, ...$args);
    }
}
