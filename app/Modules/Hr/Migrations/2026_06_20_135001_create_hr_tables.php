<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hr_empleados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // Si el empleado usa el sistema
            $table->foreignId('sede_id')->constrained('core_sedes')->cascadeOnDelete();
            $table->string('documento', 50)->unique();
            $table->string('nombres', 100);
            $table->string('apellidos', 100);
            $table->string('email', 150)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->string('cargo', 100);
            $table->decimal('salario_base', 15, 2);
            $table->date('fecha_ingreso');
            $table->date('fecha_retiro')->nullable();
            $table->boolean('estado')->default(true); // Activo / Inactivo
            $table->timestamps();
            
            $table->index(['tenant_id', 'estado']);
        });

        Schema::create('hr_asistencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->date('fecha');
            $table->string('tipo', 50)->default('asistencia'); // asistencia, falta, incapacidad, vacaciones
            $table->time('hora_entrada')->nullable();
            $table->time('hora_salida')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->unique(['empleado_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_asistencias');
        Schema::dropIfExists('hr_empleados');
    }
};
