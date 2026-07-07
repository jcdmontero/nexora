# Auditoría: Notifications
> Actualizado: 2026-07-06

---

## module.json

**Ruta:** `app/Modules/Notifications/module.json`

```json
{
    "code": "notifications",
    "name": "Notificaciones",
    "version": "1.0.0",
    "description": "Envío y seguimiento de notificaciones a clientes por WhatsApp, correo y Telegram.",
    "icon": "Bell",
    "core": false,
    "dependencies": [],
    "permissions": [
        "notifications:view",
        "notifications:send",
        "notifications:manage"
    ],
    "menus": [
        {
            "section": "NOTIFICACIONES",
            "icon": "Bell",
            "items": [
                { "label": "Bandeja", "route": "notifications.index", "permission": "notifications:view" },
                { "label": "Plantillas", "route": "notifications.plantillas.index", "permission": "notifications:manage" }
            ]
        }
    ]
}
```

---

## Routes

**Ruta:** `app/Modules/Notifications/Routes/web.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Notifications\Controllers\NotificacionController;
use App\Modules\Notifications\Controllers\PlantillaController;
use App\Modules\Notifications\Controllers\ChatController;

Route::middleware(['web', 'auth', 'tenant', 'module:notifications'])->group(function () {
    Route::prefix('notificaciones')->name('notifications.')->group(function () {
        Route::middleware('permission:notifications:view')->group(function () {
            Route::get('/', [NotificacionController::class, 'index'])->name('index');
        });
        Route::middleware('permission:notifications:send')->group(function () {
            Route::post('{notificacion}/reenviar', [NotificacionController::class, 'reenviar'])->name('reenviar');
        });
        Route::middleware('permission:notifications:manage')->group(function () {
            Route::get('plantillas', [PlantillaController::class, 'index'])->name('plantillas.index');
            Route::put('plantillas/{plantilla}', [PlantillaController::class, 'update'])->name('plantillas.update');
            Route::delete('plantillas/{plantilla}', [PlantillaController::class, 'destroy'])->name('plantillas.destroy');
        });
    });

    Route::prefix('chat')->name('chat.')->middleware('permission:notifications:send')->group(function () {
        Route::get('/conversaciones', [ChatController::class, 'index'])->name('index');
        Route::post('/conversaciones', [ChatController::class, 'store'])->name('store');
        Route::get('/{conversacionId}/mensajes', [ChatController::class, 'mensajes'])->name('mensajes');
        Route::post('/{conversacionId}/mensajes', [ChatController::class, 'enviar'])->name('enviar');
    });
});
```

---

## Controllers

### NotificacionController

**Ruta:** `app/Modules/Notifications/Controllers/NotificacionController.php`

```php
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
```

### PlantillaController

**Ruta:** `app/Modules/Notifications/Controllers/PlantillaController.php`

```php
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
```

### ChatController

**Ruta:** `app/Modules/Notifications/Controllers/ChatController.php`

```php
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
```

---

## Models

### Notificacion

**Ruta:** `app/Modules/Notifications/Models/Notificacion.php`

```php
<?php
namespace App\Modules\Notifications\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Notificacion extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'notif_notificaciones';

    protected $fillable = [
        'tenant_id', 'evento', 'referencia_type', 'referencia_id', 'cliente_id',
        'destinatario_nombre', 'destinatario_email', 'destinatario_telefono',
        'titulo', 'mensaje', 'canales', 'canal_estados', 'estado', 'error',
        'enviado_por', 'fecha_envio',
    ];

    protected $casts = [
        'canales' => 'array',
        'canal_estados' => 'array',
        'fecha_envio' => 'datetime',
    ];

    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }

    public function enviador()
    {
        return $this->belongsTo(User::class, 'enviado_por');
    }

    /** Recalcula el estado global a partir de los estados por canal. */
    public function sincronizarEstado(): void
    {
        $estados = array_values($this->canal_estados ?? []);
        if (empty($estados)) {
            $this->estado = 'pendiente';
            return;
        }
        $enviadas = count(array_filter($estados, fn ($e) => $e === 'enviada'));
        $errores = count(array_filter($estados, fn ($e) => $e === 'error'));
        if ($enviadas === count($estados)) {
            $this->estado = 'enviada';
        } elseif ($enviadas > 0) {
            $this->estado = 'parcial';
        } elseif ($errores === count($estados)) {
            $this->estado = 'error';
        } else {
            $this->estado = 'pendiente';
        }
    }

    public function scopePendientes($q)
    {
        return $q->whereIn('estado', ['pendiente', 'parcial', 'error']);
    }
}
```

### PlantillaNotificacion

**Ruta:** `app/Modules/Notifications/Models/PlantillaNotificacion.php`

```php
<?php
namespace App\Modules\Notifications\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class PlantillaNotificacion extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'notif_plantillas';

    protected $fillable = [
        'tenant_id', 'evento', 'nombre', 'asunto', 'contenido', 'canales', 'activo',
    ];

    protected $casts = [
        'canales' => 'array',
        'activo' => 'boolean',
    ];
}
```

### ChatConversacion

**Ruta:** `app/Modules/Notifications/Models/ChatConversacion.php`

