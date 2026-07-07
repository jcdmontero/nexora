<?php

namespace App\Core\Http\Controllers\Auth;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Core\Services\RoleProvisioner;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\PermissionRegistrar;

class RegisteredUserController
{
    public function create()
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $slug = str($request->tenant_name)->slug('es');

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'tenant_name' => ['required', 'string', 'max:255'],
        ]);

        // Validar que el slug del tenant sea único
        if (Tenant::where('slug', $slug)->exists()) {
            return back()->withErrors([
                'tenant_name' => 'Ya existe una empresa con un nombre similar. Intenta con otro nombre.',
            ])->onlyInput('tenant_name');
        }

        $tenant = Tenant::create([
            'name' => $request->tenant_name,
            'slug' => $slug,
        ]);

        // Activar el módulo Core para la nueva empresa
        TenantModule::firstOrCreate(
            ['tenant_id' => $tenant->id, 'module_code' => 'core'],
            ['is_active' => true]
        );

        // Instanciar el catálogo de roles para la empresa
        app(RoleProvisioner::class)->provisionForTenant($tenant);

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Asignar el rol de administrador de empresa dentro del team del tenant
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
        $user->assignRole(config('roles.default_tenant_admin', 'ADMIN_EMPRESA'));

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('core.dashboard'));
    }
}
