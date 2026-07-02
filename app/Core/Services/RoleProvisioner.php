<?php
namespace App\Core\Services;

use App\Core\Models\Tenant;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Instancia el catálogo de roles del sistema para una empresa (team-scoped).
 * Cada empresa obtiene sus propias copias de los roles, por lo que los permisos
 * pueden configurarse de forma independiente por empresa.
 */
class RoleProvisioner
{
    public function __construct(private PermissionRegistrar $registrar)
    {
    }

    /**
     * Crea (o actualiza) los roles del catálogo para la empresa dada.
     */
    public function provisionForTenant(Tenant $tenant): void
    {
        $previous = $this->registrar->getPermissionsTeamId();
        $this->registrar->setPermissionsTeamId($tenant->id);

        foreach (config('roles.tenant', []) as $name => $permissions) {
            // Asegurar que los permisos existen (globales)
            foreach ($permissions as $perm) {
                Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
            }

            // team_id explícito (firstOrCreate no lo auto-asigna desde el registrar)
            $role = Role::query()
                ->where('team_id', $tenant->id)
                ->where('name', $name)
                ->where('guard_name', 'web')
                ->first();

            if (! $role) {
                $role = Role::create([
                    'name' => $name,
                    'guard_name' => 'web',
                    'team_id' => $tenant->id,
                ]);
            }

            $role->syncPermissions($permissions);
        }

        $this->registrar->setPermissionsTeamId($previous);
    }

    /**
     * Crea el rol global de plataforma (superadmin) con todos los permisos.
     */
    public function provisionSystemRole(): Role
    {
        $previous = $this->registrar->getPermissionsTeamId();
        $this->registrar->setPermissionsTeamId(null);

        $role = Role::firstOrCreate(['name' => config('roles.system', 'superadmin'), 'guard_name' => 'web']);
        $role->syncPermissions(Permission::all());

        $this->registrar->setPermissionsTeamId($previous);

        return $role;
    }
}
