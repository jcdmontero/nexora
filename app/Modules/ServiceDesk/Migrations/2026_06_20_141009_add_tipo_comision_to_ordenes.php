<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega el tipo de comisión a nivel de orden (OT) y simplifica
     * el detalle de liquidación para que sea por orden, no por servicio.
     *
     * NOTA DE DISEÑO:
     * En Nexora, cada orden tiene su propio tipo de comisión (FIJO/PORCENTAJE/LIBRE),
     * reflejando la realidad del taller donde el técnico acuerda un pago por la
     * orden completa, no por servicio individual.
     *
     * - FIJO: el técnico cobra un monto fijo acordado (ej: $60,000).
     *         No sabe ni le importa cuánto paga el cliente.
     * - PORCENTAJE: el técnico recibe un % del valor total de la orden.
     * - LIBRE: en la liquidación se asigna manualmente el valor.
     */
    public function up(): void
    {
        // ─── sd_ordenes: campos de comisión ───
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->string('tipo_comision', 20)->default('FIJO')->after('prestador_id'); // FIJO, PORCENTAJE, LIBRE
            $table->decimal('valor_comision_fijo', 15, 2)->nullable()->after('tipo_comision');
            $table->decimal('porcentaje_comision', 5, 2)->nullable()->after('valor_comision_fijo');
        });

        // ─── sd_comisiones_detalles: simplificar a nivel de orden ───
        Schema::table('sd_comisiones_detalles', function (Blueprint $table) {
            $table->dropForeign(['servicio_id']);
            $table->dropColumn('servicio_id');
            $table->string('tipo_comision', 20)->nullable()->after('orden_id'); // FIJO, PORCENTAJE, LIBRE
        });
    }

    public function down(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropColumn(['tipo_comision', 'valor_comision_fijo', 'porcentaje_comision']);
        });

        Schema::table('sd_comisiones_detalles', function (Blueprint $table) {
            $table->dropColumn('tipo_comision');
            $table->foreignId('servicio_id')->nullable()->constrained('sd_servicios')->nullOnDelete();
        });
    }
};
