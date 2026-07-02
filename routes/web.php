<?php

use App\Core\Http\Controllers\Auth\LoginController;
use App\Core\Http\Controllers\Auth\RegisteredUserController;
use App\Core\Http\Controllers\Core\AuditLogController;
use App\Core\Http\Controllers\Core\DashboardController;
use App\Core\Http\Controllers\Core\ProfileController;
use App\Core\Http\Controllers\Core\RoleController;
use App\Core\Http\Controllers\Core\TenantController;
use App\Core\Http\Controllers\Core\UserController;
use App\Core\Http\Controllers\Core\SedeController;
use App\Core\Http\Controllers\Core\TaskController;
use App\Core\Http\Controllers\Core\WidgetLayoutController;
use App\Core\Http\Controllers\SuperAdmin\DashboardController as SuperDashboardController;
use App\Core\Http\Controllers\SuperAdmin\ModuleController as SuperModuleController;
use App\Core\Http\Controllers\SuperAdmin\TenantController as SuperTenantController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ─── Landing ───
Route::get('/', function () {
    return Inertia::render('Landing');
})->name('landing');

// ─── Performance API (SuperAdmin only) ───
Route::prefix('api/performance')->name('api.performance.')->middleware(['auth', 'superadmin'])->group(function () {
    Route::get('stats', [\App\Http\Controllers\Api\PerformanceController::class, 'stats'])->name('stats');
    Route::get('health', [\App\Http\Controllers\Api\PerformanceController::class, 'health'])->name('health');
});

// ─── SuperAdmin ───
Route::prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    // Portal SuperAdmin (solo plataforma)
    Route::middleware(['auth', 'superadmin'])->group(function () {
        Route::get('/', [SuperDashboardController::class, 'index'])->name('dashboard');

        Route::get('empresas', [SuperTenantController::class, 'index'])->name('tenants.index');
        Route::get('empresas/crear', [SuperTenantController::class, 'create'])->name('tenants.create');
        Route::post('empresas', [SuperTenantController::class, 'store'])->name('tenants.store');
        Route::get('empresas/{tenant}/editar', [SuperTenantController::class, 'edit'])->name('tenants.edit');
        Route::put('empresas/{tenant}', [SuperTenantController::class, 'update'])->name('tenants.update');
        Route::post('empresas/{tenant}/estado', [SuperTenantController::class, 'toggleActive'])->name('tenants.toggle');

        // Centro de Módulos (gobernanza del ciclo de vida)
        Route::get('modulos', [SuperModuleController::class, 'index'])->name('modules.index');
        Route::put('modulos/{module}/estado', [SuperModuleController::class, 'updateEstado'])->name('modules.estado');
    });
});

// ─── Verificación Pública de Documentos (QR) ───
Route::get('verificar/{tipo}/{token}', [\App\Core\Http\Controllers\Core\DocumentVerificationController::class, 'verify'])
    ->name('document.verify');