```php
<?php

namespace App\Modules\Notifications\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatConversacion extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'chat_conversaciones';

    protected $fillable = [
        'tenant_id',
        'tipo',
        'nombre',
        'participantes',
    ];

    protected $casts = [
        'participantes' => 'array',
    ];

    public function mensajes(): HasMany
    {
        return $this->hasMany(ChatMensaje::class, 'conversacion_id');
    }

    public function ultimoMensaje()
    {
        return $this->hasOne(ChatMensaje::class, 'conversacion_id')->latestOfMany();
    }
}
```

### ChatMensaje

**Ruta:** `app/Modules/Notifications/Models/ChatMensaje.php`

```php
<?php

namespace App\Modules\Notifications\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMensaje extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'chat_mensajes';

    protected $fillable = [
        'tenant_id',
        'conversacion_id',
        'user_id',
        'mensaje',
        'tipo',
        'leido_en',
    ];

    protected $casts = [
        'leido_en' => 'datetime',
    ];

    public function conversacion(): BelongsTo
    {
        return $this->belongsTo(ChatConversacion::class, 'conversacion_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

---

## Migrations

### Migration 1: Creación de tablas de notificaciones

**Ruta:** `app/Modules/Notifications/Migrations/2026_06_20_000001_create_notifications_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Plantillas de mensajes por evento (con variables {placeholder})
        Schema::create('notif_plantillas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('evento', 50);
            $table->string('nombre', 120);
            $table->string('asunto', 200)->nullable();
            $table->text('contenido');
            $table->json('canales')->nullable();   // ['email','whatsapp','telegram'] activos por defecto
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'evento']);
        });

        // Bandeja / historial de notificaciones enviadas
        Schema::create('notif_notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('evento', 50);
            $table->nullableMorphs('referencia'); // referencia_type / referencia_id (ej. orden)
            $table->foreignId('cliente_id')->nullable();
            $table->string('destinatario_nombre', 150)->nullable();
            $table->string('destinatario_email', 150)->nullable();
            $table->string('destinatario_telefono', 40)->nullable();
            $table->string('titulo', 200)->nullable();
            $table->text('mensaje');
            $table->json('canales');               // canales solicitados
            $table->json('canal_estados')->nullable(); // {email:'enviada', whatsapp:'pendiente', ...}
            $table->string('estado', 20)->default('pendiente'); // pendiente | enviada | parcial | error
            $table->text('error')->nullable();
            $table->foreignId('enviado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('fecha_envio')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'estado']);
            $table->index(['tenant_id', 'evento']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notif_notificaciones');
        Schema::dropIfExists('notif_plantillas');
    }
};
```

### Migration 2: Creación de tablas de chat

**Ruta:** `app/Modules/Notifications/Migrations/2026_07_03_000001_create_chat_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('tipo', 20)->default('directo'); // directo | grupo
            $table->string('nombre')->nullable();
            $table->json('participantes')->nullable(); // [user_id, user_id]
            $table->timestamps();

            $table->index('tenant_id');
        });

        Schema::create('chat_mensajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversacion_id')->constrained('chat_conversaciones')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->nullOnDelete();
            $table->text('mensaje');
            $table->string('tipo', 20)->default('texto'); // texto | imagen | archivo
            $table->timestamp('leido_en')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('conversacion_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_mensajes');
        Schema::dropIfExists('chat_conversaciones');
    }
};
```

---

## Services

### NotificacionService

**Ruta:** `app/Modules/Notifications/Services/NotificacionService.php`

```php
<?php
namespace App\Modules\Notifications\Services;

