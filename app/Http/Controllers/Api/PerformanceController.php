<?php

namespace App\Http\Controllers\Api;

use App\Core\Helpers\CacheHelper;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class PerformanceController extends Controller
{
    public function stats(): JsonResponse
    {
        $stats = [
            'cache' => CacheHelper::getStats(),
            'redis' => $this->getRedisStats(),
            'database' => $this->getDatabaseStats(),
            'php' => $this->getPhpStats(),
            'memory' => $this->getMemoryStats(),
            'timestamp' => now()->toISOString(),
        ];

        return response()->json($stats);
    }

    public function health(): JsonResponse
    {
        $checks = [
            'redis' => $this->checkRedis(),
            'database' => $this->checkDatabase(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
        ];

        $healthy = !in_array(false, array_values($checks));

        return response()->json([
            'status' => $healthy ? 'healthy' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toISOString(),
        ], $healthy ? 200 : 503);
    }

    private function getRedisStats(): array
    {
        try {
            $redis = Redis::connection()->getClient();
            $info = $redis->info();

            return [
                'connected' => true,
                'connected_clients' => $info['connected_clients'] ?? 0,
                'used_memory' => $this->formatBytes($info['used_memory'] ?? 0),
                'peak_memory' => $this->formatBytes($info['used_memory_peak'] ?? 0),
                'total_commands' => $info['total_commands_processed'] ?? 0,
                'ops_per_second' => $info['instantaneous_ops_per_sec'] ?? 0,
                'hit_rate' => $this->calculateHitRate($info),
            ];
        } catch (\Exception $e) {
            return [
                'connected' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function getDatabaseStats(): array
    {
        try {
            $dbConfig = config('database.connections.' . config('database.default'));

            return [
                'connected' => true,
                'driver' => $dbConfig['driver'] ?? 'unknown',
                'database' => $dbConfig['database'] ?? 'unknown',
                'active_connections' => DB::select('SELECT count(*) as count FROM pg_stat_activity WHERE state = ? AND datname = ?', ['active', $dbConfig['database']])[0]->count ?? 0,
            ];
        } catch (\Exception $e) {
            return [
                'connected' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    private function getPhpStats(): array
    {
        $stats = [
            'version' => PHP_VERSION,
            'sapi' => php_sapi_name(),
            'opcache_enabled' => function_exists('opcache_get_status') && opcache_get_status(false)['opcache_enabled'] ?? false,
        ];

        if ($stats['opcache_enabled']) {
            $opcache = opcache_get_status(false);
            $stats['opcache'] = [
                'memory_used' => $this->formatBytes($opcache['memory_usage']['used_memory'] ?? 0),
                'memory_free' => $this->formatBytes($opcache['memory_usage']['free_memory'] ?? 0),
                'hits' => $opcache['opcache_statistics']['hits'] ?? 0,
                'misses' => $opcache['opcache_statistics']['misses'] ?? 0,
                'hit_rate' => $this->calculateOpcacheHitRate($opcache),
            ];
        }

        return $stats;
    }

    private function getMemoryStats(): array
    {
        return [
            'current' => $this->formatBytes(memory_get_usage(true)),
            'peak' => $this->formatBytes(memory_get_peak_usage(true)),
            'limit' => ini_get('memory_limit'),
        ];
    }

    private function checkRedis(): bool
    {
        try {
            Redis::ping();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function checkDatabase(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function checkCache(): bool
    {
        try {
            $key = 'health_check_' . time();
            cache()->set($key, true, 10);
            return cache()->get($key) === true;
        } catch (\Exception $e) {
            return false;
        }
    }

    private function checkQueue(): bool
    {
        try {
            // Check if queue connection is configured
            return config('queue.default') !== 'sync';
        } catch (\Exception $e) {
            return false;
        }
    }

    private function formatBytes(float $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= 1 << (10 * $pow);
        return round($bytes, 2) . ' ' . $units[$pow];
    }

    private function calculateHitRate(array $info): string
    {
        $hits = $info['keyspace_hits'] ?? 0;
        $misses = $info['keyspace_misses'] ?? 0;
        $total = $hits + $misses;

        if ($total === 0) {
            return 'N/A';
        }

        return round(($hits / $total) * 100, 2) . '%';
    }

    private function calculateOpcacheHitRate(array $opcache): string
    {
        $hits = $opcache['opcache_statistics']['hits'] ?? 0;
        $misses = $opcache['opcache_statistics']['misses'] ?? 0;
        $total = $hits + $misses;

        if ($total === 0) {
            return 'N/A';
        }

        return round(($hits / $total) * 100, 2) . '%';
    }
}
