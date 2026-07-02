@extends('core.layouts.app')

@section('title', 'Editar Usuario')

@section('content')
<h2 class="mb-4">Editar Usuario</h2>

<div class="card">
    <div class="card-body">
        <form method="POST" action="{{ route('core.users.update', $user) }}">
            @csrf
            @method('PUT')
            <div class="mb-3">
                <label for="name" class="form-label">Nombre</label>
                <input type="text" name="name" id="name"
                       class="form-control @error('name') is-invalid @enderror" value="{{ old('name', $user->name) }}" required>
                @error('name')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input type="email" name="email" id="email"
                       class="form-control @error('email') is-invalid @enderror" value="{{ old('email', $user->email) }}" required>
                @error('email')<div class="invalid-feedback">{{ $message }}</div>@enderror
            </div>
            <div class="mb-3 form-check form-switch">
                <input type="checkbox" name="is_active" id="is_active" class="form-check-input" value="1" @checked($user->is_active)>
                <label for="is_active" class="form-check-label">Activo</label>
            </div>
            <button type="submit" class="btn btn-primary">Actualizar</button>
            <a href="{{ route('core.users.index') }}" class="btn btn-outline-light">Cancelar</a>
        </form>
    </div>
</div>
@endsection
