<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departamento extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_departamentos';
    protected $fillable = [
        'tenant_id',
        'nombre',
        'descripcion',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function cargos(): HasMany
    {
        return $this->hasMany(Cargo::class);
    }
}
