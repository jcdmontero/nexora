<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Préstamos a empleados
        Schema::create('hr_prestamos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->decimal('monto_total', 15, 2);
            $table->integer('cuotas_pactadas');
            $table->decimal('monto_cuota', 15, 2);
            $table->decimal('saldo_pendiente', 15, 2);
            $table->date('fecha_prestamo');
            $table->string('estado', 30)->default('ACTIVO'); // ACTIVO, PAGADO, ANULADO
            $table->text('observaciones')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['empleado_id', 'estado']);
        });

        // Cuotas de préstamos
        Schema::create('hr_prestamo_cuotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prestamo_id')->constrained('hr_prestamos')->cascadeOnDelete();
            $table->integer('numero_cuota');
            $table->decimal('monto', 15, 2);
            $table->date('fecha_vencimiento');
            $table->string('estado', 30)->default('PENDIENTE'); // PENDIENTE, PAGADA
            $table->foreignId('nomina_id')->nullable()->index();
            $table->timestamps();

            $table->index(['prestamo_id', 'estado']);
        });

        // Incapacidades y licencias
        Schema::create('hr_incapacidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->string('tipo', 50); // ENFERMEDAD_GENERAL, LABORAL, MATERNIDAD, LICENCIA
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->integer('dias');
            $table->decimal('porcentaje_pago', 5, 2)->default(0);
            $table->text('observaciones')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['empleado_id', 'fecha_inicio', 'fecha_fin']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_incapacidades');
        Schema::dropIfExists('hr_prestamo_cuotas');
        Schema::dropIfExists('hr_prestamos');
    }
};
