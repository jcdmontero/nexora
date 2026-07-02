<?php

namespace App\Models\Core;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Core\Services\Auditable;
use App\Models\Tenant;

class Task extends Model
{
    use SoftDeletes, Auditable;

    protected $table = 'core_tasks';

    protected $fillable = [
        'tenant_id',
        'titulo',
        'descripcion',
        'estado',
        'prioridad',
        'fecha_limite',
        'departamento',
        'asignado_a',
        'creado_por',
        'taskable_id',
        'taskable_type',
    ];

    protected $casts = [
        'fecha_limite' => 'datetime',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function asignado()
    {
        return $this->belongsTo(User::class, 'asignado_a');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'creado_por');
    }

    public function taskable()
    {
        return $this->morphTo();
    }
}
