<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pay_nominas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('mes', 7); // ej: 2026-06
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('estado', 50)->default('borrador'); // borrador, liquidada, pagada
            $table->timestamps();
        });

        Schema::create('pay_nomina_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nomina_id')->constrained('pay_nominas')->cascadeOnDelete();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            
            $table->integer('dias_laborados');
            $table->decimal('salario_base', 15, 2);
            $table->decimal('auxilio_transporte', 15, 2)->default(0);
            
            $table->decimal('salud_deduccion', 15, 2)->default(0); // 4%
            $table->decimal('pension_deduccion', 15, 2)->default(0); // 4%
            
            $table->decimal('total_devengos', 15, 2);
            $table->decimal('total_deducciones', 15, 2);
            $table->decimal('neto_pagar', 15, 2);
            $table->timestamps();
        });

        Schema::create('pay_novedades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->foreignId('nomina_id')->nullable()->constrained('pay_nominas')->nullOnDelete(); // si se asocia a una liquidada
            
            $table->string('tipo', 50); // ingreso, descuento
            $table->string('concepto', 150); // Bonificación, Préstamo, Horas Extras...
            $table->decimal('valor', 15, 2);
            $table->date('fecha_registro');
            $table->string('estado', 50)->default('pendiente'); // pendiente, aplicada
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pay_novedades');
        Schema::dropIfExists('pay_nomina_detalles');
        Schema::dropIfExists('pay_nominas');
    }
};
