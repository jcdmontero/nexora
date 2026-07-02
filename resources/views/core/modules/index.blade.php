@extends('core.layouts.app')

@section('title', 'Módulos')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0">Módulos</h2>
</div>

<div class="row g-4">
    @forelse($allModules as $module)
        <div class="col-md-4">
            <div class="card h-100">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="card-title mb-1">{{ $module->name }}</h5>
                            <small class="text-muted">v{{ $module->version }}</small>
                        </div>
                        @if(in_array($module->code, $activeCodes))
                            <span class="badge bg-success">Activo</span>
                        @else
                            <span class="badge bg-secondary">Inactivo</span>
                        @endif
                    </div>
                    <p class="card-text mt-2 flex-grow-1">{{ $module->description }}</p>
                    <div class="d-flex gap-2">
                        @if(in_array($module->code, $activeCodes))
                            <form method="POST" action="{{ route('core.modules.deactivate') }}">
                                @csrf
                                <input type="hidden" name="module_code" value="{{ $module->code }}">
                                <button type="submit" class="btn btn-sm btn-outline-danger">Desactivar</button>
                            </form>
                        @else
                            <form method="POST" action="{{ route('core.modules.activate') }}">
                                @csrf
                                <input type="hidden" name="module_code" value="{{ $module->code }}">
                                <button type="submit" class="btn btn-sm btn-primary">Activar</button>
                            </form>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    @empty
        <div class="col-12">
            <div class="alert alert-info">No hay módulos disponibles. Escanea el directorio de módulos.</div>
        </div>
    @endforelse
</div>
@endsection
