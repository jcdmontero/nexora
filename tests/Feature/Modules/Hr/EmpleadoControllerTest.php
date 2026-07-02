<?php

namespace Tests\Feature\Modules\Hr;

use App\Core\Http\Middleware\EnsureModuleActive;
use App\Core\Models\Sede;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmpleadoControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Sede $sede;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([
            \Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class,
            EnsureModuleActive::class,
        ]);

        // Cargar migraciones de módulos HR (no se auto-descubren sin Service Provider)
        $this->artisan('migrate', ['--path' => 'app/Modules/Hr/Migrations', '--realpath' => true]);

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->sede = Sede::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Sede Principal',
            'direccion' => 'Calle 100',
            'es_principal' => true,
            'activo' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    // =========================================================================
    //  AUTENTICACIÓN Y PERMISOS
    // =========================================================================

    public function test_empleado_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('hr.empleados.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_empleado_index_requires_permission(): void
    {
        $this->withMiddleware();

        $userSinPermiso = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userSinPermiso);

        $response = $this->get(route('hr.empleados.index'));
        $response->assertStatus(403);
    }

    // =========================================================================
    //  ÍNDICE
    // =========================================================================

    public function test_empleado_index_loads_empleados(): void
    {
        $empleado = Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '1234567890',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'juan@test.com',
            'estado' => true,
        ]);

        $response = $this->get(route('hr.empleados.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('empleados.data')
            ->where('empleados.data.0.id', $empleado->id)
        );
    }

    public function test_empleado_index_filters_by_tenant(): void
    {
        // Empleado del tenant actual
        Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '1111111111',
            'nombres' => 'Empleado',
            'apellidos' => 'Propio',
            'estado' => true,
        ]);

        // Empleado de otro tenant
        $otroTenant = Tenant::factory()->create();
        $otraSede = Sede::create([
            'tenant_id' => $otroTenant->id,
            'nombre' => 'Sede Otro',
            'activo' => true,
        ]);
        Empleado::create([
            'tenant_id' => $otroTenant->id,
            'sede_id' => $otraSede->id,
            'documento' => '2222222222',
            'nombres' => 'Empleado',
            'apellidos' => 'Ajeno',
            'estado' => true,
        ]);

        $response = $this->get(route('hr.empleados.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('empleados.total', 1)
        );
    }

    // =========================================================================
    //  CREAR / STORE
    // =========================================================================

    public function test_empleado_store_creates_empleado(): void
    {
        $response = $this->post(route('hr.empleados.store'), [
            'documento' => '9876543210',
            'nombres' => 'María',
            'apellidos' => 'García',
            'email' => 'maria@test.com',
            'telefono' => '3001234567',
            'sede_id' => $this->sede->id,
        ]);

        $empleado = Empleado::where('documento', '9876543210')->first();

        $this->assertNotNull($empleado);
        $this->assertEquals('María', $empleado->nombres);
        $this->assertEquals('García', $empleado->apellidos);
        $this->assertEquals($this->tenant->id, $empleado->tenant_id);
        $this->assertEquals($this->sede->id, $empleado->sede_id);
        $this->assertTrue($empleado->estado);

        $response->assertRedirectToRoute('hr.empleados.show', $empleado->id);
        $response->assertSessionHas('success');
    }

    public function test_empleado_store_validates_required_fields(): void
    {
        $response = $this->post(route('hr.empleados.store'), []);

        $response->assertSessionHasErrors(['documento', 'nombres', 'apellidos', 'sede_id']);
    }

    public function test_empleado_store_rejects_duplicate_documento(): void
    {
        Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '1111111111',
            'nombres' => 'Existente',
            'apellidos' => 'Surname',
            'estado' => true,
        ]);

        $response = $this->post(route('hr.empleados.store'), [
            'documento' => '1111111111',
            'nombres' => 'Nuevo',
            'apellidos' => 'Empleado',
            'sede_id' => $this->sede->id,
        ]);

        $response->assertSessionHasErrors('documento');
    }

    // =========================================================================
    //  SHOW
    // =========================================================================

    public function test_empleado_show_displays_empleado(): void
    {
        $empleado = Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '5555555555',
            'nombres' => 'Carlos',
            'apellidos' => 'López',
            'email' => 'carlos@test.com',
            'telefono' => '3009876543',
            'estado' => true,
        ]);

        $response = $this->get(route('hr.empleados.show', $empleado->id));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('empleado.id', $empleado->id)
            ->where('empleado.nombres', 'Carlos')
            ->where('empleado.apellidos', 'López')
        );
    }

    public function test_empleado_show_rejects_cross_tenant_access(): void
    {
        $otroTenant = Tenant::factory()->create();
        $otraSede = Sede::create([
            'tenant_id' => $otroTenant->id,
            'nombre' => 'Sede Ajena',
            'activo' => true,
        ]);
        $empleadoAjeno = Empleado::create([
            'tenant_id' => $otroTenant->id,
            'sede_id' => $otraSede->id,
            'documento' => '9999999999',
            'nombres' => 'Ajeno',
            'apellidos' => 'Tenant',
            'estado' => true,
        ]);

        $response = $this->get(route('hr.empleados.show', $empleadoAjeno->id));

        $response->assertStatus(403);
    }

    // =========================================================================
    //  UPDATE
    // =========================================================================

    public function test_empleado_update_modifies_fields(): void
    {
        $empleado = Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '4444444444',
            'nombres' => 'Antes',
            'apellidos' => 'Original',
            'email' => 'antes@test.com',
            'telefono' => '3000000000',
            'estado' => true,
        ]);

        $response = $this->put(route('hr.empleados.update', $empleado->id), [
            'documento' => '4444444444',
            'nombres' => 'Después',
            'apellidos' => 'Modificado',
            'email' => 'despues@test.com',
            'telefono' => '3001111111',
            'sede_id' => $this->sede->id,
            'estado' => true,
        ]);

        // El controller usa back() — verificar que redirige
        $response->assertStatus(302);
        $response->assertSessionHas('success');

        $empleado->refresh();
        $this->assertEquals('Después', $empleado->nombres);
        $this->assertEquals('Modificado', $empleado->apellidos);
        $this->assertEquals('despues@test.com', $empleado->email);
    }

    public function test_empleado_update_rejects_cross_tenant(): void
    {
        $otroTenant = Tenant::factory()->create();
        $otraSede = Sede::create([
            'tenant_id' => $otroTenant->id,
            'nombre' => 'Sede Ajena',
            'activo' => true,
        ]);
        $empleadoAjeno = Empleado::create([
            'tenant_id' => $otroTenant->id,
            'sede_id' => $otraSede->id,
            'documento' => '8888888888',
            'nombres' => 'Ajeno',
            'apellidos' => 'Tenant',
            'estado' => true,
        ]);

        $response = $this->put(route('hr.empleados.update', $empleadoAjeno->id), [
            'documento' => '8888888888',
            'nombres' => 'Hacked',
            'apellidos' => 'User',
            'sede_id' => $otraSede->id,
        ]);

        $response->assertStatus(403);
    }

    // =========================================================================
    //  DELETE (no soportado)
    // =========================================================================

    public function test_empleado_cannot_delete_with_active_contract(): void
    {
        $empleado = Empleado::create([
            'tenant_id' => $this->tenant->id,
            'sede_id' => $this->sede->id,
            'documento' => '7777777777',
            'nombres' => 'NoBorrar',
            'apellidos' => 'Test',
            'estado' => true,
        ]);

        // Crear contrato activo
        Contrato::create([
            'empleado_id' => $empleado->id,
            'tipo_contrato' => 'indefinido',
            'cargo' => 'Desarrollador',
            'salario_base' => 5000000,
            'fecha_inicio' => '2026-01-01',
            'estado' => true,
        ]);

        // Intentar DELETE — la ruta no existe (solo GET/PUT), retorna 405 Method Not Allowed
        $response = $this->delete(route('hr.empleados.show', $empleado->id));

        $response->assertStatus(405);

        // Verificar que el empleado y su contrato siguen existiendo
        $this->assertDatabaseHas('hr_empleados', ['id' => $empleado->id, 'estado' => true]);
        $this->assertDatabaseHas('hr_contratos', [
            'empleado_id' => $empleado->id,
            'estado' => true,
        ]);
    }
}
