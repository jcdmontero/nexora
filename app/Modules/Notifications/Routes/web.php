<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Notifications\Controllers\NotificacionController;
use App\Modules\Notifications\Controllers\PlantillaController;

Route::middleware(['web', 'auth', 'tenant', 'module:notifications'])->group(function () {
    Route::prefix('notificaciones')->name('notifications.')->group(function () {
        Route::middleware('permission:notifications:view')->group(function () {
            Route::get('/', [NotificacionController::class, 'index'])->name('index');
        });
        Route::middleware('permission:notifications:send')->group(function () {
            Route::post('{notificacion}/reenviar', [NotificacionController::class, 'reenviar'])->name('reenviar');
        });
        Route::middleware('permission:notifications:manage')->group(function () {
            Route::get('plantillas', [PlantillaController::class, 'index'])->name('plantillas.index');
            Route::put('plantillas/{plantilla}', [PlantillaController::class, 'update'])->name('plantillas.update');
            Route::delete('plantillas/{plantilla}', [PlantillaController::class, 'destroy'])->name('plantillas.destroy');
        });
    });
});
