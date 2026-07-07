<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pay_novedades', function (Blueprint $table) {
            if (!Schema::hasColumn('pay_novedades', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id');
            }
        });

        // Backfill desde la relación empleado
        DB::statement('
            UPDATE pay_novedades
            SET tenant_id = (
                SELECT tenant_id FROM hr_empleados
                WHERE hr_empleados.id = pay_novedades.empleado_id
            )
            WHERE tenant_id IS NULL
        ');

        Schema::table('pay_novedades', function (Blueprint $table) {
            if (Schema::getColumnType('pay_novedades', 'tenant_id') === 'integer') {
                $table->foreignId('tenant_id')->nullable(false)->change();
            }
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('pay_novedades', function (Blueprint $table) {
            if (Schema::hasColumn('pay_novedades', 'tenant_id')) {
                $table->dropForeign(['tenant_id']);
                $table->dropIndex(['tenant_id']);
                $table->dropColumn('tenant_id');
            }
        });
    }
};
