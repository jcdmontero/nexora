<?php

namespace App\Modules\ServiceDesk\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComisionDetalle extends Model
{
    protected $table = 'sd_comisiones_detalles';
    protected $guarded = ['id'];

    protected $casts = [
        'base_calculo' => 'decimal:2',
        'porcentaje_comision' => 'decimal:2',
        'valor_comision' => 'decimal:2',
    ];

    public function liquidacion(): BelongsTo
    {
        return $this->belongsTo(ComisionLiquidacion::class, 'liquidacion_id');
    }

    public function orden(): BelongsTo
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }
}
