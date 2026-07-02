<?php

namespace App\Console\Commands;

use App\Core\Helpers\CacheHelper;
use App\Core\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;

class OptimizeCache extends Command
{
    protected $signature = 'cache:optimize-all
                            {--flush : Flush all caches before warming}';

    protected $description = 'Optimize and warm all application caches';

    public function handle(): int
    {
        $this->info('Starting cache optimization...');

        if ($this->option('flush')) {
            $this->info('Flushing all caches...');
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');
            Artisan::call('event:clear');
            $this->info('All caches flushed.');
        }

        // 1. Cache configuration
        $this->info('Caching configuration...');
        Artisan::call('config:cache');
        $this->info('Configuration cached.');

        // 2. Cache routes
        $this->info('Caching routes...');
        Artisan::call('route:cache');
        $this->info('Routes cached.');

        // 3. Cache views
        $this->info('Caching views...');
        Artisan::call('view:cache');
        $this->info('Views cached.');

        // 4. Cache events
        $this->info('Caching events...');
        Artisan::call('event:cache');
        $this->info('Events cached.');

        // 5. Optimize autoloader
        $this->info('Optimizing autoloader...');
        Artisan::call('optimize');
        $this->info('Autoloader optimized.');

        // 6. Warm tenant caches
        $this->info('Warming tenant caches...');
        $tenants = Tenant::where('is_active', true)->get();

        foreach ($tenants as $tenant) {
            $this->info("  Warming cache for tenant: {$tenant->name}");
            CacheHelper::invalidateTenant($tenant->id);

            // Pre-warm active modules
            Cache::remember("tenant_{$tenant->id}_active_modules", 300, function () use ($tenant) {
                return \App\Core\Models\TenantModule::where('tenant_id', $tenant->id)
                    ->where('is_active', true)
                    ->with('module')
                    ->get();
            });

            // Pre-warm menus
            $registry = app(\App\Core\Services\ModuleRegistry::class);
            Cache::remember("tenant_{$tenant->id}_menus", 300, function () use ($registry, $tenant) {
                return $registry->getMenusForTenant($tenant);
            });
        }

        $this->info("Warmed cache for " . $tenants->count() . " tenants.");

        // 7. Display cache stats
        $stats = CacheHelper::getStats();
        $this->info('');
        $this->info('Cache Statistics:');
        $this->info("  Hits: {$stats['hits']}");
        $this->info("  Misses: {$stats['misses']}");
        $this->info("  Hit Ratio: {$stats['hit_ratio']}%");

        $this->info('');
        $this->info('Cache optimization completed successfully!');

        return Command::SUCCESS;
    }
}
