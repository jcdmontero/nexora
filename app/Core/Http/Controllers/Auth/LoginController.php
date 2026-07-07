<?php
namespace App\Core\Http\Controllers\Auth;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Inertia\Inertia;

class LoginController
{
    public function create()
    {
        $tenant = app()->has('current_tenant') ? app('current_tenant') : null;
        return Inertia::render('Auth/Login', [
            'tenantName' => $tenant?->name,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $throttleKey = Str::lower($request->input('email')) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'email' => "Demasiados intentos. Inténtalo de nuevo en {$seconds} segundos.",
            ])->onlyInput('email');
        }

        $tenant = app()->has('current_tenant') ? app('current_tenant') : null;

        // Autenticar por credenciales (sin filtrar por tenant en el attempt).
        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::clear($throttleKey);
            $user = Auth::user();

            // Validar que la cuenta esté activa
            if (!$user->is_active) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Tu cuenta está desactivada. Contacta al administrador.',
                ])->onlyInput('email');
            }

            // Si el tenant está suspendido, bloquear acceso (excepto superadmin)
            if ($tenant && !$user->is_superadmin && !$tenant->is_active) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Esta empresa se encuentra suspendida. Contacta al administrador.',
                ])->onlyInput('email');
            }

            // Si hay tenant (subdominio), un usuario de empresa solo puede entrar a SU empresa.
            // El SuperAdmin puede entrar desde cualquier contexto.
            if ($tenant && !$user->is_superadmin && (int) $user->tenant_id !== (int) $tenant->id) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Este usuario no pertenece a esta empresa.',
                ])->onlyInput('email');
            }

            // Si es login de SuperAdmin pero el usuario NO es superadmin, denegar
            if ($request->is('superadmin/*') && !$user->is_superadmin) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'No tienes acceso al portal de administración.',
                ])->onlyInput('email');
            }

            $request->session()->regenerate();

            if ($user->is_superadmin) {
                return redirect()->intended(route('superadmin.dashboard'));
            }

            return redirect()->intended(route('core.dashboard'));
        }

        RateLimiter::hit($throttleKey, 60);

        return back()->withErrors([
            'email' => 'Credenciales incorrectas.',
        ])->onlyInput('email');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
