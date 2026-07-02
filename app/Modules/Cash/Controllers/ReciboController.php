<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\ReciboCaja;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ReciboController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'orden_id' => ['required', 'exists:sd_ordenes,id'],
            'monto' => ['required', 'numeric', 'min:0.01'],
            'metodo_pago' => ['required', 'in:efectivo,tarjeta,transferencia'],
            'notas' => ['nullable', 'string', 'max:500'],
        ]);

        $orden = OrdenReparacion::findOrFail($validated['orden_id']);

        try {
            $reciboService = app(\App\Modules\Cash\Services\ReciboService::class);
            $recibo = $reciboService->registrarAbono(
                $orden,
                (float) $validated['monto'],
                $validated['metodo_pago'],
                $validated['notas'] ?? null,
            );

            return redirect()->back()->with([
                'success' => 'Abono registrado. Recibo RC-' . str_pad($recibo->numero, 6, '0', STR_PAD_LEFT),
                'nuevo_recibo_id' => $recibo->id,
            ]);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function show(ReciboCaja $recibo)
    {
        $recibo->load(['sesion.caja', 'usuario', 'cliente', 'referencia']);

        return inertia('Cash/Recibos/Show', [
            'recibo' => [
                'id' => $recibo->id,
                'numero' => $recibo->numero_formateado,
                'fecha' => $recibo->fecha->format('Y-m-d H:i'),
                'monto' => (float) $recibo->monto,
                'metodo_pago' => $recibo->metodo_pago,
                'concepto' => $recibo->concepto,
                'estado' => $recibo->estado,
                'notas' => $recibo->notas,
                'usuario' => $recibo->usuario?->name,
                'caja' => $recibo->sesion?->caja?->nombre,
                'cliente' => $recibo->cliente ? [
                    'nombre' => $recibo->cliente->nombre_completo,
                    'documento' => $recibo->cliente->documento,
                ] : null,
                'referencia' => $recibo->referencia ? [
                    'tipo' => class_basename($recibo->referencia_type),
                    'numero' => $recibo->referencia->numero_orden ?? $recibo->referencia->numero ?? null,
                ] : null,
            ],
        ]);
    }

    public function pdf(ReciboCaja $recibo)
    {
        $recibo->load(['sesion.caja', 'usuario', 'cliente', 'referencia']);

        $empresa = app('current_tenant');

        $pdf = Pdf::loadView('cash.recibo-pdf', compact('recibo', 'empresa'))
            ->setPaper([0, 0, 226.77, 400], 'portrait');

        return $pdf->stream("recibo-{$recibo->numero_formateado}.pdf");
    }

    /**
     * Anula un recibo de abono: reversa caja, contabilidad y actualiza la OT.
     */
    public function anular(ReciboCaja $recibo)
    {
        if ($recibo->estado === 'anulado') {
            return back()->with('error', 'El recibo ya está anulado.');
        }

        try {
            $reciboService = app(\App\Modules\Cash\Services\ReciboService::class);
            $reciboService->anularRecibo($recibo);

            return back()->with(
                'success',
                'Recibo RC-' . str_pad($recibo->numero, 6, '0', STR_PAD_LEFT) . ' anulado. Caja y contabilidad reversados.'
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Error al anular recibo: ' . $e->getMessage());
        }
    }
}
