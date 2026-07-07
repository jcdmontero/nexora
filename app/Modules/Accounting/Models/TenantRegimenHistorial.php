<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class TenantRegimenHistorial extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'tenant_regimen_historial';

    protected $fillable = [
        'tenant_id',
        'regimen',
        'fecha_vigente_desde',
        'fecha_vigente_hasta',
        'cambiado_por',
        'motivo',
    ];

    protected $casts = [
        'fecha_vigente_desde' => 'date',
        'fecha_vigente_hasta' => 'date',
    ];
}