use App\Models\User;
use App\Modules\Notifications\Models\Notificacion;
use App\Modules\Notifications\Models\PlantillaNotificacion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificacionService
{
    /** Plantillas por defecto si la empresa no ha personalizado el evento. */
    public const DEFAULTS = [
        'orden_recibida' => [
            'nombre' => 'Equipo recibido',
            'asunto' => 'Equipo recibido — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nRecibimos tu equipo {equipo} correctamente.\n\nOrden: {numero_orden}\nEstado: {estado}\nFallas reportadas: {fallas}\n\nTe avisaremos sobre el avance. ¡Gracias por confiar en {empresa}!",
        ],
        'orden_diagnostico' => [
            'nombre' => 'En diagnóstico',
            'asunto' => 'Diagnóstico en progreso — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nEstamos diagnosticando tu equipo {equipo} (orden {numero_orden}).\nTe informaremos los resultados pronto.",
        ],
        'orden_reparacion' => [
            'nombre' => 'En reparación',
            'asunto' => 'Reparación en curso — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nTu equipo {equipo} está en reparación (orden {numero_orden}).",
        ],
        'orden_pruebas' => [
            'nombre' => 'En pruebas',
            'asunto' => 'Pruebas de funcionamiento — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nTu equipo {equipo} está en pruebas finales (orden {numero_orden}).",
        ],
        'orden_listo' => [
            'nombre' => 'Listo para entrega',
            'asunto' => 'Tu equipo está listo — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\n¡Tu equipo {equipo} está listo! (orden {numero_orden})\nTotal a pagar: {total}\n\nAcércate a {empresa} para retirarlo.",
        ],
        'orden_entregado' => [
            'nombre' => 'Entregado',
            'asunto' => 'Equipo entregado — Orden {numero_orden}',
            'contenido' => "Hola {cliente_nombre},\n\nTu equipo {equipo} fue entregado (orden {numero_orden}).\nGracias por preferir a {empresa}.",
        ],
        'orden_listo_admin' => [
            'nombre' => 'Orden Lista - Notificación al Administrador',
            'asunto' => 'Orden Lista para Cobro — {numero_orden}',
            'contenido' => "Hola {admin_nombre},\n\nEl técnico {tecnico_nombre} ha marcado la orden {numero_orden} como LISTA.\n\nPor favor, continúa con el proceso de cobro, prefactura y entrega al cliente.\n\nTotal a cobrar: {total}\n\nGracias.",
        ],
    ];

    public const CANALES = ['email', 'whatsapp', 'telegram'];

    /**
     * Crea y procesa una notificación para un evento.
     *
     * @param array $destinatario ['nombre','email','telefono','cliente_id']
     * @param array $data         variables para la plantilla
     * @param array|null $canales canales solicitados; si null usa los de la plantilla
     */
    public function notificar(string $evento, ?Model $referencia, array $destinatario, array $data = [], ?array $canales = null, ?User $enviadoPor = null): ?Notificacion
    {
        $plantilla = PlantillaNotificacion::where('evento', $evento)->where('activo', true)->first();
        $base = self::DEFAULTS[$evento] ?? ['asunto' => 'Notificación', 'contenido' => '{mensaje}'];

        $asunto = $this->reemplazar($plantilla->asunto ?? $base['asunto'], $data);
        $mensaje = $this->reemplazar($plantilla->contenido ?? $base['contenido'], $data);

        $canales = $canales ?? ($plantilla->canales ?? ['email']);
        $canales = array_values(array_intersect($canales, self::CANALES));

        // Filtrar canales sin datos del destinatario
        $canales = array_values(array_filter($canales, function ($c) use ($destinatario) {
            return match ($c) {
                'email' => !empty($destinatario['email'] ?? null),
                'whatsapp', 'telegram' => !empty($destinatario['telefono'] ?? null),
                default => true,
            };
        }));

        if (empty($canales)) {
            $canales = ['email'];
        }

        $noti = Notificacion::create([
            'evento' => $evento,
            'referencia_type' => $referencia ? get_class($referencia) : null,
            'referencia_id' => $referencia?->getKey(),
            'cliente_id' => $destinatario['cliente_id'] ?? null,
            'destinatario_nombre' => $destinatario['nombre'] ?? null,
            'destinatario_email' => $destinatario['email'] ?? null,
            'destinatario_telefono' => $destinatario['telefono'] ?? null,
            'titulo' => $asunto,
            'mensaje' => $mensaje,
            'canales' => $canales,
            'canal_estados' => array_fill_keys($canales, 'pendiente'),
            'estado' => 'pendiente',
        ]);

        $this->enviar($noti, $enviadoPor);

        \App\Events\NotificacionCreada::dispatch($noti);

        return $noti;
    }

    /** Despacha jobs asíncronos para cada canal pendiente de la notificación. */
    public function enviar(Notificacion $noti, ?User $enviadoPor = null): void
    {
        $estados = $noti->canal_estados ?? [];

        foreach ($noti->canales as $canal) {
            if (($estados[$canal] ?? null) === 'enviada') {
                continue;
            }
            \App\Jobs\EnviarNotificacionJob::dispatch($noti->id, $canal)
                ->onQueue('notifications');
        }

        $noti->enviado_por = $enviadoPor?->id;
        $noti->save();
    }

    private function reemplazar(string $texto, array $data): string
    {
        $repl = [];
        foreach ($data as $k => $v) {
            $repl['{' . $k . '}'] = (string) ($v ?? '');
        }
        return strtr($texto, $repl);
    }
}
```

### PlantillasProvisioner

**Ruta:** `app/Modules/Notifications/Services/PlantillasProvisioner.php`

```php
<?php
namespace App\Modules\Notifications\Services;

use App\Core\Models\Tenant;
use App\Modules\Notifications\Models\PlantillaNotificacion;

/**
 * Siembra las plantillas de notificación por defecto al activar el módulo,
 * para que la empresa arranque con mensajes listos y solo los personalice.
 */
class PlantillasProvisioner
{
    public function provisionForTenant(Tenant $tenant): void
    {
        foreach (NotificacionService::DEFAULTS as $evento => $def) {
            PlantillaNotificacion::updateOrCreate(
                ['tenant_id' => $tenant->id, 'evento' => $evento],
                [
                    'tenant_id' => $tenant->id,
                    'nombre' => $def['nombre'],
                    'asunto' => $def['asunto'],
                    'contenido' => $def['contenido'],
                    'canales' => ['email', 'whatsapp'],
                    'activo' => true,
                ],
            );
        }
    }
}
```

---

## Events

### NotificacionCreada

**Ruta:** `app/Events/NotificacionCreada.php`

```php
<?php

namespace App\Events;

