<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Servicios (mano de obra) por tipo de equipo
        Schema::create('sd_servicios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('nombre', 150);
            $table->string('codigo', 50)->nullable();
            $table->text('descripcion')->nullable();
            $table->decimal('precio_base', 15, 2)->default(0);
            $table->decimal('costo_tecnico_base', 15, 2)->default(0);
            $table->string('tipo_comision_tecnico', 20)->default('fijo'); // fijo | porcentaje
            $table->integer('tiempo_estimado')->nullable(); // minutos
            $table->boolean('requiere_repuestos')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'tipo_equipo_id']);
        });

        // Fallas base (catálogo de fallas comunes por tipo de equipo)
        Schema::create('sd_fallas_base', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->text('solucion_sugerida')->nullable();
            $table->integer('tiempo_estimado')->nullable(); // minutos
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'tipo_equipo_id']);
        });

        // Checklist de recepción: fallas y accesorios que se activan por tipo de equipo
        Schema::create('sd_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('categoria', 20); // fallas | accesorios
            $table->string('subtipo', 50)->nullable();
            $table->string('nombre', 150);
            $table->string('icono', 50)->nullable();
            $table->text('descripcion')->nullable();
            $table->integer('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'tipo_equipo_id', 'categoria']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_checklist_items');
        Schema::dropIfExists('sd_fallas_base');
        Schema::dropIfExists('sd_servicios');
    }
};
