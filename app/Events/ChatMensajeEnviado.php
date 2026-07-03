<?php

namespace App\Events;

use App\Modules\Notifications\Models\ChatConversacion;
use App\Modules\Notifications\Models\ChatMensaje;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMensajeEnviado implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatMensaje $mensaje,
        public ChatConversacion $conversacion,
    ) {}

    public function broadcastAs(): string
    {
        return 'chat.mensaje.enviado';
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->conversacion->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->mensaje->id,
            'conversacion_id' => $this->conversacion->id,
            'user_id' => $this->mensaje->user_id,
            'user_name' => $this->mensaje->user?->name,
            'mensaje' => $this->mensaje->mensaje,
            'tipo' => $this->mensaje->tipo,
            'created_at' => $this->mensaje->created_at?->toISOString(),
        ];
    }
}
