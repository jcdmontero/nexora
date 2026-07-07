<?php

namespace App\Modules\Payroll\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Contrato;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Modelo de Novedad de Nómina.
 * Incidencias que afectan la liquidación: incapacidades,
 * licencias, horas extras, bonificaciones, descuentos, etc.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $empleado_id
 * @property int|null $contrato_id
 * @property int|null $nomina_id
 * @property int|null $concepto_id
 * @property int|null $periodo_id
 * @property string $tipo
 * @property string|null $codigo
 * @property string|null $descripcion
 * @property float $valor
 * @property string $fecha_registro
 * @property string|null $fecha_inicio
 * @property string|null $fecha_fin
 * @property string|null $estado
 * @property string|null $referencia_type
 * @property int|null $referencia_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Novedad extends Model
{
    use BelongsToTenant;

    protected $table = 'pay_novedades';

    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'contrato_id',
        'nomina_id',
        'concepto_id',
        'periodo_id',
        'tipo',
        'codigo',
        'concepto',
        'cantidad',
        'descripcion',
        'valor',
        'fecha_registro',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'referencia_type',
        'referencia_id',
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'valor' => 'decimal:2',
        'fecha_registro' => 'date',
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class, 'contrato_id');
    }

    public function nomina(): BelongsTo
    {
        return $this->belongsTo(Nomina::class, 'nomina_id');
    }

    /**
     * Concepto de nómina asociado.
     */
    public function conceptoNomina(): BelongsTo
    {
        return $this->belongsTo(ConceptoNomina::class, 'concepto_id');
    }

    /**
     * Período de nómina en el que se aplica.
     */
    public function periodo(): BelongsTo
    {
        return $this->belongsTo(PeriodoNomina::class, 'periodo_id');
    }

    /**
     * Relación polimórfica con el origen de la novedad
     * (ej. incapacidad del módulo HR, ausentismo, etc.).
     */
    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }
}
