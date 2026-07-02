<nav class="navbar navbar-dark bg-dark border-bottom border-secondary px-3">
    <div class="d-flex align-items-center gap-3">
        <span class="text-light fw-semibold">{{ Auth::user()?->name }}</span>
        <span class="badge bg-primary">{{ Auth::user()?->getRoleNames()?->first() ?? 'user' }}</span>
    </div>
</nav>
