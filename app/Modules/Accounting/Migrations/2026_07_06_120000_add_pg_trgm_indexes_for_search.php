<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // A-12: Habilitar extensión pg_trgm para búsquedas con comodín inicial
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        // Índices GIN en columnas de cuentas_contables
        DB::statement('CREATE INDEX IF NOT EXISTS idx_cuentas_codigo_trgm ON cuentas_contables USING gin (codigo gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_cuentas_nombre_trgm ON cuentas_contables USING gin (nombre gin_trgm_ops)');

        // Índices GIN en columnas de asientos_contables
        DB::statement('CREATE INDEX IF NOT EXISTS idx_asientos_concepto_trgm ON asientos_contables USING gin (concepto gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_asientos_tercero_nombre_trgm ON asientos_contables USING gin (tercero_nombre gin_trgm_ops)');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_asientos_modulo_origen_trgm ON asientos_contables USING gin (modulo_origen gin_trgm_ops)');

        // B-01: Índice B-tree estándar en modulo_origen para WHERE/whereIn
        DB::statement('CREATE INDEX IF NOT EXISTS idx_asientos_modulo_origen ON asientos_contables (modulo_origen)');
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP INDEX IF EXISTS idx_cuentas_codigo_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_cuentas_nombre_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_asientos_concepto_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_asientos_tercero_nombre_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_asientos_modulo_origen_trgm');
        DB::statement('DROP INDEX IF EXISTS idx_asientos_modulo_origen');
    }
};
