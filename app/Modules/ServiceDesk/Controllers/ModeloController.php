<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\Marca;
use App\Modules\ServiceDesk\Models\Modelo;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModeloController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Modelos/Index', [
            'modelos' => Modelo::with(['marca:id,nombre', 'tipoEquipo:id,nombre'])
                ->orderBy('nombre')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'nombre' => $m->nombre,
                    'activo' => $m->activo,
                    'marca_id' => $m->marca_id,
                    'tipo_equipo_id' => $m->tipo_equipo_id,
                    'marca' => $m->marca?->nombre,
                    'tipo_equipo' => $m->tipoEquipo?->nombre,
                ]),
            'marcas' => Marca::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
            'tipos' => TipoEquipo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        Modelo::create($this->validateData($request));

        return back()->with('success', 'Modelo creado correctamente.');
    }

    public function update(Request $request, Modelo $modelo)
    {
        $modelo->update($this->validateData($request));

        return back()->with('success', 'Modelo actualizado.');
    }

    public function destroy(Modelo $modelo)
    {
        $modelo->delete();

        return back()->with('success', 'Modelo eliminado.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'marca_id' => ['nullable', 'exists:sd_marcas,id'],
            'tipo_equipo_id' => ['nullable', 'exists:sd_tipos_equipo,id'],
            'activo' => ['boolean'],
        ]);
    }
}
