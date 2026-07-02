<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla de actividades/intervenciones realizadas por técnicos dentro de una OT.
     *
     * Permite registrar tiempo real, costos y comisiones por cada actividad
     * (diagnóstico, revisión, reparación, pruebas, etc.) independientemente
     * del resultado de la orden.
     *
     * Ejemplo: un técnico invierte 2h intentando destapar un cabezal.
     * Aunque no se recupere, esa actividad tiene costo y genera comisión.
     */
    public function up(): void
    {
        Schema::create('sd_orden_actividades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->foreignId('prestador_id')->nullable()->constrained('sd_prestadores')->nullOnDelete();
            $table->foreignId('servicio_id')->nullable()->constrained('sd_servicios')->nullOnDelete();

            // Resultado de la actividad
            $table->string('resultado', 30)->default('exitoso'); // exitoso, fallido, pendiente

            // Tiempo y costos
            $table->decimal('horas_invertidas', 8, 2)->default(0);
            $table->decimal('costo_hora', 15, 2)->default(0);
            $table->decimal('costo_total', 15, 2)->default(0); // horas × costo_hora

            // Comisión por actividad
            $table->string('comision_tipo', 20)->nullable(); // FIJO, PORCENTAJE, LIBRE
            $table->decimal('comision_valor', 15, 2)->default(0);

            // Descripción detallada
            $table->text('descripcion')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'orden_id']);
            $table->index(['tenant_id', 'prestador_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_orden_actividades');
    }
};
