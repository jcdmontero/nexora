<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Notifications\Controllers\NotificacionController;
use App\Modules\Notifications\Controllers\PlantillaController;
use App\Modules\Notifications\Controllers\ChatController;

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

    Route::prefix('chat')->name('chat.')->group(function () {
        Route::get('/conversaciones', [ChatController::class, 'index'])->name('index');
        Route::post('/conversaciones', [ChatController::class, 'store'])->name('store');
        Route::get('/{conversacionId}/mensajes', [ChatController::class, 'mensajes'])->name('mensajes');
        Route::post('/{conversacionId}/mensajes', [ChatController::class, 'enviar'])->name('enviar');
    });
});
