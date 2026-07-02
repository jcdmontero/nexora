<x-core.layouts.landing-layout>
    <section class="hero-section d-flex align-items-center" style="min-height: 100vh; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
        <div class="container text-center">
            <h1 class="display-3 fw-bold text-white mb-3">{{ config('app.name') }}</h1>
            <p class="lead text-light mb-4">Plataforma SaaS modular para empresas. Elige lo que necesitas, paga solo por eso.</p>
            <div class="d-flex justify-content-center gap-3">
                <a href="{{ route('core.register') }}" class="btn btn-primary btn-lg px-5">Crear Empresa</a>
                <a href="{{ route('core.login') }}" class="btn btn-outline-light btn-lg px-5">Iniciar Sesión</a>
            </div>
        </div>
    </section>
</x-core.layouts.landing-layout>
