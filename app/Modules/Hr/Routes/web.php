<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Hr\Controllers\EmpleadoController;
use App\Modules\Hr\Controllers\ContratoController;
use App\Modules\Hr\Controllers\CatalogoOrganizacionalController;
use App\Modules\Hr\Controllers\DashboardController;
use App\Modules\Hr\Controllers\PrestamoController;
use App\Modules\Hr\Controllers\IncapacidadController;
use App\Modules\Hr\Controllers\ConfiguracionLegalController;
use App\Modules\Hr\Controllers\AfiliacionController;

Route::middleware(['web', 'auth', 'tenant', 'module:hr'])->group(function () {
    Route::prefix('hr')->name('hr.')->group(function () {

        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard')->middleware('permission:hr:view');

        // Empleados
        Route::get('empleados', [EmpleadoController::class, 'index'])->name('empleados.index')->middleware('permission:hr:view');
        Route::get('empleados/crear', [EmpleadoController::class, 'create'])->name('empleados.create')->middleware('permission:hr:create');
        Route::post('empleados', [EmpleadoController::class, 'store'])->name('empleados.store')->middleware('permission:hr:create');
        Route::get('empleados/{empleado}', [EmpleadoController::class, 'show'])->name('empleados.show')->middleware('permission:hr:view');
        Route::get('empleados/{empleado}/editar', [EmpleadoController::class, 'edit'])->name('empleados.edit')->middleware('permission:hr:edit');
        Route::put('empleados/{empleado}', [EmpleadoController::class, 'update'])->name('empleados.update')->middleware('permission:hr:edit');

        // Contratos
        Route::post('empleados/{empleado}/contratos', [ContratoController::class, 'store'])->name('contratos.store')->middleware('permission:hr:create');
        Route::put('contratos/{contrato}', [ContratoController::class, 'update'])->name('contratos.update')->middleware('permission:hr:edit');
        Route::get('contratos', [EmpleadoController::class, 'index'])->name('contratos.index')->middleware('permission:hr:view');

        // Catálogo organizacional
        Route::get('catalogos/organigrama', [CatalogoOrganizacionalController::class, 'index'])->name('catalogos.organigrama')->middleware('permission:hr:view');
        Route::post('catalogos/departamentos', [CatalogoOrganizacionalController::class, 'storeDepartamento'])->name('catalogos.departamentos.store')->middleware('permission:hr:create');
        Route::put('catalogos/departamentos/{departamento}', [CatalogoOrganizacionalController::class, 'updateDepartamento'])->name('catalogos.departamentos.update')->middleware('permission:hr:edit');
        Route::delete('catalogos/departamentos/{departamento}', [CatalogoOrganizacionalController::class, 'destroyDepartamento'])->name('catalogos.departamentos.destroy')->middleware('permission:hr:delete');
        Route::post('catalogos/cargos', [CatalogoOrganizacionalController::class, 'storeCargo'])->name('catalogos.cargos.store')->middleware('permission:hr:create');
        Route::put('catalogos/cargos/{cargo}', [CatalogoOrganizacionalController::class, 'updateCargo'])->name('catalogos.cargos.update')->middleware('permission:hr:edit');
        Route::delete('catalogos/cargos/{cargo}', [CatalogoOrganizacionalController::class, 'destroyCargo'])->name('catalogos.cargos.destroy')->middleware('permission:hr:delete');

        // Préstamos
        Route::get('prestamos', [PrestamoController::class, 'index'])->name('prestamos.index')->middleware('permission:hr:view');
        Route::post('prestamos', [PrestamoController::class, 'store'])->name('prestamos.store')->middleware('permission:hr:create');
        Route::post('prestamos/cuotas/{cuota}/pagar', [PrestamoController::class, 'pagarCuota'])->name('prestamos.cuotas.pagar')->middleware('permission:hr:edit');

        // Incapacidades
        Route::get('incapacidades', [IncapacidadController::class, 'index'])->name('incapacidades.index')->middleware('permission:hr:view');
        Route::post('incapacidades', [IncapacidadController::class, 'store'])->name('incapacidades.store')->middleware('permission:hr:create');
        Route::put('incapacidades/{incapacidad}', [IncapacidadController::class, 'update'])->name('incapacidades.update')->middleware('permission:hr:edit');
        Route::delete('incapacidades/{incapacidad}', [IncapacidadController::class, 'destroy'])->name('incapacidades.destroy')->middleware('permission:hr:delete');

        // Configuración legal
        Route::get('configuracion-legal', [ConfiguracionLegalController::class, 'index'])->name('configuracion-legal.index')->middleware('permission:hr:view');
        Route::post('configuracion-legal', [ConfiguracionLegalController::class, 'store'])->name('configuracion-legal.store')->middleware('permission:hr:create');
        Route::put('configuracion-legal/{id}', [ConfiguracionLegalController::class, 'update'])->name('configuracion-legal.update')->middleware('permission:hr:edit');

        // Afiliaciones
        Route::get('afiliaciones', [AfiliacionController::class, 'index'])->name('afiliaciones.index')->middleware('permission:hr:view');
        Route::post('afiliaciones', [AfiliacionController::class, 'store'])->name('afiliaciones.store')->middleware('permission:hr:create');

    });
});
