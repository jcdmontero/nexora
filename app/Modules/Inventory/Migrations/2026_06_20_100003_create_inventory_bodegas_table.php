<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_bodegas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre');
            $table->string('direccion')->nullable();
            $table->boolean('es_principal')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('inventory_productos')->cascadeOnDelete();
            $table->foreignId('bodega_id')->constrained('inventory_bodegas')->cascadeOnDelete();
            $table->decimal('cantidad', 15, 4)->default(0);
            $table->timestamps();

            $table->unique(['producto_id', 'bodega_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_stocks');
        Schema::dropIfExists('inventory_bodegas');
    }
};
