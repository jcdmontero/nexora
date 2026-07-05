<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // For each existing tenant, create a default "Bodega Principal"
        $tenants = DB::table('tenants')->get();

        foreach ($tenants as $tenant) {
            $bodegaId = DB::table('inventory_bodegas')->insertGetId([
                'tenant_id' => $tenant->id,
                'nombre' => 'Bodega Principal',
                'direccion' => 'Sede Principal',
                'es_principal' => true,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Move all existing stock for this tenant into this bodega
            $productos = DB::table('inventory_productos')
                ->where('tenant_id', $tenant->id)
                ->get();

            foreach ($productos as $producto) {
                // Insert into inventory_stocks
                DB::table('inventory_stocks')->insert([
                    'producto_id' => $producto->id,
                    'bodega_id' => $bodegaId,
                    'cantidad' => $producto->stock_actual,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Data migration — no-op to avoid destroying user data.
        // up() only inserts initial records; truncate() in down()
        // would wipe records added later by business logic.
    }
};
