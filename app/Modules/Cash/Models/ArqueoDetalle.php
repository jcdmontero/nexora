<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArqueoDetalle extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_arqueo_detalles';

    protected $fillable = [
        'tenant_id',
        'arqueo_id',
        'denominacion_id',
        'cantidad',
        'subtotal',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'subtotal' => 'decimal:2',
    ];

    public function arqueo(): BelongsTo
    {
        return $this->belongsTo(Arqueo::class, 'arqueo_id');
    }

    public function denominacion(): BelongsTo
    {
        return $this->belongsTo(Denominacion::class, 'denominacion_id');
    }
}
