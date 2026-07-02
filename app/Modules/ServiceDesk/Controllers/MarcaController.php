<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\Marca;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarcaController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Marcas/Index', [
            'marcas' => Marca::withCount('modelos')
                ->orderBy('nombre')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'nombre' => $m->nombre,
                    'activo' => $m->activo,
                    'modelos_count' => $m->modelos_count,
                ]),
        ]);
    }

    public function store(Request $request)
    {
        Marca::create($this->validateData($request));

        return back()->with('success', 'Marca creada correctamente.');
    }

    public function update(Request $request, Marca $marca)
    {
        $marca->update($this->validateData($request, $marca->id));

        return back()->with('success', 'Marca actualizada.');
    }

    public function destroy(Marca $marca)
    {
        if ($marca->modelos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: tiene modelos asociados.');
        }

        $marca->delete();

        return back()->with('success', 'Marca eliminada.');
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $tenantId = app('current_tenant')->id;

        return $request->validate([
            'nombre' => [
                'required', 'string', 'max:120',
                "unique:sd_marcas,nombre,{$ignoreId},id,tenant_id,{$tenantId}",
            ],
            'activo' => ['boolean'],
        ]);
    }
}
