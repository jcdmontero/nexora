<?php

namespace App\Jobs;

use App\Core\Models\Tenant;
use App\Modules\Payroll\Services\NominaService;
use App\Modules\Payroll\Models\PeriodoNomina;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class LiquidarNominaJob implements ShouldQueue
{
    use Batchable, Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 2;
    public $timeout = 300; // 5 minutes per employee batch
    public $maxExceptions = 2;

    public function __construct(
        public int $periodoId,
        public int $tenantId,
        public ?int $empleadoId = null // null = liquidar todos
    ) {
        $this->onQueue('payroll');
    }

    public function handle(NominaService $nominaService): void
    {
        // If part of a batch and batch was cancelled, stop
        if ($this->batch()?->cancelled()) {
            return;
        }

        $tenant = Tenant::find($this->tenantId);
        if (!$tenant) {
            Log::error("Tenant not found for payroll liquidation", ['tenant_id' => $this->tenantId]);
            return;
        }

        $periodo = PeriodoNomina::find($this->periodoId);
        if (!$periodo) {
            Log::error("Period not found for payroll liquidation", ['periodo_id' => $this->periodoId]);
            return;
        }

        try {
            Log::info("Starting payroll liquidation", [
                'periodo_id' => $this->periodoId,
                'tenant_id' => $this->tenantId,
                'empleado_id' => $this->empleadoId,
            ]);

            if ($this->empleadoId) {
                // Liquidate single employee
                $nominaService->liquidarEmpleado($this->empleadoId, $periodo, $tenant);
            } else {
                // Liquidate all employees in the period
                $nominaService->liquidarPeriodo($periodo, $tenant);
            }

            Log::info("Payroll liquidation completed", [
                'periodo_id' => $this->periodoId,
                'empleado_id' => $this->empleadoId,
            ]);

            // Track progress if in batch
            if ($this->batch()) {
                $this->batch()->increment('progress');
            }

        } catch (\Exception $e) {
            Log::error("Payroll liquidation failed", [
                'periodo_id' => $this->periodoId,
                'empleado_id' => $this->empleadoId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Payroll job failed permanently", [
            'periodo_id' => $this->periodoId,
            'empleado_id' => $this->empleadoId,
            'error' => $exception->getMessage(),
        ]);
    }
}
