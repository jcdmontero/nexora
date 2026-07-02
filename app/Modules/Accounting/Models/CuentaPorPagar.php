<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class CuentaPorPagar extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cuentas_por_pagar';

    protected $fillable = [
        'tenant_id',
        'acreedor_id',
        'acreedor_type',
        'documento_origen_id',
        'documento_origen_type',
        'monto_total',
        'monto_pagado',
        'estado',
        'fecha_vencimiento',
        'notas'
    ];

    protected $casts = [
        'monto_total' => 'decimal:2',
        'monto_pagado' => 'decimal:2',
        'fecha_vencimiento' => 'date',
    ];

    public function acreedor()
    {
        return $this->morphTo();
    }

    public function documentoOrigen()
    {
        return $this->morphTo();
    }
}
