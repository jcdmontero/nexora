<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Fix sales_facturas: Replace global unique with tenant-scoped unique
        Schema::table('sales_facturas', function (Blueprint $table) {
            // Drop global unique index on numero
            $table->dropUnique(['numero']);
            // Add tenant-scoped unique constraint
            $table->unique(['tenant_id', 'numero']);
            // Add composite index for reports (estado + created_at)
            $table->index(['tenant_id', 'estado', 'created_at']);
            // Add index for client queries
            $table->index(['tenant_id', 'cliente_id']);
        });

        // 2. Fix sd_ordenes: Add missing composite indexes
        Schema::table('sd_ordenes', function (Blueprint $table) {
            // Add index for technician workload queries
            $table->index(['tenant_id', 'prestador_id']);
            // Add composite for status + date range queries
            $table->index(['tenant_id', 'estado', 'created_at']);
        });

        // 3. Fix inventory_adjustments: Add composite for Kardex
        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->index(['tenant_id', 'producto_id', 'created_at']);
        });

        // 4. Fix cash_caja_sesiones: Add missing indexes
        Schema::table('cash_caja_sesiones', function (Blueprint $table) {
            $table->index(['tenant_id', 'user_id']);
            $table->index(['tenant_id', 'fecha_apertura']);
        });

        // 5. Fix hr_empleados: Add location index
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->index(['tenant_id', 'sede_id']);
        });

        // 6. Fix taxes: Replace global unique with tenant-scoped
        Schema::table('taxes', function (Blueprint $table) {
            $table->dropUnique(['codigo']);
            $table->unique(['tenant_id', 'codigo']);
        });

        // 7. Fix hr_empleados: Replace global unique documento with tenant-scoped
        Schema::table('hr_empleados', function (Blueprint $table) {
            // Drop global unique if exists
            $table->dropUnique(['documento']);
            // Add tenant-scoped unique
            $table->unique(['tenant_id', 'documento']);
        });

        // 8. Add full-text search indexes using pg_trgm (PostgreSQL only)
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin(name gin_trgm_ops)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_clientes_nombres_trgm ON crm_clientes USING gin(nombres gin_trgm_ops)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_productos_nombre_trgm ON inventory_productos USING gin(nombre gin_trgm_ops)');
            DB::statement('CREATE INDEX IF NOT EXISTS idx_facturas_numero_trgm ON sales_facturas USING gin(numero gin_trgm_ops)');
        }

        // Jobs and cache indexes are already created in standard Laravel migrations.
    }

    public function down(): void
    {
        // Rollback changes in reverse order

        // No-op for jobs and cache indexes.

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS idx_users_name_trgm');
            DB::statement('DROP INDEX IF EXISTS idx_clientes_nombres_trgm');
            DB::statement('DROP INDEX IF EXISTS idx_productos_nombre_trgm');
            DB::statement('DROP INDEX IF EXISTS idx_facturas_numero_trgm');
        }

        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'documento']);
            $table->unique(['documento']);
        });

        Schema::table('taxes', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'codigo']);
            $table->unique(['codigo']);
        });

        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'sede_id']);
        });

        Schema::table('cash_caja_sesiones', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'user_id']);
            $table->dropIndex(['tenant_id', 'fecha_apertura']);
        });

        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'producto_id', 'created_at']);
        });

        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'prestador_id']);
            $table->dropIndex(['tenant_id', 'estado', 'created_at']);
        });

        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'cliente_id']);
            $table->dropIndex(['tenant_id', 'estado', 'created_at']);
            $table->dropUnique(['tenant_id', 'numero']);
            $table->unique(['numero']);
        });
    }
};
