<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Modules\Accounting\Services\TributaryRuleService;
use App\Modules\Accounting\Services\RegimeProvisioner;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Accounting\Models\CuentaContable;
use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;

class ContabilidadCompletaTest extends TestCase
{
    use RefreshDatabase;

    private int $tenantId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedTenant();
        $this->tenantId = app('current_tenant')->id;
    }

    private function seedTenant(): void
    {
        $tenant = Tenant::create(['name' => 'Test', 'slug' => uniqid('test-'), 'email' => 't@t.com', 'is_active' => true]);
        app()->bind('current_tenant', fn () => $tenant);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
        $this->actingAs(\App\Models\User::factory()->create(['tenant_id' => $tenant->id]));
    }

    public function test_simplificado_no_cobra_iva(): void
    {
        Configuracion::setMany(['regimen_fiscal' => 'simplificado'], $this->tenantId);

        $svc = app(TributaryRuleService::class);
        $r = $svc->calculateTaxes(1000000, 'venta', $this->tenantId);

        $this->assertEquals('simplificado', $r['regimen']);
        $this->assertEquals(0, $r['iva']);
        $this->assertEquals(1000000, $r['total']);
    }

    public function test_comun_cobra_iva_19(): void
    {
        Configuracion::setMany(['regimen_fiscal' => 'comun'], $this->tenantId);

        $svc = app(TributaryRuleService::class);
        $r = $svc->calculateTaxes(1000000, 'venta', $this->tenantId);

        $this->assertEquals('comun', $r['regimen']);
        $this->assertEquals(190000, $r['iva']);
        $this->assertEquals(1190000, $r['total']);
    }

    public function test_cambio_regimen_crea_cuentas(): void
    {
        Configuracion::setMany(['regimen_fiscal' => 'simplificado'], $this->tenantId);

        $provisioner = app(RegimeProvisioner::class);
        $tenant = Tenant::find($this->tenantId);
        $resultado = $provisioner->cambiarRegimen($tenant, 'comun');

        $this->assertEquals('simplificado', $resultado['regimen_anterior']);
        $this->assertGreaterThan(0, count($resultado['cuentas_creadas']));

        $cuentasTributarias = CuentaContable::where('tenant_id', $this->tenantId)
            ->whereIn('codigo', ['240805', '240810', '135515', '2365'])
            ->count();
        $this->assertGreaterThanOrEqual(4, $cuentasTributarias);
    }

    public function test_crear_asiento_cuadrado(): void
    {
        $cta1 = CuentaContable::create([
            'tenant_id' => $this->tenantId, 'codigo' => '110505', 'nombre' => 'Caja',
            'tipo' => 'activo', 'naturaleza' => 'debito', 'nivel' => 3, 'clase' => '1',
            'acepta_movimientos' => true,
        ]);
        $cta2 = CuentaContable::create([
            'tenant_id' => $this->tenantId, 'codigo' => '4135', 'nombre' => 'Ingresos',
            'tipo' => 'ingreso', 'naturaleza' => 'credito', 'nivel' => 2, 'clase' => '4',
            'acepta_movimientos' => true,
        ]);

        $svc = app(ContabilidadService::class);
        $asiento = $svc->registrarAsiento([
            'fecha' => now()->toDateString(),
            'concepto' => 'Venta de prueba',
            'modulo_origen' => 'ventas',
        ], [
            ['cuenta_contable_id' => $cta1->id, 'debito' => 100000, 'credito' => 0, 'descripcion' => 'Caja'],
            ['cuenta_contable_id' => $cta2->id, 'debito' => 0, 'credito' => 100000, 'descripcion' => 'Ingreso'],
        ]);

        $this->assertNotNull($asiento);
        $this->assertEquals(2, $asiento->lineas()->count());
    }

    public function test_no_permite_asiento_descuadrado(): void
    {
        $cta = CuentaContable::create([
            'tenant_id' => $this->tenantId, 'codigo' => '110505', 'nombre' => 'Caja',
            'tipo' => 'activo', 'naturaleza' => 'debito', 'nivel' => 3, 'clase' => '1',
            'acepta_movimientos' => true,
        ]);

        $this->expectException(\Exception::class);

        $svc = app(ContabilidadService::class);
        $svc->registrarAsiento([
            'fecha' => now()->toDateString(),
            'concepto' => 'Descuadrado',
            'modulo_origen' => 'ventas',
        ], [
            ['cuenta_contable_id' => $cta->id, 'debito' => 100000, 'credito' => 0, 'descripcion' => 'X'],
            ['cuenta_contable_id' => $cta->id, 'debito' => 0, 'credito' => 50000, 'descripcion' => 'Y'],
        ]);
    }
}
