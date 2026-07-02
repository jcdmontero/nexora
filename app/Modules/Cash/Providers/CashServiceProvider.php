<?php

namespace App\Modules\Cash\Providers;

use Illuminate\Support\ServiceProvider;

class CashServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');
    }
}
