<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $table = 'sd_tickets';
    protected $fillable = [
        'tenant_id',
        'user_id',
        'cliente_id',
        'agente_id',
        'tipo',
        'asunto',
        'equipo_descripcion',
        'descripcion',
        'estado',
        'prioridad',
        'costo_estimado',
        'fecha_resolucion',
    ];

    protected $casts = [
        'fecha_resolucion' => 'datetime',
        'costo_estimado' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function agente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agente_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function mensajes(): HasMany
    {
        return $this->hasMany(TicketMensaje::class);
    }
}
