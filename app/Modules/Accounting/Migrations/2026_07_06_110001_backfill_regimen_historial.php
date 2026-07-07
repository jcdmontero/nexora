<?php

use App\Core\Models\Configuracion;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // A-04: Sembrar el historial de régimen para tenants existentes
        // basándose en la configuración actual
        $tenants = DB::table('tenants')->where('is_active', true)->get();

        foreach ($tenants as $tenant) {
            $regimen = Configuracion::get('regimen_fiscal', 'simplificado', $tenant->id);
            $fechaCambio = Configuracion::get('fecha_cambio_regimen', null, $tenant->id);

            if ($regimen === 'comun' && $fechaCambio) {
                // Tenant que pasó de simplificado a común
                DB::table('tenant_regimen_historial')->insert([
                    'tenant_id' => $tenant->id,
                    'regimen' => 'simplificado',
                    'fecha_vigente_desde' => '2020-01-01',
                    'fecha_vigente_hasta' => now()->subDay()->toDateString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                DB::table('tenant_regimen_historial')->insert([
                    'tenant_id' => $tenant->id,
                    'regimen' => 'comun',
                    'fecha_vigente_desde' => $fechaCambio,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                // Tenant en simplificado (default)
                DB::table('tenant_regimen_historial')->insert([
                    'tenant_id' => $tenant->id,
                    'regimen' => 'simplificado',
                    'fecha_vigente_desde' => '2020-01-01',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('tenant_regimen_historial')->delete();
    }
};
