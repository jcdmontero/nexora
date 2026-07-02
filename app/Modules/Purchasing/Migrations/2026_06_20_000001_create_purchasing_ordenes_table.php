<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchasing_ordenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('proveedor_id')->constrained('purchasing_proveedores');
            $table->string('numero', 50);
            $table->string('estado', 20)->default('borrador'); // borrador, enviada, recibida, cancelada
            $table->date('fecha_emision');
            $table->date('fecha_esperada')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('impuestos', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchasing_ordenes');
    }
};
