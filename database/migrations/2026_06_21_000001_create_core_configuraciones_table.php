<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('core_configuraciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('categoria', 40)->default('general');
            $table->string('clave', 80);
            $table->text('valor')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'clave']);
            $table->index(['tenant_id', 'categoria']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('core_configuraciones');
    }
};
