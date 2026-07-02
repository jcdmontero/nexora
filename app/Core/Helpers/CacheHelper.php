<?php

namespace App\Core\Helpers;

use Illuminate\Support\Facades\Cache;

class CacheHelper
{
    /**
     * Invalidate all caches for a specific tenant
     */
    public static function invalidateTenant(int $tenantId): void
    {
        // Invalidate active modules cache
        Cache::forget("tenant_{$tenantId}_active_modules");

        // Invalidate menus cache
        Cache::forget("tenant_{$tenantId}_menus");

        // Invalidate configuration cache
        Cache::forget("tenant_{$tenantId}_config");

        // Invalidate dashboard caches
        self::invalidateDashboard($tenantId);
    }

    /**
     * Invalidate dashboard caches for a tenant
     */
    public static function invalidateDashboard(int $tenantId): void
    {
        Cache::forget("tenant_{$tenantId}_dashboard_stats");
        Cache::forget("tenant_{$tenantId}_dashboard_revenue");
        Cache::forget("tenant_{$tenantId}_dashboard_activity");
        Cache::forget("tenant_{$tenantId}_dashboard_alerts");
    }

    /**
     * Invalidate user-specific caches
     */
    public static function invalidateUser(int $userId): void
    {
        Cache::forget("user_{$userId}_permissions");
        Cache::forget("user_{$userId}_roles");
        Cache::forget("user_{$userId}_tenant");
    }

    /**
     * Invalidate all caches for a tenant (complete reset)
     */
    public static function flushTenant(int $tenantId): void
    {
        self::invalidateTenant($tenantId);

        // Flush all tenant-related cache keys
        $keys = Cache::getRedis()->keys("nexora-*tenant_{$tenantId}*");
        if ($keys) {
            Cache::getRedis()->del($keys);
        }
    }

    /**
     * Get cache statistics
     */
    public static function getStats(): array
    {
        $stats = [
            'hits' => 0,
            'misses' => 0,
            'hit_ratio' => 0,
        ];

        try {
            $redis = Cache::getRedis();
            $info = $redis->info('stats');

            $stats['hits'] = $info['keyspace_hits'] ?? 0;
            $stats['misses'] = $info['keyspace_misses'] ?? 0;

            if ($stats['hits'] + $stats['misses'] > 0) {
                $stats['hit_ratio'] = round(
                    ($stats['hits'] / ($stats['hits'] + $stats['misses'])) * 100,
                    2
                );
            }
        } catch (\Exception $e) {
            // Redis not available
        }

        return $stats;
    }
}
