<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\ChecklistItem;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChecklistItemController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Checklist/Index', [
            'items' => ChecklistItem::with('tipoEquipo:id,nombre')
                ->orderBy('tipo_equipo_id')
                ->orderBy('categoria')
                ->orderBy('orden')
                ->get()
                ->map(fn ($i) => [
                    'id' => $i->id,
                    'nombre' => $i->nombre,
                    'categoria' => $i->categoria,
                    'subtipo' => $i->subtipo,
                    'icono' => $i->icono,
                    'descripcion' => $i->descripcion,
                    'orden' => $i->orden,
                    'activo' => $i->activo,
                    'tipo_equipo_id' => $i->tipo_equipo_id,
                    'tipo_equipo' => $i->tipoEquipo?->nombre,
                ]),
            'tipos' => TipoEquipo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        ChecklistItem::create($this->validateData($request));

        return back()->with('success', 'Ítem de checklist creado correctamente.');
    }

    public function update(Request $request, ChecklistItem $checklist)
    {
        $checklist->update($this->validateData($request));

        return back()->with('success', 'Ítem actualizado.');
    }

    public function destroy(ChecklistItem $checklist)
    {
        $checklist->delete();

        return back()->with('success', 'Ítem eliminado.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'categoria' => ['required', 'in:fallas,accesorios'],
            'subtipo' => ['nullable', 'string', 'max:50'],
            'icono' => ['nullable', 'string', 'max:50'],
            'descripcion' => ['nullable', 'string'],
            'tipo_equipo_id' => ['nullable', 'exists:sd_tipos_equipo,id'],
            'orden' => ['nullable', 'integer', 'min:0'],
            'activo' => ['boolean'],
        ]);
    }
}
