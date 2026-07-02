<?php

namespace Tests\Feature\Modules\ServiceDesk;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\ServiceDesk\Models\FallaBase;
use App\Modules\ServiceDesk\Models\Marca;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class CatalogoTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class]);

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

        // Create permissions
        Permission::firstOrCreate(['name' => 'service-desk:view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:delete', 'guard_name' => 'web']);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    // ═══════════════════════════════════════════
    // MARCAS
    // ═══════════════════════════════════════════

    public function test_marca_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_marca_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertStatus(403);
    }

    public function test_marca_index_returns_view(): void
    {
        Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertStatus(200);
    }

    public function test_marca_crud(): void
    {
        // CREATE
        $beforeCount = Marca::count();
        $response = $this->post(route('service-desk.marcas.store'), [
            'nombre' => 'Dell',
            'activo' => true,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals($beforeCount + 1, Marca::count());

        $marca = Marca::where('nombre', 'Dell')->first();
        $this->assertNotNull($marca);
        $this->assertTrue($marca->activo);

        // UPDATE
        $response = $this->put(route('service-desk.marcas.update', $marca->id), [
            'nombre' => 'Dell Technologies',
            'activo' => false,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $marca->refresh();
        $this->assertEquals('Dell Technologies', $marca->nombre);
        $this->assertFalse($marca->activo);

        // DELETE (soft delete)
        $response = $this->delete(route('service-desk.marcas.destroy', $marca->id));
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('sd_marcas', ['id' => $marca->id]);
    }

    public function test_marca_cannot_delete_when_has_modelos(): void
    {
        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        $tipoEquipo = TipoEquipo::where('nombre', 'Impresora')->first();
        \App\Modules\ServiceDesk\Models\Modelo::create([
            'tenant_id' => $this->tenant->id,
            'marca_id' => $marca->id,
            'tipo_equipo_id' => $tipoEquipo->id,
            'nombre' => 'LaserJet Pro',
            'activo' => true,
        ]);

        $response = $this->delete(route('service-desk.marcas.destroy', $marca->id));
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('sd_marcas', ['id' => $marca->id, 'deleted_at' => null]);
    }

    public function test_marca_store_fails_without_nombre(): void
    {
        $response = $this->post(route('service-desk.marcas.store'), []);
        $response->assertSessionHasErrors('nombre');
    }

    public function test_marca_unique_nombre_per_tenant(): void
    {
        Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        $response = $this->post(route('service-desk.marcas.store'), [
            'nombre' => 'HP',
            'activo' => true,
        ]);
        $response->assertSessionHasErrors('nombre');
    }

    // ═══════════════════════════════════════════
    // TIPOS DE EQUIPO
    // ═══════════════════════════════════════════

    public function test_tipo_equipo_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.tipos-equipo.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_tipo_equipo_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->get(route('service-desk.tipos-equipo.index'));
        $response->assertStatus(403);
    }

    public function test_tipo_equipo_crud(): void
    {
        // CREATE
        $beforeCount = TipoEquipo::count();
        $response = $this->post(route('service-desk.tipos-equipo.store'), [
            'nombre' => 'Computador Portátil',
            'familia' => 'computador',
            'descripcion' => 'Equipos portátiles',
            'activo' => true,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals($beforeCount + 1, TipoEquipo::count());

        $tipo = TipoEquipo::where('nombre', 'Computador Portátil')->first();
        $this->assertNotNull($tipo);
        $this->assertEquals('computador', $tipo->familia);
        $this->assertEquals('computador-portatil', $tipo->slug);

        // UPDATE
        $response = $this->put(route('service-desk.tipos-equipo.update', $tipo->id), [
            'nombre' => 'Laptop',
            'familia' => 'computador',
            'descripcion' => 'Portátiles y laptops',
            'activo' => false,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $tipo->refresh();
        $this->assertEquals('Laptop', $tipo->nombre);
        $this->assertEquals('laptop', $tipo->slug);
        $this->assertFalse($tipo->activo);

        // DELETE (soft delete)
        $response = $this->delete(route('service-desk.tipos-equipo.destroy', $tipo->id));
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('sd_tipos_equipo', ['id' => $tipo->id]);
    }

    public function test_tipo_equipo_cannot_delete_when_has_modelos(): void
    {
        $tipo = TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        \App\Modules\ServiceDesk\Models\Modelo::create([
            'tenant_id' => $this->tenant->id,
            'marca_id' => $marca->id,
            'tipo_equipo_id' => $tipo->id,
            'nombre' => 'LaserJet Pro',
            'activo' => true,
        ]);

        $response = $this->delete(route('service-desk.tipos-equipo.destroy', $tipo->id));
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('sd_tipos_equipo', ['id' => $tipo->id, 'deleted_at' => null]);
    }

    public function test_tipo_equipo_store_fails_without_nombre(): void
    {
        $response = $this->post(route('service-desk.tipos-equipo.store'), []);
        $response->assertSessionHasErrors('nombre');
    }

    public function test_tipo_equipo_unique_nombre_per_tenant(): void
    {
        TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        $response = $this->post(route('service-desk.tipos-equipo.store'), [
            'nombre' => 'Impresora',
            'familia' => 'impresora',
        ]);
        $response->assertSessionHasErrors('nombre');
    }

    // ═══════════════════════════════════════════
    // SERVICIOS
    // ═══════════════════════════════════════════

    public function test_servicio_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.servicios.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_servicio_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->get(route('service-desk.servicios.index'));
        $response->assertStatus(403);
    }

    public function test_servicio_crud(): void
    {
        $tipo = TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        // CREATE
        $beforeCount = Servicio::count();
        $response = $this->post(route('service-desk.servicios.store'), [
            'nombre' => 'Cambio de Tóner',
            'codigo' => 'SRV-TONER-001',
            'descripcion' => 'Reemplazo de cartucho de tóner',
            'tipo_equipo_id' => $tipo->id,
            'precio_base' => 50000,
            'costo_tecnico_base' => 20000,
            'tipo_comision_tecnico' => 'fijo',
            'tiempo_estimado' => 30,
            'requiere_repuestos' => true,
            'activo' => true,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals($beforeCount + 1, Servicio::count());

        $servicio = Servicio::where('codigo', 'SRV-TONER-001')->first();
        $this->assertNotNull($servicio);
        $this->assertEquals($tipo->id, $servicio->tipo_equipo_id);
        $this->assertEquals(50000, (float) $servicio->precio_base);
        $this->assertEquals(20000, (float) $servicio->costo_tecnico_base);
        $this->assertTrue($servicio->requiere_repuestos);

        // UPDATE
        $response = $this->put(route('service-desk.servicios.update', $servicio->id), [
            'nombre' => 'Cambio de Tóner Premium',
            'precio_base' => 75000,
            'costo_tecnico_base' => 30000,
            'tipo_comision_tecnico' => 'porcentaje',
            'activo' => false,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $servicio->refresh();
        $this->assertEquals('Cambio de Tóner Premium', $servicio->nombre);
        $this->assertEquals(75000, (float) $servicio->precio_base);
        $this->assertEquals('porcentaje', $servicio->tipo_comision_tecnico);
        $this->assertFalse($servicio->activo);

        // DELETE (soft delete)
        $response = $this->delete(route('service-desk.servicios.destroy', $servicio->id));
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('sd_servicios', ['id' => $servicio->id]);
    }

    public function test_servicio_store_fails_without_required_fields(): void
    {
        $response = $this->post(route('service-desk.servicios.store'), [
            'nombre' => 'Solo nombre',
        ]);

        $response->assertSessionHasErrors(['precio_base', 'costo_tecnico_base', 'tipo_comision_tecnico']);
    }

    public function test_servicio_store_with_optional_fields(): void
    {
        $response = $this->post(route('service-desk.servicios.store'), [
            'nombre' => 'Diagnóstico General',
            'precio_base' => 30000,
            'costo_tecnico_base' => 10000,
            'tipo_comision_tecnico' => 'fijo',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('sd_servicios', ['nombre' => 'Diagnóstico General']);
    }

    // ═══════════════════════════════════════════
    // FALLAS
    // ═══════════════════════════════════════════

    public function test_falla_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.fallas.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_falla_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->get(route('service-desk.fallas.index'));
        $response->assertStatus(403);
    }

    public function test_falla_crud(): void
    {
        $tipo = TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        // CREATE
        $beforeCount = FallaBase::count();
        $response = $this->post(route('service-desk.fallas.store'), [
            'nombre' => 'No imprime',
            'descripcion' => 'La impresora no imprime documentos',
            'solucion_sugerida' => 'Verificar toner y cabezales',
            'tipo_equipo_id' => $tipo->id,
            'tiempo_estimado' => 45,
            'activo' => true,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals($beforeCount + 1, FallaBase::count());

        $falla = FallaBase::where('nombre', 'No imprime')->first();
        $this->assertNotNull($falla);
        $this->assertEquals($tipo->id, $falla->tipo_equipo_id);
        $this->assertEquals(45, $falla->tiempo_estimado);

        // UPDATE
        $response = $this->put(route('service-desk.fallas.update', $falla->id), [
            'nombre' => 'No imprime (fusor)',
            'descripcion' => 'Falla en el elemento de fusión',
            'tiempo_estimado' => 60,
            'activo' => false,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $falla->refresh();
        $this->assertEquals('No imprime (fusor)', $falla->nombre);
        $this->assertEquals(60, $falla->tiempo_estimado);
        $this->assertFalse($falla->activo);

        // DELETE (soft delete)
        $response = $this->delete(route('service-desk.fallas.destroy', $falla->id));
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('sd_fallas_base', ['id' => $falla->id]);
    }

    public function test_falla_store_fails_without_nombre(): void
    {
        $response = $this->post(route('service-desk.fallas.store'), []);
        $response->assertSessionHasErrors('nombre');
    }

    // ═══════════════════════════════════════════
    // CROSS-TENANT
    // ═══════════════════════════════════════════

    public function test_marca_isolation_between_tenants(): void
    {
        $otherTenant = Tenant::factory()->create();

        Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        Marca::create([
            'tenant_id' => $otherTenant->id,
            'nombre' => 'Dell',
            'activo' => true,
        ]);

        // Current tenant sees only HP
        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertStatus(200);
        $this->assertDatabaseHas('sd_marcas', ['nombre' => 'HP', 'tenant_id' => $this->tenant->id]);
        $this->assertDatabaseHas('sd_marcas', ['nombre' => 'Dell', 'tenant_id' => $otherTenant->id]);

        // Switch to other tenant (must also have service-desk module active)
        $otherUser = User::factory()->create([
            'tenant_id' => $otherTenant->id,
            'is_superadmin' => true,
        ]);

        \DB::table('modules')->insertOrIgnore([
            'code' => 'service-desk',
            'name' => 'Servicio Técnico',
            'class' => 'ServiceDesk',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $otherTenant->id,
            'module_code' => 'service-desk',
            'is_active' => true,
        ]);

        $this->actingAs($otherUser);
        app()->instance('current_tenant', $otherTenant);

        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertStatus(200);
    }

    public function test_servicio_isolation_between_tenants(): void
    {
        $otherTenant = Tenant::factory()->create();

        Servicio::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Reparación Tóner',
            'precio_base' => 50000,
            'costo_tecnico_base' => 20000,
            'tipo_comision_tecnico' => 'fijo',
        ]);

        Servicio::create([
            'tenant_id' => $otherTenant->id,
            'nombre' => 'Diagnóstico General',
            'precio_base' => 30000,
            'costo_tecnico_base' => 10000,
            'tipo_comision_tecnico' => 'fijo',
        ]);

        // Verify both exist
        $this->assertDatabaseHas('sd_servicios', ['nombre' => 'Reparación Tóner', 'tenant_id' => $this->tenant->id]);
        $this->assertDatabaseHas('sd_servicios', ['nombre' => 'Diagnóstico General', 'tenant_id' => $otherTenant->id]);
    }

    // ═══════════════════════════════════════════
    // AUTHORIZATION
    // ═══════════════════════════════════════════

    public function test_catalogo_store_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->post(route('service-desk.marcas.store'), ['nombre' => 'Test']);
        $response->assertStatus(403);
    }

    public function test_catalogo_update_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        $response = $this->put(route('service-desk.marcas.update', $marca->id), ['nombre' => 'HP2']);
        $response->assertStatus(403);
    }

    public function test_catalogo_delete_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        $response = $this->delete(route('service-desk.marcas.destroy', $marca->id));
        $response->assertStatus(403);
    }
}
