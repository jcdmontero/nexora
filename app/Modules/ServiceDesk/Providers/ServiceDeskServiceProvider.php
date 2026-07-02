<?php

namespace App\Modules\ServiceDesk\Providers;

use Illuminate\Support\ServiceProvider;

class ServiceDeskServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');
    }
}
