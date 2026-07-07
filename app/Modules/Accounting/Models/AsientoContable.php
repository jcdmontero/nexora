<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AsientoContable extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'asientos_contables';

    protected $fillable = [
        'tenant_id','periodo_contable_id',
        'fecha',
        'numero',
        'concepto',
        'estado',
        'modulo_origen',
        'documento_tipo',
        'documento_prefijo',
        'documento_numero',
        'tercero_tipo_documento',
        'tercero_numero_documento',
        'tercero_nombre',
        'referencia_id',
        'referencia_type',
        'reverso_de_id',
        'registrado_por',
        'contabilizado_at',
    ];

    protected $casts = [
        'fecha' => 'date',
        'contabilizado_at' => 'datetime',
    ];

    public function lineas()
    {
        return $this->hasMany(AsientoLinea::class);
    }

    public function registrador()
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function periodo()
    {
        return $this->belongsTo(PeriodoContable::class, 'periodo_contable_id');
    }

    public function asientoReversado()
    {
        return $this->belongsTo(self::class, 'reverso_de_id');
    }

    public function reversos()
    {
        return $this->hasMany(self::class, 'reverso_de_id');
    }

    public function getTotalDebitosAttribute()
    {
        return $this->lineas()->sum('debito');
    }

    public function getTotalCreditosAttribute()
    {
        return $this->lineas()->sum('credito');
    }

    public function referencia()
    {
        return $this->morphTo();
    }
}
