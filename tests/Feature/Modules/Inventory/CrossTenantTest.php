<?php

namespace Tests\Feature\Modules\Inventory;

use App\Core\Models\Tenant;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Categoria;
use App\Modules\Inventory\Models\Marca;
use App\Modules\Inventory\Models\Bodega;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossTenantTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private \App\Models\User $userA;

    protected function setUp(): void
    {
        parent::setUp();

        // Tenant A
        $this->tenantA = Tenant::create(['name' => 'Empresa A', 'slug' => uniqid('cta-'), 'email' => 'a@test.com', 'is_active' => true]);
        app()->bind('current_tenant', fn () => $this->tenantA);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->tenantA->id);

        \DB::table('modules')->insertOrIgnore([
            'code' => 'inventory', 'name' => 'Inventario', 'class' => 'Inventory',
            'version' => '1.0.0', 'is_active_globally' => true, 'estado' => 'publicado',
        ]);
        \App\Core\Models\TenantModule::create(['tenant_id' => $this->tenantA->id, 'module_code' => 'inventory', 'is_active' => true]);

        $this->userA = \App\Models\User::factory()->create(['tenant_id' => $this->tenantA->id]);
        foreach (['inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete'] as $perm) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
        $this->userA->givePermissionTo('inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete');
        $this->actingAs($this->userA);

        // Tenant B
        $this->tenantB = Tenant::create(['name' => 'Empresa B', 'slug' => uniqid('ctb-'), 'email' => 'b@test.com', 'is_active' => true]);

        // Insertar datos directamente en BD para Tenant B (sin global scope)
        \DB::table('inventory_productos')->insert([
            'tenant_id' => $this->tenantB->id, 'codigo' => 'B-001', 'nombre' => 'Producto B',
            'unidad_medida' => 'unidad', 'precio_venta' => 5000, 'costo_promedio' => 2000,
            'stock_actual' => 50, 'stock_minimo' => 5, 'is_active' => true,
        ]);
        \DB::table('inventory_categorias')->insert([
            'tenant_id' => $this->tenantB->id, 'nombre' => 'Cat B', 'is_active' => true,
        ]);
        \DB::table('inventory_marcas')->insert([
            'tenant_id' => $this->tenantB->id, 'nombre' => 'Marca B', 'is_active' => true,
        ]);
        \DB::table('inventory_bodegas')->insert([
            'tenant_id' => $this->tenantB->id, 'nombre' => 'Bodega B', 'activo' => true, 'es_principal' => true,
        ]);

        // IDs del Tenant B (sin global scope)
        $this->catBId = \DB::table('inventory_categorias')->where('tenant_id', $this->tenantB->id)->value('id');
        $this->marcaBId = \DB::table('inventory_marcas')->where('tenant_id', $this->tenantB->id)->value('id');
        $this->sedeB = \App\Core\Models\Sede::create(['tenant_id' => $this->tenantB->id, 'nombre' => 'Sede B', 'activo' => true]);
        $this->bodegaBId = \DB::table('inventory_bodegas')->where('tenant_id', $this->tenantB->id)->value('id');
        $this->productoBId = \DB::table('inventory_productos')->where('tenant_id', $this->tenantB->id)->value('id');
    }

    public function test_producto_store_rechaza_categoria_de_otro_tenant(): void
    {
        $this->post(route('inventory.productos.store'), [
            'codigo' => 'CROSS-001',
            'nombre' => 'Intento Cross Tenant',
            'categoria_id' => $this->catBId,
            'unidad_medida' => 'unidad',
            'precio_venta' => 10000,
            'costo_promedio' => 5000,
            'stock_actual' => 10,
            'stock_minimo' => 1,
        ])->assertSessionHasErrors('categoria_id');
    }

    public function test_producto_store_rechaza_marca_de_otro_tenant(): void
    {
        $this->post(route('inventory.productos.store'), [
            'codigo' => 'CROSS-002',
            'nombre' => 'Intento Cross Tenant Marca',
            'marca_id' => $this->marcaBId,
            'unidad_medida' => 'unidad',
            'precio_venta' => 10000,
            'costo_promedio' => 5000,
            'stock_actual' => 10,
            'stock_minimo' => 1,
        ])->assertSessionHasErrors('marca_id');
    }

    public function test_bodega_store_rechaza_sede_de_otro_tenant(): void
    {
        // C-04 CORREGIDO: Rule::exists con tenant_id ahora rechaza sedes ajenas
        $this->post(route('inventory.bodegas.store'), [
            'sede_id' => $this->sedeB->id,
            'nombre' => 'Bodega Cross Tenant',
        ])->assertSessionHasErrors('sede_id');

        // Verificar que NO se creó
        $this->assertDatabaseMissing('inventory_bodegas', [
            'tenant_id' => $this->tenantA->id,
            'nombre' => 'Bodega Cross Tenant',
        ]);
    }

    public function test_producto_no_visible_en_otro_tenant(): void
    {
        $this->get(route('inventory.productos.index'))->assertOk();

        // Con global scope activo, Producto::all() solo retorna productos del tenant A
        $productos = Producto::all();
        $this->assertEmpty($productos->where('tenant_id', $this->tenantB->id));
    }

    public function test_categoria_no_visible_en_otro_tenant(): void
    {
        $categorias = Categoria::all();
        $this->assertEmpty($categorias->where('tenant_id', $this->tenantB->id));
    }

    public function test_ajuste_rechaza_producto_de_otro_tenant(): void
    {
        $bodegaA = Bodega::firstOrCreate(
            ['tenant_id' => $this->tenantA->id, 'nombre' => 'Bodega A'],
            ['activo' => true, 'es_principal' => true]
        );

        $this->post(route('inventory.ajustes.store'), [
            'tipo' => 'entrada',
            'bodega_id' => $bodegaA->id,
            'producto_id' => $this->productoBId,
            'cantidad' => 10,
            'factor_conversion' => 1,
            'observaciones' => 'Intento de ajustar stock de producto ajeno',
        ])->assertSessionHasErrors('producto_id');
    }

    public function test_traslado_rechaza_bodega_de_otro_tenant(): void
    {
        $bodegaA = Bodega::firstOrCreate(
            ['tenant_id' => $this->tenantA->id, 'nombre' => 'Bodega A Traslado'],
            ['activo' => true]
        );
        $productoA = Producto::firstOrCreate(
            ['tenant_id' => $this->tenantA->id, 'codigo' => 'TR-A-001'],
            ['nombre' => 'Producto A Traslado', 'unidad_medida' => 'unidad', 'precio_venta' => 10000, 'costo_promedio' => 5000, 'stock_actual' => 0, 'stock_minimo' => 0, 'is_active' => true]
        );

        $this->post(route('inventory.traslados.store'), [
            'numero' => 'TR-CROSS-001',
            'fecha' => '2026-07-05',
            'bodega_origen_id' => $bodegaA->id,
            'bodega_destino_id' => $this->bodegaBId,
            'detalles' => [
                ['producto_id' => $productoA->id, 'cantidad' => 5],
            ],
        ])->assertSessionHasErrors('bodega_destino_id');
    }
}
