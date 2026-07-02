<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class PeriodoContable extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'periodos_contables';

    protected $fillable = [
        'tenant_id',
        'anio',
        'mes',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'cerrado_at',
        'cerrado_por',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'cerrado_at' => 'datetime',
    ];

    public function estaCerrado(): bool
    {
        return $this->estado === 'cerrado';
    }
}
