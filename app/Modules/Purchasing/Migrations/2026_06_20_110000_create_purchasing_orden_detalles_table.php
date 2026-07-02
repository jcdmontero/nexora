<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchasing_orden_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_compra_id')->constrained('purchasing_ordenes')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos');
            $table->decimal('cantidad', 10, 4);
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchasing_orden_detalles');
    }
};
