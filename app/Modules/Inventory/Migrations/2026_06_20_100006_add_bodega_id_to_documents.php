<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable()->constrained('inventory_bodegas');
        });

        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable()->constrained('inventory_bodegas');
        });

        // Set default bodega to existing records
        $defaultBodega = \Illuminate\Support\Facades\DB::table('inventory_bodegas')->where('es_principal', true)->first();
        if ($defaultBodega) {
            \Illuminate\Support\Facades\DB::table('inventory_adjustments')->update(['bodega_id' => $defaultBodega->id]);
            \Illuminate\Support\Facades\DB::table('inventory_recepciones')->update(['bodega_id' => $defaultBodega->id]);
        }

        // Make columns required
        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable(false)->change();
        });

        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->dropForeign(['bodega_id']);
            $table->dropColumn('bodega_id');
        });

        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->dropForeign(['bodega_id']);
            $table->dropColumn('bodega_id');
        });
    }
};
