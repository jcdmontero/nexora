<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MovimientoCaja extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_movimientos';

    protected $fillable = [
        'tenant_id',
        'sesion_id',
        'tipo',
        'monto',
        'metodo_pago',
        'concepto',
        'referencia_type',
        'referencia_id',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_id');
    }

    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Si el movimiento está relacionado con un abono (ReciboCaja),
     * devuelve su ID. Útil para mostrar acciones de anulación en la UI.
     */
    public function getReciboIdAttribute(): ?int
    {
        if (!$this->referencia_type || !$this->referencia_id) return null;

        // Buscar recibo activo que apunte a la misma referencia
        $recibo = ReciboCaja::where('referencia_type', $this->referencia_type)
            ->where('referencia_id', $this->referencia_id)
            ->where('estado', 'activo')
            ->where('concepto', 'like', 'Abono OT%')
            ->where('monto', $this->monto)
            ->first();

        return $recibo?->id;
    }

    /**
     * Si el movimiento es de reversión de anulación, lo identifica.
     */
    public function getEsAnulacionAttribute(): bool
    {
        return str_starts_with($this->concepto, 'Anulación recibo RC-');
    }

    /**
     * ID de recibo anulado en caso de movimiento de reversión.
     */
    public function getReciboAnuladoIdAttribute(): ?int
    {
        if (!$this->es_anulacion) return null;

        preg_match('/RC-(\d+)/', $this->concepto, $matches);
        if (empty($matches[1])) return null;

        return (int) $matches[1];
    }
}
