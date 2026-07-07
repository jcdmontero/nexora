<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrestamoCuota extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_prestamo_cuotas';

    protected $fillable = [
        'tenant_id',
        'prestamo_id',
        'numero_cuota',
        'monto',
        'fecha_vencimiento',
        'estado',
        'nomina_id',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_vencimiento' => 'date',
    ];

    public function prestamo(): BelongsTo
    {
        return $this->belongsTo(Prestamo::class);
    }

    public function nomina(): BelongsTo
    {
        if (!class_exists(\App\Modules\Payroll\Models\Nomina::class)) {
            return $this->belongsTo(\App\Modules\Payroll\Models\Nomina::class)->whereRaw('1 = 0');
        }
        return $this->belongsTo(\App\Modules\Payroll\Models\Nomina::class);
    }
}
