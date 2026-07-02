<?php
namespace App\Core\Services;

use App\Core\Models\Tenant;

class TenantService
{
    public function create(array $data): Tenant
    {
        return Tenant::create([
            'name' => $data['name'],
            'slug' => $data['slug'] ?? str($data['name'])->slug(),
            'domain' => $data['domain'] ?? null,
            'email' => $data['email'] ?? null,
            'config' => $data['config'] ?? [],
        ]);
    }

    public function registerDefaultAdmin(Tenant $tenant, array $userData): void
    {
        $user = $tenant->users()->create([
            'name' => $userData['name'],
            'email' => $userData['email'],
            'password' => bcrypt($userData['password']),
            'is_superadmin' => false,
            'is_active' => true,
        ]);

        $user->assignRole(config('roles.default_tenant_admin', 'ADMIN_EMPRESA'));
    }

    public function suspend(Tenant $tenant): void
    {
        $tenant->users()->update(['is_active' => false]);
    }

    public function activate(Tenant $tenant): void
    {
        $tenant->users()->update(['is_active' => true]);
    }
}
