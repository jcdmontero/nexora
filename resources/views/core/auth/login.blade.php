@extends('core.layouts.app')

@section('title', 'Iniciar Sesión')

@section('content')
<div class="row justify-content-center align-items-center" style="min-height: 80vh;">
    <div class="col-md-4">
        <div class="card shadow">
            <div class="card-body p-4">
                <h4 class="text-center mb-4">
                    @if(isset($tenant))
                        {{ $tenant->name }}
                    @else
                        {{ config('app.name') }}
                    @endif
                </h4>
                <form method="POST" action="{{ route('core.login') }}">
                    @csrf
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" name="email" id="email"
                               class="form-control @error('email') is-invalid @enderror"
                               value="{{ old('email') }}" required autofocus>
                        @error('email')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Contraseña</label>
                        <input type="password" name="password" id="password"
                               class="form-control @error('password') is-invalid @enderror" required>
                        @error('password')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="mb-3 form-check">
                        <input type="checkbox" name="remember" id="remember" class="form-check-input">
                        <label for="remember" class="form-check-label">Recordarme</label>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Ingresar</button>
                </form>
                <hr>
                <p class="text-center mb-0">
                    <a href="{{ route('core.register') }}">Crear nueva empresa</a>
                </p>
            </div>
        </div>
    </div>
</div>
@endsection
