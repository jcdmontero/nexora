<?php

namespace App\Modules\Hr\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cargo extends Model
{
    protected $table = 'hr_cargos';
    protected $guarded = ['id'];

    protected $casts = [
        'salario_base_sugerido' => 'decimal:2',
        'es_productivo' => 'boolean',
        'activo' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class, 'cargo_id');
    }
}
