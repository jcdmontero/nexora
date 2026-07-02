<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReporteController extends Controller
{
    public function __construct(private CajaService $cajaService)
    {
    }

    public function consolidado(Request $request)
    {
        $desde = $request->filled('desde') ? new \DateTime($request->input('desde')) : null;
        $hasta = $request->filled('hasta') ? new \DateTime($request->input('hasta')) : null;
        $sedeId = $request->filled('sede_id') ? (int) $request->input('sede_id') : null;

        $reporte = $this->cajaService->reporteConsolidado($desde, $hasta, $sedeId);
        $sedes = \App\Core\Models\Sede::orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('Cash/Reporte/Index', [
            'reporte' => $reporte,
            'sedes' => $sedes,
            'filters' => $request->only(['desde', 'hasta', 'sede_id']),
        ]);
    }
}
