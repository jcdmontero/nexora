<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_stocks', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_stocks', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id');
            }
        });

        // Backfill desde bodega → producto para obtener tenant_id
        DB::statement('
            UPDATE inventory_stocks
            SET tenant_id = (
                SELECT b.tenant_id FROM inventory_bodegas b
                WHERE b.id = inventory_stocks.bodega_id
            )
            WHERE tenant_id IS NULL
        ');

        Schema::table('inventory_stocks', function (Blueprint $table) {
            if (Schema::getColumnType('inventory_stocks', 'tenant_id') === 'integer') {
                $table->foreignId('tenant_id')->nullable(false)->change();
            }
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('tenant_id');
            // Actualizar unique constraint para incluir tenant_id
            $table->dropUnique(['producto_id', 'bodega_id']);
            $table->unique(['tenant_id', 'producto_id', 'bodega_id']);
        });
    }

    public function down(): void
    {
        Schema::table('inventory_stocks', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_stocks', 'tenant_id')) {
                $table->dropForeign(['tenant_id']);
                $table->dropIndex(['tenant_id']);
                $table->dropColumn('tenant_id');
            }
            $table->dropUnique(['tenant_id', 'producto_id', 'bodega_id']);
            $table->unique(['producto_id', 'bodega_id']);
        });
    }
};
