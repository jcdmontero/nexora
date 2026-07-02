<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Services\CierreAnualService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CierreAnualController extends Controller
{
    public function __construct(
        private CierreAnualService $cierreAnualService,
    ) {}

    /**
     * Muestra los años disponibles para cierre anual.
     */
    public function index()
    {
        $aniosDisponibles = $this->cierreAnualService->aniosDisponiblesParaCierre();

        return Inertia::render('Modules/Accounting/CierreAnual/Index', [
            'aniosDisponibles' => $aniosDisponibles,
        ]);
    }

    /**
     * Ejecuta el cierre anual para el año indicado.
     */
    public function cerrar(Request $request)
    {
        $validated = $request->validate([
            'anio' => ['required', 'integer', 'min:2000', 'max:' . (int) now()->year],
        ]);

        $anio = (int) $validated['anio'];

        try {
            $resultado = $this->cierreAnualService->cerrarAnio($anio);

            Log::info("Cierre anual {$anio} ejecutado", [
                'asiento' => $resultado['asiento_numero'],
                'utilidad_neta' => $resultado['utilidad_neta'],
            ]);

            return back()->with('success', "Año {$anio} cerrado exitosamente. Asiento {$resultado['asiento_numero']} registrado.");

        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());

        } catch (\Exception $e) {
            Log::error("Error en cierre anual {$anio}: {$e->getMessage()}");

            return back()->with('error', 'Ocurrió un error inesperado al ejecutar el cierre anual. Intente de nuevo.');
        }
    }
}
