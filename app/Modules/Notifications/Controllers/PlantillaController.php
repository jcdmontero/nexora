<?php
namespace App\Modules\Notifications\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Notifications\Models\PlantillaNotificacion;
use App\Modules\Notifications\Services\NotificacionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlantillaController extends Controller
{
    public function index()
    {
        return Inertia::render('Notifications/Plantillas/Index', [
            'plantillas' => PlantillaNotificacion::orderBy('evento')->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'evento' => $p->evento,
                    'nombre' => $p->nombre,
                    'asunto' => $p->asunto,
                    'contenido' => $p->contenido,
                    'canales' => $p->canales ?? [],
                    'activo' => $p->activo,
                ]),
            'canales' => NotificacionService::CANALES,
            'variables' => ['cliente_nombre', 'numero_orden', 'equipo', 'estado', 'fallas', 'total', 'empresa'],
        ]);
    }

    public function update(Request $request, PlantillaNotificacion $plantilla)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:120'],
            'asunto' => ['nullable', 'string', 'max:200'],
            'contenido' => ['required', 'string'],
            'canales' => ['array'],
            'canales.*' => ['in:email,whatsapp,telegram'],
            'activo' => ['boolean'],
        ]);

        $plantilla->update($data);

        return back()->with('success', 'Plantilla actualizada.');
    }

    public function destroy(PlantillaNotificacion $plantilla)
    {
        $plantilla->delete();

        return redirect()->route('notifications.plantillas.index')
            ->with('success', 'Plantilla eliminada.');
    }
}
