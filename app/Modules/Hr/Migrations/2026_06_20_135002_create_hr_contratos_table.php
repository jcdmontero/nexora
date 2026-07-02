<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Crear la nueva tabla hr_contratos
        Schema::create('hr_contratos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->string('tipo_contrato', 100); // indefinido, termino_fijo, prestacion_servicios, obra_labor
            $table->string('cargo', 100);
            $table->decimal('salario_base', 15, 2);
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->boolean('estado')->default(true); // Activo (true) o Finalizado (false)
            $table->timestamps();
        });

        // 2. Modificar hr_empleados para remover columnas que ahora van en contrato
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropColumn(['cargo', 'salario_base', 'fecha_ingreso', 'fecha_retiro']);
        });
    }

    public function down(): void
    {
        // Revertir hr_empleados
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->string('cargo', 100)->nullable();
            $table->decimal('salario_base', 15, 2)->nullable();
            $table->date('fecha_ingreso')->nullable();
            $table->date('fecha_retiro')->nullable();
        });

        Schema::dropIfExists('hr_contratos');
    }
};
