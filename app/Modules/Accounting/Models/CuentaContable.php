<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class CuentaContable extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cuentas_contables';

    protected $fillable = [
        'tenant_id','codigo',
        'nombre',
        'tipo',
        'naturaleza',
        'nivel',
        'clase',
        'acepta_movimientos',
        'requiere_tercero',
        'requiere_centro_costo',
        'parent_id',
        'descripcion',
        'tipo_regimen',
    ];

    protected $casts = [
        'acepta_movimientos' => 'boolean',
        'requiere_tercero' => 'boolean',
        'requiere_centro_costo' => 'boolean',
        'nivel' => 'integer',
    ];

    public function parent()
    {
        return $this->belongsTo(CuentaContable::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(CuentaContable::class, 'parent_id');
    }

    public function lineas()
    {
        return $this->hasMany(AsientoLinea::class);
    }
}
