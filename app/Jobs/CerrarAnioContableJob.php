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

    public $tries = 1;
    public $timeout = 600;
    public $maxExceptions = 1;

    public function __construct(
        public int $anio,
        public int $tenantId,
        public int $userId,
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

            $result = $cierreService->cerrarAnio($this->anio);

            Log::info("Annual accounting closure completed", [
                'anio' => $this->anio,
                'asiento' => $result['asiento_numero'] ?? null,
                'utilidad_neta' => $result['utilidad_neta'] ?? null,
            ]);

            \App\Jobs\EnviarNotificacionJob::dispatch(
                $this->crearNotificacionId(
                    'Cierre Anual Completado',
                    "El cierre contable del año {$this->anio} se completado exitosamente. Asiento: {$result['asiento_numero']}",
                    $this->tenantId,
                ),
                'email',
            )->onQueue('notifications');

        } catch (\Exception $e) {
            Log::error("Annual closure failed", [
                'anio' => $this->anio,
                'tenant_id' => $this->tenantId,
                'error' => $e->getMessage(),
            ]);

            \App\Jobs\EnviarNotificacionJob::dispatch(
                $this->crearNotificacionId(
                    "Error en Cierre Anual {$this->anio}",
                    "El cierre contable del año {$this->anio} ha fallado: {$e->getMessage()}",
                    $this->tenantId,
                ),
                'email',
            )->onQueue('notifications');

            throw $e;
        }
    }

    private function crearNotificacionId(string $asunto, string $mensaje, int $tenantId): int
    {
        $user = \App\Models\User::find($this->userId);
        $noti = \App\Modules\Notifications\Models\Notificacion::create([
            'tenant_id' => $tenantId,
            'evento' => 'cierre_anual',
            'destinatario_nombre' => $user?->name ?? 'Admin',
            'destinatario_email' => $user?->email ?? 'admin@nexora.com',
            'titulo' => $asunto,
            'mensaje' => $mensaje,
            'canales' => ['email'],
            'canal_estados' => ['email' => 'pendiente'],
            'estado' => 'pendiente',
        ]);
        return $noti->id;
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
