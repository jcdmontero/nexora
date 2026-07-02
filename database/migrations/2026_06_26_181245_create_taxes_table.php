<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('codigo', 20)->unique(); // Ej: IVA, ReteFuente, ICA
            $table->string('nombre'); // Ej: Impuesto al Valor Agregado
            $table->decimal('porcentaje', 5, 2)->default(0);
            $table->string('tipo')->default('generado'); // generado, descontable, retencion
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'codigo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxes');
    }
};
