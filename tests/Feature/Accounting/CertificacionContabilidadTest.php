<?php

namespace Tests\Feature\Accounting;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Core\Models\Configuracion;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Services\FacturaService;
use App\Modules\Accounting\Services\RegimeProvisioner;
use App\Modules\Accounting\Services\PucSimplificadoProvisioner;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use Illuminate\Support\Facades\DB;

class CertificacionContabilidadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
    }

    private function crearTenantYDatosComunes(string $regimen): array
    {
        // 1. Crear Tenant
        $tenant = Tenant::create([
            'name' => 'Empresa ' . $regimen,
            'slug' => 'empresa-' . strtolower($regimen),
            'domain' => strtolower($regimen) . '.nexora.com',
            'is_active' => true,
        ]);
        
        // Simular middleware IdentifyTenant
        app()->instance('current_tenant', $tenant);

        // 2. Establecer régimen usando el provisionador
        $provisioner = app(RegimeProvisioner::class);
        $provisioner->cambiarRegimen($tenant, $regimen);
        
        // También provisionar PUC base
        app(PucSimplificadoProvisioner::class)->provisionForTenant($tenant);

        // Si es régimen común, configurar impuesto (Ej. IVA 19%)
        if ($regimen === 'comun') {
            Configuracion::setMany(['incluir_iva' => 'true', 'porcentaje_iva' => '19'], $tenant->id);
            DB::table('taxes')->insert([
                'tenant_id' => $tenant->id,
                'codigo' => 'IVA',
                'nombre' => 'IVA 19%',
                'porcentaje' => 19.00,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Crear Cliente con retenciones
        $cliente = Cliente::create([
            'tenant_id' => $tenant->id,
            'tipo_documento' => 'NIT',
            'numero_documento' => '900123456',
            'razon_social' => 'Cliente Corporativo',
            'porcentaje_retencion_fuente' => 2.5,
            'porcentaje_retencion_iva' => 15,
        ]);

        // 4. Crear Producto
        $producto = Producto::create([
            'tenant_id' => $tenant->id,
            'codigo' => 'PROD-01',
            'nombre' => 'Producto de Prueba',
            'precio_venta' => 10000000, 
            'costo' => 5000000,
            'costo_promedio' => 5000000, // IMPORTANTE: Este es el que usa ContabilidadService para COGS
            'tipo' => 'producto',
            'stock_actual' => 10,
            'maneja_inventario' => true,
        ]);

        // 5. Crear Usuario y Caja
        $user = User::factory()->create(['tenant_id' => $tenant->id]);
        
        // Configurar ICA
        Configuracion::setMany([
            'codigo_municipio' => '11001',
            'ica_municipio_11001' => '1.104'
        ], $tenant->id);

        $caja = Caja::create(['tenant_id' => $tenant->id, 'nombre' => 'Caja Principal', 'estado' => 'abierta']);
        CajaSesion::create([
            'tenant_id' => $tenant->id,
            'caja_id' => $caja->id,
            'user_id' => $user->id,
            'estado' => 'abierta',
            'fecha_apertura' => now(),
            'saldo_inicial' => 0
        ]);

        $this->actingAs($user);

        return [$tenant, $cliente, $producto];
    }

    public function test_regimen_simplificado_no_genera_iva_ni_retenciones()
    {
        [$tenant, $cliente, $producto] = $this->crearTenantYDatosComunes('simplificado');

        $facturaService = app(FacturaService::class);
        
        $datosFactura = [
            'cliente_id' => $cliente->id,
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 10000000,
                ]
            ]
        ];

        $factura = $facturaService->crearDesdePos($datosFactura);

        // Validar que la factura no tenga IVA
        $this->assertEquals(0, $factura->impuestos);
        $this->assertEquals(10000000, $factura->subtotal);
        $this->assertEquals(10000000, $factura->total);

        // Validar el Asiento Contable
        $asiento = AsientoContable::where('tenant_id', $tenant->id)
            ->where('referencia_type', Factura::class)
            ->where('referencia_id', $factura->id)
            ->first();

        $this->assertNotNull($asiento);
        
        // Suma de débitos == créditos (Partida Doble)
        $this->assertEquals($asiento->total_debitos, $asiento->total_creditos);
        
        // No debe existir cuenta de IVA (2408) ni Retenciones (1355)
        $lineas = $asiento->lineas()->with('cuenta')->get();
        
        $tieneIva = $lineas->contains(fn($l) => str_starts_with($l->cuenta->codigo, '2408'));
        $this->assertFalse($tieneIva, 'El régimen simplificado no debe generar cuentas de IVA');

        // Validar Costo de Ventas (COGS) en el segundo asiento
        $asientoCogs = AsientoContable::where('tenant_id', $tenant->id)
            ->where('referencia_type', Factura::class)
            ->where('referencia_id', $factura->id)
            ->where('concepto', 'like', 'Costo de ventas%')
            ->first();
            
        $this->assertNotNull($asientoCogs, 'Falta el asiento contable de Costo de Ventas');
        $this->assertEquals($asientoCogs->total_debitos, $asientoCogs->total_creditos);
        
        $lineasCogs = $asientoCogs->lineas()->with('cuenta')->get();
        $cuentaCosto = $lineasCogs->first(fn($l) => str_starts_with($l->cuenta->codigo, '6135'));
        $cuentaInventario = $lineasCogs->first(fn($l) => str_starts_with($l->cuenta->codigo, '1405'));
        
        $this->assertNotNull($cuentaCosto, 'Falta la cuenta de Costo de Ventas');
        $this->assertNotNull($cuentaInventario, 'Falta la cuenta de Inventarios');
        $this->assertEquals(5000000, $cuentaCosto->debito); // El costo_promedio * cantidad
        $this->assertEquals(5000000, $cuentaInventario->credito);
    }

    public function test_regimen_comun_genera_iva_y_retenciones()
    {
        [$tenant, $cliente, $producto] = $this->crearTenantYDatosComunes('comun');

        $facturaService = app(FacturaService::class);
        
        $datosFactura = [
            'cliente_id' => $cliente->id,
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 10000000, 
                ]
            ]
        ];

        $factura = $facturaService->crearDesdePos($datosFactura);

        $this->assertEquals(1900000, $factura->impuestos);
        
        $this->assertEquals(10000000, $factura->subtotal);
        $this->assertEquals(11900000, $factura->total); // 10M + 1.9M

        // Validar el Asiento Contable principal
        $asiento = AsientoContable::where('tenant_id', $tenant->id)
            ->where('referencia_type', Factura::class)
            ->where('referencia_id', $factura->id)
            ->where('concepto', 'not like', 'Costo de ventas%')
            ->first();

        $this->assertNotNull($asiento);
        
        // Suma de débitos == créditos (Partida Doble)
        $this->assertEquals($asiento->total_debitos, $asiento->total_creditos);
        
        // Validar cuentas específicas
        $lineas = $asiento->lineas()->with('cuenta')->get();
        
        $cuentaIva = $lineas->first(fn($l) => str_starts_with($l->cuenta->codigo, '240805'));
        $this->assertNotNull($cuentaIva, 'Falta la cuenta de IVA generado');
        $this->assertEquals(1900000, $cuentaIva->credito);
        $this->assertEquals(0, $cuentaIva->debito);

        $cuentaReteFuente = $lineas->first(fn($l) => str_starts_with($l->cuenta->codigo, '135515'));
        $this->assertNotNull($cuentaReteFuente, 'Falta la cuenta de ReteFuente');
        $this->assertGreaterThan(0, $cuentaReteFuente->debito);

        // Verificamos retenciones
        $totalRetencionesDebito = $lineas->filter(fn($l) => str_starts_with($l->cuenta->codigo, '1355'))->sum('debito');
        $this->assertGreaterThan(0, $totalRetencionesDebito, 'Debe haber retenciones aplicadas');

        // Validar ReteICA 135518
        $cuentaReteIca = $lineas->first(fn($l) => str_starts_with($l->cuenta->codigo, '135518'));
        $this->assertNotNull($cuentaReteIca, 'Falta la cuenta de ReteICA');
        $this->assertEquals(110400, $cuentaReteIca->debito); // 10.000.000 * 1.104% = 110.400

        // Validar Costo de Ventas (COGS) en el segundo asiento
        $asientoCogs = AsientoContable::where('tenant_id', $tenant->id)
            ->where('referencia_type', Factura::class)
            ->where('referencia_id', $factura->id)
            ->where('concepto', 'like', 'Costo de ventas%')
            ->first();
            
        $this->assertNotNull($asientoCogs, 'Falta el asiento contable de Costo de Ventas');
        $this->assertEquals($asientoCogs->total_debitos, $asientoCogs->total_creditos);
        
        $lineasCogs = $asientoCogs->lineas()->with('cuenta')->get();
        $cuentaCosto = $lineasCogs->first(fn($l) => str_starts_with($l->cuenta->codigo, '6135'));
        $cuentaInventario = $lineasCogs->first(fn($l) => str_starts_with($l->cuenta->codigo, '1405'));
        $this->assertNotNull($cuentaCosto, 'Falta la cuenta de Costo de Ventas');
        $this->assertNotNull($cuentaInventario, 'Falta la cuenta de Inventarios');
        $this->assertEquals(5000000, $cuentaInventario->credito);
    }

    public function test_venta_a_credito_genera_cuenta_por_cobrar_y_asiento_clientes()
    {
        [$tenant, $cliente, $producto] = $this->crearTenantYDatosComunes('simplificado');

        $facturaService = app(FacturaService::class);
        
        $datosFactura = [
            'cliente_id' => $cliente->id,
            'metodo_pago' => 'credito',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 1000000, 
                ]
            ]
        ];

        // Se usa crearDesdePos pero con metodo_pago = credito
        $factura = $facturaService->crearDesdePos($datosFactura);

        $this->assertEquals('pendiente', $factura->estado);
        $this->assertEquals(1000000, $factura->total);

        // Validar el Asiento Contable principal
        $asiento = AsientoContable::where('tenant_id', $tenant->id)
            ->where('referencia_type', Factura::class)
            ->where('referencia_id', $factura->id)
            ->where('concepto', 'not like', 'Costo de ventas%')
            ->first();

        $this->assertNotNull($asiento);
        $this->assertEquals($asiento->total_debitos, $asiento->total_creditos);
        
        $lineas = $asiento->lineas()->with('cuenta')->get();
        
        // Debe usar la cuenta 1305 (Clientes) en el débito
        $cuentaClientes = $lineas->first(fn($l) => str_starts_with($l->cuenta->codigo, '1305'));
        $this->assertNotNull($cuentaClientes, 'Falta la cuenta de Clientes (1305)');
        $this->assertEquals(1000000, $cuentaClientes->debito);

        // Validar que se creó la Cuenta por Cobrar
        $cxc = \App\Modules\Accounting\Models\CuentaPorCobrar::where('tenant_id', $tenant->id)
            ->where('documento_origen_id', $factura->id)
            ->where('documento_origen_type', Factura::class)
            ->first();
            
        $this->assertNotNull($cxc, 'No se creó el registro en Cuentas por Cobrar');
        $this->assertEquals(1000000, $cxc->monto_total);
        $this->assertEquals(0, $cxc->monto_pagado);
        $this->assertEquals('pendiente', $cxc->estado);
    }

    public function test_facturar_orden_con_anticipo_reversa_cuenta_2815()
    {
        [$tenant, $cliente, $producto] = $this->crearTenantYDatosComunes('simplificado');

        // Crear una Orden de Reparación con abono_inicial
        $orden = \App\Modules\ServiceDesk\Models\OrdenReparacion::create([
            'tenant_id' => $tenant->id,
            'numero_orden' => 'ORD-TEST-001',
            'cliente_id' => $cliente->id,
            'estado' => 'entregado',
            'abono_inicial' => 200000,
            'precio_cliente' => 1000000,
            'total_final' => 1000000,
        ]);

        $facturaService = app(FacturaService::class);
        
        $datosFactura = [
            'cliente_id' => $cliente->id,
            'metodo_pago' => 'efectivo',
            'orden_id' => $orden->id,
            'items' => [
                [
                    'tipo' => 'servicio',
                    'producto_id' => null, // Omitido, es un servicio de SD
                    'descripcion' => 'Reparación de equipo',
                    'cantidad' => 1,
                    'precio_unitario' => 1000000, 
                ]
            ]
        ];

        $factura = $facturaService->crearDesdePos($datosFactura);

        // El total es 1.000.000 pero tiene un abono de 200.000, entonces el pago en caja es 800.000
        $this->assertEquals(1000000, $factura->total);

        // Validar el Asiento Contable principal
        $asiento = AsientoContable::where('tenant_id', $tenant->id)
            ->where('referencia_type', Factura::class)
            ->where('referencia_id', $factura->id)
            ->where('concepto', 'not like', 'Costo de ventas%')
            ->first();

        $this->assertNotNull($asiento);
        
        $lineas = $asiento->lineas()->with('cuenta')->get();
        
        // Debe haber un débito a 2815 por el anticipo (200.000)
        $cuentaAnticipo = $lineas->first(fn($l) => str_starts_with($l->cuenta->codigo, '2815'));
        $this->assertNotNull($cuentaAnticipo, 'Falta la cuenta de Anticipos (2815)');
        $this->assertEquals(200000, $cuentaAnticipo->debito);
        $this->assertEquals(0, $cuentaAnticipo->credito);

        // La caja (110505) debe recibir el restante (800.000)
        $cuentaCaja = $lineas->first(fn($l) => str_starts_with($l->cuenta->codigo, '1105'));
        $this->assertNotNull($cuentaCaja, 'Falta la cuenta de Caja (1105)');
        $this->assertEquals(800000, $cuentaCaja->debito);
        
        // El ingreso por ventas (4135 o equivalente) debe ser 1.000.000
        $cuentaIngreso = $lineas->first(fn($l) => str_starts_with($l->cuenta->codigo, '41'));
        $this->assertNotNull($cuentaIngreso, 'Falta la cuenta de Ingresos');
        $this->assertEquals(1000000, $cuentaIngreso->credito);
    }

    public function test_anular_factura_reversa_todo()
    {
        [$tenant, $cliente, $producto] = $this->crearTenantYDatosComunes('simplificado');

        $facturaService = app(FacturaService::class);
        
        $datosFactura = [
            'cliente_id' => $cliente->id,
            'metodo_pago' => 'efectivo',
            'items' => [
                [
                    'tipo' => 'producto',
                    'producto_id' => $producto->id,
                    'cantidad' => 2,
                    'precio_unitario' => 1000000, 
                ]
            ]
        ];

        // 1. Crear factura
        $factura = $facturaService->crearDesdePos($datosFactura);
        $this->assertEquals('pagada', $factura->estado);
        
        $inventarioAntes = \App\Modules\Inventory\Models\Producto::find($producto->id)->stock_actual;
        $this->assertEquals(8, $inventarioAntes); // 10 originales - 2 vendidos

        // 2. Anular factura
        $facturaService->anular($factura, 'Error de digitación');

        $factura->refresh();
        $this->assertEquals('anulada', $factura->estado);

        // 3. Validar reversión de inventario
        $inventarioDespues = \App\Modules\Inventory\Models\Producto::find($producto->id)->stock_actual;
        $this->assertEquals(10, $inventarioDespues); // Regresa a 10

        // 4. Validar reversión de contabilidad
        $asientoOriginal = AsientoContable::where('referencia_type', Factura::class)
            ->where('referencia_id', $factura->id)
            ->where('estado', 'reversado')
            ->first();
        $this->assertNotNull($asientoOriginal, 'El asiento original no se marcó como reversado');

        $asientoReverso = AsientoContable::where('reverso_de_id', $asientoOriginal->id)->first();
        $this->assertNotNull($asientoReverso, 'No se generó el asiento de reversión');
        $this->assertEquals($asientoOriginal->total_debitos, $asientoReverso->total_debitos);
        
        // El reverso debe tener las naturalezas opuestas (Caja a crédito en el reverso en vez de débito)
        $lineaCajaReverso = $asientoReverso->lineas()->with('cuenta')->get()->first(fn($l) => str_starts_with($l->cuenta->codigo, '1105'));
        $this->assertNotNull($lineaCajaReverso);
        $this->assertEquals(2000000, $lineaCajaReverso->credito);
    }
}
