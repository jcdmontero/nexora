<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_regimen_historial', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('regimen', 20); // 'simplificado' o 'comun'
            $table->date('fecha_vigente_desde');
            $table->date('fecha_vigente_hasta')->nullable();
            $table->foreignId('cambiado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->text('motivo')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'fecha_vigente_desde']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_regimen_historial');
    }
};
