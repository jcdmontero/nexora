<?php

namespace App\Core\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sede extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'core_sedes';

    protected $fillable = [
        'tenant_id',
        'nombre',
        'direccion',
        'es_principal',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'es_principal' => 'boolean',
            'activo' => 'boolean',
        ];
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'sede_id');
    }

    public function bodegas(): HasMany
    {
        return $this->hasMany(\App\Modules\Inventory\Models\Bodega::class, 'sede_id');
    }

    public function cajas(): HasMany
    {
        return $this->hasMany(\App\Modules\Cash\Models\Caja::class, 'sede_id');
    }

    protected static function booted(): void
    {
        static::addGlobalScope('tenant', function ($query) {
            if (!app()->runningInConsole() && app()->has('current_tenant')) {
                $query->where('tenant_id', app('current_tenant')->id);
            }
        });
    }
}
