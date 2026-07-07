<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Prestador de servicios técnicos.
 *
 * NOTA DE DISEÑO (cambio respecto al legacy servicemanager):
 * En el legacy, los técnicos eran usuarios o empleados con cargo productivo.
 * En Nexora, Prestador es una entidad independiente que puede ser:
 * - CONTRATISTA (externo, pago por comisión, sin RRHH)
 * - EMPLEADO (vinculado a hr_empleados, con opción a comisión adicional)
 * - FREELANCE / COMISIONISTA
 *
 * ServiceDesk NO depende de RRHH. Los técnicos existen aquí.
 * Si además la empresa tiene RRHH activo, se vincula con empleado_id.
 */
class Prestador extends Model
{
    use BelongsToTenant;

    protected $table = 'sd_prestadores';
    protected $guarded = ['id'];

    protected $casts = [
        'porcentaje_comision' => 'decimal:2',
        'es_gratuito' => 'boolean',
        'activo' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ordenes(): HasMany
    {
        return $this->hasMany(OrdenReparacion::class, 'prestador_id');
    }

    public function liquidaciones(): HasMany
    {
        return $this->hasMany(ComisionLiquidacion::class, 'prestador_id');
    }

    // Scope: solo contratistas (sin vínculo laboral)
    public function scopeContratistas($query)
    {
        return $query->whereIn('tipo_vinculacion', ['CONTRATISTA', 'FREELANCE', 'COMISIONISTA']);
    }

    // Scope: solo empleados (vinculados a RRHH)
    public function scopeEmpleados($query)
    {
        return $query->where('tipo_vinculacion', 'EMPLEADO');
    }
}
