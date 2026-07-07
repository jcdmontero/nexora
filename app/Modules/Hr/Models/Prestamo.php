<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Prestamo extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $table = 'hr_prestamos';

    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'monto_total',
        'cuotas_pactadas',
        'monto_cuota',
        'saldo_pendiente',
        'fecha_prestamo',
        'estado',
        'observaciones',
    ];

    protected $casts = [
        'monto_total' => 'decimal:2',
        'monto_cuota' => 'decimal:2',
        'saldo_pendiente' => 'decimal:2',
        'fecha_prestamo' => 'date',
        'cuotas_pactadas' => 'integer',
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
