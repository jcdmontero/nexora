<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class Denominacion extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_denominaciones';

    protected $fillable = [
        'tenant_id',
        'tipo',
        'valor',
        'orden',
        'activo',
    ];

    protected $casts = [
        'valor' => 'decimal:2',
        'orden' => 'integer',
        'activo' => 'boolean',
    ];
}
