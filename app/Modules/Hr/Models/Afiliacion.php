<?php

namespace App\Modules\Hr\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Afiliacion extends Model
{
    protected $table = 'hr_afiliaciones';

    protected $guarded = ['id'];

    protected $casts = [
        'fecha_afiliacion' => 'date',
        'activo' => 'boolean',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }

    public function entidad(): BelongsTo
    {
        return $this->belongsTo(EntidadParafiscal::class, 'entidad_id');
    }
}
