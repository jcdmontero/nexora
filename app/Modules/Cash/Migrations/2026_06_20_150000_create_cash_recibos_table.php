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
            $table->string('numero', 50);
            $table->timestamp('fecha');
            $table->foreignId('sesion_id')->constrained('cash_caja_sesiones')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('crm_clientes')->nullOnDelete();
            $table->nullableMorphs('referencia');
            $table->string('concepto', 255);
            $table->decimal('monto', 15, 2);
            $table->string('metodo_pago', 50)->default('efectivo');
            $table->string('estado', 20)->default('activo'); // activo, anulado
            $table->text('notas')->nullable();
            
            // Auditable fields
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();

            $table->index(['tenant_id', 'sesion_id']);
            $table->index(['tenant_id', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_recibos');
    }
};
