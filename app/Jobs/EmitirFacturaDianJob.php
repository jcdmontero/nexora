<?php

namespace App\Jobs;

use App\Core\Models\Tenant;
use App\Modules\Sales\Services\ElectronicBilling\DianService;
use App\Modules\Sales\Models\Factura;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EmitirFacturaDianJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 120; // 2 minutes max
    public $maxExceptions = 3;
    public $backoff = [30, 60, 90]; // seconds between retries

    public function __construct(
        public int $facturaId,
        public int $tenantId,
        public bool $retry = false
    ) {
        $this->onQueue('dian');
    }

    public function handle(DianService $dianService): void
    {
        $tenant = Tenant::find($this->tenantId);
        if (!$tenant) {
            Log::error("Tenant not found for DIAN job", ['tenant_id' => $this->tenantId]);
            return;
        }

        $factura = Factura::find($this->facturaId);
        if (!$factura) {
            Log::error("Factura not found for DIAN job", ['factura_id' => $this->facturaId]);
            return;
        }

        if ($factura->dian_status === 'aceptado') {
            Log::info("Factura already accepted by DIAN", ['factura_id' => $this->facturaId]);
            return;
        }

        try {
            Log::info("Starting DIAN emission", [
                'factura_id' => $this->facturaId,
                'tenant_id' => $this->tenantId,
                'numero' => $factura->numero,
            ]);

            $result = $dianService->emitir($factura, $tenant);

            if ($result['success']) {
                Log::info("DIAN emission successful", [
                    'factura_id' => $this->facturaId,
                    'cude' => $result['cude'] ?? null,
                ]);
            } else {
                Log::error("DIAN emission failed", [
                    'factura_id' => $this->facturaId,
                    'error' => $result['error'] ?? 'Unknown error',
                ]);

                // Mark as failed for manual retry
                $factura->update([
                    'dian_status' => 'error',
                    'dian_error' => $result['error'] ?? 'Error desconocido en emisión DIAN',
                ]);
            }
        } catch (\Exception $e) {
            Log::error("DIAN emission exception", [
                'factura_id' => $this->facturaId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Re-throw to trigger retry
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("DIAN job failed permanently", [
            'factura_id' => $this->facturaId,
            'tenant_id' => $this->tenantId,
            'error' => $exception->getMessage(),
        ]);

        // Update factura status
        $factura = Factura::find($this->facturaId);
        if ($factura) {
            $factura->update([
                'dian_status' => 'error',
                'dian_error' => 'Error permanente en emisión DIAN: ' . $exception->getMessage(),
            ]);
        }
    }
}
