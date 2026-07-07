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

        if ($factura->dian_estado === 'aceptado') {
            Log::info("Factura already accepted by DIAN", ['factura_id' => $this->facturaId]);
            return;
        }

        try {
            Log::info("Starting DIAN emission", [
                'factura_id' => $this->facturaId,
                'tenant_id' => $this->tenantId,
                'numero' => $factura->numero,
            ]);

            app()->instance('current_tenant', $tenant);

            $empresa = [
                'nit' => \App\Core\Models\Configuracion::get('nit', '', $this->tenantId),
                'razon_social' => \App\Core\Models\Configuracion::get('nombre_empresa', $tenant->name, $this->tenantId),
                'direccion' => \App\Core\Models\Configuracion::get('direccion', '', $this->tenantId),
                'ciudad_codigo' => \App\Core\Models\Configuracion::get('dian_ciudad_codigo', '11001', $this->tenantId),
                'pais' => 'CO',
            ];

            $dianService->emitirFactura($factura, $empresa);

            Log::info("DIAN emission successful", [
                'factura_id' => $this->facturaId,
                'cude' => $factura->cufe ?? null,
            ]);
        } catch (\Exception $e) {
            Log::error("DIAN emission failed", [
                'factura_id' => $this->facturaId,
                'error' => $e->getMessage(),
            ]);

            $factura->update([
                'dian_estado' => 'error',
                'dian_mensaje' => $e->getMessage(),
            ]);

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
                'dian_estado' => 'error',
                'dian_mensaje' => 'Error permanente en emisión DIAN: ' . $exception->getMessage(),
            ]);
        }
    }
}
