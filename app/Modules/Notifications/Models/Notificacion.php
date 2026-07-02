<?php
namespace App\Modules\Notifications\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Notificacion extends Model
{
    use BelongsToTenant;

    protected $table = 'notif_notificaciones';

    protected $fillable = [
        'tenant_id', 'evento', 'referencia_type', 'referencia_id', 'cliente_id',
        'destinatario_nombre', 'destinatario_email', 'destinatario_telefono',
        'titulo', 'mensaje', 'canales', 'canal_estados', 'estado', 'error',
        'enviado_por', 'fecha_envio',
    ];

    protected $casts = [
        'canales' => 'array',
        'canal_estados' => 'array',
        'fecha_envio' => 'datetime',
    ];

    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }

    public function enviador()
    {
        return $this->belongsTo(User::class, 'enviado_por');
    }

    /** Recalcula el estado global a partir de los estados por canal. */
    public function sincronizarEstado(): void
    {
        $estados = array_values($this->canal_estados ?? []);
        if (empty($estados)) {
            $this->estado = 'pendiente';
            return;
        }
        $enviadas = count(array_filter($estados, fn ($e) => $e === 'enviada'));
        $errores = count(array_filter($estados, fn ($e) => $e === 'error'));
        if ($enviadas === count($estados)) {
            $this->estado = 'enviada';
        } elseif ($enviadas > 0) {
            $this->estado = 'parcial';
        } elseif ($errores === count($estados)) {
            $this->estado = 'error';
        } else {
            $this->estado = 'pendiente';
        }
    }

    public function scopePendientes($q)
    {
        return $q->whereIn('estado', ['pendiente', 'parcial', 'error']);
    }
}
