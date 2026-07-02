<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_recibos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('numero', 30);
            $table->timestamp('fecha')->useCurrent();
            $table->foreignId('sesion_id')->constrained('cash_caja_sesiones')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('crm_clientes')->nullOnDelete();
            $table->nullableMorphs('referencia');
            $table->string('concepto', 255);
            $table->decimal('monto', 15, 2);
            $table->string('metodo_pago', 50)->default('efectivo');
            $table->string('estado', 20)->default('activo');
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'numero'], 'recibos_numero_idx');
            $table->index(['tenant_id', 'referencia_type', 'referencia_id'], 'recibos_referencia_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_recibos');
    }
};
