<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicioController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Servicios/Index', [
            'servicios' => Servicio::with('tipoEquipo:id,nombre')
                ->orderBy('nombre')
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'nombre' => $s->nombre,
                    'codigo' => $s->codigo,
                    'descripcion' => $s->descripcion,
                    'precio_base' => $s->precio_base,
                    'costo_tecnico_base' => $s->costo_tecnico_base,
                    'tipo_comision_tecnico' => $s->tipo_comision_tecnico,
                    'tiempo_estimado' => $s->tiempo_estimado,
                    'requiere_repuestos' => $s->requiere_repuestos,
                    'activo' => $s->activo,
                    'tipo_equipo_id' => $s->tipo_equipo_id,
                    'tipo_equipo' => $s->tipoEquipo?->nombre,
                ]),
            'tipos' => TipoEquipo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        Servicio::create($this->validateData($request));

        return back()->with('success', 'Servicio creado correctamente.');
    }

    public function update(Request $request, Servicio $servicio)
    {
        $servicio->update($this->validateData($request));

        return back()->with('success', 'Servicio actualizado.');
    }

    public function destroy(Servicio $servicio)
    {
        $servicio->delete();

        return back()->with('success', 'Servicio eliminado.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'codigo' => ['nullable', 'string', 'max:50'],
            'descripcion' => ['nullable', 'string'],
            'tipo_equipo_id' => ['nullable', 'exists:sd_tipos_equipo,id'],
            'precio_base' => ['required', 'numeric', 'min:0'],
            'costo_tecnico_base' => ['required', 'numeric', 'min:0'],
            'tipo_comision_tecnico' => ['required', 'in:fijo,porcentaje'],
            'tiempo_estimado' => ['nullable', 'integer', 'min:0'],
            'requiere_repuestos' => ['boolean'],
            'activo' => ['boolean'],
        ]);
    }
}
