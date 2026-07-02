<?php

namespace App\Console\Commands;

use App\Core\Helpers\CacheHelper;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class PerformanceReport extends Command
{
    protected $signature = 'performance:report
                            {--clear-stats : Clear performance statistics}';

    protected $description = 'Generate performance report and statistics';

    public function handle(): int
    {
        $this->info('Generating performance report...');
        $this->info('');

        // 1. Cache Statistics
        $this->info('=== CACHE STATISTICS ===');
        $cacheStats = CacheHelper::getStats();
        $this->info("  Cache Hits: {$cacheStats['hits']}");
        $this->info("  Cache Misses: {$cacheStats['misses']}");
        $this->info("  Hit Ratio: {$cacheStats['hit_ratio']}%");
        $this->info('');

        // 2. Redis Statistics
        $this->info('=== REDIS STATISTICS ===');
        try {
            $redis = Redis::connection()->getClient();
            $info = $redis->info();

            $this->info("  Connected Clients: {$info['connected_clients']}");
            $this->info("  Used Memory: " . $this->formatBytes($info['used_memory']));
            $this->info("  Peak Memory: " . $this->formatBytes($info['used_memory_peak']));
            $this->info("  Total Commands: {$info['total_commands_processed']}");
            $this->info("  Ops Per Second: {$info['instantaneous_ops_per_sec']}");
            $this->info("  Hit Rate: " . $this->calculateHitRate($info));
        } catch (\Exception $e) {
            $this->error("  Redis not available: {$e->getMessage()}");
        }
        $this->info('');

        // 3. Database Statistics
        $this->info('=== DATABASE STATISTICS ===');
        try {
            $queryCount = DB::select('SELECT count(*) as count FROM pg_stat_activity WHERE state = ? AND datname = ?', ['active', config('database.connections.pgsql.database')]);
            $this->info("  Active Connections: {$queryCount[0]->count}");

            $tableStats = DB::select('SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||\'.\'||tablename)) as size FROM pg_stat_user_tables ORDER BY pg_total_relation_size(schemaname||\'.\'||tablename) DESC LIMIT 10');
            $this->info('  Top 10 Tables by Size:');
            foreach ($tableStats as $table) {
                $this->info("    {$table->tablename}: {$table->size}");
            }
        } catch (\Exception $e) {
            $this->error("  Database not available: {$e->getMessage()}");
        }
        $this->info('');

        // 4. PHP OPcache Statistics
        $this->info('=== OPCACHE STATISTICS ===');
        if (function_exists('opcache_get_status')) {
            $status = opcache_get_status(false);
            if ($status) {
                $this->info("  OPcache Enabled: " . ($status['opcache_enabled'] ? 'Yes' : 'No'));
                $this->info("  Memory Used: " . $this->formatBytes($status['memory_usage']['used_memory']));
                $this->info("  Memory Free: " . $this->formatBytes($status['memory_usage']['free_memory']));
                $this->info("  Interned Strings: " . $this->formatBytes($status['interned_strings_usage']['used_memory']));
                $this->info("  Hits: {$status['opcache_statistics']['hits']}");
                $this->info("  Misses: {$status['opcache_statistics']['misses']}");
                $this->info("  Hit Rate: " . round(($status['opcache_statistics']['hits'] / max(1, $status['opcache_statistics']['hits'] + $status['opcache_statistics']['misses'])) * 100, 2) . "%");
            }
        } else {
            $this->error('  OPcache not available');
        }
        $this->info('');

        // 5. Memory Usage
        $this->info('=== MEMORY USAGE ===');
        $this->info("  Current: " . $this->formatBytes(memory_get_usage(true)));
        $this->info("  Peak: " . $this->formatBytes(memory_get_peak_usage(true)));
        $this->info('');

        // 6. Slow Query Log (last 10)
        $this->info('=== RECENT SLOW QUERIES ===');
        try {
            $slowQueries = DB::select('SELECT query, calls, mean_time, total_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10');
            foreach ($slowQueries as $query) {
                $this->info("  [{$query->mean_time}ms] " . substr($query->query, 0, 100));
            }
        } catch (\Exception $e) {
            $this->info('  pg_stat_statements not available');
        }
        $this->info('');

        $this->info('Performance report completed.');

        return Command::SUCCESS;
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
}
