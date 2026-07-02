<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inventory_bodegas', function (Blueprint $table) {
            $table->foreignId('sede_id')->nullable()->constrained('core_sedes')->nullOnDelete();
        });

        // Data migration: convertir las bodegas actuales en sedes y enlazarlas
        $bodegas = DB::table('inventory_bodegas')->get();
        foreach ($bodegas as $bodega) {
            $sedeId = DB::table('core_sedes')->insertGetId([
                'tenant_id' => $bodega->tenant_id,
                'nombre' => $bodega->nombre,
                'direccion' => $bodega->direccion,
                'es_principal' => $bodega->es_principal,
                'activo' => $bodega->activo,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('inventory_bodegas')
                ->where('id', $bodega->id)
                ->update(['sede_id' => $sedeId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_bodegas', function (Blueprint $table) {
            $table->dropForeign(['sede_id']);
            $table->dropColumn('sede_id');
        });
    }
};
