<?php

namespace App\Modules\Accounting\Providers;

use App\Modules\Accounting\Console\CambiarRegimen;
use App\Modules\Accounting\Console\SeedLibrosContables;
use Illuminate\Support\ServiceProvider;

class AccountingServiceProvider extends ServiceProvider
{
    /**
     * Register any module services.
     */
    public function register(): void
    {
        // Registrar bindings de servicios si es necesario
        $this->app->singleton(\App\Modules\Accounting\Services\ContabilidadService::class);
    }

    /**
     * Bootstrap any module services.
     */
    public function boot(): void
    {
        // Cargar migraciones del módulo
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');

        // Registrar comandos
        if ($this->app->runningInConsole()) {
            $this->commands([
                SeedLibrosContables::class,
                CambiarRegimen::class,
            ]);
        }

        // Las rutas se cargan de forma centralizada en CoreServiceProvider::loadModuleRoutes()
        // (glob de Modules/*/Routes/web.php). No volver a cargarlas aquí: duplicaría las rutas.
    }
}
