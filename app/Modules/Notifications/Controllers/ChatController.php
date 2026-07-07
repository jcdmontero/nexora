<?php

namespace App\Modules\Notifications\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Notifications\Models\ChatConversacion;
use App\Modules\Notifications\Models\ChatMensaje;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $conversaciones = ChatConversacion::where('tenant_id', $request->user()->tenant_id)
            ->whereJsonContains('participantes', $userId)
            ->with(['ultimoMensaje.user'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (ChatConversacion $c) => [
                'id' => $c->id,
                'tipo' => $c->tipo,
                'nombre' => $c->nombre,
                'participantes' => $c->participantes,
                'ultimo_mensaje' => $c->ultimoMensaje ? [
                    'mensaje' => $c->ultimoMensaje->mensaje,
                    'user_name' => $c->ultimoMensaje->user?->name,
                    'created_at' => $c->ultimoMensaje->created_at?->toISOString(),
                ] : null,
                'updated_at' => $c->updated_at?->toISOString(),
            ]);

        return response()->json(['conversaciones' => $conversaciones]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'integer', Rule::exists('users', 'id')->where('tenant_id', $request->user()->tenant_id)],
        ]);

        $userId = $request->user()->id;
        $targetUserId = (int) $validated['user_id'];
        $tenantId = $request->user()->tenant_id;

        if ($userId === $targetUserId) {
            return response()->json(['error' => 'No puedes crear un chat contigo mismo'], 422);
        }

        // Check if conversation already exists
        $existing = ChatConversacion::where('tenant_id', $tenantId)
            ->where('tipo', 'directo')
            ->whereJsonContains('participantes', $userId)
            ->whereJsonContains('participantes', $targetUserId)
            ->first();

        if ($existing) {
            return response()->json(['conversacion' => ['id' => $existing->id]]);
        }

        $conversacion = ChatConversacion::create([
            'tenant_id' => $tenantId,
            'tipo' => 'directo',
            'participantes' => [$userId, $targetUserId],
        ]);

        return response()->json(['conversacion' => ['id' => $conversacion->id]]);
    }

    public function mensajes(Request $request, int $conversacionId): JsonResponse
    {
        $userId = $request->user()->id;

        $conversacion = ChatConversacion::where('tenant_id', $request->user()->tenant_id)
            ->where('id', $conversacionId)
            ->first();

        if (!$conversacion) {
            return response()->json(['error' => 'Conversación no encontrada'], 404);
        }

        if (!in_array($userId, $conversacion->participantes ?? [])) {
            return response()->json(['error' => 'No tienes acceso a esta conversación'], 403);
        }

        $mensajes = ChatMensaje::where('conversacion_id', $conversacionId)
            ->with('user:id,name')
            ->orderBy('created_at', 'asc')
            ->limit(100)
            ->get()
            ->map(fn (ChatMensaje $m) => [
                'id' => $m->id,
                'user_id' => $m->user_id,
                'user_name' => $m->user?->name,
                'mensaje' => $m->mensaje,
                'tipo' => $m->tipo,
                'leido_en' => $m->leido_en?->toISOString(),
                'created_at' => $m->created_at?->toISOString(),
            ]);

        return response()->json(['mensajes' => $mensajes]);
    }

    public function enviar(Request $request, int $conversacionId): JsonResponse
    {
        $userId = $request->user()->id;

        $conversacion = ChatConversacion::where('tenant_id', $request->user()->tenant_id)
            ->where('id', $conversacionId)
            ->first();

        if (!$conversacion) {
            return response()->json(['error' => 'Conversación no encontrada'], 404);
        }

        if (!in_array($userId, $conversacion->participantes ?? [])) {
            return response()->json(['error' => 'No tienes acceso a esta conversación'], 403);
        }

        $validated = $request->validate([
            'mensaje' => 'required|string|max:2000',
            'tipo' => 'nullable|string|in:texto,imagen,archivo',
        ]);

        $mensaje = ChatMensaje::create([
            'tenant_id' => $request->user()->tenant_id,
            'conversacion_id' => $conversacionId,
            'user_id' => $userId,
            'mensaje' => $validated['mensaje'],
            'tipo' => $validated['tipo'] ?? 'texto',
        ]);

        $conversacion->touch();

        \App\Events\ChatMensajeEnviado::dispatch($mensaje->fresh('user'), $conversacion);

        return response()->json([
            'mensaje' => [
                'id' => $mensaje->id,
                'user_id' => $mensaje->user_id,
                'user_name' => $request->user()->name,
                'mensaje' => $mensaje->mensaje,
                'tipo' => $mensaje->tipo,
                'created_at' => $mensaje->created_at?->toISOString(),
            ],
        ]);
    }
}
