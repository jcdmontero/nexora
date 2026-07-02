<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Sales\Controllers\FacturaController;
use App\Modules\Sales\Controllers\PosController;

Route::middleware(['web', 'auth', 'tenant', 'module:sales'])->group(function () {
    Route::prefix('sales')->name('sales.')->group(function () {
        
        // Punto de Venta (POS)
        Route::get('pos', [PosController::class, 'index'])->name('pos.index')->middleware('permission:sales:create');
        Route::post('pos', [PosController::class, 'store'])->name('pos.store')->middleware('permission:sales:create');
        
        // Facturas
        Route::get('facturas', [FacturaController::class, 'index'])->name('facturas.index')->middleware('permission:sales:view');
        Route::get('facturas/{factura}/pdf', [FacturaController::class, 'pdf'])->name('facturas.pdf')->middleware('permission:sales:view');
        Route::get('facturas/{factura}', [FacturaController::class, 'show'])->name('facturas.show')->middleware('permission:sales:view');
        Route::post('facturas/{factura}/emitir', [FacturaController::class, 'emitir'])->name('facturas.emitir')->middleware('permission:sales:edit');
        Route::post('facturas/{factura}/anular', [FacturaController::class, 'anular'])->name('facturas.anular')->middleware('permission:sales:anular');

        // Configuración
        Route::get('configuracion', function () {
            return inertia('Sales/Configuracion');
        })->name('configuracion')->middleware('permission:sales:admin');

    });
});
