<?php

namespace App\Modules\Hr\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Models\Sede;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empleado extends Model
{
    use BelongsToTenant;

    protected $table = 'hr_empleados';
    protected $fillable = [
        'tenant_id',
        'user_id',
        'sede_id',
        'documento',
        'nombres',
        'apellidos',
        'email',
        'telefono',
        'estado',
    ];

    protected $casts = [
        'estado' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function asistencias(): HasMany
    {
        return $this->hasMany(Asistencia::class);
    }

    public function contratos(): HasMany
    {
        return $this->hasMany(Contrato::class);
    }

    public function contratoActivo()
    {
        return $this->hasOne(Contrato::class)->where('estado', true)->latest('fecha_inicio');
    }
}
