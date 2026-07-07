<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // M-08: Eliminar 'borrador' del enum — nunca es alcanzable porque
        // registrarAsiento() siempre crea con estado='contabilizado'.
        if (DB::getDriverName() === 'pgsql') {
            // PostgreSQL: cambiar el enum directamente
            DB::statement("ALTER TABLE asientos_contables ALTER COLUMN estado TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE asientos_contables DROP CONSTRAINT IF EXISTS asientos_contables_estado_check");
            DB::statement("ALTER TABLE asientos_contables ADD CONSTRAINT asientos_contables_estado_check CHECK (estado IN ('contabilizado', 'reversado'))");
            DB::statement("ALTER TABLE asientos_contables ALTER COLUMN estado SET DEFAULT 'contabilizado'");
        }
        // En SQLite, los enums son strings — no hay constraint que cambiar.
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE asientos_contables ALTER COLUMN estado TYPE VARCHAR(20)");
            DB::statement("ALTER TABLE asientos_contables DROP CONSTRAINT IF EXISTS asientos_contables_estado_check");
            DB::statement("ALTER TABLE asientos_contables ADD CONSTRAINT asientos_contables_estado_check CHECK (estado IN ('borrador', 'contabilizado', 'reversado'))");
            DB::statement("ALTER TABLE asientos_contables ALTER COLUMN estado SET DEFAULT 'contabilizado'");
        }
    }
};
