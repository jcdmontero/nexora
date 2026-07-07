<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_traslados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bodega_origen_id')->constrained('inventory_bodegas');
            $table->foreignId('bodega_destino_id')->constrained('inventory_bodegas');
            $table->string('numero', 50);
            $table->date('fecha');
            $table->string('estado', 20)->default('borrador'); // borrador, transito, completado
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inventory_traslado_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('traslado_id')->constrained('inventory_traslados')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos');
            $table->decimal('cantidad', 10, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_traslado_detalles');
        Schema::dropIfExists('inventory_traslados');
    }
};
