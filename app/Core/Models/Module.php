<?php
namespace App\Core\Models;

use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    protected $fillable = [
        'code', 'name', 'class', 'version', 'description',
        'is_core', 'dependencies', 'permissions', 'is_active_globally',
        'estado', 'certificacion',
    ];

    protected $casts = [
        'is_core' => 'boolean',
        'is_active_globally' => 'boolean',
        'dependencies' => 'json',
        'permissions' => 'json',
        'certificacion' => 'json',
    ];

    /** Estados del ciclo de vida. */
    public const ESTADOS = ['desarrollo', 'qa', 'certificacion', 'publicado', 'deprecado', 'retirado'];

    /** Las rutas resuelven el módulo por su `code`, no por el id. */
    public function getRouteKeyName(): string
    {
        return 'code';
    }

    /** Módulos publicados (los únicos asignables a empresas cliente). */
    public function scopePublicado($query)
    {
        return $query->where('estado', 'publicado');
    }

    public function tenants()
    {
        return $this->hasMany(TenantModule::class, 'module_code', 'code');
    }
}
