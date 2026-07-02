<?php
namespace App\Models;

use App\Core\Models\Tenant;
use App\Core\Models\Sede;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use Auditable, HasFactory, HasRoles, Notifiable;

    protected $fillable = [
        'tenant_id', 'sede_id', 'name', 'email', 'password',
        'is_superadmin', 'is_active', 'locale',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_superadmin' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sede()
    {
        return $this->belongsTo(Sede::class, 'sede_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->is_superadmin;
    }

    protected static function booted(): void
    {
        static::addGlobalScope('tenant', function ($query) {
            // Aislamiento por tenant para usuarios YA autenticados (no superadmin).
            // NO se aplica durante el login (guest), para que Auth::attempt pueda
            // encontrar al usuario por email; la pertenencia a la empresa se valida
            // en LoginController después del attempt.
            if (
                !app()->runningInConsole()
                && app()->has('current_tenant')
                && auth()->check()
                && !auth()->user()->is_superadmin
            ) {
                $query->where('tenant_id', app('current_tenant')->id);
            }
        });
    }
}
