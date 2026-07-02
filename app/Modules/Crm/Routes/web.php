<?php

use App\Modules\Crm\Controllers\ClienteController;
use App\Modules\Crm\Controllers\ContactoController;
use App\Modules\Crm\Controllers\OportunidadController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'tenant', 'module:crm'])->group(function () {
    Route::prefix('crm')->name('crm.')->group(function () {
        
        Route::middleware('permission:crm:view')->group(function () {
            Route::get('clientes', [ClienteController::class, 'index'])->name('clientes.index');
            Route::get('clientes/{cliente}', [ClienteController::class, 'show'])->name('clientes.show')->where('cliente', '[0-9]+');
            
            Route::get('oportunidades', [OportunidadController::class, 'index'])->name('oportunidades.index');
        });

        Route::middleware('permission:crm:create')->group(function () {
            Route::get('clientes/crear', [ClienteController::class, 'create'])->name('clientes.create');
            Route::post('clientes', [ClienteController::class, 'store'])->name('clientes.store');
            
            Route::post('clientes/{cliente}/contactos', [ContactoController::class, 'store'])->name('contactos.store')->where('cliente', '[0-9]+');
            
            Route::post('oportunidades', [OportunidadController::class, 'store'])->name('oportunidades.store');
        });

        Route::middleware('permission:crm:edit')->group(function () {
            Route::get('clientes/{cliente}/editar', [ClienteController::class, 'edit'])->name('clientes.edit')->where('cliente', '[0-9]+');
            Route::put('clientes/{cliente}', [ClienteController::class, 'update'])->name('clientes.update')->where('cliente', '[0-9]+');
            
            Route::put('contactos/{contacto}', [ContactoController::class, 'update'])->name('contactos.update');
            
            Route::put('oportunidades/{oportunidad}', [OportunidadController::class, 'update'])->name('oportunidades.update');
            Route::patch('oportunidades/{oportunidad}/etapa', [OportunidadController::class, 'updateEtapa'])->name('oportunidades.updateEtapa');
        });

        Route::middleware('permission:crm:delete')->group(function () {
            Route::delete('clientes/{cliente}', [ClienteController::class, 'destroy'])->name('clientes.destroy')->where('cliente', '[0-9]+');
            Route::delete('contactos/{contacto}', [ContactoController::class, 'destroy'])->name('contactos.destroy');
            Route::delete('oportunidades/{oportunidad}', [OportunidadController::class, 'destroy'])->name('oportunidades.destroy');
        });
        
    });
});
