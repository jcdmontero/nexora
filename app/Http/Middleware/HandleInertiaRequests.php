<?php

namespace App\Http\Middleware;

use App\Core\Models\Configuracion;
use App\Core\Models\TenantModule;
use App\Core\Services\ModuleRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $tenant = app()->has('current_tenant') ? app('current_tenant') : null;
        $registry = app(ModuleRegistry::class);

        $activeModules = collect();
        $moduleMenus = [];

        if ($tenant) {
            try {
                // Cache active modules for 5 minutes (changes rarely)
                $activeModules = Cache::remember(
                    "tenant_{$tenant->id}_active_modules",
                    300,
                    fn () => TenantModule::where('tenant_id', $tenant->id)
                        ->where('is_active', true)
                        ->with('module')
                        ->get()
                );

                // Cache menus for 5 minutes
                $moduleMenus = Cache::remember(
                    "tenant_{$tenant->id}_menus",
                    300,
                    fn () => $registry->getMenusForTenant($tenant)
                );
            } catch (\Exception $e) {
                \Log::warning('Error al cargar módulos activos: ' . $e->getMessage());
            }
        } else {
            $moduleMenus = $registry->getAllMenus();
        }

        $user = $request->user();
        $isUserInstance = $user instanceof \App\Models\User;

        // Cache user permissions for 1 minute (reduces Spatie queries)
        $userPermissions = null;
        $userRoles = null;
        if ($user && $isUserInstance) {
            $cacheKey = "user_{$user->id}_permissions";
            $userPermissions = Cache::remember($cacheKey, 60, function () use ($user) {
                return $user->getAllPermissions()->pluck('name');
            });
            $userRoles = Cache::remember(
                "user_{$user->id}_roles",
                60,
                fn () => $user->getRoleNames()
            );
        }

        return [
            ...parent::share($request),
            'csrf_token' => csrf_token(),
            'auth' => [
                'user' => ($user && $isUserInstance) ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_superadmin' => $user->is_superadmin,
                    'roles' => $userRoles,
                    'permissions' => $userPermissions,
                ] : null,
                'cliente' => Auth::guard('cliente')->check() ? [
                    'id' => Auth::guard('cliente')->user()->id,
                    'nombres' => Auth::guard('cliente')->user()->nombres,
                    'apellidos' => Auth::guard('cliente')->user()->apellidos,
                    'nombre_completo' => Auth::guard('cliente')->user()->nombre_completo,
                    'email' => Auth::guard('cliente')->user()->email,
                ] : null,
            ],
            'tenant' => $tenant ? [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
            ] : null,
            'activeModules' => $activeModules->map(fn ($tm) => [
                'code' => $tm->module_code,
                'name' => $tm->module?->name ?? $tm->module_code,
            ]),
            'moduleMenus' => $moduleMenus,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'nuevo_recibo_id' => fn () => $request->session()->get('nuevo_recibo_id'),
            'config' => $tenant ? Configuracion::allForTenant($tenant->id) : [],
        ];
    }
}
