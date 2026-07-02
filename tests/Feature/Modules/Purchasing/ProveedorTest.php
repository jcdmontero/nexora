<?php

namespace Tests\Feature\Modules\Purchasing;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\Purchasing\Models\OrdenCompra;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProveedorTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure the 'purchasing' module exists in the modules catalog
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

    public function test_proveedor_index_requires_auth(): void
    {
        auth()->logout();
        $response = $this->get(route('purchasing.proveedores.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_proveedor_store_creates_proveedor(): void
    {
        $response = $this->post(route('purchasing.proveedores.store'), [
            'razon_social' => 'Proveedor Test S.A.S.',
            'tipo_documento' => 'NIT',
            'numero_documento' => '900123456',
            'email' => 'contacto@proveedor.test',
            'telefono' => '3001234567',
            'ciudad' => 'Bogotá',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('purchasing_proveedores', [
            'tenant_id' => $this->tenant->id,
            'razon_social' => 'Proveedor Test S.A.S.',
            'numero_documento' => '900123456',
            'activo' => true,
        ]);
    }

    public function test_proveedor_update_modifies_fields(): void
    {
        $proveedor = Proveedor::create([
            'tenant_id' => $this->tenant->id,
            'razon_social' => 'Proveedor Original',
            'ciudad' => 'Medellín',
        ]);

        $response = $this->put(route('purchasing.proveedores.update', $proveedor), [
            'razon_social' => 'Proveedor Actualizado',
            'ciudad' => 'Cali',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('purchasing_proveedores', [
            'id' => $proveedor->id,
            'razon_social' => 'Proveedor Actualizado',
            'ciudad' => 'Cali',
        ]);
    }

    public function test_proveedor_cannot_delete_with_pending_orders(): void
    {
        $proveedor = Proveedor::create([
            'tenant_id' => $this->tenant->id,
            'razon_social' => 'Proveedor Con Órdenes',
        ]);

        // Create a pending purchase order (estado != cancelada/recibida/facturada)
        OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TEST-001',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->delete(route('purchasing.proveedores.destroy', $proveedor));

        // Should be rejected because there are pending orders
        $response->assertSessionHas('error');

        $this->assertDatabaseHas('purchasing_proveedores', [
            'id' => $proveedor->id,
            'deleted_at' => null,
        ]);
    }
}
