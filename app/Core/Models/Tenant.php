<?php
namespace App\Core\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;
    protected $fillable = [
        'name', 'slug', 'domain', 'email', 'logo', 'is_active', 'plan', 'config',
    ];

    protected $casts = [
        'config' => 'json',
        'is_active' => 'boolean',
    ];

    public function users()
    {
        return $this->hasMany(\App\Models\User::class);
    }

    public function activeModules()
    {
        return $this->hasMany(TenantModule::class)->where('is_active', true);
    }
}
