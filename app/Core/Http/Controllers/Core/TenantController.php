<?php
namespace App\Core\Http\Controllers\Core;

use App\Core\Models\Configuracion;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class TenantController extends Controller
{
    public function edit()
    {
        $t = tenant();
        if (!$t) {
            return redirect()->route('core.dashboard')->with('error', 'No hay empresa activa.');
        }

        $configs = array_merge(Configuracion::defaults(), Configuracion::allForTenant($t->id));

        return Inertia::render('Tenant/Edit', [
            'tenant' => [
                'id' => $t->id,
                'name' => $t->name,
                'slug' => $t->slug,
                'email' => $t->email,
                'logo' => $t->logo,
            ],
            'config' => $configs,
            'zonas' => ['America/Bogota', 'America/Lima', 'America/Mexico_City', 'America/Argentina/Buenos_Aires', 'America/Santiago'],
        ]);
    }

    public function update(Request $request)
    {
        $t = tenant();
        if (!$t) {
            return redirect()->route('core.dashboard')->with('error', 'No hay empresa activa.');
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash', 'unique:tenants,slug,' . $t->id],
            'logo' => ['nullable', 'image', 'max:2048'],
            'config' => ['array'],
        ]);

        $data = $request->only('name', 'email', 'slug');
        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');
            $data['logo'] = '/storage/' . $path;
        }
        $t->update($data);

        // Guardar solo las claves conocidas del catálogo
        $config = collect($request->input('config', []))
            ->only(array_keys(Configuracion::CATEGORIAS))
            ->all();
        if (!empty($config)) {
            Configuracion::setMany($config, $t->id);
        }

        return redirect()->route('core.tenant.edit')
            ->with('success', 'Configuración actualizada correctamente.');
    }

    // ───────── Estado de servicios ─────────

    public function statusWhatsapp()
    {
        $url = rtrim((string) config('services.whatsapp.url'), '/');
        try {
            $resp = Http::timeout(5)->get("{$url}/status");
            $connected = $resp->successful() && $resp->json('connected') === true;
            return response()->json([
                'status' => $connected ? 'online' : 'offline',
                'message' => $connected
                    ? 'WhatsApp conectado y listo para enviar.'
                    : 'Servidor activo pero WhatsApp no vinculado. Escanea el QR en ' . $url . '/qr',
                'qr_url' => $url . '/qr',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'offline',
                'message' => 'No se pudo conectar al servidor de WhatsApp (' . $url . '). Asegúrate de que esté encendido.',
                'qr_url' => $url . '/qr',
            ]);
        }
    }

    public function statusTelegram()
    {
        $token = config('services.telegram.bot_token');
        if (!$token) {
            return response()->json(['status' => 'offline', 'message' => 'Token de Telegram no configurado.']);
        }
        try {
            $resp = Http::timeout(5)->get("https://api.telegram.org/bot{$token}/getMe");
            if ($resp->successful() && $resp->json('ok') === true) {
                return response()->json(['status' => 'online', 'message' => 'Bot conectado: @' . $resp->json('result.username')]);
            }
            return response()->json(['status' => 'offline', 'message' => 'Token inválido: ' . $resp->json('description', 'error')]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'offline', 'message' => 'Error de conexión con Telegram.']);
        }
    }

    public function testTelegram()
    {
        $key = 'test.telegram.' . request()->ip();
        if (RateLimiter::tooManyAttempts($key, 3)) {
            return response()->json(['status' => 'error', 'message' => 'Demasiadas solicitudes. Espera un momento.'], 429);
        }
        RateLimiter::hit($key, 60);

        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');
        if (!$token || !$chatId) {
            return response()->json(['status' => 'error', 'message' => 'Falta token o chat ID de Telegram.']);
        }
        try {
            $resp = Http::timeout(8)->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => "🔔 NEXORA: la conexión de Telegram funciona correctamente.",
            ]);
            return response()->json($resp->json('ok') === true
                ? ['status' => 'success', 'message' => 'Mensaje de prueba enviado a Telegram.']
                : ['status' => 'error', 'message' => 'Error: ' . $resp->json('description', 'desconocido')]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Error al enviar: ' . $e->getMessage()]);
        }
    }

    public function testEmail(Request $request)
    {
        $key = 'test.email.' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 3)) {
            return response()->json(['status' => 'error', 'message' => 'Demasiadas solicitudes. Espera un momento.'], 429);
        }
        RateLimiter::hit($key, 60);

        $t = tenant();
        $to = $request->input('email') ?: ($t?->email ?: $request->user()?->email);
        if (!$to) {
            return response()->json(['status' => 'error', 'message' => 'No hay un correo de destino configurado.']);
        }
        try {
            $empresa = $t?->name ?: config('app.name', 'NEXORA');
            $logo = $t?->logo ? url($t->logo) : null;
            \Illuminate\Support\Facades\Mail::send('emails.notificacion', [
                'titulo' => "Correo de prueba — {$empresa}",
                'cuerpo' => "¡Hola!\n\nEste es un correo de prueba de {$empresa}.\nSi lo recibiste, la configuración de correo de tu empresa funciona correctamente.",
                'empresa' => $empresa,
                'logo' => $logo,
            ], fn ($m) => $m->to($to)->subject("Correo de prueba — {$empresa}"));

            return response()->json(['status' => 'success', 'message' => "Correo de prueba enviado a {$to}."]);
        } catch (\Throwable $e) {
            return response()->json(['status' => 'error', 'message' => 'Error al enviar el correo: ' . $e->getMessage()]);
        }
    }

    public function statusSistema()
    {
        $out = Cache::remember('system_status', 30, function () {
            $result = [];
            // Base de datos
            try {
                $driver = DB::connection()->getDriverName();
                $result['database'] = ['status' => 'online', 'message' => 'Base de datos en línea (' . $driver . ').'];
            } catch (\Throwable $e) {
                $result['database'] = ['status' => 'error', 'message' => 'Error de conexión a la BD.'];
            }
            // Caché
            try {
                Cache::put('health_test', 'ok', 10);
                $result['cache'] = Cache::get('health_test') === 'ok'
                    ? ['status' => 'online', 'message' => 'Caché operativa (' . config('cache.default') . ').']
                    : ['status' => 'error', 'message' => 'La caché no respondió.'];
            } catch (\Throwable $e) {
                $result['cache'] = ['status' => 'error', 'message' => 'Error en la caché.'];
            }
            // Correo
            $result['mail'] = config('mail.default') && config('mail.mailers.smtp.host')
                ? ['status' => 'online', 'message' => 'Correo configurado (' . config('mail.default') . ').']
                : ['status' => 'offline', 'message' => 'Correo sin configurar.'];

            return $result;
        });

        return response()->json($out);
    }
}
