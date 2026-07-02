@extends('core.layouts.app')

@section('title', 'Registrar Empresa')

@section('content')
<div class="row justify-content-center align-items-center" style="min-height: 80vh;">
    <div class="col-md-6">
        <div class="card shadow">
            <div class="card-body p-4">
                <h4 class="text-center mb-4">Crear nueva empresa</h4>
                <form method="POST" action="{{ route('core.register') }}">
                    @csrf

                    <h6 class="text-muted mb-3">Datos de la empresa</h6>
                    <div class="mb-3">
                        <label for="tenant_name" class="form-label">Nombre de la empresa</label>
                        <input type="text" name="tenant_name" id="tenant_name"
                               class="form-control @error('tenant_name') is-invalid @enderror"
                               value="{{ old('tenant_name') }}" required>
                        @error('tenant_name')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <h6 class="text-muted mb-3">Datos del administrador</h6>
                    <div class="mb-3">
                        <label for="name" class="form-label">Nombre</label>
                        <input type="text" name="name" id="name"
                               class="form-control @error('name') is-invalid @enderror"
                               value="{{ old('name') }}" required>
                        @error('name')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" name="email" id="email"
                               class="form-control @error('email') is-invalid @enderror"
                               value="{{ old('email') }}" required>
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
                    <div class="mb-3">
                        <label for="password_confirmation" class="form-label">Confirmar contraseña</label>
                        <input type="password" name="password_confirmation" id="password_confirmation"
                               class="form-control" required>
                    </div>

                    <button type="submit" class="btn btn-primary w-100">Crear empresa</button>
                </form>
                <hr>
                <p class="text-center mb-0">
                    <a href="{{ route('core.login') }}">Ya tengo una empresa</a>
                </p>
            </div>
        </div>
    </div>
</div>
@endsection
