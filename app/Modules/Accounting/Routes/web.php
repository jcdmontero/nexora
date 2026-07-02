<?php

use App\Modules\Accounting\Controllers\AsientoController;
use App\Modules\Accounting\Controllers\CierreAnualController;
use App\Modules\Accounting\Controllers\CuentaController;
use App\Modules\Accounting\Controllers\LibroController;
use App\Modules\Accounting\Controllers\ReporteController;
use App\Modules\Accounting\Controllers\PeriodoContableController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'tenant', 'module:accounting'])
    ->prefix('contabilidad')
    ->name('accounting.')
    ->group(function () {
        
        // Plan de Cuentas
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('cuentas', [CuentaController::class, 'index'])->name('cuentas.index');
        });
        Route::middleware('permission:accounting:create')->group(function () {
            Route::post('cuentas', [CuentaController::class, 'store'])->name('cuentas.store');
        });

        // Libros Contables (Diario, Mayor, Caja, Ventas)
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('libros', [LibroController::class, 'index'])->name('libros.index');
            Route::get('libros/{libro}', [LibroController::class, 'show'])->name('libros.show');
        });

        // Asientos
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('asientos', [AsientoController::class, 'index'])->name('asientos.index');
        });
        Route::middleware('permission:accounting:create')->group(function () {
            Route::get('asientos/crear', [AsientoController::class, 'create'])->name('asientos.create');
            Route::post('asientos', [AsientoController::class, 'store'])->name('asientos.store');
        });

        Route::middleware('permission:accounting:report')->group(function () {
            Route::get('reportes', [ReporteController::class, 'index'])->name('reportes.index');
            Route::get('reportes/pyg', [ReporteController::class, 'pyg'])->name('reportes.pyg');
            Route::get('reportes/balance', [ReporteController::class, 'balance'])->name('reportes.balance');
            Route::get('reportes/auxiliar', [ReporteController::class, 'auxiliar'])->name('reportes.auxiliar');
            Route::get('reportes/terceros', [ReporteController::class, 'terceros'])->name('reportes.terceros');
            Route::get('reportes/libro-iva', [ReporteController::class, 'libroIva'])->name('reportes.libro-iva');
        });

        // Periodos Contables (Cierres)
        Route::middleware('permission:accounting:admin')->group(function () {
            Route::get('periodos', [PeriodoContableController::class, 'index'])->name('periodos.index');
            Route::post('periodos/{periodo}/close', [PeriodoContableController::class, 'close'])->name('periodos.close');
            Route::post('periodos/{periodo}/reopen', [PeriodoContableController::class, 'reopen'])->name('periodos.reopen');
        });

        // Cierre Anual
        Route::middleware('permission:accounting:admin')->group(function () {
            Route::get('cierre-anual', [CierreAnualController::class, 'index'])->name('cierre-anual.index');
            Route::post('cierre-anual/cerrar', [CierreAnualController::class, 'cerrar'])->name('cierre-anual.cerrar');
        });

    });
