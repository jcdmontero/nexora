<?php

namespace Tests\Feature\Core;

use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_user_can_login_without_subdomain(): void
    {
        $this->startSession();

        $tenant = Tenant::factory()->create();
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'empleado@empresa.com',
            'password' => bcrypt('secret123'),
            'is_superadmin' => false,
        ]);

        $response = $this->post(route('core.login'), [
            '_token' => csrf_token(),
            'email' => 'empleado@empresa.com',
            'password' => 'secret123',
        ]);

        $response->assertRedirect(route('core.dashboard'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $tenant = Tenant::factory()->create();
        User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'empleado@empresa.com',
            'password' => bcrypt('secret123'),
        ]);

        $this->post(route('core.login'), [
            'email' => 'empleado@empresa.com',
            'password' => 'incorrecta',
        ]);

        $this->assertGuest();
    }
}
