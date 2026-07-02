<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prestamo extends Model
{
    use SoftDeletes;

    protected $table = 'hr_prestamos';

    protected $guarded = ['id'];

    protected $casts = [
        'monto_total' => 'decimal:2',
        'monto_cuota' => 'decimal:2',
        'saldo_pendiente' => 'decimal:2',
        'fecha_prestamo' => 'date',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function cuotas(): HasMany
    {
        return $this->hasMany(PrestamoCuota::class);
    }
}
