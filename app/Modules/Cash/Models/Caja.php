<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Caja extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_cajas';

    protected $fillable = [
        'tenant_id',
        'sede_id',
        'nombre',
        'activa',
    ];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function sede(): BelongsTo
    {
        return $this->belongsTo(\App\Core\Models\Sede::class, 'sede_id');
    }

    public function sesiones(): HasMany
    {
        return $this->hasMany(CajaSesion::class, 'caja_id');
    }

    /**
     * Sesión de caja abierta actualmente en esta caja (si la hay).
     */
    public function sesionActual()
    {
        return $this->hasOne(CajaSesion::class, 'caja_id')
            ->where('estado', 'abierta')
            ->latestOfMany('fecha_apertura');
    }

    /**
     * Saldo actual en caja: suma del último cierre + movimientos de la sesión abierta.
     */
    public function getSaldoActualAttribute(): float
    {
        $sesion = $this->sesionActual;

        if (!$sesion) {
            return 0;
        }

        return (float) $sesion->saldo_inicial
            + (float) $sesion->ingresos_totales
            - (float) $sesion->egresos_totales;
    }
}
