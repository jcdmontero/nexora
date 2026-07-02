<?php

namespace App\Modules\Hr\Services;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\ConfiguracionLegal;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class HrProvisioner
{
    /**
     * Siembra datos iniciales de RRHH para un tenant:
     * - Configuración legal por defecto (año actual)
     * - Entidades parafiscales por defecto (EPS, ARL, AFP, CCF)
     * - Permisos extra de RRHH
     */
    public function provisionForTenant(Tenant $tenant): void
    {
        $tenantId = $tenant->id;

        // ─── Configuración legal por defecto (año actual) ───
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

        // ─── Entidades parafiscales por defecto ───
        $entidades = [
            // EPS - Salud
            ['nombre' => 'Sura EPS', 'tipo_entidad' => 'EPS', 'nit' => '800251149-1', 'activo' => true],
            ['nombre' => 'Nueva EPS', 'tipo_entidad' => 'EPS', 'nit' => '900226827-1', 'activo' => true],
            ['nombre' => 'Sanitas EPS', 'tipo_entidad' => 'EPS', 'nit' => '800251269-8', 'activo' => true],
            ['nombre' => 'Coomeva EPS', 'tipo_entidad' => 'EPS', 'nit' => '800252184-6', 'activo' => true],
            ['nombre' => 'Compensar EPS', 'tipo_entidad' => 'EPS', 'nit' => '860012384-5', 'activo' => true],

            // AFP - Pensiones
            ['nombre' => 'Porvenir', 'tipo_entidad' => 'AFP', 'nit' => '800131477-0', 'activo' => true],
            ['nombre' => 'Protección', 'tipo_entidad' => 'AFP', 'nit' => '800144331-1', 'activo' => true],
            ['nombre' => 'Colfondos', 'tipo_entidad' => 'AFP', 'nit' => '800224362-7', 'activo' => true],
            ['nombre' => 'Colpensiones', 'tipo_entidad' => 'AFP', 'nit' => '899999001-1', 'activo' => true],

            // ARL
            ['nombre' => 'Sura ARL', 'tipo_entidad' => 'ARL', 'nit' => '800251149-1', 'activo' => true],
            ['nombre' => 'Positiva ARL', 'tipo_entidad' => 'ARL', 'nit' => '800130753-1', 'activo' => true],
            ['nombre' => 'Colmena ARL', 'tipo_entidad' => 'ARL', 'nit' => '800252099-1', 'activo' => true],
            ['nombre' => 'Bolívar ARL', 'tipo_entidad' => 'ARL', 'nit' => '860012987-8', 'activo' => true],

            // CCF - Cajas de Compensación
            ['nombre' => 'Compensar', 'tipo_entidad' => 'CCF', 'nit' => '860012384-5', 'activo' => true],
            ['nombre' => 'Colsubsidio', 'tipo_entidad' => 'CCF', 'nit' => '860002573-5', 'activo' => true],
            ['nombre' => 'Cafam', 'tipo_entidad' => 'CCF', 'nit' => '860005225-8', 'activo' => true],
            ['nombre' => 'Comfama', 'tipo_entidad' => 'CCF', 'nit' => '890900452-8', 'activo' => true],
            ['nombre' => 'Comfandi', 'tipo_entidad' => 'CCF', 'nit' => '890901315-2', 'activo' => true],
        ];

        foreach ($entidades as $data) {
            $data['tenant_id'] = $tenantId;
            \App\Modules\Hr\Models\EntidadParafiscal::firstOrCreate(
                ['tenant_id' => $tenantId, 'nombre' => $data['nombre']],
                $data
            );
        }

        // ─── Permisos extra a ADMIN_EMPRESA ───
        $registrar = app(PermissionRegistrar::class);
        $previous = $registrar->getPermissionsTeamId();
        $registrar->setPermissionsTeamId($tenantId);

        $extraPerms = ['hr:edit', 'hr:delete'];
        foreach ($extraPerms as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
            $role = Role::where('team_id', $tenantId)
                ->where('name', config('roles.default_tenant_admin', 'ADMIN_EMPRESA'))
                ->first();
            if ($role) {
                $role->givePermissionTo($permName);
            }
        }

        $registrar->setPermissionsTeamId($previous);
    }
}