use App\Modules\Notifications\Models\Notificacion;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificacionCreada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Notificacion $notificacion,
    ) {}

    public function broadcastAs(): string
    {
        return 'notificacion.creada';
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('tenant.' . $this->notificacion->tenant_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->notificacion->id,
            'evento' => $this->notificacion->evento,
            'titulo' => $this->notificacion->titulo,
            'mensaje' => $this->notificacion->mensaje,
            'created_at' => $this->notificacion->created_at?->toISOString(),
        ];
    }
}
```

### ChatMensajeEnviado

**Ruta:** `app/Events/ChatMensajeEnviado.php`

```php
<?php

namespace App\Events;

use App\Modules\Notifications\Models\ChatConversacion;
use App\Modules\Notifications\Models\ChatMensaje;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMensajeEnviado implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public ChatMensaje $mensaje,
        public ChatConversacion $conversacion,
    ) {}

    public function broadcastAs(): string
    {
        return 'chat.mensaje.enviado';
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->conversacion->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->mensaje->id,
            'conversacion_id' => $this->conversacion->id,
            'user_id' => $this->mensaje->user_id,
            'user_name' => $this->mensaje->user?->name,
            'mensaje' => $this->mensaje->mensaje,
            'tipo' => $this->mensaje->tipo,
            'created_at' => $this->mensaje->created_at?->toISOString(),
        ];
    }
}
```

---

## Jobs

### EnviarNotificacionJob

**Ruta:** `app/Jobs/EnviarNotificacionJob.php`

```php
<?php

namespace App\Jobs;

