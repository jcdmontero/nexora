<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Cash\Controllers\CajaController;
use App\Modules\Cash\Controllers\CajaAdminController;
use App\Modules\Cash\Controllers\MovimientoController;
use App\Modules\Cash\Controllers\ArqueoController;
use App\Modules\Cash\Controllers\TransferenciaController;
use App\Modules\Cash\Controllers\ReporteController;
use App\Modules\Cash\Controllers\ReciboController;
use App\Modules\Cash\Controllers\RecaudoController;
use App\Modules\Cash\Controllers\PagoProveedorController;

Route::middleware(['web', 'auth', 'tenant', 'module:cash'])->group(function () {
    Route::prefix('cash')->name('cash.')->group(function () {

        // ── Turnos de caja (apertura/cierre) — usados por POS y ServiceDesk ──
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('caja', [CajaController::class, 'index'])->name('caja.index');
            Route::get('caja/estado', [CajaController::class, 'estado'])->name('caja.estado');
        });
        Route::middleware('permission:cash:create')->group(function () {
            Route::post('caja/abrir', [CajaController::class, 'abrir'])->name('caja.abrir');
        });
        Route::middleware('permission:cash:close')->group(function () {
            Route::post('caja/{sesion}/cerrar', [CajaController::class, 'cerrar'])->name('caja.cerrar');
            Route::get('caja/{sesion}/arqueo', [ArqueoController::class, 'create'])->name('arqueo.create');
            Route::post('caja/{sesion}/arqueo', [ArqueoController::class, 'store'])->name('arqueo.store');
        });

        // ── Movimientos ──
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('movimientos', [MovimientoController::class, 'index'])->name('movimientos.index');
        });
        Route::middleware('permission:cash:create')->group(function () {
            Route::post('movimientos', [MovimientoController::class, 'store'])->name('movimientos.store');
        });

        // ── Administración de cajas (CRUD multicaja) ──
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('cajas', [CajaAdminController::class, 'index'])->name('cajas.index');
        });
        Route::middleware('permission:cash:manage')->group(function () {
            Route::post('cajas', [CajaAdminController::class, 'store'])->name('cajas.store');
            Route::put('cajas/{caja}', [CajaAdminController::class, 'update'])->name('cajas.update');
            Route::delete('cajas/{caja}', [CajaAdminController::class, 'destroy'])->name('cajas.destroy');
        });

        // ── Transferencias entre cajas ──
        Route::middleware('permission:cash:transfer')->group(function () {
            Route::get('transferencias', [TransferenciaController::class, 'index'])->name('transferencias.index');
            Route::post('transferencias', [TransferenciaController::class, 'store'])->name('transferencias.store');
        });

        // ── Reporte consolidado multicaja ──
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('reporte/consolidado', [ReporteController::class, 'consolidado'])->name('reporte.consolidado');
        });

        // ── Recibos de caja ──
        Route::middleware('permission:cash:receipts')->group(function () {
            Route::post('recibos', [ReciboController::class, 'store'])->name('recibos.store');
        });
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('recibos/{recibo}', [ReciboController::class, 'show'])->name('recibos.show');
            Route::get('recibos/{recibo}/pdf', [ReciboController::class, 'pdf'])->name('recibos.pdf');
            Route::post('recibos/{recibo}/anular', [ReciboController::class, 'anular'])->name('recibos.anular')->middleware('permission:cash:receipts');
        });

        // ── Recaudos (Cartera / Cuentas por Cobrar) ──
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('recaudos', [RecaudoController::class, 'index'])->name('recaudos.index');
            Route::get('recaudos/cliente/{cliente}', [RecaudoController::class, 'pendientes'])->name('recaudos.pendientes');
        });
        Route::middleware('permission:cash:receipts')->group(function () {
            Route::post('recaudos/factura/{factura}/pagar', [RecaudoController::class, 'pagar'])->name('recaudos.pagar');
        });

        // ── Pagos a Proveedores (Cuentas por Pagar) ──
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('pagos-proveedores', [PagoProveedorController::class, 'index'])->name('pagos-proveedores.index');
            Route::get('pagos-proveedores/proveedor/{proveedor}', [PagoProveedorController::class, 'pendientes'])->name('pagos-proveedores.pendientes');
        });
        Route::middleware('permission:cash:receipts')->group(function () {
            Route::post('pagos-proveedores/cxp/{cxp}/pagar', [PagoProveedorController::class, 'pagar'])->name('pagos-proveedores.pagar');
        });

    });
});
