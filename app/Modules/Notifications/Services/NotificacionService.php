<?php
namespace App\Modules\Notifications\Services;

use App\Models\User;
use App\Modules\Notifications\Models\Notificacion;
use App\Modules\Notifications\Models\PlantillaNotificacion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificacionService
{
    /** Plantillas por defecto si la empresa no ha personalizado el evento. */
    public const DEFAULTS = [
        'orden_recibida' => [
            'nombre' => 'Equipo recibido',
            'asunto' => 'Equipo recibido — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nRecibimos tu equipo {equipo} correctamente.\n\nOrden: {numero_orden}\nEstado: {estado}\nFallas reportadas: {fallas}\n\nTe avisaremos sobre el avance. ¡Gracias por confiar en {empresa}!",
        ],
        'orden_diagnostico' => [
            'nombre' => 'En diagnóstico',
            'asunto' => 'Diagnóstico en progreso — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nEstamos diagnosticando tu equipo {equipo} (orden {numero_orden}).\nTe informaremos los resultados pronto.",
        ],
        'orden_reparacion' => [
            'nombre' => 'En reparación',
            'asunto' => 'Reparación en curso — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nTu equipo {equipo} está en reparación (orden {numero_orden}).",
        ],
        'orden_pruebas' => [
            'nombre' => 'En pruebas',
            'asunto' => 'Pruebas de funcionamiento — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nTu equipo {equipo} está en pruebas finales (orden {numero_orden}).",
        ],
        'orden_listo' => [
            'nombre' => 'Listo para entrega',
            'asunto' => 'Tu equipo está listo — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\n¡Tu equipo {equipo} está listo! (orden {numero_orden})\nTotal a pagar: {total}\n\nAcércate a {empresa} para retirarlo.",
        ],
        'orden_entregado' => [
            'nombre' => 'Entregado',
            'asunto' => 'Equipo entregado — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nTu equipo {equipo} fue entregado (orden {numero_orden}).\nGracias por preferir a {empresa}.",
        ],
        'orden_listo_admin' => [
            'nombre' => 'Orden Lista - Notificación al Administrador',
            'asunto' => 'Orden Lista para Cobro — {numero_orden}',
            'contenido' => "Hola {admin_nombre},\n\nEl técnico {tecnico_nombre} ha marcado la orden {numero_orden} como LISTA.\n\nPor favor, continúa con el proceso de cobro, prefactura y entrega al cliente.\n\nTotal a cobrar: {total}\n\nGracias.",
        ],
    ];

    public const CANALES = ['email', 'whatsapp', 'telegram'];

    /**
     * Crea y procesa una notificación para un evento.
     *
     * @param array $destinatario ['nombre','email','telefono','cliente_id']
     * @param array $data         variables para la plantilla
     * @param array|null $canales canales solicitados; si null usa los de la plantilla
     */
    public function notificar(string $evento, ?Model $referencia, array $destinatario, array $data = [], ?array $canales = null, ?User $enviadoPor = null): ?Notificacion
    {
        $plantilla = PlantillaNotificacion::where('evento', $evento)->where('activo', true)->first();
        $base = self::DEFAULTS[$evento] ?? ['asunto' => 'Notificación', 'contenido' => '{mensaje}'];

        $asunto = $this->reemplazar($plantilla->asunto ?? $base['asunto'], $data);
        $mensaje = $this->reemplazar($plantilla->contenido ?? $base['contenido'], $data);

        $canales = $canales ?? ($plantilla->canales ?? ['email']);
        $canales = array_values(array_intersect($canales, self::CANALES));

        // Filtrar canales sin datos del destinatario
        $canales = array_values(array_filter($canales, function ($c) use ($destinatario) {
            return match ($c) {
                'email' => !empty($destinatario['email'] ?? null),
                'whatsapp', 'telegram' => !empty($destinatario['telefono'] ?? null),
                default => true,
            };
        }));

        if (empty($canales)) {
            $canales = ['email'];
        }

        $noti = \Illuminate\Support\Facades\DB::transaction(function () use (
            $evento, $referencia, $destinatario, $asunto, $mensaje, $canales
        ) {
            $noti = Notificacion::create([
                'tenant_id' => tenantId(),
                'evento' => $evento,
                'referencia_type' => $referencia ? get_class($referencia) : null,
                'referencia_id' => $referencia?->getKey(),
                'cliente_id' => $destinatario['cliente_id'] ?? null,
                'destinatario_nombre' => $destinatario['nombre'] ?? null,
                'destinatario_email' => $destinatario['email'] ?? null,
                'destinatario_telefono' => $destinatario['telefono'] ?? null,
                'titulo' => $asunto,
                'mensaje' => $mensaje,
                'canales' => $canales,
                'canal_estados' => array_fill_keys($canales, 'pendiente'),
                'estado' => 'pendiente',
            ]);

            return $noti;
        });

        $this->enviar($noti, $enviadoPor);

        \App\Events\NotificacionCreada::dispatch($noti);

        return $noti;
    }

    /** Despacha jobs asíncronos para cada canal pendiente de la notificación. */
    public function enviar(Notificacion $noti, ?User $enviadoPor = null): void
    {
        $estados = $noti->canal_estados ?? [];

        foreach ($noti->canales as $canal) {
            if (($estados[$canal] ?? null) === 'enviada') {
                continue;
            }
            \App\Jobs\EnviarNotificacionJob::dispatch($noti->id, $canal)
                ->onQueue('notifications');
        }

        $noti->enviado_por = $enviadoPor?->id;
        $noti->save();
    }

    private function reemplazar(string $texto, array $data): string
    {
        $repl = [];
        foreach ($data as $k => $v) {
            $repl['{' . $k . '}'] = (string) ($v ?? '');
        }
        return strtr($texto, $repl);
    }
}
