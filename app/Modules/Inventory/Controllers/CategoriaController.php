<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Categoria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoriaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $categorias = Categoria::query()
            ->when($search, function ($query, $search) {
                $query->where('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Categorias/Index', [
            'categorias' => $categorias,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:inventory_categorias,nombre,NULL,id,tenant_id,' . auth()->user()->tenant_id,
            'descripcion' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Categoria::create($validated);

        return back()->with('success', 'Categoría creada correctamente.');
    }

    public function update(Request $request, Categoria $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:inventory_categorias,nombre,' . $categoria->id . ',id,tenant_id,' . auth()->user()->tenant_id,
            'descripcion' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $categoria->update($validated);

        return back()->with('success', 'Categoría actualizada correctamente.');
    }

    public function destroy(Categoria $categoria)
    {
        if ($categoria->productos()->exists()) {
            return back()->with('error', 'No puedes eliminar una categoría que tiene productos asociados.');
        }

        $categoria->delete();
        return back()->with('success', 'Categoría eliminada correctamente.');
    }
}
