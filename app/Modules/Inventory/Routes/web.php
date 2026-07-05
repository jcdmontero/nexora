<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Inventory\Controllers\CategoriaController;
use App\Modules\Inventory\Controllers\ProductoController;
use App\Modules\Inventory\Controllers\RecepcionController;
use App\Modules\Inventory\Controllers\TrasladoController;
use App\Modules\Inventory\Controllers\BodegaController;

use App\Modules\Inventory\Controllers\MarcaController;
use App\Modules\Inventory\Controllers\AjusteController;
use App\Modules\Inventory\Controllers\KardexController;
Route::middleware(['web', 'auth', 'tenant', 'module:inventory'])->group(function () {
    Route::prefix('inventory')->name('inventory.')->group(function () {

        Route::middleware('permission:inventory:view')->group(function () {
    Route::get('categorias', [CategoriaController::class, 'index'])->name('categorias.index');
    Route::get('bodegas', [BodegaController::class, 'index'])->name('bodegas.index');
    Route::get('marcas', [MarcaController::class, 'index'])->name('marcas.index');
    Route::get('productos', [ProductoController::class, 'index'])->name('productos.index');
    Route::get('productos/etiquetas', [ProductoController::class, 'printLabels'])->name('productos.etiquetas');
    
    Route::get('kardex', [KardexController::class, 'index'])->name('kardex.index');
    Route::get('kardex/{producto}', [KardexController::class, 'show'])->name('kardex.show');

    Route::get('recepciones', [RecepcionController::class, 'index'])->name('recepciones.index');
    Route::get('recepciones/{recepcione}', [RecepcionController::class, 'show'])->name('recepciones.show')->where('recepcione', '[0-9]+');

    Route::get('traslados', [TrasladoController::class, 'index'])->name('traslados.index');
    Route::get('traslados/{traslado}', [TrasladoController::class, 'show'])->name('traslados.show')->where('traslado', '[0-9]+');
});

Route::middleware('permission:inventory:create')->group(function () {
    Route::post('categorias', [CategoriaController::class, 'store'])->name('categorias.store');
    
    Route::get('bodegas/crear', [BodegaController::class, 'create'])->name('bodegas.create');
    Route::post('bodegas', [BodegaController::class, 'store'])->name('bodegas.store');

    Route::post('marcas', [MarcaController::class, 'store'])->name('marcas.store');
    
    Route::get('productos/crear', [ProductoController::class, 'create'])->name('productos.create');
    Route::post('productos', [ProductoController::class, 'store'])->name('productos.store');

    Route::get('ajustes/crear', [AjusteController::class, 'create'])->name('ajustes.create');
    Route::post('ajustes', [AjusteController::class, 'store'])->name('ajustes.store');

    Route::get('recepciones/crear', [RecepcionController::class, 'create'])->name('recepciones.create');
    Route::post('recepciones', [RecepcionController::class, 'store'])->name('recepciones.store');

    Route::get('traslados/crear', [TrasladoController::class, 'create'])->name('traslados.create');
    Route::post('traslados', [TrasladoController::class, 'store'])->name('traslados.store');
    Route::post('traslados/{traslado}/completar', [TrasladoController::class, 'completar'])->name('traslados.completar')->where('traslado', '[0-9]+');
});

Route::middleware('permission:inventory:edit')->group(function () {
    Route::put('categorias/{categoria}', [CategoriaController::class, 'update'])->name('categorias.update');
    
    Route::get('bodegas/{bodega}/editar', [BodegaController::class, 'edit'])->name('bodegas.edit');
    Route::put('bodegas/{bodega}', [BodegaController::class, 'update'])->name('bodegas.update');

    Route::put('marcas/{marca}', [MarcaController::class, 'update'])->name('marcas.update');
    Route::get('productos/{producto}/editar', [ProductoController::class, 'edit'])->name('productos.edit');
    Route::put('productos/{producto}', [ProductoController::class, 'update'])->name('productos.update');
});

Route::middleware('permission:inventory:delete')->group(function () {
    Route::delete('categorias/{categoria}', [CategoriaController::class, 'destroy'])->name('categorias.destroy');
    Route::delete('bodegas/{bodega}', [BodegaController::class, 'destroy'])->name('bodegas.destroy');
    Route::delete('marcas/{marca}', [MarcaController::class, 'destroy'])->name('marcas.destroy');
        Route::delete('productos/{producto}', [ProductoController::class, 'destroy'])->name('productos.destroy');
    });

    });
});
