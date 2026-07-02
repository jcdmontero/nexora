@extends('core.layouts.app')

@section('title', 'Usuarios')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0">Usuarios</h2>
    <a href="{{ route('core.users.create') }}" class="btn btn-primary">+ Nuevo</a>
</div>

<div class="card">
    <div class="card-body">
        <table class="table table-dark table-hover mb-0">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Roles</th>
                    <th>Estado</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @forelse($users as $user)
                    <tr>
                        <td>{{ $user->name }}</td>
                        <td>{{ $user->email }}</td>
                        <td>
                            @foreach($user->getRoleNames() as $role)
                                <span class="badge bg-primary">{{ $role }}</span>
                            @endforeach
                        </td>
                        <td>
                            @if($user->is_active)
                                <span class="badge bg-success">Activo</span>
                            @else
                                <span class="badge bg-danger">Inactivo</span>
                            @endif
                        </td>
                        <td>
                            <a href="{{ route('core.users.edit', $user) }}" class="btn btn-sm btn-outline-light">Editar</a>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="text-center text-muted">No hay usuarios</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection
