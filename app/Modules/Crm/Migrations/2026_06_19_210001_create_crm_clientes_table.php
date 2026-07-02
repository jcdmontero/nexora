<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_clientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();

            // Tipo de cliente: natural | juridico
            $table->string('tipo', 20)->default('natural');

            // Persona natural
            $table->string('tipo_documento', 20)->nullable(); // CC, CE, PAS...
            $table->string('numero_documento', 40)->nullable();
            $table->string('nombres', 120)->nullable();
            $table->string('apellidos', 120)->nullable();

            // Persona jurídica
            $table->string('razon_social', 200)->nullable();
            $table->string('nit', 40)->nullable();
            $table->string('nombre_contacto', 120)->nullable();
            $table->string('telefono_contacto', 30)->nullable();
            $table->string('cargo_contacto', 100)->nullable();

            // Contacto general
            $table->string('email')->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('direccion')->nullable();
            $table->string('ciudad', 120)->nullable();
            $table->text('notas')->nullable();

            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            // Unique por tenant (corrige el defecto de uniques globales del legacy)
            $table->unique(['tenant_id', 'numero_documento']);
            $table->unique(['tenant_id', 'nit']);
            $table->index(['tenant_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_clientes');
    }
};
