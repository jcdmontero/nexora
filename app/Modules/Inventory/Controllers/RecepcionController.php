<?php
namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Recepcion;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RecepcionController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Recepciones/Index', [
            'recepciones' => Inertia::defer(fn () => Recepcion::with('ordenCompra:id,numero')
                ->orderBy('created_at', 'desc')
                ->paginate(20)
                ->withQueryString()),
        ]);
    }

    public function create(Request $request)
    {
        if (!class_exists(\App\Modules\Purchasing\Models\OrdenCompra::class)) {
            return redirect()->route('inventory.recepciones.index')
                ->with('error', 'El módulo de Compras no está instalado.');
        }

        $orden_id = $request->query('orden_id');
        $orden = null;

        if ($orden_id) {
            $orden = \App\Modules\Purchasing\Models\OrdenCompra::with('detalles.producto:id,codigo,nombre')->find($orden_id);
            if ($orden && $orden->estado === 'recibida') {
                return redirect()->route('inventory.recepciones.index')->with('error', 'Esta orden ya ha sido recibida.');
            }
        }

        if (!$orden) {
            return redirect()->route('inventory.recepciones.index')->with('error', 'Debe seleccionar una orden de compra para recibir mercancía.');
        }

        $sesion = null;
        if (class_exists(\App\Modules\Cash\Services\CajaService::class)) {
            $cajaService = app(\App\Modules\Cash\Services\CajaService::class);
            $sesion = $cajaService->getSesionAbierta(auth()->id());
        }

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
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'orden_compra_id' => ['required', 'integer'],
            'bodega_id' => ['required', Rule::exists('inventory_bodegas', 'id')->where('tenant_id', $tenantId)],
            'numero' => ['required', 'string', 'max:50'],
            'fecha' => ['required', 'date'],
            'metodo_pago' => ['required', 'string', 'in:efectivo,transferencia,credito'],
            'fecha_vencimiento' => ['nullable', 'date'],
            'notas' => ['nullable', 'string'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', Rule::exists('inventory_productos', 'id')->where('tenant_id', $tenantId)],
            'detalles.*.cantidad' => ['required', 'numeric', 'min:0.01'],
        ]);

        if (!class_exists(\App\Modules\Purchasing\Models\OrdenCompra::class)) {
            return back()->with('error', 'El módulo de Compras no está instalado.');
        }

        $orden = \App\Modules\Purchasing\Models\OrdenCompra::with(['proveedor', 'detalles'])->findOrFail($data['orden_compra_id']);

        $recepcionesExistentes = Recepcion::where('orden_compra_id', $orden->id)
            ->with('detalles')
            ->get();

        $cantidadesRecibidas = [];
        foreach ($recepcionesExistentes as $recAnt) {
            foreach ($recAnt->detalles as $det) {
                $cantidadesRecibidas[$det->producto_id] = ($cantidadesRecibidas[$det->producto_id] ?? 0) + (float) $det->cantidad;
            }
        }

        $montoTotal = 0.0;
        foreach ($data['detalles'] as $item) {
            $lineaOrden = $orden->detalles->firstWhere('producto_id', $item['producto_id']);

            if (!$lineaOrden) {
                return back()->withErrors([
                    'detalles' => "El producto ID {$item['producto_id']} no pertenece a esta orden de compra.",
                ])->withInput();
            }

            $precioUnitario = (float) $lineaOrden->precio_unitario;

            $cantidadOrdenada = (float) $lineaOrden->cantidad;
            $cantidadYaRecibida = $cantidadesRecibidas[$item['producto_id']] ?? 0;
            $cantidadPendiente = $cantidadOrdenada - $cantidadYaRecibida;

            if ($item['cantidad'] > $cantidadPendiente) {
                $nombreProducto = $lineaOrden->producto->nombre ?? ('ID ' . $item['producto_id']);
                return back()->withErrors([
                    'detalles' => "La cantidad recibida ({$item['cantidad']}) excede la cantidad pendiente ({$cantidadPendiente}) para el producto {$nombreProducto}.",
                ])->withInput();
            }

            $montoTotal += round($item['cantidad'] * $precioUnitario, 2);
        }

        $mensajesAdvertencia = [];

        DB::transaction(function () use ($data, $orden, $montoTotal, &$mensajesAdvertencia) {
            // #19: Re-validar sesión de caja DENTRO de la transacción para evitar condición de carrera
            $sesion = null;
            if ($data['metodo_pago'] === 'efectivo' && class_exists(\App\Modules\Cash\Services\CajaService::class)) {
                $cajaService = app(\App\Modules\Cash\Services\CajaService::class);
                $sesion = $cajaService->getSesionAbierta(auth()->id());
                if (!$sesion) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'metodo_pago' => 'La sesión de caja se cerró. Abre un nuevo turno para continuar.',
                    ]);
                }
            }

            $recepcion = Recepcion::create([
                'tenant_id' => $orden->tenant_id,
                'orden_compra_id' => $data['orden_compra_id'],
                'bodega_id' => $data['bodega_id'],
                'numero' => $data['numero'],
                'fecha' => $data['fecha'],
                'metodo_pago' => $data['metodo_pago'],
                'monto_total' => $montoTotal,
                'caja_sesion_id' => $sesion?->id,
                'notas' => $data['notas'] ?? null,
            ]);

            foreach ($data['detalles'] as $item) {
                $recepcion->detalles()->create([
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                ]);

                $producto = Producto::find($item['producto_id']);
                if ($producto) {
                    $producto->increment('stock_actual', $item['cantidad']);
                }

                $stock = Stock::firstOrCreate([
                    'producto_id' => $item['producto_id'],
                    'bodega_id' => $data['bodega_id'],
                ]);
                $stock->increment('cantidad', $item['cantidad']);
            }

            // Verificar si la orden está completamente recibida
            $orden->load('detalles');
            $todasRecibidas = true;
            foreach ($orden->detalles as $linea) {
                $recibido = DB::table('inventory_recepcion_detalles')
                    ->join('inventory_recepciones', 'inventory_recepciones.id', '=', 'inventory_recepcion_detalles.recepcion_id')
                    ->where('inventory_recepciones.orden_compra_id', $orden->id)
                    ->where('inventory_recepcion_detalles.producto_id', $linea->producto_id)
                    ->sum('inventory_recepcion_detalles.cantidad');

                if ($recibido < (float) $linea->cantidad) {
                    $todasRecibidas = false;
                    break;
                }
            }

            if ($todasRecibidas) {
                $orden->update(['estado' => 'recibida']);
            }

            // Integración con Caja (solo si el módulo está instalado)
            if ($data['metodo_pago'] === 'efectivo' && $montoTotal > 0 && $sesion && class_exists(\App\Modules\Cash\Services\CajaService::class)) {
                $cajaService = app(\App\Modules\Cash\Services\CajaService::class);
                $cajaService->registrarMovimiento(
                    $sesion,
                    'egreso',
                    $montoTotal,
                    'efectivo',
                    "Pago compra Recepción: {$recepcion->numero}",
                    $recepcion
                );
            }

            // Integración con Cuentas por Pagar y Contabilidad (solo si módulos instalados)
            if (class_exists(\App\Modules\Accounting\Models\CuentaPorPagar::class) && class_exists(\App\Modules\Accounting\Services\ContabilidadService::class)) {
                if ($data['metodo_pago'] === 'credito' && $montoTotal > 0) {
                    \App\Modules\Accounting\Models\CuentaPorPagar::create([
                        'tenant_id' => $orden->tenant_id,
                        'acreedor_id' => $orden->proveedor_id,
                        'acreedor_type' => get_class($orden->proveedor),
                        'documento_origen_id' => $recepcion->id,
                        'documento_origen_type' => Recepcion::class,
                        'monto_total' => $montoTotal,
                        'monto_pagado' => 0,
                        'estado' => 'pendiente',
                        'fecha_vencimiento' => $data['fecha_vencimiento'] ?? \Carbon\Carbon::parse($data['fecha'])->addDays(30)->toDateString(),
                        'notas' => "Compra a crédito Recepción {$recepcion->numero}",
                    ]);
                }

                $contabilidadService = app(\App\Modules\Accounting\Services\ContabilidadService::class);
                $lineasContables = [];

                $cuentaInventario = $contabilidadService->getCuenta('1405');
                if ($cuentaInventario) {
                    $lineasContables[] = [
                        'cuenta_contable_id' => $cuentaInventario->id,
                        'descripcion' => "Ingreso Inventario Recepción {$recepcion->numero}",
                        'debito' => $montoTotal,
                        'credito' => 0,
                    ];
                } else {
                    $mensajesAdvertencia[] = 'No se generó asiento contable: cuenta de inventario (1405) no configurada en el plan de cuentas.';
                }

                $codigoCredito = match ($data['metodo_pago']) {
                    'transferencia' => '111005',
                    'credito' => '2205',
                    default => '110505',
                };

                $cuentaCredito = $contabilidadService->getCuenta($codigoCredito);
                if (!$cuentaCredito) {
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
                } else {
                    $mensajesAdvertencia[] = "No se generó contrapartida contable: cuenta para método '{$data['metodo_pago']}' no configurada en el plan de cuentas.";
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
                } else {
                    $mensajesAdvertencia[] = 'El asiento contable no se registró: faltan cuentas del PUC. La recepción se guardó correctamente.';
                }
            }
        });

        $redirect = redirect()->route('inventory.recepciones.index');

        if (!empty($mensajesAdvertencia)) {
            $redirect->with('warning', implode(' ', $mensajesAdvertencia));
        }

        return $redirect->with('success', 'Mercancía recibida correctamente.');
    }

    public function show(Recepcion $recepcione)
    {
        $recepcione->load(['ordenCompra', 'detalles.producto:id,codigo,nombre']);

        return Inertia::render('Inventory/Recepciones/Show', [
            'recepcion' => $recepcione,
        ]);
    }
}
