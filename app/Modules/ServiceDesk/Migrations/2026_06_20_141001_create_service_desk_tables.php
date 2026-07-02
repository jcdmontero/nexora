<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sd_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // El solicitante interno
            $table->foreignId('cliente_id')->nullable()->constrained('crm_clientes')->nullOnDelete(); // Si es reclamo de cliente
            $table->foreignId('agente_id')->nullable()->constrained('users')->nullOnDelete(); // El que atiende
            $table->string('asunto', 255);
            $table->text('descripcion');
            $table->string('estado', 50)->default('abierto'); // abierto, en_progreso, resuelto, cerrado
            $table->string('prioridad', 20)->default('media'); // baja, media, alta, critica
            $table->timestamp('fecha_resolucion')->nullable();
            $table->timestamps();
            
            $table->index(['tenant_id', 'estado']);
        });

        Schema::create('sd_mensajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('sd_tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Quién manda el mensaje
            $table->text('mensaje');
            $table->boolean('es_interno')->default(false); // Notas solo para agentes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_mensajes');
        Schema::dropIfExists('sd_tickets');
    }
};
