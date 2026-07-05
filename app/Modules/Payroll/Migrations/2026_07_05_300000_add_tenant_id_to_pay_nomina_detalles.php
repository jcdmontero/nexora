<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pay_nomina_detalles', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id');
        });

        // Backfill tenant_id desde la nómina padre
        DB::statement('
            UPDATE pay_nomina_detalles
            SET tenant_id = (
                SELECT n.tenant_id
                FROM pay_nominas n
                WHERE n.id = pay_nomina_detalles.nomina_id
            )
            WHERE tenant_id IS NULL
        ');

        Schema::table('pay_nomina_detalles', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('pay_nomina_detalles', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
