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
        $tenantId = auth()->user()->tenant_id;
        $userId = auth()->id();

        \App\Jobs\CerrarAnioContableJob::dispatch($anio, $tenantId, $userId)
            ->onQueue('accounting');

        return back()->with('success', "Cierre anual del año {$anio} enviado a cola de procesamiento. Se notificará al finalizar.");
    }
}
