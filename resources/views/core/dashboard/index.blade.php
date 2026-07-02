@extends('core.layouts.app')

@section('title', 'Dashboard')

@section('content')
<div class="d-flex justify-content-between align-items-center mb-4">
    <h2 class="mb-0">Dashboard</h2>
</div>

<div class="row g-4">
    <div class="col-md-4">
        <div class="card bg-primary text-white">
            <div class="card-body">
                <h5 class="card-title">Usuarios</h5>
                <p class="display-6 mb-0">{{ $userCount }}</p>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card bg-success text-white">
            <div class="card-body">
                <h5 class="card-title">Módulos Activos</h5>
                <p class="display-6 mb-0">{{ $activeModules->count() }}</p>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card bg-info text-white">
            <div class="card-body">
                <h5 class="card-title">Empresa</h5>
                <p class="h4 mb-0">{{ $tenant?->name ?? '—' }}</p>
            </div>
        </div>
    </div>
</div>

@if($activeModules->isNotEmpty())
    <div class="mt-5">
        <h4>Módulos instalados</h4>
        <div class="row g-3 mt-2">
            @foreach($activeModules as $tm)
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-body">
                            <h6>{{ $tm->module?->name ?? $tm->module_code }}</h6>
                            <small class="text-muted">v{{ $tm->module?->version ?? '—' }}</small>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
@endif
@endsection
