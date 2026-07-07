<?php

namespace App\Modules\Cash\Controllers;

use App\Modules\Accounting\Models\CuentaPorPagar;
use App\Modules\Cash\Services\PagoProveedorService;
use App\Modules\Purchasing\Models\Proveedor;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Inertia\Inertia;

class PagoProveedorController extends Controller
{
    public function __construct(
        private PagoProveedorService $pagoProveedorService,
    ) {}

    /**
     * Muestra la lista de proveedores con saldos pendientes.
     */
    public function index(Request $request)
    {
        $busqueda = $request->get('busqueda');

        $proveedoresConDeuda = Proveedor::whereHas('cuentasPorPagar', function ($q) {
            $q->where('estado', 'pendiente');
        })
            ->when($busqueda, fn ($q) => $q->where(function ($q) use ($busqueda) {
                $q->whereRaw('LOWER(razon_social) LIKE ?', ['%' . strtolower($busqueda) . '%'])
                  ->orWhereRaw('LOWER(numero_documento) LIKE ?', ['%' . strtolower($busqueda) . '%']);
            }))
            ->with(['cuentasPorPagar' => fn ($q) => $q->where('estado', 'pendiente')])
            ->orderBy('razon_social')
            ->paginate(20)
            ->through(function ($proveedor) {
                $saldo = $proveedor->cuentasPorPagar->sum(fn ($c) => (float) $c->monto_total - (float) $c->monto_pagado);
                return [
                    'id' => $proveedor->id,
                    'razon_social' => $proveedor->razon_social,
                    'numero_documento' => $proveedor->numero_documento,
                    'tipo_documento' => $proveedor->tipo_documento,
                    'saldo_pendiente' => $saldo,
                ];
            });

        return Inertia::render('Modules/Cash/PagoProveedores/Index', [
            'proveedores' => $proveedoresConDeuda,
            'filtros' => ['busqueda' => $busqueda],
        ]);
    }

    /**
     * Muestra las CxP pendientes de un proveedor.
     */
    public function pendientes(Proveedor $proveedor)
    {
        $cxps = CuentaPorPagar::where('acreedor_type', Proveedor::class)
            ->where('acreedor_id', $proveedor->id)
            ->where('estado', 'pendiente')
            ->with('documentoOrigen')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($cxp) {
                $recepcion = $cxp->documentoOrigen;
                return [
                    'id' => $cxp->id,
                    'numero_recepcion' => $recepcion?->numero ?? "CXP #{$cxp->id}",
                    'fecha' => $cxp->created_at->format('Y-m-d'),
                    'monto_total' => (float) $cxp->monto_total,
                    'saldo_pendiente' => max(0, (float) $cxp->monto_total - (float) $cxp->monto_pagado),
                    'estado' => $cxp->estado,
                    'notas' => $cxp->notas,
                ];
            });

        return Inertia::render('Modules/Cash/PagoProveedores/Pendientes', [
            'proveedor' => $proveedor,
            'cxps' => $cxps,
        ]);
    }

    /**
     * Procesa el pago de una CxP.
     */
    public function pagar(Request $request, CuentaPorPagar $cxp)
    {
        $validated = $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia',
        ]);

        // Validar que la CxP está pendiente
        if ($cxp->estado !== 'pendiente') {
            return back()->withErrors(['error' => 'La cuenta por pagar no está pendiente.']);
        }

        // Validar monto contra saldo
        $saldoPendiente = max(0, (float) $cxp->monto_total - (float) $cxp->monto_pagado);

        if ($validated['monto'] > $saldoPendiente) {
            return back()->withErrors(['monto' => "El monto no puede superar el saldo pendiente (\$" . number_format($saldoPendiente, 2) . ")."]);
        }

        try {
            $this->pagoProveedorService->procesarPago($cxp, $validated['monto'], $validated['metodo_pago']);

            return redirect()->route('cash.pagos-proveedores.pendientes', $cxp->acreedor_id)
                ->with('success', 'Pago a proveedor registrado correctamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
