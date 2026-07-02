<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\Contrato;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo de Nómina Individual.
 * Representa la liquidación de un empleado dentro de un período.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $periodo_id
 * @property int $contrato_id
 * @property string $fecha_inicio
 * @property string $fecha_fin
 * @property float $ibc_seguridad_social
 * @property float $ibc_parafiscales
 * @property float $auxilio_transporte
 * @property float $total_devengado
 * @property float $total_deducciones
 * @property float $neto_pagar
 * @property float $total_provisiones
 * @property float $total_aportes_patronales
 * @property float $costo_laboral_total
 * @property int $dias_laborados
 * @property int $created_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Nomina extends Model
{
    protected $table = 'pay_nominas';

    protected $fillable = [
        'tenant_id',
        'periodo_id',
        'empleado_id',
        'contrato_id',
        'fecha_inicio',
        'fecha_fin',
        'ibc_seguridad_social',
        'ibc_parafiscales',
        'auxilio_transporte',
        'total_devengado',
        'total_deducciones',
        'neto_pagar',
        'total_provisiones',
        'total_aportes_patronales',
        'costo_laboral_total',
        'dias_laborados',
        'created_by',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'ibc_seguridad_social' => 'decimal:2',
        'ibc_parafiscales' => 'decimal:2',
        'auxilio_transporte' => 'decimal:2',
        'total_devengado' => 'decimal:2',
        'total_deducciones' => 'decimal:2',
        'neto_pagar' => 'decimal:2',
        'total_provisiones' => 'decimal:2',
        'total_aportes_patronales' => 'decimal:2',
        'costo_laboral_total' => 'decimal:2',
        'dias_laborados' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Período de nómina al que pertenece.
     */
    public function periodo(): BelongsTo
    {
        return $this->belongsTo(PeriodoNomina::class, 'periodo_id');
    }

    /**
     * Empleado.
     */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Hr\Models\Empleado::class, 'empleado_id');
    }

    /**
     * Contrato base de la liquidación.
     */
    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class, 'contrato_id');
    }

    /**
     * Detalles desagregados por concepto.
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(NominaDetalle::class, 'nomina_id');
    }

    /**
     * Novedades aplicadas a esta nómina.
     */
    public function novedades(): HasMany
    {
        return $this->hasMany(Novedad::class, 'nomina_id');
    }

    /**
     * Usuario que creó la liquidación.
     */
    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
