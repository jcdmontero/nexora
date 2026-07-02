<?php
namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Recepcion;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use App\Modules\Purchasing\Models\OrdenCompra;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Accounting\Models\CuentaPorPagar;
use Carbon\Carbon;

class RecepcionController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Recepciones/Index', [
            'recepciones' => Inertia::defer(fn () => Recepcion::with('ordenCompra:id,numero')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'numero' => $r->numero,
                    'orden_compra' => $r->ordenCompra->numero ?? '—',
                    'fecha' => $r->fecha ? $r->fecha->format('Y-m-d') : null,
                ])),
        ]);
    }

    public function create(Request $request)
    {
        $orden_id = $request->query('orden_id');
        $orden = null;

        if ($orden_id) {
            $orden = OrdenCompra::with('detalles.producto:id,codigo,nombre')->find($orden_id);
            if ($orden && $orden->estado === 'recibida') {
                return redirect()->route('inventory.recepciones.index')->with('error', 'Esta orden ya ha sido recibida.');
            }
        }

        // Si no viene orden, se puede crear una recepción libre o forzar que venga de una orden.
        // En este diseño lo forzamos a traer una orden para la demostración.
        if (!$orden) {
            return redirect()->route('inventory.recepciones.index')->with('error', 'Debe seleccionar una orden de compra para recibir mercancía.');
        }

        $cajaService = app(CajaService::class);
        $sesion = $cajaService->getSesionAbierta(auth()->id());

        return Inertia::render('Inventory/Recepciones/Create', [
            'orden' => $orden,
            'bodegas' => Bodega::where('activo', true)->get(['id', 'nombre']),
            'numero_sugerido' => 'REC-' . date('Ymd-His'),
            'sesion_caja' => $sesion ? [
                'id' => $sesion->id,
                'caja_nombre' => $sesion->caja->nombre,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'orden_compra_id' => ['required', 'exists:purchasing_ordenes,id'],
            'bodega_id' => ['required', 'exists:inventory_bodegas,id'],
            'numero' => ['required', 'string', 'max:50'],
            'fecha' => ['required', 'date'],
            'metodo_pago' => ['required', 'string', 'in:efectivo,transferencia,credito'],
            'fecha_vencimiento' => ['nullable', 'date'],
            'notas' => ['nullable', 'string'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', 'exists:inventory_productos,id'],
            'detalles.*.cantidad' => ['required', 'numeric', 'min:0.01'],
        ]);

        $orden = OrdenCompra::with(['proveedor', 'detalles'])->findOrFail($data['orden_compra_id']);

        // Calcular el monto total de la recepción a partir de las cantidades recibidas y precios pactados
        $montoTotal = 0.0;
        foreach ($data['detalles'] as $item) {
            $lineaOrden = $orden->detalles->firstWhere('producto_id', $item['producto_id']);
            $precioUnitario = $lineaOrden ? (float) $lineaOrden->precio_unitario : 0.0;
            $montoTotal += round($item['cantidad'] * $precioUnitario, 2);
        }

        $cajaService = app(CajaService::class);
        $sesion = $cajaService->getSesionAbierta(auth()->id());

        if ($data['metodo_pago'] === 'efectivo' && !$sesion) {
            return back()->with('error', 'Debes abrir un turno de caja para registrar egresos en efectivo.');
        }

        DB::transaction(function () use ($data, $orden, $montoTotal, $cajaService, $sesion) {
            $recepcion = Recepcion::create([
                'tenant_id' => $orden->tenant_id,
                'orden_compra_id' => $data['orden_compra_id'],
                'bodega_id' => $data['bodega_id'],
                'numero' => $data['numero'],
                'fecha' => $data['fecha'],
                'metodo_pago' => $data['metodo_pago'],
                'monto_total' => $montoTotal,
                'caja_sesion_id' => $data['metodo_pago'] === 'efectivo' ? $sesion->id : null,
                'notas' => $data['notas'] ?? null,
            ]);

            foreach ($data['detalles'] as $item) {
                // 1. Guardar el detalle de la recepción
                $recepcion->detalles()->create([
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                ]);

                // 2. Incrementar el stock global (mantenemos para compatibilidad)
                $producto = Producto::find($item['producto_id']);
                if ($producto) {
                    $producto->increment('stock_actual', $item['cantidad']);
                }

                // 3. Incrementar el stock en la bodega seleccionada
                $stock = Stock::firstOrCreate([
                    'producto_id' => $item['producto_id'],
                    'bodega_id' => $data['bodega_id'],
                ]);
                $stock->increment('cantidad', $item['cantidad']);
            }

            // 4. Marcar la orden de compra como recibida
            $orden->update(['estado' => 'recibida']);

            // 5. Integración con Caja
            if ($data['metodo_pago'] === 'efectivo' && $montoTotal > 0) {
                $cajaService->registrarMovimiento(
                    $sesion,
                    'egreso',
                    $montoTotal,
                    'efectivo',
                    "Pago compra Recepción: {$recepcion->numero}",
                    $recepcion
                );
            }

            // 6. Integración con Cuentas por Pagar (Crédito)
            if ($data['metodo_pago'] === 'credito' && $montoTotal > 0) {
                CuentaPorPagar::create([
                    'tenant_id' => $orden->tenant_id,
                    'acreedor_id' => $orden->proveedor_id,
                    'acreedor_type' => get_class($orden->proveedor),
                    'documento_origen_id' => $recepcion->id,
                    'documento_origen_type' => Recepcion::class,
                    'monto_total' => $montoTotal,
                    'monto_pagado' => 0,
                    'estado' => 'pendiente',
                    'fecha_vencimiento' => $data['fecha_vencimiento'] ?? Carbon::parse($data['fecha'])->addDays(30)->toDateString(),
                    'notas' => "Compra a crédito Recepción {$recepcion->numero}",
                ]);
            }

            // 7. Integración Contable
            $contabilidadService = app(ContabilidadService::class);
            $lineasContables = [];

            // Débito: Inventario (1405)
            $cuentaInventario = $contabilidadService->getCuenta('1405');
            if ($cuentaInventario) {
                $lineasContables[] = [
                    'cuenta_contable_id' => $cuentaInventario->id,
                    'descripcion' => "Ingreso Inventario Recepción {$recepcion->numero}",
                    'debito' => $montoTotal,
                    'credito' => 0,
                ];
            }

            // Crédito: Contrapartida según método de pago
            $codigoCredito = match ($data['metodo_pago']) {
                'transferencia' => '111005',
                'credito' => '2205',
                default => '110505', // efectivo
            };

            $cuentaCredito = $contabilidadService->getCuenta($codigoCredito);
            if (!$cuentaCredito) {
                // Fallbacks si no existen en el PUC del tenant
                if ($data['metodo_pago'] === 'transferencia') {
                    $cuentaCredito = $contabilidadService->getCuenta('110505');
                } elseif ($data['metodo_pago'] === 'credito') {
                    $cuentaCredito = $contabilidadService->getCuenta('2000');
                }
            }

            if ($cuentaCredito) {
                $lineasContables[] = [
                    'cuenta_contable_id' => $cuentaCredito->id,
                    'descripcion' => "Pago compra Recepción {$recepcion->numero}",
                    'debito' => 0,
                    'credito' => $montoTotal,
                    'tercero_tipo_documento' => $orden->proveedor->tipo_documento ?? null,
                    'tercero_numero_documento' => $orden->proveedor->numero_documento ?? null,
                    'tercero_nombre' => $orden->proveedor->razon_social ?? null,
                ];
            }

            if (count($lineasContables) >= 2) {
                $contabilidadService->registrarAsiento([
                    'fecha' => $data['fecha'],
                    'concepto' => "Compra mercancía Recepción {$recepcion->numero}",
                    'modulo_origen' => 'compras',
                    'documento_tipo' => 'REC',
                    'documento_numero' => $recepcion->numero,
                    'tercero_tipo_documento' => $orden->proveedor->tipo_documento ?? null,
                    'tercero_numero_documento' => $orden->proveedor->numero_documento ?? null,
                    'tercero_nombre' => $orden->proveedor->razon_social ?? null,
                    'referencia_type' => Recepcion::class,
                    'referencia_id' => $recepcion->id,
                ], $lineasContables);
            }
        });

        return redirect()->route('purchasing.ordenes.index')
            ->with('success', 'Mercancía recibida e integración financiera procesada correctamente.');
    }

    public function show(Recepcion $recepcione)
    {
        $recepcione->load(['ordenCompra', 'detalles.producto:id,codigo,nombre']);

        return Inertia::render('Inventory/Recepciones/Show', [
            'recepcion' => $recepcione,
        ]);
    }
}
