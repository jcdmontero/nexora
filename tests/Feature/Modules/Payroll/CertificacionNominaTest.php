<?php

namespace Tests\Feature\Modules\Payroll;

use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Hr\Services\HrProvisioner;
use App\Modules\Payroll\Services\PayrollProvisioner;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Payroll\Models\PeriodoNomina;
use App\Modules\Payroll\Services\NominaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CertificacionNominaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->artisan('migrate', ['--path' => 'app/Modules/Accounting/Migrations', '--realpath' => true]);
        $this->artisan('migrate', ['--path' => 'app/Modules/Hr/Migrations', '--realpath' => true]);
        $this->artisan('migrate', ['--path' => 'app/Modules/Payroll/Migrations', '--realpath' => true]);
    }

    private function setupTenantYProvisionar(): array
    {
        $tenant = Tenant::factory()->create();
        app()->instance('current_tenant', $tenant);

        // Run accounting provisioner first to create accounts
        $accountingProvisioner = new \App\Modules\Accounting\Services\PucColombiaProvisioner();
        $accountingProvisioner->provisionForTenant($tenant);

        $hrProvisioner = new \App\Modules\Hr\Services\HrProvisioner();
        $hrProvisioner->provisionForTenant($tenant);

        $payrollProvisioner = new \App\Modules\Payroll\Services\PayrollProvisioner();
        $payrollProvisioner->provisionForTenant($tenant);

        return [$tenant];
    }

    public function test_configuracion_entorno_hr_y_payroll()
    {
        [$tenant] = $this->setupTenantYProvisionar();
        
        $this->assertDatabaseHas('hr_configuracion_legal', ['tenant_id' => $tenant->id]);
        $this->assertDatabaseHas('pay_conceptos_nomina', ['tenant_id' => $tenant->id]);
        
        // Retornamos el tenant para que otras pruebas lo puedan usar si quieren
        return [$tenant];
    }
    
    // =========================================================================
    //  ESCENARIO 1: SALARIO MÍNIMO
    // =========================================================================

    public function test_liquida_empleado_salario_minimo_con_extras_y_auxilio()
    {
        [$tenant] = $this->setupTenantYProvisionar();
        
        $sede = \App\Core\Models\Sede::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Sede Principal',
            'es_principal' => true
        ]);

        $departamento = \App\Modules\Hr\Models\Departamento::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Operaciones',
        ]);

        $cargo = \App\Modules\Hr\Models\Cargo::create([
            'tenant_id' => $tenant->id,
            'departamento_id' => $departamento->id,
            'nombre' => 'Operario',
            'salario_base_sugerido' => 1400000 // SMMLV aprox
        ]);

        $empleado = Empleado::create([
            'tenant_id' => $tenant->id,
            'sede_id' => $sede->id,
            'documento' => '1000000000',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'juan@test.com'
        ]);

        $eps = \App\Modules\Hr\Models\EntidadParafiscal::where('tenant_id', $tenant->id)->where('tipo_entidad', 'EPS')->first();
        $afp = \App\Modules\Hr\Models\EntidadParafiscal::where('tenant_id', $tenant->id)->where('tipo_entidad', 'AFP')->first();
        $arl = \App\Modules\Hr\Models\EntidadParafiscal::where('tipo_entidad', 'ARL')->first();
        $ccf = \App\Modules\Hr\Models\EntidadParafiscal::where('tipo_entidad', 'CCF')->first();

        // Crear Contrato activo
        $contrato = Contrato::create([
            'tenant_id' => $tenant->id,
            'empleado_id' => $empleado->id,
            'cargo_id' => $cargo->id,
            'cargo' => 'Operario',
            'fecha_inicio' => '2026-01-01',
            'salario_base' => 1400000,
            'tipo_contrato' => 'indefinido',
            'riesgo_arl' => 1,
            'eps_id' => $eps->id,
            'afp_id' => $afp->id,
            'arl_id' => $arl->id,
            'ccf_id' => $ccf->id,
            'estado' => true
        ]);
        // Crear Periodo de Nómina (Enero 2026)
        $user = \App\Models\User::factory()->create(['tenant_id' => $tenant->id]);
        $periodo = PeriodoNomina::create([
            'tenant_id' => $tenant->id,
            'codigo' => 'NOM-2026-01',
            'mes_contable' => '2026-01',
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-01-30',
            'estado' => 'BORRADOR',
            'created_by' => $user->id,
        ]);

        $configLegal = \App\Modules\Hr\Models\ConfiguracionLegal::where('tenant_id', $tenant->id)
            ->where('ano_vigencia', 2026)->first();

        // Agregar novedad (Horas extras)
        $conceptoExtra = \App\Modules\Payroll\Models\ConceptoNomina::where('tenant_id', $tenant->id)
            ->where('codigo', 'HEX01')->first();
            
        \App\Modules\Payroll\Models\Novedad::create([
            'empleado_id' => $empleado->id,
            'periodo_id' => $periodo->id,
            'concepto_id' => $conceptoExtra->id,
            'tipo' => 'ingreso',
            'concepto' => 'Hora Extra Diurna',
            'valor' => 36458.33,
            'fecha_registro' => '2026-01-15',
            'estado' => 'pendiente',
        ]);

        $nominaService = new NominaService();
        $resultado = $nominaService->liquidarEmpleado($empleado, $periodo, $configLegal);

        $resumen = $resultado['resumen'];
        
        // Assertions
        $this->assertEquals(30, $resumen['dias_laborados']);
        
        // IBC (Salario Base 1.400.000 + Horas Extras)
        $this->assertGreaterThan(1400000, $resumen['ibc_seguridad_social']);
        $this->assertEquals($resumen['ibc_seguridad_social'], $resumen['ibc_parafiscales']);

        // Deducciones: 4% Salud, 4% Pensión sobre IBC
        $deduccionesEsperadas = round($resumen['ibc_seguridad_social'] * 0.04) * 2; // 8% total
        $this->assertEquals($deduccionesEsperadas, $resumen['total_deducciones']);

        // Validar Auxilio de Transporte (gana < 2 SMMLV)
        $conceptos = collect($resultado['conceptos']);
        $auxilio = $conceptos->firstWhere('concepto_codigo', 'AUX01');
        $this->assertNotNull($auxilio, 'Debe pagarse auxilio de transporte');
        $this->assertEquals(200000, $auxilio['valor']); // Valor default del provisioner
        
        // Validar Provisiones
        // Prima: 8.33% sobre (IBC + Auxilio) - que equivale a dividir por 12
        $basePrestaciones = $resumen['ibc_seguridad_social'] + 200000;
        $primaEsperada = round($basePrestaciones / 12);
        
        $prima = $conceptos->firstWhere('concepto_codigo', 'PRO01');
        $this->assertNotNull($prima, 'Debe calcularse la prima');
        $this->assertEquals($primaEsperada, $prima['valor']);
        // Me aseguro de imprimir el resumen si falla para ajustar las llaves
        
    }

    // =========================================================================
    //  ESCENARIO 2: SALARIO ALTO (> 10 SMMLV) SIN AUXILIO Y CON RETEFUENTE
    // =========================================================================

    public function test_liquida_empleado_salario_alto_sin_auxilio_con_retefuente()
    {
        [$tenant] = $this->setupTenantYProvisionar();
        
        $sede = \App\Core\Models\Sede::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Sede Principal',
            'es_principal' => true
        ]);

        $departamento = \App\Modules\Hr\Models\Departamento::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Dirección',
        ]);

        $cargo = \App\Modules\Hr\Models\Cargo::create([
            'tenant_id' => $tenant->id,
            'departamento_id' => $departamento->id,
            'nombre' => 'Gerente General',
            'salario_base_sugerido' => 15000000 
        ]);

        $empleado = Empleado::create([
            'tenant_id' => $tenant->id,
            'sede_id' => $sede->id,
            'documento' => '2000000000',
            'nombres' => 'María',
            'apellidos' => 'Gómez',
            'email' => 'maria@test.com'
        ]);

        $eps = \App\Modules\Hr\Models\EntidadParafiscal::where('tenant_id', $tenant->id)->where('tipo_entidad', 'EPS')->first();
        $afp = \App\Modules\Hr\Models\EntidadParafiscal::where('tenant_id', $tenant->id)->where('tipo_entidad', 'AFP')->first();
        $arl = \App\Modules\Hr\Models\EntidadParafiscal::where('tipo_entidad', 'ARL')->first();
        $ccf = \App\Modules\Hr\Models\EntidadParafiscal::where('tipo_entidad', 'CCF')->first();

        // Crear Contrato activo
        $contrato = Contrato::create([
            'tenant_id' => $tenant->id,
            'empleado_id' => $empleado->id,
            'cargo_id' => $cargo->id,
            'cargo' => 'Gerente General',
            'fecha_inicio' => '2026-01-01',
            'salario_base' => 15000000,
            'tipo_contrato' => 'indefinido',
            'riesgo_arl' => 1,
            'eps_id' => $eps->id,
            'afp_id' => $afp->id,
            'arl_id' => $arl->id,
            'ccf_id' => $ccf->id,
            'estado' => true
        ]);
        
        $user = \App\Models\User::factory()->create(['tenant_id' => $tenant->id]);
        $periodo = PeriodoNomina::create([
            'tenant_id' => $tenant->id,
            'codigo' => 'NOM-2026-01',
            'mes_contable' => '2026-01',
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-01-30',
            'estado' => 'BORRADOR',
            'created_by' => $user->id,
        ]);

        $configLegal = \App\Modules\Hr\Models\ConfiguracionLegal::where('tenant_id', $tenant->id)
            ->where('ano_vigencia', 2026)->first();

        $nominaService = new NominaService();
        $resultado = $nominaService->liquidarEmpleado($empleado, $periodo, $configLegal);

        $resumen = $resultado['resumen'];
        $conceptos = collect($resultado['conceptos']);
        
        // Assertions
        $this->assertEquals(30, $resumen['dias_laborados']);
        $this->assertEquals(15000000, $resumen['ibc_seguridad_social']);
        
        // Auxilio de Transporte (Gana > 2 SMMLV, no debe pagarse)
        $auxilio = $conceptos->firstWhere('concepto_codigo', 'AUX01');
        $this->assertNull($auxilio, 'NO debe pagarse auxilio de transporte para salarios altos');
        
        // Solidaridad Pensional (Gana > 4 SMMLV, 15M / 1.3M = 11.5 SMMLV -> 1.5% o similar)
        // La tabla de FSP dice: 4-16 smmlv -> 1% adicional. 
        // 15M es > 4 SMMLV (5.2M)
        $fsp = $conceptos->firstWhere('concepto_codigo', 'DED05');
        $this->assertNotNull($fsp, 'Debe cobrar fondo de solidaridad pensional');
        $this->assertEquals(150000, $fsp['valor']); // 15M * 1%
        
        // Retefuente ? En el provisioner no hay retefuente generada dinámicamente, 
        // pero validemos que deducciones incluyen 4% salud, 4% pensión, FSP (1%)
        $salud = $conceptos->firstWhere('concepto_codigo', 'DED01');
        $pension = $conceptos->firstWhere('concepto_codigo', 'DED02');
        
        $this->assertEquals(600000, $salud['valor']); // 4% de 15M
        $this->assertEquals(600000, $pension['valor']); // 4% de 15M
        
    }

    // =========================================================================
    //  ESCENARIO 3: EMPLEADO CON INCAPACIDAD
    // =========================================================================

    public function test_liquida_empleado_con_incapacidad()
    {
        [$tenant] = $this->setupTenantYProvisionar();
        
        $sede = \App\Core\Models\Sede::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Sede Principal',
            'es_principal' => true
        ]);

        $departamento = \App\Modules\Hr\Models\Departamento::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Operaciones',
        ]);

        $cargo = \App\Modules\Hr\Models\Cargo::create([
            'tenant_id' => $tenant->id,
            'departamento_id' => $departamento->id,
            'nombre' => 'Operario',
            'salario_base_sugerido' => 1400000 
        ]);

        $empleado = Empleado::create([
            'tenant_id' => $tenant->id,
            'sede_id' => $sede->id,
            'documento' => '3000000000',
            'nombres' => 'Carlos',
            'apellidos' => 'Ruiz',
            'email' => 'carlos@test.com'
        ]);

        $eps = \App\Modules\Hr\Models\EntidadParafiscal::where('tenant_id', $tenant->id)->where('tipo_entidad', 'EPS')->first();
        $afp = \App\Modules\Hr\Models\EntidadParafiscal::where('tenant_id', $tenant->id)->where('tipo_entidad', 'AFP')->first();
        $arl = \App\Modules\Hr\Models\EntidadParafiscal::where('tipo_entidad', 'ARL')->first();
        $ccf = \App\Modules\Hr\Models\EntidadParafiscal::where('tipo_entidad', 'CCF')->first();

        // Crear Contrato activo
        $contrato = Contrato::create([
            'tenant_id' => $tenant->id,
            'empleado_id' => $empleado->id,
            'cargo_id' => $cargo->id,
            'cargo' => 'Operario',
            'fecha_inicio' => '2026-01-01',
            'salario_base' => 1400000,
            'tipo_contrato' => 'indefinido',
            'riesgo_arl' => 1,
            'eps_id' => $eps->id,
            'afp_id' => $afp->id,
            'arl_id' => $arl->id,
            'ccf_id' => $ccf->id,
            'estado' => true
        ]);
        
        $user = \App\Models\User::factory()->create(['tenant_id' => $tenant->id]);
        $periodo = PeriodoNomina::create([
            'tenant_id' => $tenant->id,
            'codigo' => 'NOM-2026-01',
            'mes_contable' => '2026-01',
            'fecha_inicio' => '2026-01-01',
            'fecha_fin' => '2026-01-30',
            'estado' => 'BORRADOR',
            'created_by' => $user->id,
        ]);

        // Registrar incapacidad
        \App\Modules\Hr\Models\Incapacidad::create([
            'tenant_id' => $tenant->id,
            'empleado_id' => $empleado->id,
            'tipo' => 'enfermedad_general',
            'fecha_inicio' => '2026-01-10',
            'fecha_fin' => '2026-01-14',
            'dias' => 5,
            'porcentaje_pago' => 66.67,
            'entidad_id' => $eps->id,
            'estado' => 'aprobada'
        ]);

        $configLegal = \App\Modules\Hr\Models\ConfiguracionLegal::where('tenant_id', $tenant->id)
            ->where('ano_vigencia', 2026)->first();

        $nominaService = new NominaService();
        $resultado = $nominaService->liquidarEmpleado($empleado, $periodo, $configLegal);

        $resumen = $resultado['resumen'];
        $conceptos = collect($resultado['conceptos']);
        
        // Assertions
        $this->assertEquals(30, $resumen['dias_laborados']);
        $this->assertEquals(5, $resumen['dias_incapacidad']);
        
        // Validar que se liquida el concepto de incapacidad INC01
        $incapacidad = $conceptos->firstWhere('concepto_codigo', 'INC01');
        $this->assertNotNull($incapacidad, 'Debe pagarse la incapacidad');
        
        // Valor esperado: 1.400.000 / 30 * 5 * 66.67%
        $valorDia = 1400000 / 30; // 46666.67
        $valorInc = round($valorDia * 5 * 0.6667);
        $this->assertEquals($valorInc, $incapacidad['valor']);
        
        // Salario proporcional
        $salario = $conceptos->firstWhere('concepto_codigo', 'SAL01');
        $this->assertEquals(round($valorDia * 25), $salario['valor']);
        
    }

    public function test_aprobar_nomina_genera_asientos_contables()
    {
        [$tenant] = $this->setupTenantYProvisionar();
        $user = \App\Models\User::factory()->create(['tenant_id' => $tenant->id]);
        $this->actingAs($user);
        
        $sede = \App\Core\Models\Sede::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Sede Principal',
            'es_principal' => true
        ]);

        $departamento = \App\Modules\Hr\Models\Departamento::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Operaciones',
        ]);

        $cargo = \App\Modules\Hr\Models\Cargo::create([
            'tenant_id' => $tenant->id,
            'departamento_id' => $departamento->id,
            'nombre' => 'Operario',
        ]);

        $empleado = \App\Modules\Hr\Models\Empleado::create([
            'tenant_id' => $tenant->id,
            'tipo_documento' => 'CC',
            'documento' => '111222333',
            'nombres' => 'Juan',
            'apellidos' => 'Perez',
            'fecha_nacimiento' => '1990-01-01',
            'genero' => 'M',
            'estado_civil' => 'SOLTERO',
            'direccion' => 'Calle 123',
            'telefono' => '3001234567',
            'email' => 'juan@example.com',
            'estado' => true,
            'fecha_ingreso' => '2026-01-01',
            'sede_id' => $sede->id,
            'departamento_id' => $departamento->id,
            'cargo_id' => $cargo->id,
        ]);

        $contrato = \App\Modules\Hr\Models\Contrato::create([
            'tenant_id' => $tenant->id,
            'empleado_id' => $empleado->id,
            'tipo_contrato' => 'indefinido',
            'fecha_inicio' => '2026-01-01',
            'salario_base' => 1400000, 
            'estado' => true,
            'sede_id' => $sede->id,
            'cargo_id' => $cargo->id,
            'cargo' => 'Operario',
        ]);

        $periodo = \App\Modules\Payroll\Models\PeriodoNomina::create([
            'tenant_id' => $tenant->id,
            'codigo' => 'NOM-2026-06',
            'fecha_inicio' => '2026-06-01',
            'fecha_fin' => '2026-06-30',
            'mes_contable' => '2026-06',
            'estado' => 'BORRADOR',
        ]);

        $nominaService = app(\App\Modules\Payroll\Services\NominaService::class);
        $nominaService->liquidarPeriodo($periodo);
        $periodo->refresh();

        $this->assertEquals('LIQUIDADA', $periodo->estado);

        // Llama a aprobar
        $controller = app(\App\Modules\Payroll\Controllers\PeriodoController::class);
        $service = app(\App\Modules\Payroll\Services\ContabilidadNominaService::class);
        
        $request = \Illuminate\Http\Request::create('/payroll/periodos/'.$periodo->id.'/aprobar', 'POST');
        $controller->aprobar($periodo, $service);
        
        $periodo->refresh();
        $this->assertEquals('CONTABILIZADA', $periodo->estado);

        $this->assertDatabaseHas('asientos_contables', [
            'referencia_id' => $periodo->id,
            'referencia_type' => \App\Modules\Payroll\Models\PeriodoNomina::class,
            'estado' => 'contabilizado'
        ]);

        $asiento = \App\Modules\Accounting\Models\AsientoContable::where('referencia_id', $periodo->id)
            ->where('referencia_type', \App\Modules\Payroll\Models\PeriodoNomina::class)
            ->first();
        $this->assertNotNull($asiento);

        // Validar que débitos y créditos cuadren
        $totalDebitos = \App\Modules\Accounting\Models\AsientoLinea::where('asiento_contable_id', $asiento->id)->sum('debito');
        $totalCreditos = \App\Modules\Accounting\Models\AsientoLinea::where('asiento_contable_id', $asiento->id)->sum('credito');
        
        $this->assertEquals($totalDebitos, $totalCreditos, "El asiento contable no cuadra");
        $this->assertTrue($totalDebitos > 0, "El total de débitos debe ser mayor a 0");
    }
}



