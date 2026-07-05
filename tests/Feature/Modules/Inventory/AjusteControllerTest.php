<?php

namespace Tests\Feature\Modules\Inventory;

use App\Core\Models\Tenant;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use App\Modules\Inventory\Models\InventoryAdjustment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AjusteControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private \App\Models\User $user;
    private Producto $producto;
    private Bodega $bodega;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['name' => 'Test', 'slug' => uniqid('aj-'), 'email' => 'aj@test.com', 'is_active' => true]);
        app()->bind('current_tenant', fn () => $this->tenant);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);

        \DB::table('modules')->insertOrIgnore([
            'code' => 'inventory', 'name' => 'Inventario', 'class' => 'Inventory',
            'version' => '1.0.0', 'is_active_globally' => true, 'estado' => 'publicado',
        ]);
        \App\Core\Models\TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'inventory', 'is_active' => true]);

        $this->user = \App\Models\User::factory()->create(['tenant_id' => $this->tenant->id]);
        foreach (['inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete'] as $perm) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
        $this->user->givePermissionTo('inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete');
        $this->actingAs($this->user);

        $this->bodega = Bodega::create([
            'tenant_id' => $this->tenant->id, 'nombre' => 'Bodega Central',
            'activo' => true, 'es_principal' => true,
        ]);

        $this->producto = Producto::create([
            'tenant_id' => $this->tenant->id, 'codigo' => 'AJ-001', 'nombre' => 'Producto Ajuste',
            'unidad_medida' => 'unidad', 'precio_venta' => 10000, 'costo_promedio' => 5000,
            'stock_actual' => 100, 'stock_minimo' => 10, 'is_active' => true,
        ]);

        // Sincronizar Stock record con stock_actual
        Stock::create(['producto_id' => $this->producto->id, 'bodega_id' => $this->bodega->id, 'cantidad' => 100]);
    }

    public function test_entrada_incrementa_stock(): void
    {
        $this->post(route('inventory.ajustes.store'), [
            'tipo' => 'entrada',
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'cantidad' => 50,
            'factor_conversion' => 1,
            'observaciones' => 'Entrada de mercancía nueva al almacén',
        ])->assertRedirect();

        $this->producto->refresh();
        $this->assertEquals(150, (float) $this->producto->stock_actual);

        $stock = Stock::where('producto_id', $this->producto->id)->where('bodega_id', $this->bodega->id)->first();
        $this->assertNotNull($stock);
        $this->assertEquals(150, (float) $stock->cantidad);

        $this->assertDatabaseHas('inventory_adjustments', [
            'producto_id' => $this->producto->id,
            'bodega_id' => $this->bodega->id,
            'tipo' => 'entrada',
            'cantidad' => 50,
            'cantidad_base' => 50,
        ]);
    }

    public function test_salida_decrementa_stock(): void
    {
        $this->post(route('inventory.ajustes.store'), [
            'tipo' => 'salida',
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'cantidad' => 30,
            'factor_conversion' => 1,
            'observaciones' => 'Salida para entrega al cliente',
        ])->assertRedirect();

        $this->producto->refresh();
        $this->assertEquals(70, (float) $this->producto->stock_actual);

        $stock = Stock::where('producto_id', $this->producto->id)->where('bodega_id', $this->bodega->id)->first();
        $this->assertEquals(70, (float) $stock->cantidad);
    }

    public function test_salida_rechaza_stock_insuficiente(): void
    {
        // Override Stock to have only 10 units
        \DB::table('inventory_stocks')
            ->where('producto_id', $this->producto->id)
            ->where('bodega_id', $this->bodega->id)
            ->update(['cantidad' => 10]);

        $response = $this->post(route('inventory.ajustes.store'), [
            'tipo' => 'salida',
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'cantidad' => 50,
            'factor_conversion' => 1,
            'observaciones' => 'Intento de salida mayor al stock disponible',
        ]);

        $response->assertSessionHasErrors('cantidad');
        $this->assertEquals(100, (float) $this->producto->refresh()->stock_actual);
    }

    public function test_ajuste_directo_setea_stock(): void
    {
        // Stock already created in setUp with cantidad=100
        $this->post(route('inventory.ajustes.store'), [
            'tipo' => 'ajuste',
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'cantidad' => 75,
            'factor_conversion' => 1,
            'observaciones' => 'Inventario físico revela 75 unidades',
        ])->assertRedirect();

        $stock = Stock::where('producto_id', $this->producto->id)->where('bodega_id', $this->bodega->id)->first();
        $this->assertEquals(75, (float) $stock->cantidad);
    }

    public function test_ajuste_requiere_observaciones_min_5_caracteres(): void
    {
        $this->post(route('inventory.ajustes.store'), [
            'tipo' => 'entrada',
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'cantidad' => 10,
            'factor_conversion' => 1,
            'observaciones' => 'Cort',
        ])->assertSessionHasErrors('observaciones');
    }

    public function test_factor_conversion_multipliica_cantidad(): void
    {
        $this->post(route('inventory.ajustes.store'), [
            'tipo' => 'entrada',
            'bodega_id' => $this->bodega->id,
            'producto_id' => $this->producto->id,
            'cantidad' => 3,
            'factor_conversion' => 12,
            'observaciones' => '3 docenas de producto ingresadas',
        ])->assertRedirect();

        $this->producto->refresh();
        $this->assertEquals(136, (float) $this->producto->stock_actual);

        $ajuste = InventoryAdjustment::latest()->first();
        $this->assertEquals(3, (float) $ajuste->cantidad);
        $this->assertEquals(12, (float) $ajuste->factor_conversion);
        $this->assertEquals(36, (float) $ajuste->cantidad_base);
    }
}
