<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\Caja;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CajaAdminController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $cajas = Caja::with(['sede', 'sesionActual.usuario'])
            ->when($search, function ($query, $search) {
                $query->where('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        $sedes = \App\Core\Models\Sede::orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('Cash/Cajas/Index', [
            'cajas' => $cajas,
            'sedes' => $sedes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'sede_id' => 'nullable|exists:core_sedes,id',
            'activa' => 'boolean',
        ]);

        // tenant_id lo autoasigna BelongsToTenant.
        Caja::create($validated);

        return back()->with('success', 'Caja creada correctamente.');
    }

    public function update(Request $request, Caja $caja)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'sede_id' => 'nullable|exists:core_sedes,id',
            'activa' => 'boolean',
        ]);

        $caja->update($validated);

        return back()->with('success', 'Caja actualizada correctamente.');
    }

    public function destroy(Caja $caja)
    {
        if ($caja->sesiones()->where('estado', 'abierta')->exists()) {
            return back()->with('error', 'No puedes eliminar una caja con un turno abierto.');
        }

        if ($caja->sesiones()->exists()) {
            // En lugar de borrar, se desactiva para preservar el histórico.
            $caja->update(['activa' => false]);
            return back()->with('success', 'La caja tiene historial y fue desactivada en lugar de eliminada.');
        }

        $caja->delete();

        return back()->with('success', 'Caja eliminada correctamente.');
    }
}
