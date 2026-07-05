<?php

namespace Tests\Feature\Modules\Inventory;

use App\Core\Models\Tenant;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use App\Modules\Inventory\Models\Traslado;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrasladoControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private \App\Models\User $user;
    private Producto $producto;
    private Bodega $bodegaOrigen;
    private Bodega $bodegaDestino;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['name' => 'Test', 'slug' => uniqid('tr-'), 'email' => 'tr@test.com', 'is_active' => true]);
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

        $this->bodegaOrigen = Bodega::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Origen', 'activo' => true]);
        $this->bodegaDestino = Bodega::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Destino', 'activo' => true]);

        $this->producto = Producto::create([
            'tenant_id' => $this->tenant->id, 'codigo' => 'TR-001', 'nombre' => 'Producto Traslado',
            'unidad_medida' => 'unidad', 'precio_venta' => 10000, 'costo_promedio' => 5000,
            'stock_actual' => 0, 'stock_minimo' => 0, 'is_active' => true,
        ]);

        Stock::create(['producto_id' => $this->producto->id, 'bodega_id' => $this->bodegaOrigen->id, 'cantidad' => 100]);
    }

    public function test_store_crea_traslado_borrador(): void
    {
        $this->post(route('inventory.traslados.store'), [
            'numero' => 'TR-TEST-001',
            'fecha' => '2026-07-05',
            'bodega_origen_id' => $this->bodegaOrigen->id,
            'bodega_destino_id' => $this->bodegaDestino->id,
            'detalles' => [
                ['producto_id' => $this->producto->id, 'cantidad' => 20],
            ],
        ])->assertRedirect();

        $traslado = Traslado::where('numero', 'TR-TEST-001')->first();
        $this->assertNotNull($traslado);
        $this->assertEquals('borrador', $traslado->estado);
        $this->assertCount(1, $traslado->detalles);

        // Stock NO se movió todavía
        $stockOrigen = Stock::where('producto_id', $this->producto->id)->where('bodega_id', $this->bodegaOrigen->id)->first();
        $this->assertEquals(100, (float) $stockOrigen->cantidad);
    }

    public function test_completar_mueve_stock(): void
    {
        $traslado = Traslado::create([
            'tenant_id' => $this->tenant->id, 'numero' => 'TR-COMP-001', 'fecha' => '2026-07-05',
            'bodega_origen_id' => $this->bodegaOrigen->id, 'bodega_destino_id' => $this->bodegaDestino->id,
            'estado' => 'borrador',
        ]);
        $traslado->detalles()->create(['producto_id' => $this->producto->id, 'cantidad' => 30]);

        $this->post(route('inventory.traslados.completar', $traslado->id))->assertRedirect();

        $traslado->refresh();
        $this->assertEquals('completado', $traslado->estado);

        $stockOrigen = Stock::where('producto_id', $this->producto->id)->where('bodega_id', $this->bodegaOrigen->id)->first();
        $this->assertEquals(70, (float) $stockOrigen->cantidad);

        $stockDestino = Stock::where('producto_id', $this->producto->id)->where('bodega_id', $this->bodegaDestino->id)->first();
        $this->assertNotNull($stockDestino);
        $this->assertEquals(30, (float) $stockDestino->cantidad);
    }

    public function test_completar_rechaza_stock_insuficiente(): void
    {
        $traslado = Traslado::create([
            'tenant_id' => $this->tenant->id, 'numero' => 'TR-FAIL-001', 'fecha' => '2026-07-05',
            'bodega_origen_id' => $this->bodegaOrigen->id, 'bodega_destino_id' => $this->bodegaDestino->id,
            'estado' => 'borrador',
        ]);
        $traslado->detalles()->create(['producto_id' => $this->producto->id, 'cantidad' => 200]);

        $response = $this->post(route('inventory.traslados.completar', $traslado->id));
        $response->assertSessionHasErrors('detalles');

        $traslado->refresh();
        $this->assertEquals('borrador', $traslado->estado);
    }

    public function test_completar_rechaza_estado_no_borrador(): void
    {
        $traslado = Traslado::create([
            'tenant_id' => $this->tenant->id, 'numero' => 'TR-DONE-001', 'fecha' => '2026-07-05',
            'bodega_origen_id' => $this->bodegaOrigen->id, 'bodega_destino_id' => $this->bodegaDestino->id,
            'estado' => 'completado',
        ]);
        $traslado->detalles()->create(['producto_id' => $this->producto->id, 'cantidad' => 10]);

        $this->post(route('inventory.traslados.completar', $traslado->id))
            ->assertSessionHas('error');
    }

    public function test_store_rechaza_misma_bodega_origen_destino(): void
    {
        $this->post(route('inventory.traslados.store'), [
            'numero' => 'TR-SAME-001',
            'fecha' => '2026-07-05',
            'bodega_origen_id' => $this->bodegaOrigen->id,
            'bodega_destino_id' => $this->bodegaOrigen->id,
            'detalles' => [
                ['producto_id' => $this->producto->id, 'cantidad' => 10],
            ],
        ])->assertSessionHasErrors('bodega_destino_id');
    }
}
