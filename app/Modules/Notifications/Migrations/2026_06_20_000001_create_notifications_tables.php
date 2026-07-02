<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Plantillas de mensajes por evento (con variables {placeholder})
        Schema::create('notif_plantillas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('evento', 50);
            $table->string('nombre', 120);
            $table->string('asunto', 200)->nullable();
            $table->text('contenido');
            $table->json('canales')->nullable();   // ['email','whatsapp','telegram'] activos por defecto
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'evento']);
        });

        // Bandeja / historial de notificaciones enviadas
        Schema::create('notif_notificaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('evento', 50);
            $table->nullableMorphs('referencia'); // referencia_type / referencia_id (ej. orden)
            $table->foreignId('cliente_id')->nullable();
            $table->string('destinatario_nombre', 150)->nullable();
            $table->string('destinatario_email', 150)->nullable();
            $table->string('destinatario_telefono', 40)->nullable();
            $table->string('titulo', 200)->nullable();
            $table->text('mensaje');
            $table->json('canales');               // canales solicitados
            $table->json('canal_estados')->nullable(); // {email:'enviada', whatsapp:'pendiente', ...}
            $table->string('estado', 20)->default('pendiente'); // pendiente | enviada | parcial | error
            $table->text('error')->nullable();
            $table->foreignId('enviado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('fecha_envio')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'estado']);
            $table->index(['tenant_id', 'evento']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notif_notificaciones');
        Schema::dropIfExists('notif_plantillas');
    }
};
