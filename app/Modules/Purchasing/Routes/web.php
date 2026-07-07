<?php

use App\Modules\Purchasing\Controllers\ProveedorController;
use App\Modules\Purchasing\Controllers\OrdenCompraController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'tenant', 'module:purchasing'])->group(function () {
    Route::prefix('purchasing')->name('purchasing.')->group(function () {
        Route::middleware('permission:purchasing:view')->group(function () {
        Route::get('proveedores', [ProveedorController::class, 'index'])->name('proveedores.index');
        
        Route::get('ordenes', [OrdenCompraController::class, 'index'])->name('ordenes.index');
        Route::get('ordenes/{ordene}', [OrdenCompraController::class, 'show'])->name('ordenes.show')->where('ordene', '[0-9]+');
    });

    Route::middleware(['permission:purchasing:create', 'throttle:60,1'])->group(function () {
        Route::get('proveedores/crear', [ProveedorController::class, 'create'])->name('proveedores.create');
        Route::post('proveedores', [ProveedorController::class, 'store'])->name('proveedores.store');

        Route::get('ordenes/crear', [OrdenCompraController::class, 'create'])->name('ordenes.create');
        Route::post('ordenes', [OrdenCompraController::class, 'store'])->name('ordenes.store');
    });

    Route::middleware(['permission:purchasing:edit', 'throttle:60,1'])->group(function () {
        Route::get('proveedores/{proveedore}/editar', [ProveedorController::class, 'edit'])->name('proveedores.edit')->where('proveedore', '[0-9]+');
        Route::put('proveedores/{proveedore}', [ProveedorController::class, 'update'])->name('proveedores.update')->where('proveedore', '[0-9]+');

        Route::get('ordenes/{ordene}/editar', [OrdenCompraController::class, 'edit'])->name('ordenes.edit')->where('ordene', '[0-9]+');
        Route::put('ordenes/{ordene}', [OrdenCompraController::class, 'update'])->name('ordenes.update')->where('ordene', '[0-9]+');
        Route::patch('ordenes/{ordene}/estado', [OrdenCompraController::class, 'updateEstado'])->name('ordenes.estado')->where('ordene', '[0-9]+');
    });

    Route::middleware(['permission:purchasing:delete', 'throttle:60,1'])->group(function () {
        Route::delete('proveedores/{proveedore}', [ProveedorController::class, 'destroy'])->name('proveedores.destroy')->where('proveedore', '[0-9]+');

        Route::delete('ordenes/{ordene}', [OrdenCompraController::class, 'destroy'])->name('ordenes.destroy')->where('ordene', '[0-9]+');
        });
    });
});
