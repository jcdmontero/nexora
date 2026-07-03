<?php

namespace App\Events;

use App\Modules\Notifications\Models\Notificacion;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificacionCreada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Notificacion $notificacion,
    ) {}

    public function broadcastAs(): string
    {
        return 'notificacion.creada';
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('tenant.' . $this->notificacion->tenant_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->notificacion->id,
            'evento' => $this->notificacion->evento,
            'titulo' => $this->notificacion->titulo,
            'mensaje' => $this->notificacion->mensaje,
            'created_at' => $this->notificacion->created_at?->toISOString(),
        ];
    }
}
