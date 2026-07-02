<?php
namespace App\Core\Providers;

use App\Core\Http\Middleware\EnsureModuleActive;
use App\Core\Http\Middleware\IdentifyTenant;
use App\Core\Services\ModuleActivator;
use App\Core\Services\ModuleRegistry;
use App\Core\Services\TenantService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class CoreServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TenantService::class);
        $this->app->singleton(ModuleRegistry::class);
        $this->app->singleton(ModuleActivator::class);

        $this->loadHelpers();
    }

    protected function loadHelpers(): void
    {
        foreach (glob(app_path('Core/helpers.php')) as $file) {
            require_once $file;
        }
    }

    public function boot(): void
    {
        $this->loadViewsFrom(resource_path('views/core'), 'core');

        // SuperAdmin omite todas las verificaciones de permisos
        Gate::before(function ($user) {
            return $user->is_superadmin ? true : null;
        });

        $router = $this->app['router'];
        $router->aliasMiddleware('tenant', IdentifyTenant::class);
        $router->aliasMiddleware('module', EnsureModuleActive::class);

        $this->loadModuleRoutes();

        // Cargar migraciones de todos los módulos dinámicamente
        foreach (glob(app_path('Modules/*/Migrations')) as $migrationPath) {
            $this->loadMigrationsFrom($migrationPath);
        }
    }

    /**
     * Carga automáticamente las rutas de cada módulo desde su carpeta Routes.
     * Las rutas existen siempre; cada módulo se protege con el middleware module:{code}.
     */
    protected function loadModuleRoutes(): void
    {
        foreach (glob(app_path('Modules/*/Routes/web.php')) as $routeFile) {
            Route::middleware(['web', 'auth'])->group($routeFile);
        }
    }
}
