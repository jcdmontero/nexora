<?php

use App\Core\Http\Middleware\EnsureModuleActive;
use App\Core\Http\Middleware\IdentifyTenant;
use App\Core\Providers\CoreServiceProvider;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // IdentifyTenant se agrega DESPUÉS de StartSession para poder resolver
        // el tenant del usuario autenticado cuando no hay subdominio (localhost).
        $middleware->appendToGroup('web', IdentifyTenant::class);
        $middleware->appendToGroup('web', HandleInertiaRequests::class);
        $middleware->appendToGroup('web', AddLinkHeadersForPreloadedAssets::class);
        $middleware->alias([
            'tenant' => IdentifyTenant::class,
            'module' => EnsureModuleActive::class,
            'superadmin' => \App\Core\Http\Middleware\EnsureSuperAdmin::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);

        // Redirigir según el contexto de la petición
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->is('portal') || $request->is('portal/*')) {
                return route('portal.login');
            }
            return route('core.login');
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })
    ->create();
