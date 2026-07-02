<?php

namespace App\Modules\Hr\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EntidadParafiscal extends Model
{
    protected $table = 'hr_entidades_parafiscales';

    protected $guarded = ['id'];

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
