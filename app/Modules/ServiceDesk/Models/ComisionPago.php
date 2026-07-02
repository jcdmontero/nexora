<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComisionPago extends Model
{
    protected $table = 'sd_comisiones_pagos';
    protected $guarded = ['id'];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'datetime',
    ];

    const ESTADOS = ['PENDIENTE', 'PAGADO'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function liquidacion(): BelongsTo
    {
        return $this->belongsTo(ComisionLiquidacion::class, 'liquidacion_id');
    }

    public function prestador(): BelongsTo
    {
        return $this->belongsTo(Prestador::class);
    }
}
