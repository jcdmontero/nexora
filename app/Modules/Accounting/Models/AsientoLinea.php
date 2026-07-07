<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class AsientoLinea extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'asiento_lineas';

    protected $fillable = [
        'tenant_id','asiento_contable_id',
        'cuenta_contable_id',
        'centro_costo_id',
        'tercero_tipo_documento',
        'tercero_numero_documento',
        'tercero_nombre',
        'debito',
        'credito',
        'base_gravable',
        'impuesto_tipo',
        'impuesto_tarifa',
        'descripcion',
    ];

    protected $casts = [
        'debito' => 'decimal:2',
        'credito' => 'decimal:2',
        'base_gravable' => 'decimal:2',
        'impuesto_tarifa' => 'decimal:4',
    ];

    /**
     * Normaliza impuesto_tipo a minúsculas para evitar mismatches de casing
     * entre lo que se guarda (validación) y lo que consultan los reportes.
     */
    public function setImpuestoTipoAttribute(?string $value): void
    {
        $this->attributes['impuesto_tipo'] = $value !== null ? strtolower($value) : null;
    }

    public function asiento()
    {
        return $this->belongsTo(AsientoContable::class, 'asiento_contable_id');
    }

    public function cuenta()
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_contable_id');
    }

    public function centroCosto()
    {
        return $this->belongsTo(CentroCosto::class, 'centro_costo_id');
    }
}
