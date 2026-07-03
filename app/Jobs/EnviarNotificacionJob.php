<?php

namespace App\Jobs;

use App\Core\Models\Tenant;
use App\Modules\Notifications\Models\Notificacion;
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
        public int $notificacionId,
        public string $canal,
    ) {
        $this->onQueue('notifications');
    }

    public function handle(NotificacionService $notificacionService): void
    {
        $tenant = app('current_tenant');
        if (!$tenant) {
            Log::error("No current_tenant for notification job", ['notificacion_id' => $this->notificacionId]);
            return;
        }

        $noti = Notificacion::find($this->notificacionId);
        if (!$noti) {
            Log::error("Notificacion not found", ['notificacion_id' => $this->notificacionId]);
            return;
        }

        $estados = $noti->canal_estados ?? [];
        if (($estados[$this->canal] ?? null) === 'enviada') {
            Log::info("Notification channel already sent", [
                'notificacion_id' => $this->notificacionId,
                'canal' => $this->canal,
            ]);
            return;
        }

        try {
            $resultado = $this->enviarCanal($this->canal, $noti);

            $estados[$this->canal] = $resultado ? 'enviada' : 'error';
            $noti->canal_estados = $estados;
            $noti->sincronizarEstado();
            $noti->fecha_envio = $noti->fecha_envio ?? now();
            $noti->save();

            Log::info("Notification sent", [
                'notificacion_id' => $this->notificacionId,
                'canal' => $this->canal,
                'exito' => $resultado,
            ]);
        } catch (\Exception $e) {
            Log::error("Notification job failed", [
                'notificacion_id' => $this->notificacionId,
                'canal' => $this->canal,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function enviarCanal(string $canal, Notificacion $noti): bool
    {
        return match ($canal) {
            'email' => $this->enviarEmail($noti),
            'whatsapp' => $this->enviarWhatsApp($noti),
            'telegram' => $this->enviarTelegram($noti),
            default => false,
        };
    }

    private function enviarEmail(Notificacion $noti): bool
    {
        if (empty($noti->destinatario_email)) {
            return false;
        }
        try {
            $tenant = app('current_tenant');
            $empresa = $tenant?->name ?: config('app.name', 'NEXORA');
            $logo = $tenant?->logo ? url($tenant->logo) : null;

            \Illuminate\Support\Facades\Mail::send('emails.notificacion', [
                'titulo' => $noti->titulo,
                'cuerpo' => $noti->mensaje,
                'empresa' => $empresa,
                'logo' => $logo,
            ], function ($m) use ($noti, $empresa) {
                $m->to($noti->destinatario_email)->subject($noti->titulo ?? "Notificación de {$empresa}");
            });
            return true;
        } catch (\Throwable $e) {
            Log::warning('Notificación email falló: ' . $e->getMessage());
            $noti->error = $e->getMessage();
            return false;
        }
    }

    private function enviarWhatsApp(Notificacion $noti): bool
    {
        $url = rtrim((string) config('services.whatsapp.url'), '/');
        if (!$url || empty($noti->destinatario_telefono)) {
            return false;
        }
        try {
            $telefono = $this->normalizarTelefono($noti->destinatario_telefono);
            $resp = \Illuminate\Support\Facades\Http::timeout(20)->post("{$url}/send-message", [
                'phone' => $telefono,
                'message' => $noti->mensaje,
            ]);
            if ($resp->successful() && ($resp->json('success') === true)) {
                return true;
            }
            $noti->error = 'WhatsApp: ' . ($resp->json('error') ?? $resp->status());
            return false;
        } catch (\Throwable $e) {
            Log::warning('Notificación WhatsApp falló: ' . $e->getMessage());
            $noti->error = $e->getMessage();
            return false;
        }
    }

    private function enviarTelegram(Notificacion $noti): bool
    {
        $token = config('services.telegram.bot_token');
        $chatId = $noti->destinatario_telefono ?: config('services.telegram.chat_id');
        if (!$token || !$chatId) {
            return false;
        }
        try {
            $resp = \Illuminate\Support\Facades\Http::timeout(20)
                ->post("https://api.telegram.org/bot{$token}/sendMessage", [
                    'chat_id' => $chatId,
                    'text' => $noti->mensaje,
                ]);
            if ($resp->successful() && ($resp->json('ok') === true)) {
                return true;
            }
            $noti->error = 'Telegram: ' . ($resp->json('description') ?? $resp->status());
            return false;
        } catch (\Throwable $e) {
            Log::warning('Notificación Telegram falló: ' . $e->getMessage());
            $noti->error = $e->getMessage();
            return false;
        }
    }

    private function normalizarTelefono(string $telefono): string
    {
        $digits = preg_replace('/\D/', '', $telefono);
        if (strlen($digits) === 10) {
            $digits = '57' . $digits;
        }
        return $digits;
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Notification job failed permanently", [
            'notificacion_id' => $this->notificacionId,
            'canal' => $this->canal,
            'error' => $exception->getMessage(),
        ]);
    }
}