// ─── Tenant Auth ───
Route::name('core.')->group(function () {
    Route::get('login', [LoginController::class, 'create'])->name('login');
    Route::post('login', [LoginController::class, 'store']);
    Route::post('logout', [LoginController::class, 'destroy'])->name('logout');

    Route::get('register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('register', [RegisteredUserController::class, 'store']);
});

// ─── Tenant Core (auth required) ───
Route::middleware(['web', 'auth', 'tenant'])->group(function () {

    Route::name('core.')->group(function () {
        // Búsqueda Global
        Route::get('search', [\App\Core\Controllers\SearchController::class, 'search'])->name('search');

        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');
        Route::get('dashboard/widget/{module}/data', [DashboardController::class, 'widgetData'])->name('dashboard.widget-data');

        // Widget Layout API
        Route::get('dashboard/widgets/layout/{viewName?}', [WidgetLayoutController::class, 'show'])->name('widgets.layout.show');
        Route::put('dashboard/widgets/layout/{viewName?}', [WidgetLayoutController::class, 'update'])->name('widgets.layout.update');
        Route::get('dashboard/widgets/views', [WidgetLayoutController::class, 'availableViews'])->name('widgets.views');

        // Perfil de usuario (sin permisos especiales, cualquier usuario autenticado)
        Route::get('perfil', [ProfileController::class, 'edit'])->name('profile.index');
        Route::put('perfil', [ProfileController::class, 'update'])->name('profile.update');
        Route::put('perfil/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

        // Tareas
        Route::get('tareas', [TaskController::class, 'index'])->name('tasks.index');
        Route::post('tareas', [TaskController::class, 'store'])->name('tasks.store');
        Route::put('tareas/{task}', [TaskController::class, 'update'])->name('tasks.update');
        Route::delete('tareas/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');

    Route::middleware('permission:users:view')->group(function () {
        Route::get('usuarios', [UserController::class, 'index'])->name('users.index');
    });
    Route::middleware('permission:users:create')->group(function () {
        Route::get('usuarios/crear', [UserController::class, 'create'])->name('users.create');
        Route::post('usuarios', [UserController::class, 'store'])->name('users.store');
    });
    Route::middleware('permission:users:edit')->group(function () {
        Route::get('usuarios/{user}/editar', [UserController::class, 'edit'])->name('users.edit');
        Route::put('usuarios/{user}', [UserController::class, 'update'])->name('users.update');
    });
    Route::middleware('permission:users:delete')->group(function () {
        Route::delete('usuarios/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    Route::middleware('permission:tenant:edit')->group(function () {
        Route::get('sedes', [SedeController::class, 'index'])->name('sedes.index');
        Route::get('sedes/crear', [SedeController::class, 'create'])->name('sedes.create');
        Route::post('sedes', [SedeController::class, 'store'])->name('sedes.store');
        Route::get('sedes/{sede}/editar', [SedeController::class, 'edit'])->name('sedes.edit');
        Route::put('sedes/{sede}', [SedeController::class, 'update'])->name('sedes.update');
        Route::delete('sedes/{sede}', [SedeController::class, 'destroy'])->name('sedes.destroy');
    });

    Route::middleware('permission:audit:view')->group(function () {
        Route::get('auditoria', [AuditLogController::class, 'index'])->name('audit.index');
    });

    Route::middleware('permission:roles:view')->group(function () {
        Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    });
    Route::middleware('permission:roles:create')->group(function () {
        Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    });
    Route::middleware('permission:roles:edit')->group(function () {
        Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    });
    Route::middleware('permission:roles:delete')->group(function () {
        Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
    });

    Route::middleware('permission:tenant:edit')->group(function () {
        Route::get('mi-empresa', [TenantController::class, 'edit'])->name('tenant.edit');
        Route::put('mi-empresa', [TenantController::class, 'update'])->name('tenant.update');
        Route::get('mi-empresa/status/whatsapp', [TenantController::class, 'statusWhatsapp'])->name('tenant.status.whatsapp');
        Route::get('mi-empresa/status/telegram', [TenantController::class, 'statusTelegram'])->name('tenant.status.telegram');
        Route::post('mi-empresa/test/telegram', [TenantController::class, 'testTelegram'])->name('tenant.test.telegram');
        Route::post('mi-empresa/test/email', [TenantController::class, 'testEmail'])->name('tenant.test.email');
        Route::get('mi-empresa/status/sistema', [TenantController::class, 'statusSistema'])->name('tenant.status.sistema');
    });
    });
});

// ─── Portal de Clientes ───
Route::prefix('portal')->name('portal.')->group(function () {
    // Rutas públicas de autenticación
    Route::get('login', [\App\Core\Http\Controllers\Auth\PortalClientesAuthController::class, 'create'])->name('login');
    Route::post('login', [\App\Core\Http\Controllers\Auth\PortalClientesAuthController::class, 'store']);
    Route::post('logout', [\App\Core\Http\Controllers\Auth\PortalClientesAuthController::class, 'destroy'])->name('logout');

    // Rutas protegidas para clientes autenticados
    Route::middleware(['web', 'auth:cliente'])->group(function () {
        Route::get('dashboard', [\App\Core\Http\Controllers\Core\PortalClientesDashboardController::class, 'index'])->name('dashboard');
        Route::get('ordenes', [\App\Core\Http\Controllers\Core\PortalClientesDashboardController::class, 'ordenes'])->name('ordenes');
        Route::get('ordenes/{id}', [\App\Core\Http\Controllers\Core\PortalClientesDashboardController::class, 'ordenShow'])->name('ordenes.show');
        Route::get('facturas', [\App\Core\Http\Controllers\Core\PortalClientesDashboardController::class, 'facturas'])->name('facturas');
    });
});
