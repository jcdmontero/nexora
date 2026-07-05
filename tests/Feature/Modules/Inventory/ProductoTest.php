<?php

namespace Tests\Feature\Modules\Inventory;

use App\Core\Models\Tenant;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductoTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedTenant();
    }

    private function seedTenant(): void
    {
        $this->tenant = Tenant::create(['name' => 'Test', 'slug' => uniqid('inv-'), 'email' => 'inv@test.com', 'is_active' => true]);
        app()->bind('current_tenant', fn () => $this->tenant);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);

        \DB::table('modules')->insertOrIgnore([
            'code' => 'inventory', 'name' => 'Inventario', 'class' => 'Inventory',
            'version' => '1.0.0', 'is_active_globally' => true, 'estado' => 'publicado',
        ]);

        \App\Core\Models\TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'inventory',
            'is_active' => true,
        ]);

        $user = \App\Models\User::factory()->create(['tenant_id' => $this->tenant->id]);

        // Crear permisos del módulo
        foreach (['inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete'] as $perm) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
        $user->givePermissionTo('inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete');
        $this->actingAs($user);
    }

    public function test_store_crea_producto(): void
    {
        $this->post(route('inventory.productos.store'), [
            'codigo' => 'PROD-NEW',
            'nombre' => 'Cable USB',
            'unidad_medida' => 'unidad',
            'precio_venta' => 15000,
            'costo_promedio' => 8000,
            'stock_actual' => 50,
            'stock_minimo' => 5,
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_productos', [
            'tenant_id' => $this->tenant->id,
            'codigo' => 'PROD-NEW',
            'nombre' => 'Cable USB',
        ]);
    }

    public function test_store_requiere_codigo_unico(): void
    {
        Producto::create([
            'tenant_id' => $this->tenant->id, 'codigo' => 'DUP-001', 'nombre' => 'Existente',
            'unidad_medida' => 'unidad', 'precio_venta' => 10000, 'costo_promedio' => 5000,
            'stock_actual' => 1, 'stock_minimo' => 1,
        ]);

        $this->post(route('inventory.productos.store'), [
            'codigo' => 'DUP-001', 'nombre' => 'Duplicado', 'unidad_medida' => 'unidad',
            'precio_venta' => 10000, 'costo_promedio' => 5000, 'stock_actual' => 1, 'stock_minimo' => 1,
        ])->assertSessionHasErrors('codigo');
    }

    public function test_update_modifica_producto(): void
    {
        $producto = Producto::create([
            'tenant_id' => $this->tenant->id, 'codigo' => 'UPD-001', 'nombre' => 'Original',
            'unidad_medida' => 'unidad', 'precio_venta' => 10000, 'costo_promedio' => 5000,
            'stock_actual' => 10, 'stock_minimo' => 1,
        ]);

        $this->put(route('inventory.productos.update', $producto->id), [
            'codigo' => 'UPD-001', 'nombre' => 'Modificado', 'unidad_medida' => 'unidad',
            'precio_venta' => 20000, 'costo_promedio' => 5000, 'stock_minimo' => 1,
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_productos', ['id' => $producto->id, 'nombre' => 'Modificado']);
    }

    public function test_delete_elimina_producto(): void
    {
        $producto = Producto::create([
            'tenant_id' => $this->tenant->id, 'codigo' => 'DEL-001', 'nombre' => 'Para borrar',
            'unidad_medida' => 'unidad', 'precio_venta' => 10000, 'costo_promedio' => 5000,
            'stock_actual' => 0, 'stock_minimo' => 0,
        ]);

        $this->delete(route('inventory.productos.destroy', $producto->id))->assertRedirect();
        $this->assertSoftDeleted('inventory_productos', ['id' => $producto->id]);
    }

    public function test_producto_store_con_imagenes(): void
    {
        Storage::fake('public');
        $archivo = UploadedFile::fake()->image('foto.jpg', 200, 200);

        $this->post(route('inventory.productos.store'), [
            'codigo' => 'IMG-001',
            'nombre' => 'Con imagen',
            'unidad_medida' => 'unidad',
            'precio_venta' => 15000,
            'costo_promedio' => 8000,
            'stock_actual' => 10,
            'stock_minimo' => 1,
            'imagenes' => [$archivo],
        ])->assertRedirect();

        $producto = Producto::where('codigo', 'IMG-001')->first();
        $this->assertNotNull($producto);
        $this->assertNotEmpty($producto->imagenes);
    }
}
