<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Marca;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarcaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $marcas = Marca::query()
            ->when($search, function ($query, $search) {
                $query->where('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Marcas/Index', [
            'marcas' => $marcas,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:inventory_marcas,nombre,NULL,id,tenant_id,' . auth()->user()->tenant_id,
            'is_active' => 'boolean',
        ]);

        Marca::create($validated);

        return back()->with('success', 'Marca creada correctamente.');
    }

    public function update(Request $request, Marca $marca)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:inventory_marcas,nombre,' . $marca->id . ',id,tenant_id,' . auth()->user()->tenant_id,
            'is_active' => 'boolean',
        ]);

        $marca->update($validated);

        return back()->with('success', 'Marca actualizada correctamente.');
    }

    public function destroy(Marca $marca)
    {
        if ($marca->productos()->exists()) {
            return back()->with('error', 'No puedes eliminar una marca que tiene productos asociados.');
        }

        $marca->delete();
        return back()->with('success', 'Marca eliminada correctamente.');
    }
}
