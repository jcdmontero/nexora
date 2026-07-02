<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\FallaBase;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FallaBaseController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Fallas/Index', [
            'fallas' => FallaBase::with('tipoEquipo:id,nombre')
                ->orderBy('nombre')
                ->get()
                ->map(fn ($f) => [
                    'id' => $f->id,
                    'nombre' => $f->nombre,
                    'descripcion' => $f->descripcion,
                    'solucion_sugerida' => $f->solucion_sugerida,
                    'tiempo_estimado' => $f->tiempo_estimado,
                    'activo' => $f->activo,
                    'tipo_equipo_id' => $f->tipo_equipo_id,
                    'tipo_equipo' => $f->tipoEquipo?->nombre,
                ]),
            'tipos' => TipoEquipo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        FallaBase::create($this->validateData($request));

        return back()->with('success', 'Falla creada correctamente.');
    }

    public function update(Request $request, FallaBase $falla)
    {
        $falla->update($this->validateData($request));

        return back()->with('success', 'Falla actualizada.');
    }

    public function destroy(FallaBase $falla)
    {
        $falla->delete();

        return back()->with('success', 'Falla eliminada.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string'],
            'solucion_sugerida' => ['nullable', 'string'],
            'tipo_equipo_id' => ['nullable', 'exists:sd_tipos_equipo,id'],
            'tiempo_estimado' => ['nullable', 'integer', 'min:0'],
            'activo' => ['boolean'],
        ]);
    }
}
