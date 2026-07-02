<?php

namespace Tests\Feature\Modules\Sales;

use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\FacturaItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Caja $caja;
    private CajaSesion $sesion;
    private Cliente $cliente;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class]);

        $this->tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'sales',
            'name' => 'Ventas / POS',
            'class' => 'Sales',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'sales',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        $this->caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Principal',
            'activa' => true,
        ]);

        $this->sesion = app(CajaService::class)->abrirCaja($this->user->id, $this->caja->id, 100000);

        $this->cliente = Cliente::factory()->create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
        ]);
    }

    public function test_pos_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();
        $response = $this->get(route('sales.pos.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_pos_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userSinPermiso = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => false]);
        $this->actingAs($userSinPermiso);

        $response = $this->get(route('sales.pos.index'));
        $response->assertStatus(403);
    }

    public function test_pos_index_loads_products_clientes_and_sesion(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Producto Test',
            'precio_venta' => 50000,
            'is_active' => true,
            'stock_actual' => 10,
        ]);

        $response = $this->get(route('sales.pos.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('sesionActiva.id', $this->sesion->id)
            ->where('productos.0.id', $producto->id)
            ->where('clientes.0.id', $this->cliente->id)
        );
    }

    public function test_pos_index_shows_no_sesion_when_caja_cerrada(): void
    {
        app(CajaService::class)->cerrarSesion($this->sesion, 0);

        $response = $this->get(route('sales.pos.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('sesionActiva', null)
        );
    }

    public function test_pos_store_crea_factura_y_decrementa_stock(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Repuesto A',
            'precio_venta' => 25000,
            'stock_actual' => 20,
            'costo_promedio' => 10000,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'cliente_id' => $this->cliente->id,
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 2,
                    'precio_unitario' => 25000,
                ],
            ],
        ]);

        $response->assertRedirectToRoute('sales.facturas.show', Factura::first()->id);
        $response->assertSessionHas('success');

        $producto->refresh();
        $this->assertEquals(18, (float) $producto->stock_actual);

        $factura = Factura::first();
        $this->assertEquals('pagada', $factura->estado);
        $this->assertEquals('efectivo', $factura->metodo_pago);
        $this->assertEquals(50000, (float) $factura->total);
        $this->assertEquals(1, $factura->items()->count());
    }

    public function test_pos_store_crea_factura_de_servicio_sin_stock(): void
    {
        $response = $this->post(route('sales.pos.store'), [
            'cliente_id' => $this->cliente->id,
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'servicio',
                    'producto_id' => null,
                    'descripcion' => 'Diagnóstico',
                    'cantidad' => 1,
                    'precio_unitario' => 30000,
                ],
            ],
        ]);

        $response->assertRedirectToRoute('sales.facturas.show', Factura::first()->id);

        $factura = Factura::first();
        $this->assertEquals(1, $factura->items()->count());
        $this->assertEquals('Diagnóstico', $factura->items()->first()->descripcion);
    }

    public function test_pos_store_credito_no_requiere_caja_abierta(): void
    {
        $user2 = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);
        $this->actingAs($user2);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 5,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'cliente_id' => $this->cliente->id,
            'metodo_pago' => 'credito',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 10000,
                ],
            ],
        ]);

        $response->assertRedirectToRoute('sales.facturas.show', Factura::first()->id);

        $factura = Factura::first();
        $this->assertEquals('pendiente', $factura->estado);
        $this->assertEquals('credito', $factura->metodo_pago);
    }

    public function test_pos_store_falla_si_stock_insuficiente(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 1,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 5,
                    'precio_unitario' => 10000,
                ],
            ],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $this->assertStringContainsString('Stock insuficiente', session('error') ?? '');
    }

    public function test_pos_store_falla_sin_items(): void
    {
        $response = $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $response->assertSessionHasErrors('items');
    }

    public function test_pos_store_con_iva_regimen_comun(): void
    {
        Configuracion::setMany([
            'regimen_fiscal' => 'comun',
            'incluir_iva' => 'true',
            'porcentaje_iva' => '19',
        ], $this->tenant->id);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 100000,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 100000,
                ],
            ],
        ]);

        $factura = Factura::first();
        $this->assertEquals(100000, (float) $factura->subtotal);
        $this->assertEquals(19000, (float) $factura->impuestos);
        $this->assertEquals(119000, (float) $factura->total);
        $this->assertEquals('borrador', $factura->dian_estado);
    }

    public function test_pos_store_sin_iva_regimen_simplificado(): void
    {
        Configuracion::setMany([
            'regimen_fiscal' => 'simplificado',
        ], $this->tenant->id);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 100000,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 100000,
                ],
            ],
        ]);

        $factura = Factura::first();
        $this->assertEquals(100000, (float) $factura->subtotal);
        $this->assertEquals(0, (float) $factura->impuestos);
        $this->assertEquals(100000, (float) $factura->total);
    }

    public function test_pos_store_registra_movimiento_en_caja(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 30000,
            'stock_actual' => 5,
            'is_active' => true,
        ]);

        $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 30000,
                ],
            ],
        ]);

        $this->sesion->refresh();
        $this->assertEquals(30000, (float) $this->sesion->ingresos_totales);
    }

    public function test_pos_store_pago_mixto(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 100000,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $response = $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 100000,
                ],
            ],
            'pagos_mixtos' => [
                ['metodo' => 'efectivo', 'monto' => 60000],
                ['metodo' => 'tarjeta', 'monto' => 40000],
            ],
        ]);

        $response->assertRedirectToRoute('sales.facturas.show', Factura::first()->id);

        $factura = Factura::first();
        $this->assertEquals(100000, (float) $factura->total);
        $this->assertEquals('pagada', $factura->estado);
    }

    public function test_numero_factura_es_unico(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'precio_venta' => 1000,
            'stock_actual' => 100,
            'is_active' => true,
        ]);

        $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 1000,
                ],
            ],
        ]);

        $this->post(route('sales.pos.store'), [
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 1000,
                ],
            ],
        ]);

        $numeros = Factura::pluck('numero')->toArray();
        $this->assertEquals(count($numeros), count(array_unique($numeros)));
    }
}