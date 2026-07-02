<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transferencia extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_transferencias';

    protected $fillable = [
        'tenant_id',
        'caja_origen_id',
        'caja_destino_id',
        'sesion_origen_id',
        'sesion_destino_id',
        'user_id',
        'monto',
        'concepto',
        'estado',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    public function cajaOrigen(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_origen_id');
    }

    public function cajaDestino(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_destino_id');
    }

    public function sesionOrigen(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_origen_id');
    }

    public function sesionDestino(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_destino_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
