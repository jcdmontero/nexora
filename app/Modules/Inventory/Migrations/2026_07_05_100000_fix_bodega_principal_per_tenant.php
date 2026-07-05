<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix #6: La migración original 100006 asignaba la primera bodega principal
        // global a TODOS los registros. Corregir para que cada tenant tenga su propia
        // bodega principal asignada.

        $tenants = DB::table('tenants')->get();

        foreach ($tenants as $tenant) {
            $bodegaPrincipal = DB::table('inventory_bodegas')
                ->where('tenant_id', $tenant->id)
                ->where('es_principal', true)
                ->first();

            if ($bodegaPrincipal) {
                // Corregir ajustes de este tenant que apuntan a una bodega de otro tenant
                DB::table('inventory_adjustments')
                    ->where('tenant_id', $tenant->id)
                    ->whereNotIn('bodega_id', function ($q) use ($tenant) {
                        $q->select('id')
                            ->from('inventory_bodegas')
                            ->where('tenant_id', $tenant->id);
                    })
                    ->update(['bodega_id' => $bodegaPrincipal->id]);

                // Corregir recepciones de este tenant
                DB::table('inventory_recepciones')
                    ->where('tenant_id', $tenant->id)
                    ->whereNotIn('bodega_id', function ($q) use ($tenant) {
                        $q->select('id')
                            ->from('inventory_bodegas')
                            ->where('tenant_id', $tenant->id);
                    })
                    ->update(['bodega_id' => $bodegaPrincipal->id]);
            }
        }
    }

    public function down(): void
    {
        // No reversible - data correction only
    }
};
