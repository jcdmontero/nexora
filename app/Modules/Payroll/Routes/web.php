<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Payroll\Controllers\LiquidacionController;
use App\Modules\Payroll\Controllers\NovedadController;
use App\Modules\Payroll\Controllers\NominaController;
use App\Modules\Payroll\Controllers\PeriodoController;
use App\Modules\Payroll\Controllers\ReporteController;
use App\Modules\Payroll\Models\PeriodoNomina;

Route::middleware(['web', 'auth', 'tenant', 'module:payroll'])->group(function () {
    Route::prefix('payroll')->name('payroll.')->group(function () {

        // ========================================================================
        // PERÍODOS DE NÓMINA (reemplazan LiquidacionController legacy)
        // ========================================================================
        Route::get('periodos', [PeriodoController::class, 'index'])
            ->name('periodos.index')
            ->middleware('permission:payroll:view');

        Route::post('periodos', [PeriodoController::class, 'store'])
            ->name('periodos.store')
            ->middleware('permission:payroll:liquidate');

        Route::get('periodos/{periodo}', [PeriodoController::class, 'show'])
            ->name('periodos.show')
            ->middleware('permission:payroll:view');

        Route::post('periodos/{periodo}/liquidar', [PeriodoController::class, 'liquidar'])
            ->name('periodos.liquidar')
            ->middleware('permission:payroll:liquidate');

        Route::post('periodos/{periodo}/aprobar', [PeriodoController::class, 'aprobar'])
            ->name('periodos.aprobar')
            ->middleware('permission:payroll:manage');

        Route::post('periodos/{periodo}/anular', [PeriodoController::class, 'anular'])
            ->name('periodos.anular')
            ->middleware('permission:payroll:manage');

        // ========================================================================
        // NÓMINAS INDIVIDUALES
        // ========================================================================
        Route::get('nominas', [NominaController::class, 'index'])
            ->name('nominas.index')
            ->middleware('permission:payroll:view');

        Route::get('nominas/{nomina}', [NominaController::class, 'show'])
            ->name('nominas.show')
            ->middleware('permission:payroll:view');

        Route::post('nominas/{nomina}/concepto', [NominaController::class, 'updateConcepto'])
            ->name('nominas.update-concepto')
            ->middleware('permission:payroll:edit');

        // ========================================================================
        // NOVEDADES
        // ========================================================================
        Route::get('novedades', [NovedadController::class, 'index'])
            ->name('novedades.index')
            ->middleware('permission:payroll:view');

        Route::post('novedades', [NovedadController::class, 'store'])
            ->name('novedades.store')
            ->middleware('permission:payroll:create');

        Route::post('novedades/bulk', [NovedadController::class, 'storeBulk'])
            ->name('novedades.store-bulk')
            ->middleware('permission:payroll:create');

        Route::delete('novedades/{novedad}', [NovedadController::class, 'destroy'])
            ->name('novedades.destroy')
            ->middleware('permission:payroll:delete');

        // ========================================================================
        // REPORTES
        // ========================================================================
        Route::get('reportes', [ReporteController::class, 'index'])
            ->name('reportes.index')
            ->middleware('permission:payroll:report');

        Route::get('reportes/resumen/{periodo}', [ReporteController::class, 'resumen'])
            ->name('reportes.resumen')
            ->middleware('permission:payroll:report');

        Route::get('reportes/desprendible/{nomina}', [ReporteController::class, 'desprendible'])
            ->name('reportes.desprendible')
            ->middleware('permission:payroll:report');

        // ========================================================================
        // LIQUIDACIONES LEGACY (compatibilidad — se mantienen temporalmente)
        // ========================================================================
        Route::get('liquidaciones', [LiquidacionController::class, 'index'])
            ->name('liquidaciones.index')
            ->middleware('permission:payroll:view');

        Route::post('liquidaciones', [LiquidacionController::class, 'store'])
            ->name('liquidaciones.store')
            ->middleware('permission:payroll:liquidate');

        Route::get('liquidaciones/{periodo}', [LiquidacionController::class, 'show'])
            ->name('liquidaciones.show')
            ->middleware('permission:payroll:view')
            ->defaults('binding', 'periodo');

    });
});
