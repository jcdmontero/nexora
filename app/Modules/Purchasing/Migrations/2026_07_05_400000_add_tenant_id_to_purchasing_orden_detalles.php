<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchasing_orden_detalles', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id');
        });

        // Backfill desde la orden padre
        DB::statement('
            UPDATE purchasing_orden_detalles
            SET tenant_id = (
                SELECT o.tenant_id
                FROM purchasing_ordenes o
                WHERE o.id = purchasing_orden_detalles.orden_compra_id
            )
            WHERE tenant_id IS NULL
        ');

        Schema::table('purchasing_orden_detalles', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('purchasing_orden_detalles', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
