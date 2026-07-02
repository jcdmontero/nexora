<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TipoEquipoController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/TiposEquipo/Index', [
            'tipos' => TipoEquipo::withCount('modelos')
                ->orderBy('nombre')
                ->get()
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'nombre' => $t->nombre,
                    'familia' => $t->familia,
                    'descripcion' => $t->descripcion,
                    'activo' => $t->activo,
                    'modelos_count' => $t->modelos_count,
                ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] = Str::slug($data['nombre']);
        TipoEquipo::create($data);

        return back()->with('success', 'Tipo de equipo creado correctamente.');
    }

    public function update(Request $request, TipoEquipo $tipos_equipo)
    {
        $data = $this->validateData($request, $tipos_equipo->id);
        $data['slug'] = Str::slug($data['nombre']);
        $tipos_equipo->update($data);

        return back()->with('success', 'Tipo de equipo actualizado.');
    }

    public function destroy(TipoEquipo $tipos_equipo)
    {
        if ($tipos_equipo->modelos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: tiene modelos asociados.');
        }

        $tipos_equipo->delete();

        return back()->with('success', 'Tipo de equipo eliminado.');
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $tenantId = app('current_tenant')->id;

        return $request->validate([
            'nombre' => [
                'required', 'string', 'max:120',
                "unique:sd_tipos_equipo,nombre,{$ignoreId},id,tenant_id,{$tenantId}",
            ],
            'familia' => ['nullable', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ]);
    }
}
