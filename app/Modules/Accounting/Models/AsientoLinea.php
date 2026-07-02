<?php

namespace App\Modules\Accounting\Models;

use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class AsientoLinea extends Model
{
    use Auditable;
    // Las líneas no necesitan BelongsToTenant directo si ya pertenecen a un AsientoContable
    // que sí lo tiene, pero para mayor seguridad podríamos incluirlo. 
    // Para simplificar y evitar redundancia, nos basamos en el asiento.

    protected $guarded = [];

    protected $table = 'asiento_lineas';

    protected $fillable = [
        'asiento_contable_id',
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
