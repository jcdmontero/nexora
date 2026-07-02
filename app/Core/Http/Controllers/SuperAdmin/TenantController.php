<?php
namespace App\Core\Http\Controllers\SuperAdmin;

use App\Core\Models\Module;
use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Core\Services\ModuleActivator;
use App\Core\Services\RoleProvisioner;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\PermissionRegistrar;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::withCount('users')
            ->with('activeModules')
            ->orderBy('name')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
                'email' => $t->email,
                'is_active' => $t->is_active,
                'plan' => $t->plan,
                'users_count' => $t->users_count,
                'modulos_count' => $t->activeModules->where('module_code', '!=', 'core')->count(),
            ]);

        return Inertia::render('SuperAdmin/Tenants/Index', [
            'tenants' => $tenants,
        ]);
    }

    public function create()
    {
        return Inertia::render('SuperAdmin/Tenants/Create', [
            'modulosDisponibles' => $this->moduleCatalog(),
        ]);
    }

    public function store(Request $request, RoleProvisioner $provisioner, ModuleActivator $activator)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:tenants,slug'],
            'email' => ['nullable', 'email', 'max:255'],
            'plan' => ['nullable', 'string', 'max:100'],
            'modulos' => ['array'],
            'modulos.*' => ['string', 'exists:modules,code'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'unique:users,email'],
            'admin_password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $tenant = Tenant::create([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'email' => $data['email'] ?? null,
            'plan' => $data['plan'] ?? null,
            'is_active' => true,
        ]);

        // Roles del catálogo para la empresa
        $provisioner->provisionForTenant($tenant);

        // Activar módulos vendidos (core + seleccionados, con dependencias)
        $activator->syncModules($tenant, $data['modulos'] ?? []);

        // Crear el administrador de la empresa
        $admin = User::create([
            'tenant_id' => $tenant->id,
            'name' => $data['admin_name'],
            'email' => $data['admin_email'],
            'password' => Hash::make($data['admin_password']),
            'is_active' => true,
        ]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
        $admin->assignRole(config('roles.default_tenant_admin', 'ADMIN_EMPRESA'));

        return redirect()->route('superadmin.tenants.index')
            ->with('success', "Empresa \"{$tenant->name}\" creada con sus módulos y administrador.");
    }

    public function edit(Tenant $tenant)
    {
        $activos = TenantModule::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->pluck('module_code')
            ->all();

        return Inertia::render('SuperAdmin/Tenants/Edit', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'email' => $tenant->email,
                'plan' => $tenant->plan,
                'is_active' => $tenant->is_active,
            ],
            'modulosDisponibles' => $this->moduleCatalog(),
            'modulosActivos' => $activos,
        ]);
    }

    public function update(Request $request, Tenant $tenant, ModuleActivator $activator)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:tenants,slug,' . $tenant->id],
            'email' => ['nullable', 'email', 'max:255'],
            'plan' => ['nullable', 'string', 'max:100'],
            'is_active' => ['boolean'],
            'modulos' => ['array'],
            'modulos.*' => ['string', 'exists:modules,code'],
        ]);

        $tenant->update([
            'name' => $data['name'],
            'slug' => $data['slug'],
            'email' => $data['email'] ?? null,
            'plan' => $data['plan'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        $activator->syncModules($tenant, $data['modulos'] ?? []);

        return redirect()->route('superadmin.tenants.index')
            ->with('success', "Empresa \"{$tenant->name}\" actualizada.");
    }

    public function toggleActive(Tenant $tenant)
    {
        $activando = !$tenant->is_active;

        $usuariosActivos = User::where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->count();

        $tenant->update(['is_active' => $activando]);

        if ($activando) {
            $mensaje = "Empresa \"{$tenant->name}\" reactivada. {$usuariosActivos} usuario(s) recuperan acceso.";
        } else {
            $mensaje = "Empresa \"{$tenant->name}\" suspendida. {$usuariosActivos} usuario(s) perderán acceso inmediatamente.";
        }

        return redirect()->route('superadmin.tenants.index')->with('success', $mensaje);
    }

    private function moduleCatalog()
    {
        return Module::where('code', '!=', 'core')
            ->publicado()
            ->orderBy('name')
            ->get()
            ->map(fn ($m) => [
                'code' => $m->code,
                'name' => $m->name,
                'description' => $m->description,
                'dependencies' => $m->dependencies ?? [],
            ]);
    }
}
