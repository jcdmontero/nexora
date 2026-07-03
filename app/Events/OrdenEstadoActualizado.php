<?php

namespace App\Events;

use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrdenEstadoActualizado implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public OrdenReparacion $orden,
        public string $estadoAnterior,
        public string $estadoNuevo,
    ) {}

    public function broadcastAs(): string
    {
        return 'orden.estado.actualizado';
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('tenant.' . $this->orden->tenant_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'orden_id' => $this->orden->id,
            'numero_orden' => $this->orden->numero_orden,
            'estado_anterior' => $this->estadoAnterior,
            'estado_nuevo' => $this->estadoNuevo,
        ];
    }
}
