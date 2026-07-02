<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Services\Auditable;
use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComisionLiquidacion extends Model
{
    use Auditable;

    protected $table = 'sd_comisiones_liquidaciones';
    protected $guarded = ['id'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->verification_token = bin2hex(random_bytes(32));
        });
    }

    protected $casts = [
        'total_comisiones' => 'decimal:2',
        'periodo_inicio' => 'date',
        'periodo_fin' => 'date',
        'fecha_aprobacion' => 'datetime',
    ];

    const ESTADOS = ['BORRADOR', 'APROBADO', 'PAGADO', 'ANULADO'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function prestador(): BelongsTo
    {
        return $this->belongsTo(Prestador::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(ComisionDetalle::class, 'liquidacion_id');
    }

    public function aprobadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(ComisionPago::class, 'liquidacion_id');
    }
}
