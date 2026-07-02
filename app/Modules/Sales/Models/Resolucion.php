<?php

namespace App\Modules\Sales\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resolucion extends Model
{
    protected $table = 'sales_resoluciones';

    protected $fillable = [
        'tenant_id',
        'tipo_documento',
        'numero_resolucion',
        'prefijo',
        'rango_desde',
        'rango_hasta',
        'consecutivo_actual',
        'fecha_desde',
        'fecha_hasta',
        'clave_tecnica',
        'is_active',
    ];

    protected $casts = [
        'fecha_desde' => 'date',
        'fecha_hasta' => 'date',
        'is_active' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
