<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Models\Denominacion;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArqueoController extends Controller
{
    public function __construct(private CajaService $cajaService)
    {
    }

    /**
     * Formulario de arqueo: muestra denominaciones y la sesión a arquear.
     */
    public function create(Request $request, CajaSesion $sesion)
    {
        $sesion->load(['caja', 'usuario']);
        $denominaciones = Denominacion::where('activo', true)
            ->orderBy('orden')
            ->get(['id', 'tipo', 'valor']);

        return Inertia::render('Modules/Cash/Arqueo', [
            'sesion' => $sesion,
            'denominaciones' => $denominaciones,
        ]);
    }

    /**
     * Persiste el arqueo (conteo por denominación) y marca la sesión como arqueada.
     */
    public function store(Request $request, CajaSesion $sesion, CajaService $cajaService)
    {
        $validated = $request->validate([
            'detalles' => 'required|array|min:1',
            'detalles.*.denominacion_id' => 'required|exists:cash_denominaciones,id',
            'detalles.*.cantidad' => 'required|integer|min:0',
            'observaciones' => 'nullable|string',
        ]);

        try {
            $arqueo = $cajaService->arquearSesion($sesion, $validated['detalles'], $validated['observaciones'] ?? null);

            return redirect()->route('cash.caja.index')
                ->with('success', 'Arqueo registrado. Diferencia: $' . number_format((float) $arqueo->diferencia, 2));
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
