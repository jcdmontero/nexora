<?php

namespace App\Modules\Payroll\Services;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\ConfiguracionLegal;
use App\Modules\Payroll\Models\ConceptoNomina;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PayrollProvisioner
{
    /**
     * Siembra datos iniciales de nómina para un tenant:
     * - Configuración legal por defecto (año actual)
     * - Catálogo de conceptos de nómina
     * - Permisos de nómina
     */
    public function provisionForTenant(Tenant $tenant): void
    {
        $tenantId = $tenant->id;

        // ─── Configuración legal por defecto ───
        $currentYear = (int) date('Y');
        ConfiguracionLegal::firstOrCreate(
            ['tenant_id' => $tenantId, 'ano_vigencia' => $currentYear],
            [
                'salario_minimo' => 1400000,
                'auxilio_transporte' => 200000,
                'tope_auxilio_transporte_salarios' => 2,
                'valor_uvt' => 47000,
                'horas_semanales' => 46,
                'aporte_salud_empleado' => 4,
                'aporte_pension_empleado' => 4,
                'aporte_salud_patronal' => 8.5,
                'aporte_pension_patronal' => 12,
                'caja_compensacion' => 4,
                'sena' => 2,
                'icbf' => 3,
            ]
        );

        // ─── Conceptos de nómina ───
        $conceptos = [
            // Devengados
            ['codigo' => 'SAL01', 'nombre' => 'Salario Básico', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'INC01', 'nombre' => 'Auxilio por Incapacidad', 'tipo' => 'DEVENGADO'],
            ['codigo' => 'AUX01', 'nombre' => 'Auxilio de Transporte', 'tipo' => 'DEVENGADO'],
            ['codigo' => 'HEX01', 'nombre' => 'Hora Extra Diurna', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'HEX02', 'nombre' => 'Hora Extra Nocturna', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'HEX03', 'nombre' => 'Hora Extra Diurna Festiva', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'HEX04', 'nombre' => 'Hora Extra Nocturna Festiva', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'REC01', 'nombre' => 'Recargo Nocturno', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'REC02', 'nombre' => 'Recargo Festivo', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'REC03', 'nombre' => 'Recargo Nocturno Festivo', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'EDF01', 'nombre' => 'Domingo / Festivo', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'ENF01', 'nombre' => 'Nocturno Festivo', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'BON01', 'nombre' => 'Bonificación No Salarial', 'tipo' => 'DEVENGADO'],
            ['codigo' => 'BON02', 'nombre' => 'Bonificación Salarial', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'COM01', 'nombre' => 'Comisiones', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],

            // Deducciones
            ['codigo' => 'DED01', 'nombre' => 'Aporte Salud (4%)', 'tipo' => 'DEDUCCION'],
            ['codigo' => 'DED02', 'nombre' => 'Aporte Pensión (4%)', 'tipo' => 'DEDUCCION'],
            ['codigo' => 'DED03', 'nombre' => 'Retención en la Fuente', 'tipo' => 'DEDUCCION'],
            ['codigo' => 'DED04', 'nombre' => 'Préstamos', 'tipo' => 'DEDUCCION'],
            ['codigo' => 'DED05', 'nombre' => 'Fondo Solidaridad Pensional', 'tipo' => 'DEDUCCION'],

            // Provisiones
            ['codigo' => 'PRO01', 'nombre' => 'Prima de Servicios', 'tipo' => 'PROVISION'],
            ['codigo' => 'PRO02', 'nombre' => 'Cesantías', 'tipo' => 'PROVISION'],
            ['codigo' => 'PRO03', 'nombre' => 'Intereses a las Cesantías', 'tipo' => 'PROVISION'],
            ['codigo' => 'PRO04', 'nombre' => 'Vacaciones', 'tipo' => 'PROVISION'],

            // Aportes patronales
            ['codigo' => 'PAT01', 'nombre' => 'Aporte Pensión Patronal (12%)', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT02', 'nombre' => 'Aporte Salud Patronal (8.5%)', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT03', 'nombre' => 'ARL', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT04', 'nombre' => 'Caja de Compensación (4%)', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT05', 'nombre' => 'SENA (2%)', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT06', 'nombre' => 'ICBF (3%)', 'tipo' => 'APORTE_PATRONAL'],
        ];

        // Obtener IDs de las cuentas contables
        $cuentaGasto = \App\Modules\Accounting\Models\CuentaContable::withoutGlobalScopes()->where('tenant_id', $tenantId)->where('codigo', '5105')->value('id');
        $cuentaRetenciones = \App\Modules\Accounting\Models\CuentaContable::withoutGlobalScopes()->where('tenant_id', $tenantId)->where('codigo', '2370')->value('id');
        $cuentaProvisiones = \App\Modules\Accounting\Models\CuentaContable::withoutGlobalScopes()->where('tenant_id', $tenantId)->where('codigo', '2610')->value('id');

        foreach ($conceptos as $data) {
            $data['tenant_id'] = $tenantId;
            
            // Asignar cuenta contable según el tipo
            if ($data['tipo'] === 'DEVENGADO' || $data['tipo'] === 'APORTE_PATRONAL') {
                $data['cuenta_contable_id'] = $cuentaGasto;
            } elseif ($data['tipo'] === 'DEDUCCION') {
                $data['cuenta_contable_id'] = $cuentaRetenciones;
            } elseif ($data['tipo'] === 'PROVISION') {
                $data['cuenta_contable_id'] = $cuentaProvisiones;
            }

            ConceptoNomina::firstOrCreate(
                ['tenant_id' => $tenantId, 'codigo' => $data['codigo']],
                $data
            );
        }

        // ─── Permisos extra de nómina ───
        $registrar = app(PermissionRegistrar::class);
        $previous = $registrar->getPermissionsTeamId();
        $registrar->setPermissionsTeamId($tenantId);

        try {
            foreach (['payroll:edit', 'payroll:delete', 'payroll:manage'] as $perm) {
                Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
                $role = \Spatie\Permission\Models\Role::where('team_id', $tenantId)
                    ->where('name', config('roles.default_tenant_admin', 'ADMIN_EMPRESA'))
                    ->first();
                if ($role) {
                    $role->givePermissionTo($perm);
                }
            }
        } finally {
            $registrar->setPermissionsTeamId($previous);
        }
    }
}
