<?php
namespace App\Core\Http\Middleware;

use App\Core\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Response;

class IdentifyTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();
        $tenant = null;

        // 1. Resolver por subdominio (producción): tenant.nexora.com
        if (!in_array($host, ['localhost', '127.0.0.1', '::1'])) {
            $segments = explode('.', $host);
            $subdomain = count($segments) >= 3 ? $segments[0] : null;

            if ($subdomain && $subdomain !== 'www' && $subdomain !== 'superadmin') {
                try {
                    // CORE-011: Cache 60s, verificar is_active siempre contra BD
                    $tenant = Cache::remember(
                        "tenant_slug_{$subdomain}",
                        60,
                        fn () => Tenant::where('slug', $subdomain)->first()
                    );

                    if (!$tenant) {
                        abort(404, 'Empresa no encontrada');
                    }

                    // Verificar estado actual en BD (no confiar en cache para is_active)
                    $isActivo = Tenant::where('id', $tenant->id)->where('is_active', true)->exists();
                    if (!$isActivo) {
                        Cache::forget("tenant_slug_{$subdomain}");
                        abort(403, 'Esta empresa está suspendida.');
                    }
                } catch (\Exception $e) {
                    abort(404, 'Error al identificar la empresa.');
                }
            }
        }

        // 2. Fallback (localhost / dev): resolver el tenant del usuario autenticado
        if (!$tenant) {
            if (Auth::check() && Auth::user()->tenant_id) {
                // Cache user's tenant for 2 minutes
                $tenant = Cache::remember(
                    "user_" . Auth::id() . "_tenant",
                    120,
                    fn () => Tenant::find(Auth::user()->tenant_id)
                );
            } elseif (Auth::guard('cliente')->check() && Auth::guard('cliente')->user()->tenant_id) {
                $tenant = Cache::remember(
                    "cliente_" . Auth::guard('cliente')->id() . "_tenant",
                    120,
                    fn () => Tenant::find(Auth::guard('cliente')->user()->tenant_id)
                );
            }
        }

        if ($tenant) {
            app()->instance('current_tenant', $tenant);
            config(['app.tenant' => $tenant]);
        }

        // Fijar el team de permisos al tenant actual (null para SuperAdmin/plataforma)
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant?->id);

        return $next($request);
    }
}
