<?php

namespace App\Modules\Payroll\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo de Concepto de Nómina.
 * Catalogo fijo de conceptos retributivos (devengados, deducciones,
 * provisiones y aportes patronales) parametrizables por empresa.
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $codigo
 * @property string $nombre
 * @property string $tipo             DEVENGADO|DEDUCCION|PROVISION|APORTE_PATRONAL
 * @property int|null $cuenta_contable_id
 * @property bool $base_seguridad_social
 * @property bool $base_parafiscales
 * @property bool $base_prestaciones
 * @property bool $activo
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class ConceptoNomina extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $table = 'pay_conceptos_nomina';

    protected $fillable = [
        'tenant_id',
        'codigo',
        'nombre',
        'tipo',
        'cuenta_contable_id',
        'base_seguridad_social',
        'base_parafiscales',
        'base_prestaciones',
        'activo',
    ];

    protected $casts = [
        'base_seguridad_social' => 'boolean',
        'base_parafiscales' => 'boolean',
        'base_prestaciones' => 'boolean',
        'activo' => 'boolean',
    ];

    /**
     * Relación multi-tenant.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Cuenta contable asociada por defecto (PUC).
     */
    public function cuentaContable(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_contable_id');
    }
}
