<?php

namespace App\Modules\Payroll\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo de Periodo de Nómina.
 * Agrupa las liquidaciones individuales dentro de un mismo ciclo
 * de pago (quincenal, mensual, etc.).
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $codigo
 * @property string $fecha_inicio
 * @property string $fecha_fin
 * @property string $mes_contable         Formato YYYY-MM
 * @property string $estado               BORRADOR|LIQUIDADA|CONTABILIZADA|PAGADA|ANULADA
 * @property string|null $observaciones
 * @property float $total_devengado
 * @property float $total_deducciones
 * @property float $total_provisiones
 * @property float $total_aportes_patronales
 * @property float $neto_pagar
 * @property int $created_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class PeriodoNomina extends Model
{
    use BelongsToTenant;

    public const ESTADOS = ['BORRADOR', 'PROCESANDO', 'LIQUIDADA', 'CONTABILIZADA', 'PAGADA', 'ANULADA'];

    protected $table = 'pay_periodos_nomina';

    protected $fillable = [
        'tenant_id',
        'codigo',
        'fecha_inicio',
        'fecha_fin',
        'mes_contable',
        'estado',
        'observaciones',
        'total_devengado',
        'total_deducciones',
        'total_provisiones',
        'total_aportes_patronales',
        'neto_pagar',
        'created_by',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'total_devengado' => 'decimal:2',
        'total_deducciones' => 'decimal:2',
        'total_provisiones' => 'decimal:2',
        'total_aportes_patronales' => 'decimal:2',
        'neto_pagar' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Nóminas individuales liquidadas dentro de este período.
     */
    public function nominas(): HasMany
    {
        return $this->hasMany(Nomina::class, 'periodo_id');
    }

    /**
     * Usuario que creó el período.
     */
    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
