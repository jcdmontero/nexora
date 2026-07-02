<?php
namespace App\Modules\Notifications\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Notifications\Models\Notificacion;
use App\Modules\Notifications\Services\NotificacionService;
use Inertia\Inertia;

class NotificacionController extends Controller
{
    public function index()
    {
        return Inertia::render('Notifications/Index', [
            'notificaciones' => Inertia::defer(fn () => Notificacion::with('enviador:id,name')
                ->latest()
                ->limit(200)
                ->get()
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'evento' => $n->evento,
                    'destinatario' => $n->destinatario_nombre,
                    'email' => $n->destinatario_email,
                    'telefono' => $n->destinatario_telefono,
                    'titulo' => $n->titulo,
                    'mensaje' => $n->mensaje,
                    'canales' => $n->canales,
                    'canal_estados' => $n->canal_estados,
                    'estado' => $n->estado,
                    'fecha_envio' => $n->fecha_envio?->toIso8601String(),
                    'creado' => $n->created_at?->diffForHumans(),
                ])),
        ]);
    }

    public function reenviar(Notificacion $notificacion)
    {
        app(NotificacionService::class)->enviar($notificacion, request()->user());

        return back()->with('success', 'Notificación reenviada.');
    }
}
