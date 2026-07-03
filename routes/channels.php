<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Canal de tenant: todos los usuarios autenticados del mismo tenant
| reciben notificaciones en tiempo real.
|
| Canal de presencia: indica qué usuarios están en línea.
|
| Canal de chat: mensajes directos entre usuarios.
|
*/

// Canal privado del tenant — notificaciones + live updates
Broadcast::channel('tenant.{tenantId}', function ($user, $tenantId) {
    if ((int) $user->tenant_id !== (int) $tenantId) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
    ];
});

// Canal de presencia — quién está en línea
Broadcast::channel('presence.online', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
    ];
});

// Canal de chat por conversación
Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {
    $conversacion = \App\Modules\Notifications\Models\ChatConversacion::find($conversationId);

    if (!$conversacion) {
        return false;
    }

    $participantes = $conversacion->participantes ?? [];
    $isParticipant = in_array($user->id, $participantes);

    if (!$isParticipant) {
        return false;
    }

    return [
        'id' => $user->id,
        'name' => $user->name,
    ];
});
