<?php
namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Models\Bodega;
use App\Core\Models\Sede;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class BodegaController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Bodegas/Index', [
            'bodegas' => Bodega::with('sede:id,nombre')->orderBy('nombre')->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventory/Bodegas/Create', [
            'sedes' => Sede::where('activo', true)->get(['id', 'nombre'])
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'sede_id' => ['required', 'exists:core_sedes,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'es_principal' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        if (!empty($data['es_principal'])) {
            Bodega::where('es_principal', true)->update(['es_principal' => false]);
        }

        Bodega::create($data);

        return redirect()->route('inventory.bodegas.index')
            ->with('success', 'Bodega creada correctamente.');
    }

    public function edit(Bodega $bodega)
    {
        return Inertia::render('Inventory/Bodegas/Edit', [
            'bodega' => $bodega,
            'sedes' => Sede::where('activo', true)->get(['id', 'nombre'])
        ]);
    }

    public function update(Request $request, Bodega $bodega)
    {
        $data = $request->validate([
            'sede_id' => ['required', 'exists:core_sedes,id'],
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'es_principal' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        if (!empty($data['es_principal'])) {
            Bodega::where('id', '!=', $bodega->id)->where('es_principal', true)->update(['es_principal' => false]);
        }

        $bodega->update($data);

        return redirect()->route('inventory.bodegas.index')
            ->with('success', 'Bodega actualizada correctamente.');
    }

    public function destroy(Bodega $bodega)
    {
        if ($bodega->es_principal) {
            return back()->with('error', 'No puedes eliminar la bodega principal.');
        }

        $bodega->delete();

        return back()->with('success', 'Bodega eliminada.');
    }
}
