<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sd_tickets', function (Blueprint $table) {
            $table->string('tipo', 50)->default('orden_trabajo')->after('agente_id'); // orden_trabajo, garantia
            $table->string('equipo_descripcion', 255)->nullable()->after('asunto');
            $table->decimal('costo_estimado', 12, 2)->nullable()->after('prioridad');
        });
    }

    public function down(): void
    {
        Schema::table('sd_tickets', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'equipo_descripcion', 'costo_estimado']);
        });
    }
};
