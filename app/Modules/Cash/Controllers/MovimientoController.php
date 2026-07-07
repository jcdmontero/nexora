<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Concerns\HasReciboLoader;
use App\Modules\Cash\Models\MovimientoCaja;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MovimientoController extends Controller
{
    use HasReciboLoader;
    public function index(Request $request)
    {
        // BelongsToTenant aplica el scope automáticamente (no hace falta where tenant_id).
        $movimientos = MovimientoCaja::with(['sesion.caja', 'sesion.usuario'])
            ->orderBy('id', 'desc')
            ->paginate(20);

        $reciboMap = $this->loadRecibosParaMovimientos($movimientos->getCollection());

        $movimientos->through(fn ($m) => [
                'id' => $m->id,
                'tipo' => $m->tipo,
                'monto' => (float) $m->monto,
                'metodo_pago' => $m->metodo_pago,
                'concepto' => $m->concepto,
                'created_at' => $m->created_at,
                'sesion' => $m->sesion ? [
                    'caja' => ['nombre' => $m->sesion->caja?->nombre],
                    'usuario' => ['name' => $m->sesion->usuario?->name],
                ] : null,
                'recibo_id' => $reciboMap[$m->referencia_type . '::' . $m->referencia_id . '::' . (float) $m->monto] ?? null,
                'es_anulacion' => $m->es_anulacion,
            ]);

        return Inertia::render('Modules/Cash/Movimientos/Index', [
            'movimientos' => $movimientos,
        ]);
    }

    public function store(Request $request, CajaService $cajaService)
    {
        $validated = $request->validate([
            'tipo' => 'required|in:ingreso,egreso',
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|string|max:50',
            'concepto' => 'required|string|max:255',
        ]);

        $sesionActiva = $cajaService->getSesionAbierta(auth()->id());

        if (!$sesionActiva) {
            return back()->with('error', 'Debes abrir un turno de caja antes de registrar movimientos.');
        }

        $cajaService->registrarMovimiento(
            $sesionActiva,
            $validated['tipo'],
            (float) $validated['monto'],
            $validated['metodo_pago'],
            $validated['concepto'],
        );

        return back()->with('success', 'Movimiento registrado correctamente.');
    }
}
