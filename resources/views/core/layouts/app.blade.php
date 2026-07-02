<!DOCTYPE html>
<html lang="es" data-bs-theme="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', config('app.name'))</title>
    @vite(['resources/css/app.css'])
</head>
<body>
    <div class="d-flex" style="min-height: 100vh;">
        @if(Auth::check())
            <x-core.sidebar />
        @endif
        <main class="flex-grow-1 d-flex flex-column">
            @if(Auth::check())
                <x-core.topbar />
            @endif
            <div class="container-fluid p-4 flex-grow-1">
                @if(session('success'))
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        {{ session('success') }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                @endif
                @if(session('error'))
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        {{ session('error') }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                @endif
                @yield('content')
            </div>
        </main>
    </div>
    @vite(['resources/js/app.js'])
</body>
</html>
