<?php

namespace App\Modules\Inventory\Providers;

use Illuminate\Support\ServiceProvider;

class InventoryServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');

        // Las rutas se cargan de forma centralizada en CoreServiceProvider::loadModuleRoutes()
        // (glob de Modules/*/Routes/web.php). No volver a cargarlas aquí: duplicaría las rutas
        // con un prefijo extra (inventario/inventory/...).
    }
}
