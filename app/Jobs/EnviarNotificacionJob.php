<?php

namespace App\Jobs;

use App\Core\Models\Tenant;
use App\Modules\Notifications\Services\NotificacionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EnviarNotificacionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;
    public $maxExceptions = 2;
    public $backoff = [10, 30, 60];

    public function __construct(
        public string $tipo, // 'email', 'whatsapp', 'telegram'
        public string $destinatario,
        public string $asunto,
        public string $mensaje,
        public array $datos = [],
        public int $tenantId
    ) {
        $this->onQueue('notifications');
    }

    public function handle(NotificacionService $notificacionService): void
    {
        $tenant = Tenant::find($this->tenantId);
        if (!$tenant) {
            Log::error("Tenant not found for notification", ['tenant_id' => $this->tenantId]);
            return;
        }

        try {
            Log::info("Sending notification", [
                'tipo' => $this->tipo,
                'destinatario' => $this->destinatario,
                'tenant_id' => $this->tenantId,
            ]);

            switch ($this->tipo) {
                case 'email':
                    $notificacionService->enviarEmail(
                        $this->destinatario,
                        $this->asunto,
                        $this->mensaje,
                        $this->datos,
                        $tenant
                    );
                    break;

                case 'whatsapp':
                    $notificacionService->enviarWhatsApp(
                        $this->destinatario,
                        $this->mensaje,
                        $this->datos,
                        $tenant
                    );
                    break;

                case 'telegram':
                    $notificacionService->enviarTelegram(
                        $this->destinatario,
                        $this->mensaje,
                        $this->datos,
                        $tenant
                    );
                    break;

                default:
                    Log::error("Unknown notification type", ['tipo' => $this->tipo]);
                    return;
            }

            Log::info("Notification sent successfully", [
                'tipo' => $this->tipo,
                'destinatario' => $this->destinatario,
            ]);

        } catch (\Exception $e) {
            Log::error("Notification failed", [
                'tipo' => $this->tipo,
                'destinatario' => $this->destinatario,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Notification job failed permanently", [
            'tipo' => $this->tipo,
            'destinatario' => $this->destinatario,
            'error' => $exception->getMessage(),
        ]);
    }
}
