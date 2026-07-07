<?php

namespace App\Modules\Crm\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Oportunidad extends Model
{
    use HasFactory, BelongsToTenant, Auditable, SoftDeletes;

    protected $table = 'crm_oportunidades';

    protected $fillable = [
        'tenant_id','cliente_id',
        'titulo',
        'valor_estimado',
        'etapa',
        'fecha_cierre_esperada',
        'probabilidad',
        'notas',
    ];

    protected $casts = [
        'valor_estimado' => 'decimal:2',
        'fecha_cierre_esperada' => 'date',
        'probabilidad' => 'integer',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class);
    }
}
