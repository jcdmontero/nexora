<?php
namespace App\Core\Http\Controllers\Core;

use App\Models\User;
use App\Core\Models\Sede;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UserController extends Controller
{
    public function index()
    {
        $t = tenant();

        if (!$t && !auth()->user()?->isSuperAdmin()) {
            return redirect()->route('core.login')->with('error', 'Debes iniciar sesión en una empresa');
        }

        return Inertia::render('Users/Index', [
            'users' => Inertia::defer(fn () => User::when($t, fn ($q) => $q->where('tenant_id', $t->id))
                ->get()
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'is_active' => $u->is_active,
                    'roles' => $u->getRoleNames(),
                ])),
        ]);
    }

    public function create()
    {
        return Inertia::render('Users/Create', [
            'roles' => Role::where('team_id', tenantId())->get(['id', 'name']),
            'sedes' => Sede::where('activo', true)->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        $t = tenant();
        
        if (!$t && !auth()->user()?->isSuperAdmin()) {
            return redirect()->route('core.login')->with('error', 'Debes iniciar sesión en una empresa');
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => ['required', 'string', 'exists:roles,name'],
            'sede_id' => ['nullable', 'exists:core_sedes,id'],
        ]);

        $attrs = [
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'sede_id' => $request->sede_id,
            'is_active' => true,
        ];

        if ($t) {
            $user = $t->users()->create($attrs);
        } else {
            $user = User::create($attrs);
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId(tenantId());
        $user->assignRole($request->role);

        return redirect()->route('core.users.index')
            ->with('success', 'Usuario creado correctamente.');
    }

    public function edit(User $user)
    {
        $t = tenant();
        if ($t && (int) $user->tenant_id !== (int) $t->id) {
            abort(403);
        }

        $user->load('roles', 'sede');
        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => Role::where('team_id', tenantId())->get(['id', 'name']),
            'sedes' => Sede::where('activo', true)->get(['id', 'nombre']),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $t = tenant();
        if ($t && (int) $user->tenant_id !== (int) $t->id) {
            abort(403);
        }

        // No permitir que un usuario se desactive a sí mismo
        if ((int) $user->id === (int) auth()->id() && $request->boolean('is_active') === false) {
            return back()->with('error', 'No puedes desactivar tu propia cuenta.');
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email,' . $user->id],
            'role' => ['required', 'string', 'exists:roles,name'],
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        $user->update($request->only('name', 'email', 'is_active'));

        if ($request->filled('password')) {
            $user->update(['password' => bcrypt($request->password)]);
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId(tenantId());
        $user->syncRoles([$request->role]);

        return redirect()->route('core.users.index')
            ->with('success', 'Usuario actualizado.');
    }

    public function destroy(User $user)
    {
        $t = tenant();
        if ($t && (int) $user->tenant_id !== (int) $t->id) {
            abort(403);
        }

        // No permitir eliminarse a sí mismo
        if ((int) $user->id === (int) auth()->id()) {
            return back()->with('error', 'No puedes eliminar tu propia cuenta.');
        }

        // No permitir eliminar el último admin del tenant
        if ($t && $user->hasRole('ADMIN_EMPRESA')) {
            $adminCount = User::where('tenant_id', $t->id)
                ->whereHas('roles', fn ($q) => $q->where('name', 'ADMIN_EMPRESA'))
                ->count();
            if ($adminCount <= 1) {
                return back()->with('error', 'No se puede eliminar el último administrador de la empresa.');
            }
        }

        $user->delete();

        return redirect()->route('core.users.index')
            ->with('success', 'Usuario eliminado.');
    }
}