use App\Core\Models\Tenant;
use App\Modules\Notifications\Models\Notificacion;
use App\Modules\Notifications\Services\NotificacionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class EnviarNotificacionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;
    public $maxExceptions = 2;
    public $backoff = [10, 30, 60];

    public function __construct(
        public int $notificacionId,
        public string $canal,
    ) {
        $this->onQueue('notifications');
    }

    public function handle(NotificacionService $notificacionService): void
    {
        $tenant = app('current_tenant');
        if (!$tenant) {
            Log::error("No current_tenant for notification job", ['notificacion_id' => $this->notificacionId]);
            return;
        }

        $noti = Notificacion::find($this->notificacionId);
        if (!$noti) {
            Log::error("Notificacion not found", ['notificacion_id' => $this->notificacionId]);
            return;
        }

        $estados = $noti->canal_estados ?? [];
        if (($estados[$this->canal] ?? null) === 'enviada') {
            Log::info("Notification channel already sent", [
                'notificacion_id' => $this->notificacionId,
                'canal' => $this->canal,
            ]);
            return;
        }

        try {
            $resultado = $this->enviarCanal($this->canal, $noti);

            $estados[$this->canal] = $resultado ? 'enviada' : 'error';
            $noti->canal_estados = $estados;
            $noti->sincronizarEstado();
            $noti->fecha_envio = $noti->fecha_envio ?? now();
            $noti->save();

            Log::info("Notification sent", [
                'notificacion_id' => $this->notificacionId,
                'canal' => $this->canal,
                'exito' => $resultado,
            ]);
        } catch (\Exception $e) {
            Log::error("Notification job failed", [
                'notificacion_id' => $this->notificacionId,
                'canal' => $this->canal,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function enviarCanal(string $canal, Notificacion $noti): bool
    {
        return match ($canal) {
            'email' => $this->enviarEmail($noti),
            'whatsapp' => $this->enviarWhatsApp($noti),
            'telegram' => $this->enviarTelegram($noti),
            default => false,
        };
    }

    private function enviarEmail(Notificacion $noti): bool
    {
        if (empty($noti->destinatario_email)) {
            return false;
        }
        try {
            $tenant = app('current_tenant');
            $empresa = $tenant?->name ?: config('app.name', 'NEXORA');
            $logo = $tenant?->logo ? url($tenant->logo) : null;

            \Illuminate\Support\Facades\Mail::send('emails.notificacion', [
                'titulo' => $noti->titulo,
                'cuerpo' => $noti->mensaje,
                'empresa' => $empresa,
                'logo' => $logo,
            ], function ($m) use ($noti, $empresa) {
                $m->to($noti->destinatario_email)->subject($noti->titulo ?? "Notificación de {$empresa}");
            });
            return true;
        } catch (\Throwable $e) {
            Log::warning('Notificación email falló: ' . $e->getMessage());
            $noti->error = $e->getMessage();
            return false;
        }
    }

    private function enviarWhatsApp(Notificacion $noti): bool
    {
        $url = rtrim((string) config('services.whatsapp.url'), '/');
        if (!$url || empty($noti->destinatario_telefono)) {
            return false;
        }
        try {
            $telefono = $this->normalizarTelefono($noti->destinatario_telefono);
            $resp = \Illuminate\Support\Facades\Http::timeout(20)->post("{$url}/send-message", [
                'phone' => $telefono,
                'message' => $noti->mensaje,
            ]);
            if ($resp->successful() && ($resp->json('success') === true)) {
                return true;
            }
            $noti->error = 'WhatsApp: ' . ($resp->json('error') ?? $resp->status());
            return false;
        } catch (\Throwable $e) {
            Log::warning('Notificación WhatsApp falló: ' . $e->getMessage());
            $noti->error = $e->getMessage();
            return false;
        }
    }

    private function enviarTelegram(Notificacion $noti): bool
    {
        $token = config('services.telegram.bot_token');
        $chatId = $noti->destinatario_telefono ?: config('services.telegram.chat_id');
        if (!$token || !$chatId) {
            return false;
        }
        try {
            $resp = \Illuminate\Support\Facades\Http::timeout(20)
                ->post("https://api.telegram.org/bot{$token}/sendMessage", [
                    'chat_id' => $chatId,
                    'text' => $noti->mensaje,
                ]);
            if ($resp->successful() && ($resp->json('ok') === true)) {
                return true;
            }
            $noti->error = 'Telegram: ' . ($resp->json('description') ?? $resp->status());
            return false;
        } catch (\Throwable $e) {
            Log::warning('Notificación Telegram falló: ' . $e->getMessage());
            $noti->error = $e->getMessage();
            return false;
        }
    }

    private function normalizarTelefono(string $telefono): string
    {
        $digits = preg_replace('/\D/', '', $telefono);
        if (strlen($digits) === 10) {
            $digits = '57' . $digits;
        }
        return $digits;
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("Notification job failed permanently", [
            'notificacion_id' => $this->notificacionId,
            'canal' => $this->canal,
            'error' => $exception->getMessage(),
        ]);
    }
}
```

---

## Frontend Pages

### Notifications/Index.jsx

**Ruta:** `resources/js/Pages/Notifications/Index.jsx`

```jsx
import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { TableSkeleton } from '@/Components/ui/skeleton'
import { PageHeader } from '@/Components/ui/page-header'
import { ListToolbar, FilterSelect } from '@/Components/ui/list-toolbar'
import { Pagination } from '@/Components/ui/pagination'
import { useDataTable } from '@/Hooks/useDataTable'
import { usePermissions } from '@/Hooks/usePermissions'
import { Bell, Mail, MessageCircle, Send, RefreshCw, SearchX } from 'lucide-react'

const eventoLabel = {
  orden_recibida: 'Equipo recibido',
  orden_diagnostico: 'En diagnóstico',
  orden_reparacion: 'En reparación',
  orden_pruebas: 'En pruebas',
  orden_listo: 'Listo para entrega',
  orden_entregado: 'Entregado',
}
const estadoBadge = {
  enviada: { label: 'Enviada', variant: 'default' },
  parcial: { label: 'Parcial', variant: 'secondary' },
  error: { label: 'Error', variant: 'destructive' },
  pendiente: { label: 'Pendiente', variant: 'outline' },
}
const canalIcon = { email: Mail, whatsapp: MessageCircle, telegram: Send }

export default function NotificacionesIndex({ notificaciones }) {
  const loading = notificaciones == null
  const { can } = usePermissions()

  const data = notificaciones || []
  const table = useDataTable(data, {
    searchAccessor: (n) => `${n.destinatario ?? ''} ${n.email ?? ''} ${n.titulo ?? ''} ${eventoLabel[n.evento] ?? n.evento}`,
    pageSize: 12,
  })

  const reenviar = (id) => router.post(route('notifications.reenviar', id), {}, { preserveScroll: true })

  const columns = [
    {
      key: 'destinatario', header: 'Destinatario', className: 'font-medium',
      cell: (n) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{n.destinatario || '—'}</p>
          <p className="truncate text-xs text-muted-foreground">{n.email || n.telefono || '—'}</p>
        </div>
      ),
    },
    {
      key: 'evento', header: 'Evento', hideOnMobile: true,
      cell: (n) => <span className="text-sm text-foreground">{eventoLabel[n.evento] ?? n.evento}</span>,
    },
    {
      key: 'canales', header: 'Canales',
      cell: (n) => (
        <div className="flex items-center gap-1.5">
          {(n.canales || []).map((c) => {
            const Icon = canalIcon[c] || Bell
            const est = n.canal_estados?.[c]
            const color = est === 'enviada' ? 'text-emerald-500' : est === 'error' ? 'text-rose-500' : 'text-muted-foreground'
            return <Icon key={c} className={`h-4 w-4 ${color}`} title={`${c}: ${est ?? 'pendiente'}`} />
          })}
        </div>
      ),
    },
    {
      key: 'estado', header: 'Estado',
      cell: (n) => {
        const b = estadoBadge[n.estado] || estadoBadge.pendiente
        return <Badge variant={b.variant}>{b.label}</Badge>
      },
    },
    { key: 'creado', header: 'Cuándo', alignEnd: true, hideOnMobile: true, cell: (n) => <span className="text-xs text-muted-foreground">{n.creado}</span> },
    {
      key: 'actions', header: 'Acciones', alignEnd: true,
      cell: (n) => (
        can('notifications:send') && n.estado !== 'enviada' ? (
          <button
            type="button"
            onClick={() => reenviar(n.id)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted"
            title="Reenviar"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reenviar
          </button>
        ) : <span className="text-xs text-muted-foreground">—</span>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Notificaciones" />
      <PageHeader
        title="Bandeja de notificaciones"
        description="Historial de avisos enviados a los clientes por correo, WhatsApp y Telegram."
        icon={Bell}
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar por destinatario, correo o asunto…"
            total={table.totalResults}
            filters={
              <FilterSelect
                value={table.filters.estado ?? 'all'}
                onChange={(v) => table.setFilter('estado', v)}
                placeholder="Todos los estados"
                options={[
                  { value: 'enviada', label: 'Enviadas' },
                  { value: 'parcial', label: 'Parciales' },
                  { value: 'error', label: 'Con error' },
                  { value: 'pendiente', label: 'Pendientes' },
                ]}
              />
            }
          />
        </div>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Sin notificaciones todavía"
            description="Cuando registres o cambies el estado de una orden, los avisos al cliente aparecerán aquí."
          />
        ) : table.totalResults === 0 ? (
          <EmptyState icon={SearchX} title="Sin coincidencias" description="Ninguna notificación coincide con la búsqueda o el filtro." />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(n) => n.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
```

### Notifications/Plantillas/Index.jsx

**Ruta:** `resources/js/Pages/Notifications/Plantillas/Index.jsx`

```jsx
import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { PageHeader } from '@/Components/ui/page-header'
import { Modal } from '@/Components/ui/modal'
import { Field } from '@/Components/ui/form-section'
import { usePermissions } from '@/Hooks/usePermissions'
import { Mail, MessageCircle, Send, Pencil, FileText } from 'lucide-react'

const canalMeta = { email: { label: 'Correo', icon: Mail }, whatsapp: { label: 'WhatsApp', icon: MessageCircle }, telegram: { label: 'Telegram', icon: Send } }

export default function PlantillasIndex({ plantillas = [], canales = [], variables = [] }) {
  const { can } = usePermissions()
  const [editing, setEditing] = useState(null)
  const { data, setData, put, processing, errors, reset } = useForm({
    nombre: '', asunto: '', contenido: '', canales: [], activo: true,
  })

  const abrir = (p) => {
    setData({ nombre: p.nombre, asunto: p.asunto || '', contenido: p.contenido, canales: p.canales || [], activo: p.activo })
    setEditing(p)
  }
  const cerrar = () => { setEditing(null); reset() }
  const toggleCanal = (c) => setData('canales', data.canales.includes(c) ? data.canales.filter((x) => x !== c) : [...data.canales, c])

  const submit = (e) => {
    e.preventDefault()
    put(route('notifications.plantillas.update', editing.id), { preserveScroll: true, onSuccess: cerrar })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Plantillas de notificación" />
      <PageHeader
        title="Plantillas de notificación"
        description="Personaliza los mensajes que se envían a tus clientes en cada evento."
        icon={FileText}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plantillas.map((p) => (
          <div key={p.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground">{p.nombre}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.asunto}</p>
              </div>
              <Badge variant={p.activo ? 'default' : 'outline'}>{p.activo ? 'Activa' : 'Inactiva'}</Badge>
            </div>
            <p className="mt-3 line-clamp-3 flex-1 whitespace-pre-line text-sm text-muted-foreground">{p.contenido}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {(p.canales || []).map((c) => {
                  const Icon = canalMeta[c]?.icon || Mail
                  return <Icon key={c} className="h-4 w-4 text-muted-foreground" title={canalMeta[c]?.label} />
                })}
              </div>
              {can('notifications:manage') && (
                <button onClick={() => abrir(p)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted">
                  <Pencil className="h-3.5 w-3.5" /> Editar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={editing !== null}
        onClose={cerrar}
        title="Editar plantilla"
        description="Usa variables entre llaves; se reemplazan al enviar."
        icon={FileText}
        className="max-w-2xl"
        footer={
          <>
            <button type="button" onClick={cerrar} className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">Cancelar</button>
            <button type="submit" form="plantilla-form" disabled={processing} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {processing ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <form id="plantilla-form" onSubmit={submit} className="space-y-4">
          <Field label="Nombre" htmlFor="nombre" required error={errors.nombre}>
            <Input id="nombre" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} required />
          </Field>
          <Field label="Asunto (correo)" htmlFor="asunto" error={errors.asunto}>
            <Input id="asunto" value={data.asunto} onChange={(e) => setData('asunto', e.target.value)} />
          </Field>
          <Field label="Mensaje" htmlFor="contenido" required error={errors.contenido}>
            <textarea id="contenido" value={data.contenido} onChange={(e) => setData('contenido', e.target.value)} rows={6} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" required />
          </Field>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Canales</p>
            <div className="flex flex-wrap gap-2">
              {canales.map((c) => {
                const Icon = canalMeta[c]?.icon || Mail
                const sel = data.canales.includes(c)
                return (
                  <button key={c} type="button" onClick={() => toggleCanal(c)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${sel ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50'}`}>
                    <Icon className="h-4 w-4" /> {canalMeta[c]?.label || c}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Variables disponibles</p>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <code key={v} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-foreground">{`{${v}}`}</code>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
            <input type="checkbox" checked={data.activo} onChange={(e) => setData('activo', e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-foreground">Plantilla activa</span>
          </label>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
```

---

## Tests

### ChatTest

**Ruta:** `tests/Feature/Modules/Notifications/ChatTest.php`

```php
<?php

namespace Tests\Feature\Modules\Notifications;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Notifications\Models\ChatConversacion;
use App\Modules\Notifications\Models\ChatMensaje;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant1;
    private Tenant $tenant2;
    private User $user1;
    private User $user2;
    private User $otherTenantUser;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'notifications',
            'name' => 'Notificaciones',
            'class' => 'Notifications',
            'version' => '1.0.0',
        ]);

        $this->tenant1 = Tenant::factory()->create(['name' => 'Empresa A']);
        $this->tenant2 = Tenant::factory()->create(['name' => 'Empresa B']);

        foreach ([$this->tenant1, $this->tenant2] as $t) {
            TenantModule::create([
                'tenant_id' => $t->id,
                'module_code' => 'notifications',
                'is_active' => true,
            ]);
        }

        $this->user1 = User::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'is_superadmin' => true,
            'name' => 'Usuario T1',
        ]);
        $this->user2 = User::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'is_superadmin' => true,
            'name' => 'Otro T1',
        ]);
        $this->otherTenantUser = User::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'is_superadmin' => true,
            'name' => 'Usuario T2',
        ]);
    }

    public function test_chat_store_creates_conversacion(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        $response = $this->postJson(route('chat.store'), [
            'user_id' => $this->user2->id,
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['conversacion' => ['id']]);

        $this->assertDatabaseHas('chat_conversaciones', [
            'tenant_id' => $this->tenant1->id,
            'tipo' => 'directo',
        ]);
    }

    public function test_chat_store_rejects_self_chat(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        $response = $this->postJson(route('chat.store'), [
            'user_id' => $this->user1->id,
        ]);

        $response->assertStatus(422);
        $response->assertJson(['error' => 'No puedes crear un chat contigo mismo']);
    }

    public function test_chat_store_rejects_cross_tenant_user(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        // El user_id existe pero pertenece a otro tenant → validation debe fallar
        $response = $this->postJson(route('chat.store'), [
            'user_id' => $this->otherTenantUser->id,
        ]);

        $this->assertTrue(
            $response->status() === 422 || $response->status() === 302,
            'Debe rechazar usuario de otro tenant (422 o redirect)'
        );
    }

    public function test_chat_mensajes_isolates_by_tenant(): void
    {
        // user1 crea conversación con user2 (ambos tenant1)
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        $conv = ChatConversacion::create([
            'tenant_id' => $this->tenant1->id,
            'tipo' => 'directo',
            'participantes' => [$this->user1->id, $this->user2->id],
        ]);

        ChatMensaje::create([
            'tenant_id' => $this->tenant1->id,
            'conversacion_id' => $conv->id,
            'user_id' => $this->user1->id,
            'mensaje' => 'Hola mundo',
        ]);

        // Crear usuario en tenant2 para FK consistency
        $userT2 = User::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'is_superadmin' => true,
        ]);

        $conv2 = ChatConversacion::create([
            'tenant_id' => $this->tenant2->id,
            'tipo' => 'directo',
            'participantes' => [$userT2->id, $this->otherTenantUser->id],
        ]);
        ChatMensaje::create([
            'tenant_id' => $this->tenant2->id,
            'conversacion_id' => $conv2->id,
            'user_id' => $userT2->id,
            'mensaje' => 'Mensaje secreto de otro tenant',
        ]);

        // user1 intenta acceder a mensajes de tenant2 — BelongsToTenant scope → 404
        $response = $this->getJson(route('chat.mensajes', $conv2->id));
        $response->assertStatus(404);

        // user1 intenta enviar mensaje a conversación de tenant2
        $response = $this->postJson(route('chat.enviar', $conv2->id), [
            'mensaje' => 'Hacked',
        ]);
        $response->assertStatus(404);
    }

    public function test_chat_enviar_mensaje(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        $conv = ChatConversacion::create([
            'tenant_id' => $this->tenant1->id,
            'tipo' => 'directo',
            'participantes' => [$this->user1->id, $this->user2->id],
        ]);

        $response = $this->postJson(route('chat.enviar', $conv->id), [
            'mensaje' => 'Nuevo mensaje de prueba',
        ]);

        $response->assertOk();
        $response->assertJsonPath('mensaje.mensaje', 'Nuevo mensaje de prueba');

        $this->assertDatabaseHas('chat_mensajes', [
            'conversacion_id' => $conv->id,
            'user_id' => $this->user1->id,
            'mensaje' => 'Nuevo mensaje de prueba',
        ]);
    }

    public function test_chat_index_returns_only_own_tenant_conversations(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        // Conversación en tenant1
        ChatConversacion::create([
            'tenant_id' => $this->tenant1->id,
            'tipo' => 'directo',
            'participantes' => [$this->user1->id, $this->user2->id],
        ]);

        // Conversación en tenant2
        ChatConversacion::create([
            'tenant_id' => $this->tenant2->id,
            'tipo' => 'directo',
            'participantes' => [$this->otherTenantUser->id, 999],
        ]);

        $response = $this->getJson(route('chat.index'));
        $response->assertOk();
        $response->assertJsonCount(1, 'conversaciones');
    }
}
```

---

## Resumen de la Auditoría

| Aspecto | Estado |
|---|---|
| **Total archivos revisados** | 17 (12 module + 2 events + 1 job + 2 frontend pages + 1 test) |
| **module.json** | 3 permisos (`notifications:view`, `:send`, `:manage`), 2 items en menú, sin dependencias |
| **Routes** | 10 rutas: 5 notificaciones (CRUD plantillas + bandeja + reenviar) + 4 chat (conversaciones + mensajes), todas bajo `web`, `auth`, `tenant`, `module:notifications` |
| **Controllers** | 3 controllers: NotificacionController (2 métodos), PlantillaController (3 métodos), ChatController (4 métodos) |
| **Models** | 4 modelos: Notificacion, PlantillaNotificacion, ChatConversacion, ChatMensaje — todos con `BelongsToTenant` + `Auditable` |
| **Migrations** | 2 migraciones: notificaciones (notif_plantillas + notif_notificaciones) y chat (chat_conversaciones + chat_mensajes) |
| **Services** | NotificacionService (envío multi-canal con filtrado por disponibilidad de datos) + PlantillasProvisioner (siembra inicial) |
| **Events** | NotificacionCreada (broadcast por tenant channel) + ChatMensajeEnviado (broadcast por conversacion channel) |
| **Jobs** | EnviarNotificacionJob (queue `notifications`, 3 tries, backoff exponencial, envío email/whatsapp/telegram) |
| **Frontend Pages** | 2 páginas React: Bandeja de notificaciones (DataTable + filtros + skeleton + empty state) y Plantillas (grid + Modal edición con toggle de canales) |
| **Tests** | ChatTest: 5 tests de aislamiento multi-tenant, creación de conversación, envío de mensajes, rechazo de self-chat y cross-tenant |
| **Multi-tenant** | Todos los modelos usan `BelongsToTenant`, queries scoped por `tenant_id`, ChatController valida `Rule::exists` con `tenant_id` |
| **Auditable** | Todos los 4 modelos implementan trait `Auditable` |
| **UI en español** | Toda la UI y mensajes de respuesta en español |

---

## Correcciones

### Cambios detectados entre auditoría previa y código actual

1. **Auditable en todos los modelos**: La auditoría previa reportaba ❌ para `Auditable`. **Corregido**: los 4 modelos ahora implementan `App\Core\Services\Auditable` (Notificacion, PlantillaNotificacion, ChatConversacion, ChatMensaje).

2. **Chat routes: middleware de permisos añadido**: Las rutas de chat (`chat.index`, `chat.store`, `chat.mensajes`, `chat.enviar`) ahora tienen `middleware('permission:notifications:send')` en el grupo. Antes estaban sin middleware de permisos específico.

3. **ChatController.store: validación cross-tenant con Rule::exists**: La validación de `user_id` ahora usa `Rule::exists('users', 'id')->where('tenant_id', $request->user()->tenant_id)` en lugar del validador genérico `'exists:users,id'`. Esto garantiza que solo se puedan crear chats con usuarios del mismo tenant.

4. **Envio de canales movido a EnviarNotificacionJob**: Los métodos `enviarCanal`, `enviarEmail`, `enviarWhatsApp`, `enviarTelegram`, `normalizarTelefono` fueron removidos de `NotificacionService` y movidos a `app/Jobs/EnviarNotificacionJob.php`. La lógica de envío ahora corre en la queue `notifications` con reintentos (3 tries, backoff [10, 30, 60]s).

5. **Filtrado de canales por disponibilidad de datos**: `NotificacionService::notificar()` ahora filtra canales según si el destinatario tiene email o teléfono antes de crear la notificación. Ejemplo: sin teléfono no se agenda WhatsApp/Telegram.

6. **Events y Job como archivos independientes**: `NotificacionCreada`, `ChatMensajeEnviado` (events broadcast) y `EnviarNotificacionJob` existen fuera del módulo (`app/Events/`, `app/Jobs/`) pero son parte funcional de Notifications.

### Pendientes / Deuda técnica

- **No hay Providers de módulo** (`app/Modules/Notifications/Providers/`): No existe `NotificationsServiceProvider`. El registro de events listeners (si se necesitara) debería implementarse.
- **No hay transacciones explícitas**: `NotificacionService::notificar()` crea modelo + despacha jobs sin `DB::transaction()`. Un fallo post-create podría dejar estado inconsistente.
- **Chat no tiene UI en React**: Las rutas de chat son API JSON sin página Inertia correspondiente. Falta componente React para el chat.
- **Telegram chat_id usa campo `destinatario_telefono`**: En `EnviarNotificacionJob::enviarTelegram()` se usa `$noti->destinatario_telefono` como chat_id de Telegram, lo cual es conceptualmente incorrecto (un teléfono no es un chat_id de Telegram).
- **No hay tests para NotificacionService ni EnviarNotificacionJob**: Solo existen tests para Chat. Falta cobertura del flujo de notificaciones (envío, plantillas, multi-canal).
- **Plantillas no tienen creación desde UI**: Solo se pueden editar y eliminar; no hay botón para crear plantillas nuevas desde la interfaz.
- **`orden_listo_admin`**: Evento para notificar al admin existe en defaults pero no tiene menú propio ni entrada en `eventoLabel` del frontend (Index.jsx solo lista 6 eventos, este es el 7mo).
