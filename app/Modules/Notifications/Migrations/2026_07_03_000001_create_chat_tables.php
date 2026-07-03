<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_conversaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('tipo', 20)->default('directo'); // directo | grupo
            $table->string('nombre')->nullable();
            $table->json('participantes')->nullable(); // [user_id, user_id]
            $table->timestamps();

            $table->index('tenant_id');
        });

        Schema::create('chat_mensajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversacion_id')->constrained('chat_conversaciones')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->nullOnDelete();
            $table->text('mensaje');
            $table->string('tipo', 20)->default('texto'); // texto | imagen | archivo
            $table->timestamp('leido_en')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('conversacion_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_mensajes');
        Schema::dropIfExists('chat_conversaciones');
    }
};
