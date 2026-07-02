<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contrato extends Model
{
    protected $table = 'hr_contratos';
    protected $fillable = [
        'empleado_id',
        'cargo_id',
        'tipo_contrato',
        'cargo',
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
