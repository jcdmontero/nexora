<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('core_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            
            $table->string('estado')->default('pendiente'); // pendiente, en_progreso, completada, cancelada
            $table->string('prioridad')->default('media'); // baja, media, alta, urgente
            $table->timestamp('fecha_limite')->nullable();
            $table->string('departamento')->nullable(); // Ventas, Contabilidad, etc.
            
            $table->foreignId('asignado_a')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
            
            $table->nullableMorphs('taskable'); // Para ligarla a una orden, cliente, etc. en el futuro
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indices para rendimiento
            $table->index(['tenant_id', 'estado']);
            $table->index(['tenant_id', 'asignado_a']);
            $table->index(['tenant_id', 'departamento']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('core_tasks');
    }
};
