<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_cajas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sede_id')->nullable()->constrained('core_sedes')->nullOnDelete();
            $table->string('nombre', 100);
            $table->boolean('activa')->default(true);
            $table->timestamps();
            
            $table->index(['tenant_id', 'sede_id']);
        });

        Schema::create('cash_caja_sesiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('caja_id')->constrained('cash_cajas')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // El cajero
            $table->timestamp('fecha_apertura')->useCurrent();
            $table->decimal('saldo_inicial', 15, 2)->default(0);
            $table->timestamp('fecha_cierre')->nullable();
            $table->decimal('saldo_final', 15, 2)->nullable();
            $table->decimal('diferencia', 15, 2)->nullable(); // Faltante o sobrante
            $table->string('estado', 20)->default('abierta'); // abierta, cerrada
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'caja_id', 'estado']);
        });

        Schema::create('cash_movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sesion_id')->constrained('cash_caja_sesiones')->cascadeOnDelete();
            $table->string('tipo', 20); // ingreso, egreso
            $table->decimal('monto', 15, 2);
            $table->string('metodo_pago', 50)->default('efectivo'); // efectivo, tarjeta, transferencia
            $table->string('concepto', 255);
            $table->nullableMorphs('referencia'); // Por si se asocia a una Factura (sales_facturas)
            $table->timestamps();

            $table->index(['tenant_id', 'sesion_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movimientos');
        Schema::dropIfExists('cash_caja_sesiones');
        Schema::dropIfExists('cash_cajas');
    }
};
