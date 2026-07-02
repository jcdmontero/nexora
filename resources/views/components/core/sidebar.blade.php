<nav class="d-flex flex-column bg-dark border-end border-secondary" style="width: 250px; min-height: 100vh;">
    <div class="p-3 border-bottom border-secondary">
        <h5 class="text-primary mb-0">{{ config('app.name') }}</h5>
        <small class="text-secondary">{{ app('current_tenant')?->name ?? 'SuperAdmin' }}</small>
    </div>
    <ul class="nav nav-pills flex-column p-2 gap-1">
        <li class="nav-item">
            <a href="{{ route('core.dashboard') }}" class="nav-link text-light @if(request()->routeIs('core.dashboard')) active @endif">
                <i class="bi bi-speedometer2 me-2"></i>Dashboard
            </a>
        </li>
        <li class="nav-item">
            <a href="{{ route('core.users.index') }}" class="nav-link text-light @if(request()->routeIs('core.users.*')) active @endif">
                <i class="bi bi-people me-2"></i>Usuarios
            </a>
        </li>
        <li class="nav-item">
            <a href="{{ route('core.modules.index') }}" class="nav-link text-light @if(request()->routeIs('core.modules.*')) active @endif">
                <i class="bi bi-puzzle me-2"></i>Módulos
            </a>
        </li>
        <li class="nav-item mt-2">
            <form method="POST" action="{{ route('core.logout') }}">
                @csrf
                <button type="submit" class="nav-link text-danger w-100 text-start">
                    <i class="bi bi-box-arrow-left me-2"></i>Salir
                </button>
            </form>
        </li>
    </ul>
</nav>
