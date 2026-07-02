<?php

namespace Tests\Feature\Modules\Inventory;

use App\Core\Models\Sede;
use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Categoria;
use App\Modules\Inventory\Models\Marca;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogosInventarioTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Sede $sede;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'inventory', 'name' => 'Inventario', 'class' => 'Inventory', 'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();
        TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'inventory', 'is_active' => true]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => true]);
        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        $this->sede = Sede::create([
            'tenant_id' => $this->tenant->id,
            'nombre'    => 'Sede Principal',
            'activo'    => true,
        ]);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CATEGORÍAS
    // ═══════════════════════════════════════════════════════════════

    public function test_categorias_index_requiere_autenticacion(): void
    {
        auth()->logout();
        $this->get(route('inventory.categorias.index'))->assertRedirect(route('core.login'));
    }

    public function test_categoria_store_crea_categoria(): void
    {
        $response = $this->post(route('inventory.categorias.store'), [
            'nombre' => 'Electrónica',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('inventory_categorias', [
            'tenant_id' => $this->tenant->id,
            'nombre'    => 'Electrónica',
        ]);
    }

    public function test_categoria_store_falla_nombre_duplicado_en_mismo_tenant(): void
    {
        Categoria::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Duplicada']);

        $this->post(route('inventory.categorias.store'), [
            'nombre' => 'Duplicada',
        ])->assertSessionHasErrors('nombre');
    }

    public function test_categoria_store_permite_mismo_nombre_en_diferente_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        Categoria::create(['tenant_id' => $tenantB->id, 'nombre' => 'Compartida']);

        $this->post(route('inventory.categorias.store'), [
            'nombre' => 'Compartida',
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_categorias', [
            'tenant_id' => $this->tenant->id,
            'nombre'    => 'Compartida',
        ]);
    }

    public function test_categoria_update_modifica_nombre(): void
    {
        $cat = Categoria::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Original']);

        $this->put(route('inventory.categorias.update', $cat), [
            'nombre' => 'Modificada',
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_categorias', ['id' => $cat->id, 'nombre' => 'Modificada']);
    }

    public function test_categoria_destroy_elimina(): void
    {
        $cat = Categoria::create(['tenant_id' => $this->tenant->id, 'nombre' => 'A Borrar']);

        $this->delete(route('inventory.categorias.destroy', $cat))->assertRedirect();

        $this->assertSoftDeleted('inventory_categorias', ['id' => $cat->id]);
    }

    public function test_categoria_aislamiento_entre_tenants(): void
    {
        $tenantB = Tenant::factory()->create();
        $catB    = Categoria::create(['tenant_id' => $tenantB->id, 'nombre' => 'Cat Tenant B']);

        $visible = Categoria::all();
        $this->assertFalse($visible->contains('id', $catB->id));
    }

    // ═══════════════════════════════════════════════════════════════
    //  MARCAS
    // ═══════════════════════════════════════════════════════════════

    public function test_marca_store_crea_marca(): void
    {
        $this->post(route('inventory.marcas.store'), [
            'nombre' => 'Samsung',
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_marcas', [
            'tenant_id' => $this->tenant->id,
            'nombre'    => 'Samsung',
        ]);
    }

    public function test_marca_store_falla_sin_nombre(): void
    {
        $this->post(route('inventory.marcas.store'), [])->assertSessionHasErrors('nombre');
    }

    public function test_marca_store_falla_nombre_duplicado(): void
    {
        Marca::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Dup']);

        $this->post(route('inventory.marcas.store'), ['nombre' => 'Dup'])
            ->assertSessionHasErrors('nombre');
    }

    public function test_marca_update_modifica_nombre(): void
    {
        $marca = Marca::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Sony']);

        $this->put(route('inventory.marcas.update', $marca), ['nombre' => 'Sony Corp'])
            ->assertRedirect();

        $this->assertDatabaseHas('inventory_marcas', ['id' => $marca->id, 'nombre' => 'Sony Corp']);
    }

    public function test_marca_destroy_elimina(): void
    {
        $marca = Marca::create(['tenant_id' => $this->tenant->id, 'nombre' => 'A Borrar']);

        $this->delete(route('inventory.marcas.destroy', $marca))->assertRedirect();

        $this->assertSoftDeleted('inventory_marcas', ['id' => $marca->id]);
    }

    public function test_marca_aislamiento_entre_tenants(): void
    {
        $tenantB = Tenant::factory()->create();
        $marcaB  = Marca::create(['tenant_id' => $tenantB->id, 'nombre' => 'Marca B']);

        $this->assertFalse(Marca::all()->contains('id', $marcaB->id));
    }

    // ═══════════════════════════════════════════════════════════════
    //  BODEGAS
    // ═══════════════════════════════════════════════════════════════

    public function test_bodegas_index_devuelve_pagina(): void
    {
        $this->get(route('inventory.bodegas.index'))->assertStatus(200);
    }

    public function test_bodega_store_crea_bodega(): void
    {
        $this->post(route('inventory.bodegas.store'), [
            'sede_id'     => $this->sede->id,
            'nombre'      => 'Bodega Principal',
            'direccion'   => 'Calle 10 #5-20',
            'es_principal' => true,
            'activo'      => true,
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_bodegas', [
            'tenant_id' => $this->tenant->id,
            'nombre'    => 'Bodega Principal',
        ]);
    }

    public function test_bodega_store_falla_sin_nombre(): void
    {
        $this->post(route('inventory.bodegas.store'), [
            'sede_id' => $this->sede->id,
        ])->assertSessionHasErrors('nombre');
    }

    public function test_bodega_store_falla_sin_sede(): void
    {
        $this->post(route('inventory.bodegas.store'), [
            'nombre' => 'Sin Sede',
        ])->assertSessionHasErrors('sede_id');
    }

    public function test_bodega_update_modifica_nombre(): void
    {
        $bodega = Bodega::create([
            'tenant_id' => $this->tenant->id,
            'sede_id'   => $this->sede->id,
            'nombre'    => 'Bodega A',
        ]);

        $this->put(route('inventory.bodegas.update', $bodega), [
            'sede_id' => $this->sede->id,
            'nombre'  => 'Bodega A Renombrada',
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_bodegas', [
            'id'     => $bodega->id,
            'nombre' => 'Bodega A Renombrada',
        ]);
    }

    public function test_bodega_destroy_elimina_no_principal(): void
    {
        $bodega = Bodega::create([
            'tenant_id'    => $this->tenant->id,
            'sede_id'      => $this->sede->id,
            'nombre'       => 'Secundaria',
            'es_principal' => false,
        ]);

        $this->delete(route('inventory.bodegas.destroy', $bodega))->assertRedirect();

        $this->assertSoftDeleted('inventory_bodegas', ['id' => $bodega->id]);
    }

    public function test_bodega_aislamiento_entre_tenants(): void
    {
        $tenantB = Tenant::factory()->create();
        $sedeB   = Sede::create(['tenant_id' => $tenantB->id, 'nombre' => 'Sede B', 'activo' => true]);
        $bodegaB = Bodega::create(['tenant_id' => $tenantB->id, 'sede_id' => $sedeB->id, 'nombre' => 'Bodega B']);

        $this->assertFalse(Bodega::all()->contains('id', $bodegaB->id));
    }
}
