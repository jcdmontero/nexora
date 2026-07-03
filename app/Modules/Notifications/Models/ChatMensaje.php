<?php

namespace App\Modules\Notifications\Models;

use App\Core\Models\BelongsToTenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMensaje extends Model
{
    use BelongsToTenant;

    protected $table = 'chat_mensajes';

    protected $fillable = [
        'tenant_id',
        'conversacion_id',
        'user_id',
        'mensaje',
        'tipo',
        'leido_en',
    ];

    protected $casts = [
        'leido_en' => 'datetime',
    ];

    public function conversacion(): BelongsTo
    {
        return $this->belongsTo(ChatConversacion::class, 'conversacion_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
