<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ReciboCaja extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_recibos';

    protected $fillable = [
        'tenant_id',
        'numero',
        'fecha',
        'sesion_id',
        'user_id',
        'cliente_id',
        'referencia_type',
        'referencia_id',
        'concepto',
        'monto',
        'metodo_pago',
        'estado',
        'notas',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'monto' => 'decimal:2',
    ];

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }

    public function getNumeroFormateadoAttribute(): string
    {
        return 'RC-' . str_pad($this->numero, 6, '0', STR_PAD_LEFT);
    }
}
