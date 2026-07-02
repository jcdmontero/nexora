<?php

namespace App\Jobs;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Services\CierreAnualService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CerrarAnioContableJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1; // Only try once - manual intervention needed on failure
    public $timeout = 600; // 10 minutes
    public $maxExceptions = 1;

    public function __construct(
        public int $anio,
        public int $tenantId,
        public int $userId // User who initiated the closure
    ) {
        $this->onQueue('accounting');
    }

    public function handle(CierreAnualService $cierreService): void
    {
        $tenant = Tenant::find($this->tenantId);
        if (!$tenant) {
            Log::error("Tenant not found for annual closure", ['tenant_id' => $this->tenantId]);
            return;
        }

        try {
            Log::info("Starting annual accounting closure", [
                'anio' => $this->anio,
                'tenant_id' => $this->tenantId,
                'user_id' => $this->userId,
            ]);

            $result = $cierreService->cerrarAnio($this->anio, $tenant);

            Log::info("Annual accounting closure completed", [
                'anio' => $this->anio,
                'result' => $result,
            ]);

            // Notify user via notification service
            \App\Jobs\EnviarNotificacionJob::dispatch(
                'email',
                auth()->user()->email ?? 'admin@nexora.com',
                "Cierre Anual {$this->anio} Completado",
                "El cierre contable del año {$this->anio} se ha completado exitosamente.",
                ['anio' => $this->anio, 'tenant' => $tenant->name],
                $this->tenantId
            )->onQueue('notifications');

        } catch (\Exception $e) {
            Log::error("Annual closure failed", [
                'anio' => $this->anio,
                'tenant_id' => $this->tenantId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Notify user of failure
            \App\Jobs\EnviarNotificacionJob::dispatch(
                'email',
                auth()->user()->email ?? 'admin@nexora.com',
                "Error en Cierre Anual {$this->anio}",
                "El cierre contable del año {$this->anio} ha fallado: {$e->getMessage()}",
                ['error' => $e->getMessage()],
                $this->tenantId
            )->onQueue('notifications');

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Annual closure job failed permanently", [
            'anio' => $this->anio,
            'tenant_id' => $this->tenantId,
            'error' => $exception->getMessage(),
        ]);
    }
}
