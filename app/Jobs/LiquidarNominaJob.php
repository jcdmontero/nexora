<?php

namespace App\Jobs;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\ConfiguracionLegal;
use App\Modules\Hr\Models\Empleado;
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
    public $timeout = 300;
    public $maxExceptions = 2;

    public function __construct(
        public int $periodoId,
        public int $tenantId,
        public ?int $empleadoId = null,
    ) {
        $this->onQueue('payroll');
    }

    public function handle(NominaService $nominaService): void
    {
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
                $empleado = Empleado::find($this->empleadoId);
                if (!$empleado) {
                    Log::error("Employee not found", ['empleado_id' => $this->empleadoId]);
                    return;
                }

                $ano = (int) date('Y', strtotime($periodo->fecha_inicio));
                $configLegal = ConfiguracionLegal::where('ano_vigencia', $ano)
                    ->where('tenant_id', $this->tenantId)
                    ->first();

                if (!$configLegal) {
                    Log::error("ConfiguracionLegal not found", ['ano' => $ano, 'tenant_id' => $this->tenantId]);
                    return;
                }

                $resultado = $nominaService->liquidarEmpleado($empleado, $periodo, $configLegal);
                Log::info("Employee liquidation completed", [
                    'empleado_id' => $this->empleadoId,
                    'neto_pagar' => $resultado['resumen']['neto_pagar'],
                ]);
            } else {
                $total = $nominaService->liquidarPeriodo($periodo);
                Log::info("Period liquidation completed", [
                    'periodo_id' => $this->periodoId,
                    'total_liquidados' => $total,
                ]);
            }

            if ($this->batch()) {
                $this->batch()->increment('progress');
            }

        } catch (\Exception $e) {
            Log::error("Payroll liquidation failed", [
                'periodo_id' => $this->periodoId,
                'empleado_id' => $this->empleadoId,
                'error' => $e->getMessage(),
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
