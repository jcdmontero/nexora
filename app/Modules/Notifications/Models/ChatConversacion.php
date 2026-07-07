<?php

namespace App\Modules\Notifications\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatConversacion extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'chat_conversaciones';

    protected $fillable = [
        'tenant_id',
        'tipo',
        'nombre',
        'participantes',
    ];

    protected $casts = [
        'participantes' => 'array',
    ];

    public function mensajes(): HasMany
    {
        return $this->hasMany(ChatMensaje::class, 'conversacion_id');
    }

    public function ultimoMensaje()
    {
        return $this->hasOne(ChatMensaje::class, 'conversacion_id')->latestOfMany();
    }
}
