<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asistencia extends Model
{
    use BelongsToTenant;
    protected $table = 'hr_asistencias';
    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'fecha',
        'tipo',
        'hora_entrada',
        'hora_salida',
        'notas',
    ];

    protected $casts = [
        'fecha' => 'date',
        'hora_entrada' => 'datetime:H:i:s',
        'hora_salida' => 'datetime:H:i:s',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class);
    }
}
