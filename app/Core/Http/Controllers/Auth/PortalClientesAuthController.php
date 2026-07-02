<?php

namespace App\Core\Http\Controllers\Auth;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PortalClientesAuthController
{
    public function create()
    {
        $tenant = app()->has('current_tenant') ? app('current_tenant') : null;
        return Inertia::render('PortalClientes/Login', [
            'tenantName' => $tenant?->name ?? 'Nexora',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $throttleKey = 'portal|' . Str::lower($request->input('email')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'email' => "Demasiados intentos. Inténtalo de nuevo en {$seconds} segundos.",
            ])->onlyInput('email');
        }

        $tenant = app()->has('current_tenant') ? app('current_tenant') : null;

        // Intentar autenticar al cliente
        if (Auth::guard('cliente')->attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::clear($throttleKey);
            $cliente = Auth::guard('cliente')->user();

            // Validar que el portal esté activo para el cliente
            if (!$cliente->portal_active) {
                Auth::guard('cliente')->logout();
                return back()->withErrors([
                    'email' => 'El acceso al portal no está habilitado para tu cuenta.',
                ])->onlyInput('email');
            }

            // Validar que el cliente pertenezca al tenant si estamos en un contexto tenant
            if ($tenant && (int) $cliente->tenant_id !== (int) $tenant->id) {
                Auth::guard('cliente')->logout();
                return back()->withErrors([
                    'email' => 'Esta cuenta no pertenece a esta empresa.',
                ])->onlyInput('email');
            }

            // Actualizar fecha del último login
            $cliente->update(['last_login_at' => now()]);

            $request->session()->regenerate();

            return redirect()->intended(route('portal.dashboard'));
        }

        RateLimiter::hit($throttleKey, 60);

        return back()->withErrors([
            'email' => 'Credenciales de acceso incorrectas.',
        ])->onlyInput('email');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('cliente')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('portal.login');
    }
}
