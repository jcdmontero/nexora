<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Provisión Acumulada.
 * Registro anual del acumulado de prestaciones sociales
 * (prima, cesantías, intereses de cesantías, vacaciones)
 * para efectos contables y de liquidación.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $empleado_id
 * @property string $tipo_provision    PRIMA|CESANTIAS|INT_CESANTIAS|VACACIONES
 * @property int $ano
 * @property float $saldo_inicial
 * @property float $movimiento_mes
 * @property float $saldo_final
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class ProvisionAcumulada extends Model
{
    protected $table = 'pay_provisiones_acumuladas';

    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'tipo_provision',
        'ano',
        'saldo_inicial',
        'movimiento_mes',
        'saldo_final',
    ];

    protected $casts = [
        'saldo_inicial' => 'decimal:2',
        'movimiento_mes' => 'decimal:2',
        'saldo_final' => 'decimal:2',
        'ano' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Empleado al que corresponde la provisión acumulada.
     */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }
}
