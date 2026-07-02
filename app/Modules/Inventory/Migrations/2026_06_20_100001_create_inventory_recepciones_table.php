<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_recepciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('orden_compra_id')->nullable(); // Soft reference to purchasing_ordenes
            $table->string('numero', 50); // Número de albarán o recepción interno
            $table->date('fecha');
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_recepciones');
    }
};
