<?php

namespace Tests\Unit\Modules\Sales;

use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Models\FacturaItem;
use App\Modules\Sales\Services\FacturaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacturaServiceTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private FacturaService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        $this->service = app(FacturaService::class);
    }

    private function abrirCaja(): void
    {
        $caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Test',
            'activa' => true,
        ]);
        app(CajaService::class)->abrirCaja($this->user->id, $caja->id, 0);
    }

    // ─── crearDesdePos ───────────────────────────────────────────────────────

    public function test_crear_desde_pos_genera_numero_unico(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 10000,
                ],
            ],
        ]);

        $this->assertNotNull($factura->numero);
        $this->assertStringStartsWith('POS-', $factura->numero);
        $this->assertEquals(10000, (float) $factura->total);
        $this->assertEquals('pagada', $factura->estado);
    }

    public function test_crear_desde_pos_decrementa_stock(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 20,
            'is_active' => true,
        ]);

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 3,
                    'precio_unitario' => 15000,
                ],
            ],
        ]);

        $producto->refresh();
        $this->assertEquals(17, (float) $producto->stock_actual);
    }

    public function test_crear_desde_pos_no_decrementa_stock_de_servicios(): void
    {
        $this->abrirCaja();

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'servicio',
                    'producto_id' => null,
                    'descripcion' => 'Reparación',
                    'cantidad' => 1,
                    'precio_unitario' => 50000,
                ],
            ],
        ]);

        $this->assertEquals(1, Factura::count());
    }

    public function test_crear_desde_pos_credito_no_registra_en_caja(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'credito',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 20000,
                ],
            ],
        ]);

        $this->assertEquals('pendiente', $factura->estado);
    }

    public function test_crear_desde_pos_con_iva_regimen_comun(): void
    {
        $this->abrirCaja();
        Configuracion::setMany([
            'regimen_fiscal' => 'comun',
            'incluir_iva' => 'true',
            'porcentaje_iva' => '19',
        ], $this->tenant->id);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 2,
                    'precio_unitario' => 100000,
                ],
            ],
        ]);

        $this->assertEquals(200000, (float) $factura->subtotal);
        $this->assertEquals(38000, (float) $factura->impuestos);
        $this->assertEquals(238000, (float) $factura->total);
    }

    public function test_crear_desde_pos_regimen_simplificado_sin_iva(): void
    {
        $this->abrirCaja();
        Configuracion::setMany([
            'regimen_fiscal' => 'simplificado',
        ], $this->tenant->id);

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 50000,
                ],
            ],
        ]);

        $this->assertEquals(50000, (float) $factura->subtotal);
        $this->assertEquals(0, (float) $factura->impuestos);
        $this->assertEquals(50000, (float) $factura->total);
    }

    public function test_crear_desde_pos_lanza_excepcion_si_stock_insuficiente(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 2,
            'is_active' => true,
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Stock insuficiente');

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 10,
                    'precio_unitario' => 10000,
                ],
            ],
        ]);
    }

    public function test_crear_desde_pos_lanza_excepcion_si_caja_cerrada_en_contado(): void
    {
        $producto = Producto::factory()->create([
            'tenant_id' => $this->tenant->id,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('caja');

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 10000,
                ],
            ],
        ]);
    }

    public function test_crear_desde_pos_multiple_items(): void
    {
        $this->abrirCaja();

        $prodA = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 10, 'is_active' => true]);
        $prodB = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 5, 'is_active' => true]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $prodA->id, 'cantidad' => 2, 'precio_unitario' => 10000],
                ['tipo' => 'servicio', 'producto_id' => null, 'descripcion' => 'Instalación', 'cantidad' => 1, 'precio_unitario' => 5000],
                ['tipo' => 'producto', 'producto_id' => $prodB->id, 'cantidad' => 1, 'precio_unitario' => 20000],
            ],
        ]);

        $this->assertEquals(3, $factura->items()->count());
        $this->assertEquals(45000, (float) $factura->total);

        $prodA->refresh();
        $prodB->refresh();
        $this->assertEquals(8, (float) $prodA->stock_actual);
        $this->assertEquals(4, (float) $prodB->stock_actual);
    }

    public function test_crear_desde_pos_con_cliente(): void
    {
        $this->abrirCaja();

        $cliente = Cliente::factory()->create(['tenant_id' => $this->tenant->id]);
        $producto = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 10, 'is_active' => true]);

        $factura = $this->service->crearDesdePos([
            'cliente_id' => $cliente->id,
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 10000],
            ],
        ]);

        $this->assertEquals($cliente->id, $factura->cliente_id);
    }

    public function test_crear_desde_pos_pago_mixto_registra_varios_movimientos(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 10, 'is_active' => true]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $producto->id, 'cantidad' => 1, 'precio_unitario' => 100000],
            ],
            'pagos_mixtos' => [
                ['metodo' => 'efectivo', 'monto' => 60000],
                ['metodo' => 'tarjeta', 'monto' => 40000],
            ],
        ]);

        $this->assertEquals(100000, (float) $factura->total);
        $this->assertEquals('pagada', $factura->estado);
    }

    // ─── FacturaItem ─────────────────────────────────────────────────────────

    public function test_factura_item_calcula_totales_correctamente(): void
    {
        $this->abrirCaja();

        $producto = Producto::factory()->create(['tenant_id' => $this->tenant->id, 'stock_actual' => 10, 'is_active' => true]);

        $factura = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 3,
                    'precio_unitario' => 25000,
                ],
            ],
        ]);

        $item = $factura->items()->first();
        $this->assertEquals(3, (float) $item->cantidad);
        $this->assertEquals(25000, (float) $item->precio_unitario);
        $this->assertEquals(75000, (float) $item->subtotal);
        $this->assertEquals(75000, (float) $item->total);
    }

    // ─── Aislamiento multi-tenant ────────────────────────────────────────────

    public function test_aislamiento_entre_tenants(): void
    {
        $tenantB = Tenant::factory()->create();
        $userB = User::factory()->create(['tenant_id' => $tenantB->id]);
        $this->actingAs($userB);
        app()->instance('current_tenant', $tenantB);

        $cajaB = Caja::create(['tenant_id' => $tenantB->id, 'nombre' => 'Caja B', 'activa' => true]);
        app(CajaService::class)->abrirCaja($userB->id, $cajaB->id, 0);

        $prodB = Producto::factory()->create(['tenant_id' => $tenantB->id, 'stock_actual' => 10, 'is_active' => true]);

        $facturaB = $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                ['tipo' => 'producto', 'producto_id' => $prodB->id, 'cantidad' => 1, 'precio_unitario' => 5000],
            ],
        ]);

        $this->assertEquals($tenantB->id, $facturaB->tenant_id);
        $this->assertEquals(0, Factura::withoutGlobalScopes()->where('tenant_id', $this->tenant->id)->count());
        $this->assertEquals(1, Factura::withoutGlobalScopes()->where('tenant_id', $tenantB->id)->count());
    }

    // ─── Excepciones ─────────────────────────────────────────────────────────

    public function test_crear_desde_pos_explota_con_producto_invalido(): void
    {
        $this->abrirCaja();

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Producto no válido para el item de POS');

        $this->service->crearDesdePos([
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => 9999,
                    'cantidad' => 1,
                    'precio_unitario' => 1000,
                ],
            ],
        ]);
    }
}