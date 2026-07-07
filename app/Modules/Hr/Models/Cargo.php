<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cargo extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_cargos';
    protected $fillable = [
        'tenant_id',
        'departamento_id',
        'nombre',
        'categoria_laboral',
        'salario_base_sugerido',
        'es_productivo',
        'activo',
    ];

    protected $casts = [
        'salario_base_sugerido' => 'decimal:2',
        'es_productivo' => 'boolean',
        'activo' => 'boolean',
    ];

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class, 'cargo_id');
    }
}
