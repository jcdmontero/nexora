<?php

use Illuminate\Support\Facades\Route;
use App\Modules\ServiceDesk\Controllers\TicketController;
use App\Modules\ServiceDesk\Controllers\TipoEquipoController;
use App\Modules\ServiceDesk\Controllers\MarcaController;
use App\Modules\ServiceDesk\Controllers\ModeloController;
use App\Modules\ServiceDesk\Controllers\ServicioController;
use App\Modules\ServiceDesk\Controllers\FallaBaseController;
use App\Modules\ServiceDesk\Controllers\ChecklistItemController;
use App\Modules\ServiceDesk\Controllers\OrdenController;
use App\Modules\ServiceDesk\Controllers\PrestadorController;
use App\Modules\ServiceDesk\Controllers\ComisionController;

Route::get('service-desk/comisiones/verificar/{token}', [ComisionController::class, 'verify'])
    ->name('service-desk.comisiones.verify')
    ->middleware('throttle:10,1');

Route::middleware(['web', 'auth', 'tenant', 'module:service-desk'])->group(function () {
    Route::prefix('service-desk')->name('service-desk.')->group(function () {

        // ─── Órdenes de reparación ───
        Route::get('ordenes', [OrdenController::class, 'index'])->name('ordenes.index')->middleware('permission:service-desk:view');
        Route::get('ordenes/crear', [OrdenController::class, 'create'])->name('ordenes.create')->middleware('permission:service-desk:create');
        Route::post('ordenes', [OrdenController::class, 'store'])->name('ordenes.store')->middleware('permission:service-desk:create');
        Route::get('ordenes/{orden}/editar', [OrdenController::class, 'edit'])->name('ordenes.edit')->middleware('permission:service-desk:edit');
        Route::put('ordenes/{orden}', [OrdenController::class, 'update'])->name('ordenes.update')->middleware('permission:service-desk:edit');
        Route::get('ordenes/validar-numero-serie', [OrdenController::class, 'validarNumeroSerie'])->name('ordenes.validar-numero-serie')->middleware('permission:service-desk:view');
        Route::get('ordenes/{orden}', [OrdenController::class, 'show'])->name('ordenes.show')->middleware('permission:service-desk:view');
        Route::put('ordenes/{orden}/estado', [OrdenController::class, 'updateEstado'])->name('ordenes.estado')->middleware('permission:service-desk:edit');
        Route::delete('ordenes/{orden}', [OrdenController::class, 'destroy'])->name('ordenes.destroy')->middleware('permission:service-desk:delete');
        Route::post('ordenes/{orden}/notificar-tecnico', [OrdenController::class, 'notificarTecnico'])->name('ordenes.notificar-tecnico')->middleware('permission:service-desk:edit');
        Route::post('ordenes/{orden}/notificar-administrador', [OrdenController::class, 'notificarAdministrador'])->name('ordenes.notificar-administrador')->middleware('permission:service-desk:edit');
        
        // ─── Liquidación y Facturación de Orden ───
        Route::get('ordenes/{orden}/liquidar', [\App\Modules\ServiceDesk\Controllers\LiquidacionController::class, 'edit'])->name('ordenes.liquidar')->middleware('permission:service-desk:edit');
        Route::post('ordenes/{orden}/liquidar', [\App\Modules\ServiceDesk\Controllers\LiquidacionController::class, 'update'])->name('ordenes.liquidar.update')->middleware('permission:service-desk:edit');
        
        // ─── Prefactura y Notificación ───
        // La "prefactura" es la vista editable (liquidación), no un PDF de descarga.
        Route::get('ordenes/{orden}/prefactura', [\App\Modules\ServiceDesk\Controllers\LiquidacionController::class, 'edit'])->name('ordenes.prefactura')->middleware('permission:service-desk:edit');
        Route::get('ordenes/{orden}/prefactura/pdf', [\App\Modules\ServiceDesk\Controllers\PrefacturaController::class, 'generar'])->name('ordenes.prefactura.pdf')->middleware('permission:service-desk:edit');
        Route::post('ordenes/{orden}/prefactura/notificar', [\App\Modules\ServiceDesk\Controllers\PrefacturaController::class, 'notificar'])->name('ordenes.prefactura.notificar')->middleware('permission:service-desk:edit');
        // ─── Actividades de la OT ───
        Route::post('ordenes/{orden}/actividades', [OrdenController::class, 'storeActividad'])->name('ordenes.actividades.store')->middleware('permission:service-desk:edit');
        Route::put('ordenes/{orden}/actividades/{actividad}', [OrdenController::class, 'updateActividad'])->name('ordenes.actividades.update')->middleware('permission:service-desk:edit');
        Route::delete('ordenes/{orden}/actividades/{actividad}', [OrdenController::class, 'destroyActividad'])->name('ordenes.actividades.destroy')->middleware('permission:service-desk:edit');

        // ─── Multimedia (fotos/videos) ───
        Route::middleware('permission:service-desk:edit')->group(function () {
            Route::get('ordenes/{orden}/multimedia', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'indexOrden'])->name('ordenes.multimedia.index');
            Route::post('ordenes/{orden}/multimedia', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'uploadOrden'])->name('ordenes.multimedia.upload');
            Route::delete('multimedia/{multimedia}', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'destroy'])->name('ordenes.multimedia.destroy');
        });

        // ─── Garantías y Tickets ───
        Route::get('garantias', [TicketController::class, 'garantiasIndex'])->name('garantias.index')->middleware('permission:service-desk:view');
        Route::get('tickets/crear', [TicketController::class, 'create'])->name('tickets.create')->middleware('permission:service-desk:create');
        Route::post('tickets', [TicketController::class, 'store'])->name('tickets.store')->middleware('permission:service-desk:create');
        Route::get('tickets/{ticket}', [TicketController::class, 'show'])->name('tickets.show')->middleware('permission:service-desk:view');
        Route::put('tickets/{ticket}/estado', [TicketController::class, 'updateStatus'])->name('tickets.updateStatus')->middleware('permission:service-desk:edit');
        Route::put('tickets/{ticket}/agente', [TicketController::class, 'updateAgent'])->name('tickets.updateAgent')->middleware('permission:service-desk:assign');
        Route::post('tickets/{ticket}/mensajes', [TicketController::class, 'addMessage'])->name('tickets.mensajes.store')->middleware('permission:service-desk:view');

        // ─── Prestadores (técnicos internos/externos) ───
        Route::get('prestadores', [PrestadorController::class, 'index'])->name('prestadores.index')->middleware('permission:service-desk:view');
        Route::get('prestadores/crear', [PrestadorController::class, 'create'])->name('prestadores.create')->middleware('permission:service-desk:create');
        Route::post('prestadores', [PrestadorController::class, 'store'])->name('prestadores.store')->middleware('permission:service-desk:create');
        Route::get('prestadores/{prestador}', [PrestadorController::class, 'show'])->name('prestadores.show')->middleware('permission:service-desk:view');
        Route::get('prestadores/{prestador}/editar', [PrestadorController::class, 'edit'])->name('prestadores.edit')->middleware('permission:service-desk:edit');
        Route::put('prestadores/{prestador}', [PrestadorController::class, 'update'])->name('prestadores.update')->middleware('permission:service-desk:edit');
        Route::delete('prestadores/{prestador}', [PrestadorController::class, 'destroy'])->name('prestadores.destroy')->middleware('permission:service-desk:delete');

        // ─── Liquidación de comisiones ───
        Route::get('comisiones', [ComisionController::class, 'index'])->name('comisiones.index')->middleware('permission:service-desk:view');
        Route::get('comisiones/crear', [ComisionController::class, 'create'])->name('comisiones.create')->middleware('permission:service-desk:create');
        Route::post('comisiones', [ComisionController::class, 'store'])->name('comisiones.store')->middleware('permission:service-desk:create');
        Route::get('comisiones/{liquidacion}', [ComisionController::class, 'show'])->name('comisiones.show')->middleware('permission:service-desk:view');
        Route::post('comisiones/{liquidacion}/aprobar', [ComisionController::class, 'approve'])->name('comisiones.approve')->middleware('permission:service-desk:edit');
        Route::post('comisiones/{liquidacion}/pagar', [ComisionController::class, 'pay'])->name('comisiones.pay')->middleware('permission:service-desk:edit');
        Route::get('comisiones/{liquidacion}/pdf', [ComisionController::class, 'pdf'])->name('comisiones.pdf')->middleware('permission:service-desk:view');
        Route::delete('comisiones/{liquidacion}', [ComisionController::class, 'destroy'])->name('comisiones.destroy')->middleware('permission:service-desk:delete');

        // ─── Catálogos del taller ───
        Route::middleware('permission:service-desk:view')->group(function () {
            Route::get('catalogos/tipos-equipo', [TipoEquipoController::class, 'index'])->name('tipos-equipo.index');
            Route::get('catalogos/marcas', [MarcaController::class, 'index'])->name('marcas.index');
            Route::get('catalogos/modelos', [ModeloController::class, 'index'])->name('modelos.index');
            Route::get('catalogos/servicios', [ServicioController::class, 'index'])->name('servicios.index');
            Route::get('catalogos/fallas', [FallaBaseController::class, 'index'])->name('fallas.index');
            Route::get('catalogos/checklist', [ChecklistItemController::class, 'index'])->name('checklist.index');
        });
        Route::middleware('permission:service-desk:create')->group(function () {
            Route::post('catalogos/tipos-equipo', [TipoEquipoController::class, 'store'])->name('tipos-equipo.store');
            Route::post('catalogos/marcas', [MarcaController::class, 'store'])->name('marcas.store');
            Route::post('catalogos/modelos', [ModeloController::class, 'store'])->name('modelos.store');
            Route::post('catalogos/servicios', [ServicioController::class, 'store'])->name('servicios.store');
            Route::post('catalogos/fallas', [FallaBaseController::class, 'store'])->name('fallas.store');
            Route::post('catalogos/checklist', [ChecklistItemController::class, 'store'])->name('checklist.store');
        });
        Route::middleware('permission:service-desk:edit')->group(function () {
            Route::put('catalogos/tipos-equipo/{tipos_equipo}', [TipoEquipoController::class, 'update'])->name('tipos-equipo.update');
            Route::put('catalogos/marcas/{marca}', [MarcaController::class, 'update'])->name('marcas.update');
            Route::put('catalogos/modelos/{modelo}', [ModeloController::class, 'update'])->name('modelos.update');
            Route::put('catalogos/servicios/{servicio}', [ServicioController::class, 'update'])->name('servicios.update');
            Route::put('catalogos/fallas/{falla}', [FallaBaseController::class, 'update'])->name('fallas.update');
            Route::put('catalogos/checklist/{checklist}', [ChecklistItemController::class, 'update'])->name('checklist.update');
        });
        Route::middleware('permission:service-desk:delete')->group(function () {
            Route::delete('catalogos/tipos-equipo/{tipos_equipo}', [TipoEquipoController::class, 'destroy'])->name('tipos-equipo.destroy');
            Route::delete('catalogos/marcas/{marca}', [MarcaController::class, 'destroy'])->name('marcas.destroy');
            Route::delete('catalogos/modelos/{modelo}', [ModeloController::class, 'destroy'])->name('modelos.destroy');
            Route::delete('catalogos/servicios/{servicio}', [ServicioController::class, 'destroy'])->name('servicios.destroy');
            Route::delete('catalogos/fallas/{falla}', [FallaBaseController::class, 'destroy'])->name('fallas.destroy');
            Route::delete('catalogos/checklist/{checklist}', [ChecklistItemController::class, 'destroy'])->name('checklist.destroy');
        });

        // ─── Imágenes de servicios ───
        Route::middleware('permission:service-desk:edit')->group(function () {
            Route::post('catalogos/servicios/{servicio}/imagen', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'uploadServicio'])->name('servicios.imagen.upload');
            Route::delete('catalogos/servicios/{servicio}/imagen', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'destroyServicio'])->name('servicios.imagen.destroy');
        });

    });
});
