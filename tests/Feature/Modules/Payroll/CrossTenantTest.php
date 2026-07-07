<?php

namespace Tests\Feature\Modules\Payroll;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Departamento;
use App\Modules\Hr\Models\Cargo;
use App\Core\Models\Sede;
use App\Modules\Payroll\Models\PeriodoNomina;
use App\Modules\Payroll\Models\Nomina;
use App\Modules\Payroll\Models\NominaDetalle;
use App\Modules\Payroll\Models\Novedad;
use App\Modules\Payroll\Models\ConceptoNomina;
use App\Modules\Payroll\Models\ProvisionAcumulada;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossTenantTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private \App\Models\User $userA;

    protected function setUp(): void
    {
        parent::setUp();

        // Registrar módulos necesarios
        \DB::table('modules')->insertOrIgnore([
            ['code' => 'hr', 'name' => 'RRHH', 'class' => 'Hr', 'version' => '1.0.0', 'is_active_globally' => true, 'estado' => 'publicado'],
            ['code' => 'payroll', 'name' => 'Nómina', 'class' => 'Payroll', 'version' => '1.0.0', 'is_active_globally' => true, 'estado' => 'publicado'],
        ]);

        // Tenant A
        $this->tenantA = Tenant::create(['name' => 'Empresa A', 'slug' => uniqid('pta-'), 'email' => 'a@test.com', 'is_active' => true]);
        app()->bind('current_tenant', fn () => $this->tenantA);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->tenantA->id);

        TenantModule::create(['tenant_id' => $this->tenantA->id, 'module_code' => 'hr', 'is_active' => true]);
        TenantModule::create(['tenant_id' => $this->tenantA->id, 'module_code' => 'payroll', 'is_active' => true]);

        $this->userA = \App\Models\User::factory()->create(['tenant_id' => $this->tenantA->id, 'is_superadmin' => true]);
        foreach (['payroll:view', 'payroll:create', 'payroll:edit', 'payroll:delete', 'payroll:liquidate', 'payroll:manage', 'payroll:report'] as $perm) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
        $this->userA->givePermissionTo(...['payroll:view', 'payroll:create', 'payroll:edit', 'payroll:delete', 'payroll:liquidate', 'payroll:manage', 'payroll:report']);
        $this->actingAs($this->userA);

        // Tenant B — datos directos en BD bypassing scopes
        $this->tenantB = Tenant::create(['name' => 'Empresa B', 'slug' => uniqid('ptb-'), 'email' => 'b@test.com', 'is_active' => true]);

        // Empleado del Tenant B
        $sedeB = Sede::create(['tenant_id' => $this->tenantB->id, 'nombre' => 'Sede B', 'activo' => true]);
        $deptoB = Departamento::create(['tenant_id' => $this->tenantB->id, 'nombre' => 'Depto B', 'activo' => true]);
        $cargoB = Cargo::create(['tenant_id' => $this->tenantB->id, 'departamento_id' => $deptoB->id, 'nombre' => 'Cargo B', 'activo' => true]);

        $this->empleadoBId = \DB::table('hr_empleados')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'sede_id' => $sedeB->id,
            'documento' => '9999999999',
            'nombres' => 'Empleado',
            'apellidos' => 'Tenant B',
            'email' => 'empleado@b.test',
            'estado' => true,
        ]);

        \DB::table('hr_contratos')->insert([
            'tenant_id' => $this->tenantB->id,
            'empleado_id' => $this->empleadoBId,
            'cargo_id' => $cargoB->id,
            'tipo_contrato' => 'indefinido',
            'cargo' => 'Desarrollador',
            'salario_base' => 2000000,
            'fecha_inicio' => '2025-01-01',
            'estado' => true,
        ]);

        // Período del Tenant B
        $this->periodoBId = \DB::table('pay_periodos_nomina')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'codigo' => 'P-B-001',
            'mes_contable' => '2026-01',
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-01-31',
            'estado' => 'BORRADOR',
            'total_devengado' => 0,
            'total_deducciones' => 0,
            'total_provisiones' => 0,
            'total_aportes_patronales' => 0,
            'neto_pagar' => 0,
        ]);

        // Concepto del Tenant B
        $this->conceptoBId = \DB::table('pay_conceptos_nomina')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'codigo' => 'SAL01',
            'nombre' => 'Salario Básico',
            'tipo' => 'DEVENGADO',
            'base_seguridad_social' => true,
            'base_parafiscales' => true,
            'base_prestaciones' => true,
            'activo' => true,
        ]);

        // Novedad del Tenant B
        $this->novedadBId = \DB::table('pay_novedades')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'empleado_id' => $this->empleadoBId,
            'tipo' => 'ingreso',
            'concepto' => 'Hora Extra',
            'valor' => 50000,
            'fecha_registro' => '2026-01-15',
            'estado' => 'pendiente',
        ]);

        // Provision del Tenant B
        \DB::table('pay_provisiones_acumuladas')->insert([
            'tenant_id' => $this->tenantB->id,
            'empleado_id' => $this->empleadoBId,
            'tipo_provision' => 'PRIMA',
            'ano' => 2026,
            'saldo_inicial' => 0,
            'movimiento_mes' => 100000,
            'saldo_final' => 100000,
        ]);
    }

    // ── VISIBILIDAD ──────────────────────────────────────────────────────

    public function test_periodo_nomina_no_visible_en_otro_tenant(): void
    {
        $this->get(route('payroll.periodos.index'))->assertOk();

        $periodos = PeriodoNomina::all();
        $this->assertEmpty($periodos->where('tenant_id', $this->tenantB->id));
    }

    public function test_nomina_no_visible_en_otro_tenant(): void
    {
        // Crear una nomina directamente para tenant B
        \DB::table('pay_nominas')->insert([
            'tenant_id' => $this->tenantB->id,
            'periodo_id' => $this->periodoBId,
            'empleado_id' => $this->empleadoBId,
            'contrato_id' => \DB::table('hr_contratos')->where('empleado_id', $this->empleadoBId)->value('id'),
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-01-31',
            'dias_laborados' => 30,
            'total_devengado' => 2000000,
            'total_deducciones' => 0,
            'neto_pagar' => 2000000,
            'total_provisiones' => 0,
            'total_aportes_patronales' => 0,
            'costo_laboral_total' => 2000000,
        ]);

        $this->get(route('payroll.nominas.index'))->assertOk();

        $nominas = Nomina::all();
        $this->assertEmpty($nominas->where('tenant_id', $this->tenantB->id));
    }

    public function test_novedad_no_visible_en_otro_tenant(): void
    {
        $this->get(route('payroll.novedades.index'))->assertOk();

        $novedades = Novedad::all();
        $this->assertEmpty($novedades->where('tenant_id', $this->tenantB->id));
    }

    public function test_concepto_nomina_no_visible_en_otro_tenant(): void
    {
        $conceptos = ConceptoNomina::all();
        $this->assertEmpty($conceptos->where('tenant_id', $this->tenantB->id));
    }

    public function test_provision_acumulada_no_visible_en_otro_tenant(): void
    {
        $provisiones = ProvisionAcumulada::all();
        $this->assertEmpty($provisiones->where('tenant_id', $this->tenantB->id));
    }

    // ── ACCESO DIRECTO POR ID ────────────────────────────────────────────

    public function test_show_periodo_rechaza_id_de_otro_tenant(): void
    {
        $this->get(route('payroll.periodos.show', $this->periodoBId))->assertNotFound();
    }

    public function test_show_nomina_rechaza_id_de_otro_tenant(): void
    {
        $nominaBId = \DB::table('pay_nominas')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'periodo_id' => $this->periodoBId,
            'empleado_id' => $this->empleadoBId,
            'contrato_id' => \DB::table('hr_contratos')->where('empleado_id', $this->empleadoBId)->value('id'),
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-01-31',
            'dias_laborados' => 30,
            'total_devengado' => 2000000,
            'total_deducciones' => 0,
            'neto_pagar' => 2000000,
            'total_provisiones' => 0,
            'total_aportes_patronales' => 0,
            'costo_laboral_total' => 2000000,
        ]);

        $this->get(route('payroll.nominas.show', $nominaBId))->assertNotFound();
    }

    public function test_desprendible_rechaza_id_de_otro_tenant(): void
    {
        $nominaBId = \DB::table('pay_nominas')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'periodo_id' => $this->periodoBId,
            'empleado_id' => $this->empleadoBId,
            'contrato_id' => \DB::table('hr_contratos')->where('empleado_id', $this->empleadoBId)->value('id'),
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-01-31',
            'dias_laborados' => 30,
            'total_devengado' => 2000000,
            'total_deducciones' => 0,
            'neto_pagar' => 2000000,
            'total_provisiones' => 0,
            'total_aportes_patronales' => 0,
            'costo_laboral_total' => 2000000,
        ]);

        $this->get(route('payroll.reportes.desprendible', $nominaBId))->assertNotFound();
    }

    // ── ESCRITURA CROSS-TENANT ───────────────────────────────────────────

    public function test_novedad_store_rechaza_empleado_de_otro_tenant(): void
    {
        $this->post(route('payroll.novedades.store'), [
            'empleado_id' => $this->empleadoBId,
            'tipo' => 'ingreso',
            'valor' => 100000,
            'fecha_registro' => '2026-01-20',
        ])->assertSessionHasErrors('empleado_id');
    }

    public function test_novedad_store_bulk_rechaza_empleados_de_otro_tenant(): void
    {
        $this->post(route('payroll.novedades.store-bulk'), [
            'empleados_ids' => [$this->empleadoBId],
            'tipo' => 'ingreso',
            'valor' => 50000,
            'fecha_registro' => '2026-01-20',
        ])->assertSessionHasErrors('empleados_ids.*');
    }

    public function test_anular_periodo_rechaza_id_de_otro_tenant(): void
    {
        $this->post(route('payroll.periodos.anular', $this->periodoBId))->assertNotFound();
    }

    public function test_liquidar_periodo_rechaza_id_de_otro_tenant(): void
    {
        $this->post(route('payroll.periodos.liquidar', $this->periodoBId))->assertNotFound();
    }

    public function test_resumen_reporte_rechaza_periodo_de_otro_tenant(): void
    {
        $this->get(route('payroll.reportes.resumen', $this->periodoBId))->assertNotFound();
    }
}
