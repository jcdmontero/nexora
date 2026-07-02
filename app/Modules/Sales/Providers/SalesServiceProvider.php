<?php

namespace App\Modules\Sales\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Sales\Services\ElectronicBilling\SignatureProviderInterface;
use App\Modules\Sales\Services\ElectronicBilling\DianProviderInterface;
use App\Modules\Sales\Services\ElectronicBilling\XmlUBLGenerator;
use App\Modules\Sales\Services\ElectronicBilling\Providers\MockSignatureProvider;
use App\Modules\Sales\Services\ElectronicBilling\Providers\MockDianProvider;
use App\Modules\Sales\Services\ElectronicBilling\Providers\RealDianProvider;
use App\Modules\Sales\Services\ElectronicBilling\XmlSigner;

class SalesServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->registerElectronicBillingBindings();
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');
    }

    private function registerElectronicBillingBindings(): void
    {
        // Always bind the UBL generator (stateless, no external dependencies)
        $this->app->singleton(XmlUBLGenerator::class);

        // Resolve provider mode from config
        $providerMode = config('dian.provider', 'mock');

        if ($providerMode === 'real') {
            $this->app->bind(DianProviderInterface::class, RealDianProvider::class);
            $this->app->bind(SignatureProviderInterface::class, XmlSigner::class);
        } else {
            $this->app->bind(DianProviderInterface::class, MockDianProvider::class);
            $this->app->bind(SignatureProviderInterface::class, MockSignatureProvider::class);
        }
    }
}
