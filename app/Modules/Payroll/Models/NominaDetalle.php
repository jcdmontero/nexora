<?php

namespace App\Modules\Payroll\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Detalle de Nómina.
 * Desagregación por concepto (devengado, deducción, provisión o aporte patronal)
 * de cada liquidación individual.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $nomina_id
 * @property int $concepto_id
 * @property int $empleado_id
 * @property int $contrato_id
 * @property float $cantidad
 * @property float $valor
 * @property float $base_calculo
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class NominaDetalle extends Model
{
    use BelongsToTenant;

    protected $table = 'pay_nomina_detalles';

    protected $fillable = [
        'tenant_id',
        'nomina_id',
        'concepto_id',
        'empleado_id',
        'contrato_id',
        'cantidad',
        'valor',
        'base_calculo',
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'valor' => 'decimal:2',
        'base_calculo' => 'decimal:2',
    ];

    public function nomina(): BelongsTo
    {
        return $this->belongsTo(Nomina::class, 'nomina_id');
    }

    /**
     * Concepto de nómina asociado.
     */
    public function concepto(): BelongsTo
    {
        return $this->belongsTo(ConceptoNomina::class, 'concepto_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class, 'contrato_id');
    }
}
