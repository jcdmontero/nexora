<?php

namespace Tests\Feature\Core;

use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $admin;
    private Role $rol;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->rol = Role::firstOrCreate(
            ['name' => 'ADMIN_EMPRESA', 'guard_name' => 'web', 'team_id' => $this->tenant->id]
        );

        $this->admin = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->admin);
        app()->instance('current_tenant', $this->tenant);
    }

    // ─── Index ───────────────────────────────────────────────────────────

    public function test_index_requiere_autenticacion(): void
    {
        auth()->logout();
        $this->get(route('core.users.index'))->assertRedirect(route('core.login'));
    }

    public function test_index_muestra_usuarios_del_tenant(): void
    {
        User::factory()->create(['tenant_id' => $this->tenant->id, 'name' => 'Empleado Uno']);

        $this->get(route('core.users.index'))->assertStatus(200);
    }

    // ─── Store ───────────────────────────────────────────────────────────

    public function test_store_crea_usuario_correctamente(): void
    {
        $response = $this->post(route('core.users.store'), [
            'name'                  => 'Nuevo Empleado',
            'email'                 => 'nuevo@empresa.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role'                  => 'ADMIN_EMPRESA',
        ]);

        $response->assertRedirect(route('core.users.index'));
        $this->assertDatabaseHas('users', [
            'tenant_id' => $this->tenant->id,
            'email'     => 'nuevo@empresa.com',
            'name'      => 'Nuevo Empleado',
        ]);
    }

    public function test_store_falla_sin_nombre(): void
    {
        $this->post(route('core.users.store'), [
            'email'                 => 'x@x.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role'                  => 'ADMIN_EMPRESA',
        ])->assertSessionHasErrors('name');
    }

    public function test_store_falla_email_duplicado(): void
    {
        User::factory()->create(['email' => 'duplicado@x.com']);

        $this->post(route('core.users.store'), [
            'name'                  => 'X',
            'email'                 => 'duplicado@x.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role'                  => 'ADMIN_EMPRESA',
        ])->assertSessionHasErrors('email');
    }

    public function test_store_falla_con_contrasena_debil(): void
    {
        $this->post(route('core.users.store'), [
            'name'                  => 'X',
            'email'                 => 'x@x.com',
            'password'              => '123',
            'password_confirmation' => '123',
            'role'                  => 'ADMIN_EMPRESA',
        ])->assertSessionHasErrors('password');
    }

    // ─── Edit / Update ───────────────────────────────────────────────────

    public function test_edit_bloquea_usuario_de_otro_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        $userB   = User::factory()->create(['tenant_id' => $tenantB->id]);

        $this->get(route('core.users.edit', $userB))->assertStatus(403);
    }

    public function test_update_modifica_nombre_y_email(): void
    {
        $otro = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Original',
            'email'     => 'original@x.com',
        ]);

        $this->put(route('core.users.update', $otro), [
            'name'  => 'Actualizado',
            'email' => 'actualizado@x.com',
            'role'  => 'ADMIN_EMPRESA',
        ])->assertRedirect(route('core.users.index'));

        $this->assertDatabaseHas('users', [
            'id'    => $otro->id,
            'name'  => 'Actualizado',
            'email' => 'actualizado@x.com',
        ]);
    }

    public function test_update_impide_autodesactivacion(): void
    {
        $response = $this->put(route('core.users.update', $this->admin), [
            'name'      => $this->admin->name,
            'email'     => $this->admin->email,
            'role'      => 'ADMIN_EMPRESA',
            'is_active' => false,
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $this->admin->id, 'is_active' => true]);
    }

    public function test_update_bloquea_usuario_de_otro_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        $userB   = User::factory()->create(['tenant_id' => $tenantB->id]);

        $this->put(route('core.users.update', $userB), [
            'name'  => 'Hack',
            'email' => 'hack@x.com',
            'role'  => 'ADMIN_EMPRESA',
        ])->assertStatus(403);
    }

    // ─── Destroy ─────────────────────────────────────────────────────────

    public function test_destroy_elimina_usuario(): void
    {
        $otro = User::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->delete(route('core.users.destroy', $otro))
            ->assertRedirect(route('core.users.index'));

        $this->assertDatabaseMissing('users', ['id' => $otro->id]);
    }

    public function test_destroy_impide_autoeliminacion(): void
    {
        $this->delete(route('core.users.destroy', $this->admin))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    public function test_destroy_impide_eliminar_ultimo_admin(): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);
        $this->admin->assignRole('ADMIN_EMPRESA');

        // Segundo superadmin que intenta eliminar al único ADMIN_EMPRESA
        $superOtro = User::factory()->create([
            'tenant_id'    => $this->tenant->id,
            'is_superadmin' => true,
        ]);
        $this->actingAs($superOtro);
        app()->instance('current_tenant', $this->tenant);

        $this->delete(route('core.users.destroy', $this->admin))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }

    public function test_destroy_bloquea_usuario_de_otro_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        $userB   = User::factory()->create(['tenant_id' => $tenantB->id]);

        $this->delete(route('core.users.destroy', $userB))->assertStatus(403);
    }

    // ─── Tenant isolation ────────────────────────────────────────────────

    public function test_store_asigna_tenant_id_automaticamente(): void
    {
        $this->post(route('core.users.store'), [
            'name'                  => 'Aislado',
            'email'                 => 'aislado@x.com',
            'password'              => 'Password1!',
            'password_confirmation' => 'Password1!',
            'role'                  => 'ADMIN_EMPRESA',
        ]);

        $this->assertDatabaseHas('users', [
            'email'     => 'aislado@x.com',
            'tenant_id' => $this->tenant->id,
        ]);
    }
}
