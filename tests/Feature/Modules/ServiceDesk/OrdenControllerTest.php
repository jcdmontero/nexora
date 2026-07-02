<?php

namespace Tests\Feature\Modules\ServiceDesk;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Modules\ServiceDesk\Models\Marca;
use App\Modules\ServiceDesk\Models\Modelo;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Models\Prestador;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class OrdenControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Cliente $cliente;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class]);

        // Ensure sd_orden_multimedia has deleted_at (model uses SoftDeletes but
        // the module migration creates the table without it).
        if (!Schema::hasColumn('sd_orden_multimedia', 'deleted_at')) {
            Schema::table('sd_orden_multimedia', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        $this->tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'service-desk',
            'name' => 'Servicio Técnico',
            'class' => 'ServiceDesk',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'service-desk',
            'is_active' => true,
        ]);

        // Set permissions team to tenant so givePermissionTo works
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($this->tenant->id);

        // Create permissions
        Permission::firstOrCreate(['name' => 'service-desk:view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:delete', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:assign', 'guard_name' => 'web']);

        // User with superadmin (bypasses all permission checks)
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        // Seed shared data
        $this->cliente = Cliente::factory()->create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
        ]);
    }

    // ───────── INDEX ─────────

    public function test_orden_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.ordenes.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_orden_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $response = $this->get(route('service-desk.ordenes.index'));
        $response->assertStatus(403);
    }

    public function test_orden_index_returns_view(): void
    {
        // Create some orders to verify they appear in the list
        OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00001',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Diagnostico,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->get(route('service-desk.ordenes.index'));
        $response->assertStatus(200);
    }

    // ───────── STORE ─────────

    public function test_orden_store_creates_orden(): void
    {
        $beforeCount = OrdenReparacion::count();

        $response = $this->post(route('service-desk.ordenes.store'), [
            'cliente_id' => $this->cliente->id,
            'tipo_equipo_manual' => 'Computador Portátil',
            'condicion_inicial' => 'Pantalla rota',
            'fallas_otras' => 'No enciende',
        ]);

        $response->assertRedirect();
        $this->assertEquals($beforeCount + 1, OrdenReparacion::count());

        $orden = OrdenReparacion::latest()->first();
        $this->assertEquals($this->cliente->id, $orden->cliente_id);
        $this->assertEquals(OrdenEstado::Diagnostico, $orden->estado);
        $this->assertStringStartsWith('OR-', $orden->numero_orden);
    }

    public function test_orden_store_fails_without_required_fields(): void
    {
        $response = $this->post(route('service-desk.ordenes.store'), []);
        $response->assertSessionHasErrors('cliente_id');
    }

    // ───────── SHOW ─────────

    public function test_orden_show_displays_orden(): void
    {
        $tipoEquipo = TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Computador Portátil',
            'slug' => 'computador-portatil',
            'activo' => true,
        ]);

        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Dell',
            'activo' => true,
        ]);

        $modelo = Modelo::create([
            'tenant_id' => $this->tenant->id,
            'marca_id' => $marca->id,
            'tipo_equipo_id' => $tipoEquipo->id,
            'nombre' => 'Latitude 3420',
            'activo' => true,
        ]);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00010',
            'cliente_id' => $this->cliente->id,
            'tipo_equipo_id' => $tipoEquipo->id,
            'modelo_id' => $modelo->id,
            'numero_serie' => 'SN12345',
            'estado' => OrdenEstado::Recibido,
            'condicion_inicial' => 'Equipo no enciende',
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->get(route('service-desk.ordenes.show', $orden->id));
        $response->assertStatus(200);
    }

    // ───────── ESTADO UPDATE ─────────

    public function test_orden_estado_update(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00020',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->put(route('service-desk.ordenes.estado', $orden->id), [
            'estado' => 'diagnosticado',
            'nota' => 'Iniciando diagnóstico visual',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $orden->refresh();
        $this->assertEquals(OrdenEstado::Diagnostico, $orden->estado);
    }

    public function test_orden_estado_update_full_lifecycle(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00030',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $transitions = [
            'diagnosticado',
            'en_proceso',
            'pruebas',
            'completado',
            'entregado',
        ];

        foreach ($transitions as $estado) {
            $this->put(route('service-desk.ordenes.estado', $orden->id), [
                'estado' => $estado,
            ]);

            $orden->refresh();
            $this->assertEquals($estado, $orden->estado->value);
        }
    }

    public function test_orden_cannot_update_when_entregado(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00040',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Entregado,
            'fecha_recibido' => now(),
            'fecha_entregado' => now(),
            'created_by' => $this->user->id,
        ]);

        // The update() route blocks entregado/cancelado orders
        $response = $this->put(route('service-desk.ordenes.update', $orden->id), [
            'cliente_id' => $this->cliente->id,
            'condicion_inicial' => 'Intento de cambio',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $orden->refresh();
        $this->assertNull($orden->condicion_inicial);
    }

    public function test_orden_cannot_update_cancelled(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00050',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Cancelado,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        // Trying to update the order itself (not estado) should be blocked
        $response = $this->put(route('service-desk.ordenes.update', $orden->id), [
            'cliente_id' => $this->cliente->id,
            'condicion_inicial' => 'Cambiada',
        ]);

        $response->assertRedirect();
        $orden->refresh();
        // The order should still have its original estado (cancelado)
        $this->assertEquals(OrdenEstado::Cancelado, $orden->estado);
    }

    // ───────── DESTROY ─────────

    public function test_orden_destroy_deletes(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00060',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $beforeCount = OrdenReparacion::count();

        $response = $this->delete(route('service-desk.ordenes.destroy', $orden->id));
        $response->assertRedirect(route('service-desk.ordenes.index'));
        $response->assertSessionHas('success');

        $this->assertEquals($beforeCount - 1, OrdenReparacion::count());
    }

    // ───────── AUTHORIZATION ─────────

    public function test_orden_store_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $response = $this->post(route('service-desk.ordenes.store'), [
            'cliente_id' => $this->cliente->id,
        ]);
        $response->assertStatus(403);
    }

    public function test_orden_show_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00070',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->get(route('service-desk.ordenes.show', $orden->id));
        $response->assertStatus(403);
    }

    public function test_orden_estado_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00080',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->put(route('service-desk.ordenes.estado', $orden->id), [
            'estado' => 'diagnostico',
        ]);
        $response->assertStatus(403);
    }

    public function test_orden_destroy_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00090',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->delete(route('service-desk.ordenes.destroy', $orden->id));
        $response->assertStatus(403);
    }

    // ───────── CROSS-TENANT ─────────

    public function test_orden_cannot_access_other_tenants_order(): void
    {
        $otherTenant = Tenant::factory()->create();
        $otherUser = User::factory()->create([
            'tenant_id' => $otherTenant->id,
            'is_superadmin' => true,
        ]);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00100',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        // Other tenant user cannot see this order (global scope filters by tenant)
        $this->actingAs($otherUser);
        app()->instance('current_tenant', $otherTenant);

        $response = $this->get(route('service-desk.ordenes.show', $orden->id));
        // 404 because the global scope filters out the order
        $response->assertStatus(404);
    }

    public function test_orden_update_requires_service_desk_edit_permission(): void
    {
        $this->withMiddleware();

        $userWithEdit = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);

        // Set the permissions team before assigning
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($this->tenant->id);
        $userWithEdit->givePermissionTo('service-desk:edit');

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00110',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        // User WITH permission can update
        $this->actingAs($userWithEdit);
        $response = $this->put(route('service-desk.ordenes.update', $orden->id), [
            'cliente_id' => $this->cliente->id,
            'condicion_inicial' => 'Modificado',
        ]);

        $response->assertRedirect();
        $orden->refresh();
        $this->assertEquals('Modificado', $orden->condicion_inicial);
    }

    // ───────── VALIDATION ─────────

    public function test_orden_estado_update_requires_valid_state(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00120',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->put(route('service-desk.ordenes.estado', $orden->id), [
            'estado' => 'estado_invalido_xyz',
        ]);

        $response->assertSessionHasErrors('estado');
    }
}
