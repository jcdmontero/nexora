<?php

namespace Tests\Feature\Modules\Purchasing;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\Purchasing\Models\OrdenCompra;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossTenantTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private User $userA;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            ['code' => 'purchasing', 'name' => 'Compras', 'class' => 'Purchasing', 'version' => '1.0.0', 'is_active_globally' => true, 'estado' => 'publicado'],
            ['code' => 'inventory', 'name' => 'Inventario', 'class' => 'Inventory', 'version' => '1.0.0', 'is_active_globally' => true, 'estado' => 'publicado'],
        ]);

        // Tenant A
        $this->tenantA = Tenant::create(['name' => 'Empresa A', 'slug' => uniqid('pta-'), 'email' => 'a@test.com', 'is_active' => true]);
        app()->bind('current_tenant', fn () => $this->tenantA);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->tenantA->id);

        TenantModule::create(['tenant_id' => $this->tenantA->id, 'module_code' => 'purchasing', 'is_active' => true]);
        TenantModule::create(['tenant_id' => $this->tenantA->id, 'module_code' => 'inventory', 'is_active' => true]);

        $this->userA = User::factory()->create(['tenant_id' => $this->tenantA->id, 'is_superadmin' => true]);
        foreach (['purchasing:view', 'purchasing:create', 'purchasing:edit', 'purchasing:delete'] as $perm) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
        $this->userA->givePermissionTo(...['purchasing:view', 'purchasing:create', 'purchasing:edit', 'purchasing:delete']);
        $this->actingAs($this->userA);

        // Tenant B
        $this->tenantB = Tenant::create(['name' => 'Empresa B', 'slug' => uniqid('ptb-'), 'email' => 'b@test.com', 'is_active' => true]);

        // Proveedor del Tenant B
        $this->proveedorBId = \DB::table('purchasing_proveedores')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'razon_social' => 'Proveedor B S.A.S.',
            'tipo_documento' => 'NIT',
            'numero_documento' => '900987654',
            'activo' => true,
        ]);

        // Producto del Tenant B
        $this->productoBId = \DB::table('inventory_productos')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'codigo' => 'PROD-B-001',
            'nombre' => 'Producto B',
            'unidad_medida' => 'unidad',
            'precio_venta' => 5000,
            'costo_promedio' => 2000,
            'stock_actual' => 50,
            'stock_minimo' => 5,
            'is_active' => true,
        ]);

        // Orden del Tenant B
        $this->ordenBId = \DB::table('purchasing_ordenes')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'proveedor_id' => $this->proveedorBId,
            'numero' => 'OC-B-001',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);
    }

    // ── VISIBILIDAD ──────────────────────────────────────────────────────

    public function test_proveedor_no_visible_en_otro_tenant(): void
    {
        $this->get(route('purchasing.proveedores.index'))->assertOk();

        $proveedores = Proveedor::all();
        $this->assertEmpty($proveedores->where('tenant_id', $this->tenantB->id));
    }

    public function test_orden_compra_no_visible_en_otro_tenant(): void
    {
        $this->get(route('purchasing.ordenes.index'))->assertOk();

        $ordenes = OrdenCompra::all();
        $this->assertEmpty($ordenes->where('tenant_id', $this->tenantB->id));
    }

    // ── ACCESO DIRECTO POR ID ────────────────────────────────────────────

    public function test_show_proveedor_rechaza_id_de_otro_tenant(): void
    {
        $this->get(route('purchasing.proveedores.edit', $this->proveedorBId))->assertNotFound();
    }

    public function test_show_orden_rechaza_id_de_otro_tenant(): void
    {
        $this->get(route('purchasing.ordenes.show', $this->ordenBId))->assertNotFound();
    }

    public function test_edit_proveedor_rechaza_id_de_otro_tenant(): void
    {
        $this->get(route('purchasing.proveedores.edit', $this->proveedorBId))->assertNotFound();
    }

    public function test_edit_orden_rechaza_id_de_otro_tenant(): void
    {
        $this->get(route('purchasing.ordenes.edit', $this->ordenBId))->assertNotFound();
    }

    // ── ESCRITURA CROSS-TENANT ───────────────────────────────────────────

    public function test_orden_store_rechaza_proveedor_de_otro_tenant(): void
    {
        $productoA = Producto::create([
            'tenant_id' => $this->tenantA->id,
            'codigo' => 'PROD-A-001',
            'nombre' => 'Producto A',
            'unidad_medida' => 'unidad',
            'costo_promedio' => 10000,
            'stock_actual' => 100,
            'stock_minimo' => 5,
            'is_active' => true,
        ]);

        $this->post(route('purchasing.ordenes.store'), [
            'proveedor_id' => $this->proveedorBId,
            'numero' => 'OC-CROSS-001',
            'fecha_emision' => now()->toDateString(),
            'detalles' => [
                ['producto_id' => $productoA->id, 'cantidad' => 10, 'precio_unitario' => 5000],
            ],
        ])->assertSessionHasErrors('proveedor_id');
    }

    public function test_orden_store_rechaza_producto_de_otro_tenant(): void
    {
        $proveedorA = Proveedor::create([
            'tenant_id' => $this->tenantA->id,
            'razon_social' => 'Proveedor A',
            'numero_documento' => '900111111',
        ]);

        $this->post(route('purchasing.ordenes.store'), [
            'proveedor_id' => $proveedorA->id,
            'numero' => 'OC-CROSS-002',
            'fecha_emision' => now()->toDateString(),
            'detalles' => [
                ['producto_id' => $this->productoBId, 'cantidad' => 5, 'precio_unitario' => 3000],
            ],
        ])->assertSessionHasErrors('detalles.*.producto_id');
    }

    public function test_orden_update_rechaza_proveedor_de_otro_tenant(): void
    {
        $ordenA = OrdenCompra::create([
            'tenant_id' => $this->tenantA->id,
            'proveedor_id' => \DB::table('purchasing_proveedores')->insertGetId([
                'tenant_id' => $this->tenantA->id,
                'razon_social' => 'Proveedor A',
                'numero_documento' => '900222222',
            ]),
            'numero' => 'OC-A-UPD',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $productoA = Producto::create([
            'tenant_id' => $this->tenantA->id,
            'codigo' => 'PROD-A-UPD',
            'nombre' => 'Producto A Update',
            'unidad_medida' => 'unidad',
            'costo_promedio' => 10000,
            'stock_actual' => 100,
            'stock_minimo' => 5,
            'is_active' => true,
        ]);

        $this->put(route('purchasing.ordenes.update', $ordenA), [
            'proveedor_id' => $this->proveedorBId,
            'numero' => 'OC-A-UPD',
            'fecha_emision' => now()->toDateString(),
            'detalles' => [
                ['producto_id' => $productoA->id, 'cantidad' => 10, 'precio_unitario' => 5000],
            ],
        ])->assertSessionHasErrors('proveedor_id');
    }

    public function test_proveedor_no_visible_en_otro_tenant_post_create(): void
    {
        // Crear proveedor para tenant A
        $proveedorA = Proveedor::create([
            'tenant_id' => $this->tenantA->id,
            'razon_social' => 'Proveedor Solo A',
            'numero_documento' => '900333333',
        ]);

        // Verificar que el proveedor B no aparece
        $this->get(route('purchasing.proveedores.index'))->assertOk();

        $allProveedores = Proveedor::withoutGlobalScopes()->where('tenant_id', $this->tenantB->id)->get();
        $visibleProveedores = Proveedor::all();

        $this->assertNotEmpty($allProveedores, 'Proveedor B debe existir en BD');
        $this->assertEmpty($visibleProveedores->where('id', $this->proveedorBId), 'Proveedor B no debe ser visible');
    }
}
