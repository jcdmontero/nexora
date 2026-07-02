<?php
namespace App\Core\Http\Middleware;

use App\Core\Models\TenantModule;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleActive
{
    public function handle(Request $request, Closure $next, string $moduleCode): Response
    {
        /** @var \App\Core\Models\Tenant|null $tenant */
        $tenant = app()->has('current_tenant') ? app('current_tenant') : null;

        if (!$tenant) {
            return redirect()->route('core.dashboard')->with('error', 'No se detectó la empresa');
        }

        $active = Cache::remember(
            "tenant_module_{$tenant->id}_{$moduleCode}",
            3600,
            fn () => TenantModule::where('tenant_id', $tenant->id)
                ->where('module_code', $moduleCode)
                ->where('is_active', true)
                ->exists()
        );

        if (!$active) {
            return redirect()->route('core.modules.index')
                ->with('error', "El módulo \"{$moduleCode}\" no está activo. Actívalo primero.");
        }

        return $next($request);
    }
}
