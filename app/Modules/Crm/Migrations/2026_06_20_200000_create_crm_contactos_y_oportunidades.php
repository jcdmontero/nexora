<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_contactos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('crm_clientes')->cascadeOnDelete();
            
            $table->string('nombre', 150);
            $table->string('cargo', 100)->nullable();
            $table->string('email', 150)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->boolean('is_principal')->default(false);
            
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('crm_oportunidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('crm_clientes')->cascadeOnDelete();
            
            $table->string('titulo', 150);
            $table->decimal('valor_estimado', 15, 2)->default(0);
            
            // Etapas: prospecto, calificado, propuesta, negociacion, ganado, perdido
            $table->string('etapa', 50)->default('prospecto');
            
            $table->date('fecha_cierre_esperada')->nullable();
            $table->integer('probabilidad')->default(10); // 0 a 100
            
            $table->text('notas')->nullable();
            
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'etapa']);
            $table->index('cliente_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_oportunidades');
        Schema::dropIfExists('crm_contactos');
    }
};
