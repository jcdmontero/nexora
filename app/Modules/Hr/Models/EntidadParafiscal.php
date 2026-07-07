<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EntidadParafiscal extends Model
{
    use BelongsToTenant;
    protected $table = 'hr_entidades_parafiscales';

    protected $fillable = [
        'tenant_id',
        'tipo_entidad',
        'nombre',
        'nit',
        'codigo_pila',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function afiliaciones(): HasMany
    {
        return $this->hasMany(Afiliacion::class, 'entidad_id');
    }
}
