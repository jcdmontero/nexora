<?php

namespace Tests\Feature\Core;

use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user   = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name'      => 'Usuario Prueba',
            'email'     => 'usuario@empresa.com',
            'password'  => bcrypt('Password1!'),
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    // ─── Edit ────────────────────────────────────────────────────────────

    public function test_edit_requiere_autenticacion(): void
    {
        auth()->logout();
        $this->get(route('core.profile.index'))->assertRedirect(route('core.login'));
    }

    public function test_edit_devuelve_datos_del_usuario(): void
    {
        $this->get(route('core.profile.index'))
            ->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->where('user.email', 'usuario@empresa.com')
                ->where('user.name', 'Usuario Prueba')
            );
    }

    // ─── Update ──────────────────────────────────────────────────────────

    public function test_update_cambia_nombre_y_email(): void
    {
        $this->put(route('core.profile.update'), [
            'name'  => 'Nombre Nuevo',
            'email' => 'nuevo@empresa.com',
        ])->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id'    => $this->user->id,
            'name'  => 'Nombre Nuevo',
            'email' => 'nuevo@empresa.com',
        ]);
    }

    public function test_update_falla_sin_nombre(): void
    {
        $this->put(route('core.profile.update'), [
            'email' => 'valido@x.com',
        ])->assertSessionHasErrors('name');
    }

    public function test_update_falla_email_invalido(): void
    {
        $this->put(route('core.profile.update'), [
            'name'  => 'X',
            'email' => 'no-es-un-email',
        ])->assertSessionHasErrors('email');
    }

    public function test_update_falla_email_duplicado(): void
    {
        User::factory()->create(['email' => 'ocupado@x.com']);

        $this->put(route('core.profile.update'), [
            'name'  => 'X',
            'email' => 'ocupado@x.com',
        ])->assertSessionHasErrors('email');
    }

    public function test_update_permite_mismo_email_propio(): void
    {
        $this->put(route('core.profile.update'), [
            'name'  => 'Sin Cambio Email',
            'email' => 'usuario@empresa.com',
        ])->assertSessionHas('success');
    }

    // ─── UpdatePassword ──────────────────────────────────────────────────

    public function test_update_password_cambia_contrasena(): void
    {
        $this->put(route('core.profile.password'), [
            'current_password'      => 'Password1!',
            'password'              => 'NuevaPass2!',
            'password_confirmation' => 'NuevaPass2!',
        ])->assertSessionHas('success');
    }

    public function test_update_password_falla_con_contrasena_actual_incorrecta(): void
    {
        $this->put(route('core.profile.password'), [
            'current_password'      => 'IncorrectaXX',
            'password'              => 'NuevaPass2!',
            'password_confirmation' => 'NuevaPass2!',
        ])->assertSessionHasErrors('current_password');
    }

    public function test_update_password_falla_sin_confirmacion(): void
    {
        $this->put(route('core.profile.password'), [
            'current_password'      => 'Password1!',
            'password'              => 'NuevaPass2!',
            'password_confirmation' => 'NoCoincide',
        ])->assertSessionHasErrors('password');
    }

    public function test_update_password_falla_contrasena_debil(): void
    {
        $this->put(route('core.profile.password'), [
            'current_password'      => 'Password1!',
            'password'              => '123',
            'password_confirmation' => '123',
        ])->assertSessionHasErrors('password');
    }
}
