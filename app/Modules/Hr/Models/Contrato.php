<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contrato extends Model
{
    use BelongsToTenant;
    protected $table = 'hr_contratos';
    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'cargo_id',
        'cargo',
        'tipo_contrato',
        'salario_base',
        'fecha_inicio',
        'fecha_fin',
        'estado',
    ];

    protected $casts = [
        'salario_base' => 'decimal:2',
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'estado' => 'boolean',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function cargoRel(): BelongsTo
    {
        return $this->belongsTo(Cargo::class, 'cargo_id');
    }
}
