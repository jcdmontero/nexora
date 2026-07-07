<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // M-02: Agregar unicidad en numero de traslado (consistente con recepciones)
        Schema::table('inventory_traslados', function (Blueprint $table) {
            $table->unique(['tenant_id', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::table('inventory_traslados', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'numero']);
        });
    }
};
