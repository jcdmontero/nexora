<?php

namespace Tests\Feature\Modules\Inventory;

use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Recepcion;
use App\Modules\Purchasing\Models\OrdenCompra;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Models\CuentaPorPagar;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Services\PucColombiaProvisioner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecepcionIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Bodega $bodega;
    private Proveedor $proveedor;
    private Producto $producto;
    private OrdenCompra $orden;
    private Caja $caja;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class]);

        // 1. Crear tenant y admin
        $this->tenant = Tenant::create([
            'name' => 'Empresa Test',
            'slug' => 'test-empresa',
            'domain' => 'test.nexora.com',
        ]);
        app()->instance('current_tenant', $this->tenant);

        // Registrar módulos en la base de datos
        app(\App\Core\Services\ModuleRegistry::class)->scanAndRegister();
        \App\Core\Models\Module::firstOrCreate(['code' => 'core'], [
            'name' => 'Core', 'class' => 'Core', 'version' => '1.0.0',
            'is_core' => true, 'is_active_globally' => true, 'estado' => 'publicado',
        ]);

        // Activar módulos necesarios en el tenant de prueba
        \App\Core\Models\TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'core', 'is_active' => true]);
        \App\Core\Models\TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'inventory', 'is_active' => true]);
        \App\Core\Models\TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'purchasing', 'is_active' => true]);
        \App\Core\Models\TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'cash', 'is_active' => true]);
        \App\Core\Models\TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'accounting', 'is_active' => true]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);
        $this->actingAs($this->user);

        // 2. Provisionar PUC Colombia
        app(PucColombiaProvisioner::class)->provisionForTenant($this->tenant);

        // 3. Crear bodega
        $this->bodega = Bodega::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Bodega Principal',
            'activo' => true,
            'es_principal' => true,
        ]);

        // 4. Crear proveedor
        $this->proveedor = Proveedor::create([
            'tenant_id' => $this->tenant->id,
            'tipo_documento' => 'NIT',
            'numero_documento' => '900123456-1',
            'razon_social' => 'Proveedor de Prueba S.A.S.',
            'activo' => true,
        ]);

        // 5. Crear producto
        $this->producto = Producto::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => 'PROD-01',
            'nombre' => 'Repuesto Test',
            'precio_venta' => 50000,
            'costo_promedio' => 20000,
            'stock_actual' => 10,
            'is_active' => true,
        ]);

        // 6. Crear Orden de Compra
        $this->orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $this->proveedor->id,
            'numero' => 'OC-TEST-01',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 100000,
            'total' => 100000,
        ]);

        $this->orden->detalles()->create([
            'producto_id' => $this->producto->id,
            'cantidad' => 5,
            'precio_unitario' => 20000,
            'subtotal' => 100000,
        ]);

        // 7. Crear Caja
        $this->caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja General Compras',
            'activa' => true,
        ]);
    }

    public function test_recepcion_pago_efectivo_registra_egreso_y_asiento_contable(): void
    {
        // Abrir turno de caja
        $sesion = app(CajaService::class)->abrirCaja($this->user->id, $this->caja->id, 500000);

        $response = $this->post(route('inventory.recepciones.store'), [
            'orden_compra_id' => $this->orden->id,
            'bodega_id' => $this->bodega->id,
            'numero' => 'REC-EFECTIVO',
            'fecha' => now()->toDateString(),
            'metodo_pago' => 'efectivo',
            'detalles' => [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 5,
                ],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Validar incremento de stock
        $this->producto->refresh();
        $this->assertEquals(15, (float) $this->producto->stock_actual);

        // Validar estado de la orden
        $this->orden->refresh();
        $this->assertEquals('recibida', $this->orden->estado);

        // Validar egreso de caja
        $sesion->refresh();
        $this->assertEquals(100000, (float) $sesion->egresos_totales);

        $this->assertDatabaseHas('cash_movimientos', [
            'sesion_id' => $sesion->id,
            'tipo' => 'egreso',
            'monto' => 100000,
            'metodo_pago' => 'efectivo',
        ]);

        // Validar asiento contable
        $asiento = AsientoContable::where('modulo_origen', 'compras')
            ->where('documento_numero', 'REC-EFECTIVO')
            ->first();

        $this->assertNotNull($asiento);
        $this->assertCount(2, $asiento->lineas);

        // Cuenta Inventario 1405 en Débito
        $lineaInventario = $asiento->lineas->where('cuenta_contable_id', CuentaContable::where('codigo', '1405')->first()->id)->first();
        $this->assertEquals(100000, (float) $lineaInventario->debito);

        // Cuenta Caja 110505 en Crédito
        $lineaCaja = $asiento->lineas->where('cuenta_contable_id', CuentaContable::where('codigo', '110505')->first()->id)->first();
        $this->assertEquals(100000, (float) $lineaCaja->credito);
    }

    public function test_recepcion_credito_crea_cuenta_por_pagar_y_asiento_proveedores(): void
    {
        $response = $this->post(route('inventory.recepciones.store'), [
            'orden_compra_id' => $this->orden->id,
            'bodega_id' => $this->bodega->id,
            'numero' => 'REC-CREDITO',
            'fecha' => now()->toDateString(),
            'metodo_pago' => 'credito',
            'fecha_vencimiento' => now()->addDays(15)->toDateString(),
            'detalles' => [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 5,
                ],
            ],
        ]);

        $response->assertRedirect();

        // Validar que se creó la cuenta por pagar usando Eloquent para evitar discrepancias de formato de fecha en SQLite
        $cpp = CuentaPorPagar::first();
        $this->assertNotNull($cpp);
        $this->assertEquals($this->tenant->id, $cpp->tenant_id);
        $this->assertEquals($this->proveedor->id, $cpp->acreedor_id);
        $this->assertEquals(Proveedor::class, $cpp->acreedor_type);
        $this->assertEquals(100000, (float) $cpp->monto_total);
        $this->assertEquals('pendiente', $cpp->estado);
        $this->assertEquals(now()->addDays(15)->toDateString(), $cpp->fecha_vencimiento->toDateString());

        // Validar asiento contable
        $asiento = AsientoContable::where('modulo_origen', 'compras')
            ->where('documento_numero', 'REC-CREDITO')
            ->first();

        $this->assertNotNull($asiento);
        $this->assertCount(2, $asiento->lineas);

        // Cuenta Inventario 1405 en Débito
        $lineaInventario = $asiento->lineas->where('cuenta_contable_id', CuentaContable::where('codigo', '1405')->first()->id)->first();
        $this->assertEquals(100000, (float) $lineaInventario->debito);

        // Cuenta Proveedores 2205 en Crédito con Tercero
        $lineaProveedor = $asiento->lineas->where('cuenta_contable_id', CuentaContable::where('codigo', '2205')->first()->id)->first();
        $this->assertEquals(100000, (float) $lineaProveedor->credito);
        $this->assertEquals($this->proveedor->numero_documento, $lineaProveedor->tercero_numero_documento);
    }

    public function test_recepcion_transferencia_bancaria_registra_asiento_bancos(): void
    {
        $response = $this->post(route('inventory.recepciones.store'), [
            'orden_compra_id' => $this->orden->id,
            'bodega_id' => $this->bodega->id,
            'numero' => 'REC-BANCOS',
            'fecha' => now()->toDateString(),
            'metodo_pago' => 'transferencia',
            'detalles' => [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 5,
                ],
            ],
        ]);

        $response->assertRedirect();

        // Validar asiento contable
        $asiento = AsientoContable::where('modulo_origen', 'compras')
            ->where('documento_numero', 'REC-BANCOS')
            ->first();

        $this->assertNotNull($asiento);
        $this->assertCount(2, $asiento->lineas);

        // Cuenta Bancos 111005 en Crédito
        $lineaBancos = $asiento->lineas->where('cuenta_contable_id', CuentaContable::where('codigo', '111005')->first()->id)->first();
        $this->assertEquals(100000, (float) $lineaBancos->credito);
    }

    public function test_recepcion_pago_efectivo_falla_sin_caja_abierta(): void
    {
        // No abrimos turno de caja
        $response = $this->post(route('inventory.recepciones.store'), [
            'orden_compra_id' => $this->orden->id,
            'bodega_id' => $this->bodega->id,
            'numero' => 'REC-EFECTIVO-FAIL',
            'fecha' => now()->toDateString(),
            'metodo_pago' => 'efectivo',
            'detalles' => [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad' => 5,
                ],
            ],
        ]);

        $response->assertSessionHas('error', 'Debes abrir un turno de caja para registrar egresos en efectivo.');
    }
}
