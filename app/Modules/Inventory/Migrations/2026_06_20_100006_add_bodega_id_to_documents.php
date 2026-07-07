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

        // INV-004: Asignar bodega principal POR TENANTE en vez de global
        $bodegasPrincipales = \Illuminate\Support\Facades\DB::table('inventory_bodegas')
            ->where('es_principal', true)
            ->get()
            ->keyBy('tenant_id');

        foreach ($bodegasPrincipales as $tenantId => $bodega) {
            \Illuminate\Support\Facades\DB::table('inventory_adjustments')
                ->where('tenant_id', $tenantId)
                ->whereNull('bodega_id')
                ->update(['bodega_id' => $bodega->id]);
            \Illuminate\Support\Facades\DB::table('inventory_recepciones')
                ->where('tenant_id', $tenantId)
                ->whereNull('bodega_id')
                ->update(['bodega_id' => $bodega->id]);
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
