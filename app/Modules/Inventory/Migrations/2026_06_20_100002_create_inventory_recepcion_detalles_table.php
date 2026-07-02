<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_recepcion_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recepcion_id')->constrained('inventory_recepciones')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos');
            $table->decimal('cantidad', 10, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_recepcion_detalles');
    }
};
