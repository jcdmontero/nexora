<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Departamentos
        Schema::create('hr_departamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'nombre']);
        });

        // 2. Cargos (posiciones laborales)
        Schema::create('hr_cargos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('departamento_id')->constrained('hr_departamentos')->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->string('categoria_laboral', 50)->default('Operativo'); // Administrativo, Operativo, Comercial
            $table->decimal('salario_base_sugerido', 15, 2)->nullable();
            $table->boolean('es_productivo')->default(false); // true = puede ser técnico en ServiceDesk
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'nombre']);
        });

        // 3. Agregar cargo_id a hr_contratos (nullable para migración gradual)
        Schema::table('hr_contratos', function (Blueprint $table) {
            $table->foreignId('cargo_id')->nullable()->after('empleado_id')->constrained('hr_cargos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('hr_contratos', function (Blueprint $table) {
            $table->dropForeign(['cargo_id']);
            $table->dropColumn('cargo_id');
        });
        Schema::dropIfExists('hr_cargos');
        Schema::dropIfExists('hr_departamentos');
    }
};
