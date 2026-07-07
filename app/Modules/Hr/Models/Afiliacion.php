<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Afiliacion extends Model
{
    use BelongsToTenant;
    protected $table = 'hr_afiliaciones';

    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'entidad_id',
        'tipo_afiliacion',
        'numero_identificacion',
        'fecha_afiliacion',
        'activo',
    ];

    protected $casts = [
        'fecha_afiliacion' => 'date',
        'activo' => 'boolean',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function entidad(): BelongsTo
    {
        return $this->belongsTo(EntidadParafiscal::class, 'entidad_id');
    }
}
