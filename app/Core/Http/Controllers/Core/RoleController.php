<?php
namespace App\Core\Http\Controllers\Core;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    public function index()
    {
        $tid = tenantId();

        $roles = Role::where('team_id', $tid)
            ->with('permissions')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'permissions' => $r->permissions->pluck('name'),
            ]);

        $catalog = array_keys(config('roles.tenant', []));
        $existing = $roles->pluck('name')->all();
        $availableToAdd = array_values(array_diff($catalog, $existing));

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'allPermissions' => Permission::orderBy('name')->pluck('name'),
            'availableToAdd' => $availableToAdd,
        ]);
    }

    public function store(Request $request)
    {
        $catalog = array_keys(config('roles.tenant', []));

        $request->validate([
            'name' => ['required', 'string', 'in:' . implode(',', $catalog)],
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        $tid = tenantId();

        $exists = Role::where('team_id', $tid)->where('name', $request->name)->exists();
        if ($exists) {
            return redirect()->route('core.roles.index')
                ->with('error', "El rol \"{$request->name}\" ya existe en esta empresa.");
        }

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => 'web',
            'team_id' => $tid,
        ]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($tid);
        $role->syncPermissions($request->permissions ?? []);

        return redirect()->route('core.roles.index')
            ->with('success', "Rol \"{$role->name}\" agregado correctamente.");
    }

    public function update(Request $request, Role $role)
    {
        $request->validate([
            'permissions' => ['array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($role->team_id);
        $role->syncPermissions($request->permissions ?? []);

        return redirect()->route('core.roles.index')
            ->with('success', "Permisos del rol \"{$role->name}\" actualizados.");
    }

    public function destroy(Role $role)
    {
        if (in_array($role->name, [config('roles.system', 'superadmin'), config('roles.default_tenant_admin', 'ADMIN_EMPRESA')])) {
            return redirect()->route('core.roles.index')
                ->with('error', "El rol \"{$role->name}\" no se puede eliminar.");
        }

        $role->delete();

        return redirect()->route('core.roles.index')
            ->with('success', 'Rol eliminado.');
    }
}
