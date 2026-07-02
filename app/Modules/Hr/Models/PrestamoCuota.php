<?php

namespace App\Modules\Hr\Models;

use App\Modules\Payroll\Models\Nomina;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrestamoCuota extends Model
{
    protected $table = 'hr_prestamo_cuotas';

    protected $guarded = ['id'];

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
        return $this->belongsTo(Nomina::class);
    }
}
