<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CajaController extends Controller
{
    public function __construct(private CajaService $cajaService)
    {
    }

    /**
     * Gestión de turnos: sesión activa del usuario, cajas disponibles e historial.
     */
    public function index(Request $request)
    {
        $sesionActiva = $this->cajaService->getSesionAbierta(auth()->id());

        $cajasDisponibles = [];
        if (!$sesionActiva) {
            $cajasDisponibles = $this->cajaService->cajasDisponibles()
                ->map(fn ($c) => ['id' => $c->id, 'nombre' => $c->nombre, 'sede' => $c->sede?->nombre])
                ->values();
        }

        $movimientos = [];
        if ($sesionActiva) {
            $movimientos = \App\Modules\Cash\Models\MovimientoCaja::where('sesion_id', $sesionActiva->id)
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'tipo' => $m->tipo,
                    'monto' => (float) $m->monto,
                    'metodo_pago' => $m->metodo_pago,
                    'concepto' => $m->concepto,
                    'fecha' => $m->created_at->format('H:i'),
                    'referencia' => $m->referencia ? class_basename($m->referencia_type) : null,
                    'recibo_id' => $m->recibo_id,
                    'es_anulacion' => $m->es_anulacion,
                ]);

            // Forzar carga de totales para saldo_sistema
            $sesionActiva->load([]);
        }

        $historial = CajaSesion::with(['caja.sede', 'usuario'])
            ->orderBy('id', 'desc')
            ->paginate(10);

        return Inertia::render('Cash/Caja/Index', [
            'sesionActiva' => $sesionActiva,
            'cajasDisponibles' => $cajasDisponibles,
            'movimientos' => $movimientos,
            'historial' => $historial,
        ]);
    }

    public function abrir(Request $request)
    {
        $validated = $request->validate([
            'caja_id' => 'required|exists:cash_cajas,id',
            'saldo_inicial' => 'required|numeric|min:0',
        ]);

        try {
            $this->cajaService->abrirCaja(
                auth()->id(),
                (int) $validated['caja_id'],
                (float) $validated['saldo_inicial'],
            );

            return back()->with('success', 'Turno de caja abierto correctamente.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function cerrar(Request $request, CajaSesion $sesion)
    {
        $validated = $request->validate([
            'saldo_final' => 'required|numeric|min:0',
            'notas' => 'nullable|string',
        ]);

        try {
            $sesion = $this->cajaService->cerrarSesion(
                $sesion,
                (float) $validated['saldo_final'],
                $validated['notas'] ?? null,
            );

            return back()->with(
                'success',
                'Turno de caja cerrado correctamente. Diferencia: $' . number_format((float) $sesion->diferencia, 2)
            );
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Estado de la caja para integraciones (POS, liquidación de órdenes, etc.).
     * Devuelve si hay sesión abierta y las cajas disponibles para abrir turno.
     */
    public function estado(Request $request)
    {
        if (!$request->user()->can('cash:view')) {
            abort(403);
        }

        $sesionActiva = $this->cajaService->getSesionAbierta(auth()->id());

        $cajasDisponibles = [];
        if (!$sesionActiva) {
            $cajasDisponibles = $this->cajaService->cajasDisponibles()
                ->map(fn ($c) => ['id' => $c->id, 'nombre' => $c->nombre])
                ->values();
        }

        return response()->json([
            'cajaAbierta' => $sesionActiva ? true : false,
            'cajasDisponibles' => $cajasDisponibles,
            'sesionActiva' => $sesionActiva,
        ]);
    }
}
