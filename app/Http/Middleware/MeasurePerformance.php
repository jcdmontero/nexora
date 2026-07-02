<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class MeasurePerformance
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage(true);

        $response = $next($request);

        $endTime = microtime(true);
        $endMemory = memory_get_usage(true);

        $executionTime = round(($endTime - $startTime) * 1000, 2); // ms
        $memoryUsed = round(($endMemory - $startMemory) / 1024 / 1024, 2); // MB
        $queryCount = DB::getQueryLog() ? count(DB::getQueryLog()) : 0;

        // Add performance headers
        $response->headers->set('X-Response-Time', $executionTime . 'ms');
        $response->headers->set('X-Memory-Used', $memoryUsed . 'MB');
        $response->headers->set('X-Query-Count', (string) $queryCount);

        // Log slow requests (> 500ms)
        if ($executionTime > 500) {
            Log::warning('Slow request detected', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'execution_time' => $executionTime . 'ms',
                'memory_used' => $memoryUsed . 'MB',
                'query_count' => $queryCount,
                'ip' => $request->ip(),
            ]);
        }

        // Log to performance file for monitoring
        if (config('app.env') === 'production') {
            Log::channel('performance')->info('Request performance', [
                'method' => $request->method(),
                'path' => $request->path(),
                'status' => $response->getStatusCode(),
                'time' => $executionTime,
                'memory' => $memoryUsed,
                'queries' => $queryCount,
            ]);
        }

        return $response;
    }
}
