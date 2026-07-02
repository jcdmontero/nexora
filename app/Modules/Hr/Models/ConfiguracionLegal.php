<?php

namespace App\Modules\Hr\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConfiguracionLegal extends Model
{
    protected $table = 'hr_configuracion_legal';

    protected $guarded = ['id'];

    protected $casts = [
        'salario_minimo' => 'decimal:2',
        'auxilio_transporte' => 'decimal:2',
        'tope_auxilio_transporte_salarios' => 'decimal:2',
        'valor_uvt' => 'decimal:2',
        'aporte_salud_empleado' => 'decimal:2',
        'aporte_pension_empleado' => 'decimal:2',
        'aporte_salud_patronal' => 'decimal:2',
        'aporte_pension_patronal' => 'decimal:2',
        'caja_compensacion' => 'decimal:2',
        'sena' => 'decimal:2',
        'icbf' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
