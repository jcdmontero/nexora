<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CajaSesion extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_caja_sesiones';

    protected $fillable = [
        'tenant_id',
        'caja_id',
        'user_id',
        'fecha_apertura',
        'saldo_inicial',
        'fecha_cierre',
        'saldo_final',
        'diferencia',
        'estado',
        'notas',
        'ingresos_totales',
        'egresos_totales',
        'observaciones_cierre',
        'arqueado',
    ];

    protected $casts = [
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
        'saldo_inicial' => 'decimal:2',
        'saldo_final' => 'decimal:2',
        'diferencia' => 'decimal:2',
        'ingresos_totales' => 'decimal:2',
        'egresos_totales' => 'decimal:2',
        'arqueado' => 'boolean',
    ];

    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoCaja::class, 'sesion_id');
    }

    public function arqueos(): HasMany
    {
        return $this->hasMany(Arqueo::class, 'sesion_id');
    }

    /**
     * Saldo esperado por el sistema: base inicial + ingresos - egresos.
     */
    public function getSaldoSistemaAttribute(): float
    {
        return (float) $this->saldo_inicial
            + (float) $this->ingresos_totales
            - (float) $this->egresos_totales;
    }
}
