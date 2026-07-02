<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega prestador_id a sd_ordenes (reemplazando conceptualmente a tecnico_id->users)
     * y crea el subsistema de liquidación de comisiones.
     *
     * NOTA: tecnico_id (FK a users) se conserva como nullable para no romper
     * datos existentes. El nuevo campo prestador_id es el que se usa en adelante.
     * En una migración futura se podrá dropear tecnico_id.
     */
    public function up(): void
    {
        // ─── sd_ordenes: agregar prestador_id ───
        Schema::table('sd_ordenes', function (Blueprint $table) {
            // Hacer tecnico_id un simple entero (quitar FK) para no bloquear
            $table->dropForeign(['tecnico_id']);
            $table->foreignId('tecnico_id')->nullable()->change(); // queda como integer nullable sin FK

            // Nuevo campo apuntando a prestadores
            $table->foreignId('prestador_id')->nullable()->after('tecnico_id')
                ->constrained('sd_prestadores')->nullOnDelete();
        });

        // ─── Liquidaciones de comisiones ───
        Schema::create('sd_comisiones_liquidaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('codigo', 30); // LIQ-00001
            $table->foreignId('prestador_id')->constrained('sd_prestadores')->cascadeOnDelete();
            $table->date('periodo_inicio');
            $table->date('periodo_fin');
            $table->decimal('total_comisiones', 15, 2)->default(0);
            $table->string('estado', 30)->default('BORRADOR'); // BORRADOR, APROBADO, PAGADO, ANULADO
            $table->text('observaciones')->nullable();
            $table->foreignId('aprobado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('fecha_aprobacion')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'codigo']);
            $table->index(['tenant_id', 'prestador_id', 'estado']);
        });

        // ─── Detalles de liquidación ───
        Schema::create('sd_comisiones_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('liquidacion_id')->constrained('sd_comisiones_liquidaciones')->cascadeOnDelete();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->foreignId('servicio_id')->nullable()->constrained('sd_servicios')->nullOnDelete();
            $table->string('concepto', 200);
            $table->decimal('base_calculo', 15, 2); // Precio del servicio
            $table->decimal('porcentaje_comision', 5, 2)->nullable();
            $table->decimal('valor_comision', 15, 2);
            $table->timestamps();
        });

        // ─── Cuentas por pagar a prestadores (registro contable simple) ───
        Schema::create('sd_comisiones_pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('liquidacion_id')->constrained('sd_comisiones_liquidaciones')->cascadeOnDelete();
            $table->foreignId('prestador_id')->constrained('sd_prestadores')->cascadeOnDelete();
            $table->decimal('monto', 15, 2);
            $table->string('metodo_pago', 50)->nullable(); // efectivo, transferencia, etc.
            $table->string('referencia_pago', 100)->nullable();
            $table->timestamp('fecha_pago')->nullable();
            $table->string('estado', 30)->default('PENDIENTE'); // PENDIENTE, PAGADO
            $table->timestamps();

            $table->index(['tenant_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_comisiones_pagos');
        Schema::dropIfExists('sd_comisiones_detalles');
        Schema::dropIfExists('sd_comisiones_liquidaciones');

        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropForeign(['prestador_id']);
            $table->dropColumn('prestador_id');

            // Restaurar FK original
            $table->foreignId('tecnico_id')->nullable()->change();
            $table->foreign('tecnico_id')->references('id')->on('users')->nullOnDelete();
        });
    }
};
