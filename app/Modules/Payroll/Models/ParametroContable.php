<?php

namespace App\Modules\Payroll\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CentroCosto;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Parámetro Contable de Nómina.
 * Define la contrapartida contable (débito/crédito) de cada
 * concepto de nómina según la categoría laboral del empleado.
 *
 * @property int $id
 * @property int $tenant_id
 * @property int $concepto_id
 * @property string|null $categoria_laboral
 * @property int|null $cuenta_debito_id
 * @property int|null $cuenta_credito_id
 * @property int|null $centro_costo_id
 * @property string|null $fecha_inicio
 * @property string|null $fecha_fin
 * @property bool $activo
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class ParametroContable extends Model
{
    use BelongsToTenant;

    protected $table = 'pay_parametros_contables';

    protected $fillable = [
        'tenant_id',
        'concepto_id',
        'categoria_laboral',
        'cuenta_debito_id',
        'cuenta_credito_id',
        'centro_costo_id',
        'fecha_inicio',
        'fecha_fin',
        'activo',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'activo' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Concepto de nómina asociado.
     */
    public function concepto(): BelongsTo
    {
        return $this->belongsTo(ConceptoNomina::class, 'concepto_id');
    }

    /**
     * Cuenta contable de débito (gasto/costo).
     */
    public function cuentaDebito(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_debito_id');
    }

    /**
     * Cuenta contable de crédito (pasivo/banco).
     */
    public function cuentaCredito(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_credito_id');
    }

    /**
     * Centro de costo opcional.
     */
    public function centroCosto(): BelongsTo
    {
        return $this->belongsTo(CentroCosto::class, 'centro_costo_id');
    }
}
