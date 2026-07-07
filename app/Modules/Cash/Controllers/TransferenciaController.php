<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\Transferencia;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TransferenciaController extends Controller
{
    public function __construct(private CajaService $cajaService)
    {
    }

    public function index(Request $request)
    {
        $cajas = Caja::where('activa', true)->orderBy('nombre')->get(['id', 'nombre']);

        $transferencias = Transferencia::with(['cajaOrigen', 'cajaDestino', 'usuario'])
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Cash/Transferencias/Index', [
            'cajas' => $cajas,
            'transferencias' => $transferencias,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'caja_origen_id' => ['required', Rule::exists('cash_cajas', 'id')->where('tenant_id', app('current_tenant')->id)->where('activa', true), 'different:caja_destino_id'],
            'caja_destino_id' => ['required', Rule::exists('cash_cajas', 'id')->where('tenant_id', app('current_tenant')->id)->where('activa', true)],
            'monto' => 'required|numeric|min:0.01',
            'concepto' => 'nullable|string|max:255',
        ]);

        try {
            $this->cajaService->transferirEntreCajas(
                (int) $validated['caja_origen_id'],
                (int) $validated['caja_destino_id'],
                (float) $validated['monto'],
                $validated['concepto'] ?? null,
            );

            return back()->with('success', 'Transferencia registrada correctamente.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
