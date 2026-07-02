<?php

namespace App\Modules\Cash\Controllers;

use App\Modules\Accounting\Models\CuentaPorCobrar;
use App\Modules\Cash\Services\RecaudoService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Sales\Models\Factura;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class RecaudoController extends Controller
{
    public function __construct(
        private RecaudoService $recaudoService,
    ) {}

    /**
     * Muestra la lista de clientes con saldos pendientes.
     */
    public function index(Request $request)
    {
        $busqueda = $request->get('busqueda');

        $clientesConDeuda = Cliente::whereHas('cuentasPorCobrar', function ($q) {
            $q->where('estado', 'pendiente');
        })
            ->when($busqueda, fn ($q) => $q->where(function ($q) use ($busqueda) {
                $q->where('nombre_completo', 'ilike', "%{$busqueda}%")
                  ->orWhere('numero_documento', 'ilike', "%{$busqueda}%");
            }))
            ->with(['cuentasPorCobrar' => fn ($q) => $q->where('estado', 'pendiente')])
            ->orderBy('nombre_completo')
            ->paginate(20)
            ->through(function ($cliente) {
                $saldo = $cliente->cuentasPorCobrar->sum(fn ($c) => (float) $c->monto_total - (float) $c->monto_pagado);
                return [
                    'id' => $cliente->id,
                    'nombre_completo' => $cliente->nombre_completo,
                    'numero_documento' => $cliente->numero_documento,
                    'tipo_documento' => $cliente->tipo_documento,
                    'saldo_pendiente' => $saldo,
                ];
            });

        return Inertia::render('Modules/Cash/Recaudos/Index', [
            'clientes' => $clientesConDeuda,
            'filtros' => ['busqueda' => $busqueda],
        ]);
    }

    /**
     * Muestra las facturas pendientes de un cliente para seleccionar cuál pagar.
     */
    public function pendientes(Cliente $cliente)
    {
        $facturas = Factura::where('cliente_id', $cliente->id)
            ->whereIn('estado', ['pendiente'])
            ->with('cuentaPorCobrar')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($f) {
                $cxc = $f->cuentaPorCobrar;
                return [
                    'id' => $f->id,
                    'numero' => $f->numero,
                    'fecha' => $f->created_at->format('Y-m-d'),
                    'total' => (float) $f->total,
                    'saldo_pendiente' => $cxc ? max(0, (float) $cxc->monto_total - (float) $cxc->monto_pagado) : (float) $f->total,
                    'metodo_pago' => $f->metodo_pago,
                    'estado' => $f->estado,
                ];
            });

        return Inertia::render('Modules/Cash/Recaudos/Pendientes', [
            'cliente' => $cliente,
            'facturas' => $facturas,
        ]);
    }

    /**
     * Procesa el pago de una factura.
     */
    public function pagar(Request $request, Factura $factura)
    {
        $validated = $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia',
        ]);

        // Validar que la factura es válida para recaudo
        if (!in_array($factura->estado, ['pendiente'])) {
            return back()->withErrors(['error' => 'La factura no está pendiente de pago.']);
        }

        // Validar monto contra saldo
        $cxc = CuentaPorCobrar::where('documento_origen_type', Factura::class)
            ->where('documento_origen_id', $factura->id)
            ->first();

        $saldoPendiente = $cxc
            ? max(0, (float) $cxc->monto_total - (float) $cxc->monto_pagado)
            : (float) $factura->total;

        if ($validated['monto'] > $saldoPendiente) {
            return back()->withErrors(['monto' => "El monto no puede superar el saldo pendiente (\$" . number_format($saldoPendiente, 2) . ")."]);
        }

        try {
            $this->recaudoService->procesarRecaudo($factura, $validated['monto'], $validated['metodo_pago']);

            return redirect()->route('cash.recaudos.pendientes', $factura->cliente_id)
                ->with('success', 'Recaudo registrado correctamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
