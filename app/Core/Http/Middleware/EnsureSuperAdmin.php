<?php
namespace App\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe el acceso al Portal SuperAdmin (plataforma).
 * Solo usuarios con is_superadmin = true.
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()?->is_superadmin) {
            abort(403, 'Acceso restringido a administradores de la plataforma.');
        }

        return $next($request);
    }
}
