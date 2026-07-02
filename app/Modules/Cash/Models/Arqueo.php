<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Arqueo extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_arqueos';

    protected $fillable = [
        'tenant_id',
        'sesion_id',
        'user_id',
        'total_sistema',
        'total_contado',
        'diferencia',
        'observaciones',
    ];

    protected $casts = [
        'total_sistema' => 'decimal:2',
        'total_contado' => 'decimal:2',
        'diferencia' => 'decimal:2',
    ];

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(ArqueoDetalle::class, 'arqueo_id');
    }
}
