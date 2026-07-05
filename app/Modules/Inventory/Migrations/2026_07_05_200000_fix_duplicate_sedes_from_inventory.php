<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // La migración 130351 creó una sede por cada bodega sin verificar
        // si ya existían sedes reales. Eliminar las sedes duplicadas que
        // fueron creadas por esa migración y reasignar las bodegas a las
        // sedes reales del mismo tenant cuando coincidan por nombre.

        // 1. Para cada tenant, encontrar sedes que coincidan por nombre
        //    entre las creadas por la migración y las sedes "reales"
        $bodegas = DB::table('inventory_bodegas')
            ->whereNotNull('sede_id')
            ->get();

        foreach ($bodegas as $bodega) {
            // Buscar si existe otra sede en el mismo tenant con el mismo nombre
            $duplicada = DB::table('core_sedes')
                ->where('tenant_id', $bodega->tenant_id)
                ->where('nombre', $bodega->nombre)
                ->where('id', '!=', $bodega->sede_id)
                ->first();

            if ($duplicada) {
                // Reasignar la bodega a la sede "real" existente
                DB::table('inventory_bodegas')
                    ->where('id', $bodega->id)
                    ->update(['sede_id' => $duplicada->id]);

                // Eliminar la sede duplicada
                DB::table('core_sedes')
                    ->where('id', $bodega->sede_id)
                    ->delete();
            }
        }
    }

    public function down(): void
    {
        // No reversible — las sedes duplicadas eliminadas no se pueden restaurar
    }
};
