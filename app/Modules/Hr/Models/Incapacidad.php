<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Incapacidad extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $table = 'hr_incapacidades';

    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'tipo',
        'fecha_inicio',
        'fecha_fin',
        'dias',
        'porcentaje_pago',
        'observaciones',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'porcentaje_pago' => 'decimal:2',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }
}
