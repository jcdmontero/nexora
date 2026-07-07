<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class CentroCosto extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'centros_costo';

    protected $fillable = [
        'tenant_id','codigo',
        'nombre',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];
}
