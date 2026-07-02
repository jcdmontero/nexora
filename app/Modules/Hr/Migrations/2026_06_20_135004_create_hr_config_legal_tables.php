<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Configuración legal anual (SMMLV, UVT, aportes)
        Schema::create('hr_configuracion_legal', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->integer('ano_vigencia');
            $table->unique(['tenant_id', 'ano_vigencia']);
            $table->decimal('salario_minimo', 15, 2);
            $table->decimal('auxilio_transporte', 15, 2);
            $table->decimal('tope_auxilio_transporte_salarios', 5, 2)->default(2);
            $table->decimal('valor_uvt', 15, 2);
            $table->integer('horas_semanales')->default(46);
            $table->decimal('aporte_salud_empleado', 5, 2)->default(4);
            $table->decimal('aporte_pension_empleado', 5, 2)->default(4);
            $table->decimal('aporte_salud_patronal', 5, 2)->default(8.5);
            $table->decimal('aporte_pension_patronal', 5, 2)->default(12);
            $table->decimal('caja_compensacion', 5, 2)->default(4);
            $table->decimal('sena', 5, 2)->default(2);
            $table->decimal('icbf', 5, 2)->default(3);
            $table->timestamps();
        });

        // Entidades parafiscales (EPS, AFP, ARL, CCF)
        Schema::create('hr_entidades_parafiscales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('tipo_entidad', 20); // EPS, AFP, ARL, CCF
            $table->string('nombre', 200);
            $table->string('nit', 50)->nullable();
            $table->string('codigo_pila', 50)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'tipo_entidad']);
        });

        // Afiliaciones de empleados a entidades
        Schema::create('hr_afiliaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->foreignId('entidad_id')->constrained('hr_entidades_parafiscales')->cascadeOnDelete();
            $table->date('fecha_afiliacion');
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['empleado_id', 'entidad_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hr_afiliaciones');
        Schema::dropIfExists('hr_entidades_parafiscales');
        Schema::dropIfExists('hr_configuracion_legal');
    }
};
