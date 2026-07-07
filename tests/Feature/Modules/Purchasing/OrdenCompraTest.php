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

class OrdenCompraTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'purchasing',
            'name' => 'Compras',
            'class' => 'Purchasing',
            'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();

        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'purchasing',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    private function createProveedor(): Proveedor
    {
        return Proveedor::create([
            'tenant_id' => $this->tenant->id,
            'razon_social' => 'Proveedor Test',
            'tipo_documento' => 'NIT',
            'numero_documento' => '900123456',
        ]);
    }

    private function createProducto(): Producto
    {
        return Producto::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => 'PROD-001',
            'nombre' => 'Producto Test',
            'unidad_medida' => 'unidad',
            'costo_promedio' => 10000,
            'stock_actual' => 100,
            'stock_minimo' => 5,
            'is_active' => true,
        ]);
    }

    private function ordenData(Proveedor $proveedor, Producto $producto, string $numero = 'OC-TEST-001'): array
    {
        return [
            'proveedor_id' => $proveedor->id,
            'numero' => $numero,
            'fecha_emision' => now()->toDateString(),
            'detalles' => [
                ['producto_id' => $producto->id, 'cantidad' => 10, 'precio_unitario' => 10000],
            ],
        ];
    }

    public function test_store_creates_orden(): void
    {
        $proveedor = $this->createProveedor();
        $producto = $this->createProducto();

        $response = $this->post(route('purchasing.ordenes.store'), $this->ordenData($proveedor, $producto));

        $response->assertRedirect();

        $this->assertDatabaseHas('purchasing_ordenes', [
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TEST-001',
            'estado' => 'borrador',
        ]);

        $this->assertDatabaseHas('purchasing_orden_detalles', [
            'tenant_id' => $this->tenant->id,
            'producto_id' => $producto->id,
            'cantidad' => 10,
            'precio_unitario' => 10000,
            'subtotal' => 100000,
        ]);
    }

    public function test_store_rejects_duplicate_numero(): void
    {
        $proveedor = $this->createProveedor();
        $producto = $this->createProducto();

        $this->post(route('purchasing.ordenes.store'), $this->ordenData($proveedor, $producto, 'OC-DUP'));

        $response = $this->post(route('purchasing.ordenes.store'), $this->ordenData($proveedor, $producto, 'OC-DUP'));

        $response->assertSessionHasErrors('numero');
    }

    public function test_update_modifies_orden(): void
    {
        $proveedor = $this->createProveedor();
        $producto = $this->createProducto();

        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-UPD-001',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->put(route('purchasing.ordenes.update', $orden), [
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-UPD-001',
            'fecha_emision' => now()->toDateString(),
            'detalles' => [
                ['producto_id' => $producto->id, 'cantidad' => 5, 'precio_unitario' => 20000],
            ],
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('purchasing_ordenes', [
            'id' => $orden->id,
            'subtotal' => 100000,
            'total' => 100000,
        ]);
    }

    public function test_update_rejected_if_not_borrador(): void
    {
        $proveedor = $this->createProveedor();

        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-NOUPD',
            'estado' => 'enviada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->put(route('purchasing.ordenes.update', $orden), [
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-NOUPD',
            'fecha_emision' => now()->toDateString(),
            'detalles' => [['producto_id' => 1, 'cantidad' => 1, 'precio_unitario' => 0]],
        ]);

        $response->assertSessionHas('error');
    }

    public function test_destroy_only_borrador(): void
    {
        $proveedor = $this->createProveedor();

        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-DEL-001',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->delete(route('purchasing.ordenes.destroy', $orden));

        $response->assertRedirect();
        $this->assertSoftDeleted('purchasing_ordenes', ['id' => $orden->id]);
    }

    public function test_destroy_rejected_if_not_borrador(): void
    {
        $proveedor = $this->createProveedor();

        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-NODEL',
            'estado' => 'enviada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->delete(route('purchasing.ordenes.destroy', $orden));

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'deleted_at' => null]);
    }

    // --- State transition tests ---

    public function test_transition_borrador_to_enviada(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-001',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'enviada']);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'enviada']);
    }

    public function test_transition_borrador_to_cancelada(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-002',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'cancelada']);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'cancelada']);
    }

    public function test_transition_enviada_to_recibida_is_blocked(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-003',
            'estado' => 'enviada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'recibida']);

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'enviada']);
    }

    public function test_transition_enviada_to_cancelada(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-004',
            'estado' => 'enviada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'cancelada']);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'cancelada']);
    }

    public function test_transition_borrador_to_recibida_is_blocked(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-005',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'recibida']);

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'borrador']);
    }

    public function test_cancelled_orden_cannot_transition(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-006',
            'estado' => 'cancelada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'borrador']);

        $response->assertSessionHas('error');
    }
}
