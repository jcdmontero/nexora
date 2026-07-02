<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tipo de equipo: la raíz del catálogo del taller (Celular, Computador, etc.)
        Schema::create('sd_tipos_equipo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre', 120);
            $table->string('slug', 120)->nullable();
            $table->string('familia', 120)->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'nombre']);
        });

        // Marcas (Samsung, Apple, HP, ...)
        Schema::create('sd_marcas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre', 120);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'nombre']);
        });

        // Modelos (iPhone 13, Galaxy A52, ...) → cuelgan de marca y tipo de equipo
        Schema::create('sd_modelos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('sd_marcas')->nullOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('nombre', 150);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'marca_id']);
            $table->index(['tenant_id', 'tipo_equipo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_modelos');
        Schema::dropIfExists('sd_marcas');
        Schema::dropIfExists('sd_tipos_equipo');
    }
};
