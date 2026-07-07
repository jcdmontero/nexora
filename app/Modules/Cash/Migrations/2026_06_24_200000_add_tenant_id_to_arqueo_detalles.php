<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cash_arqueo_detalles', function (Blueprint $table) {
            if (!Schema::hasColumn('cash_arqueo_detalles', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // Poblar tenant_id desde el arqueo padre para filas existentes
        DB::statement('
            UPDATE cash_arqueo_detalles
            SET tenant_id = (
                SELECT tenant_id FROM cash_arqueos WHERE cash_arqueos.id = cash_arqueo_detalles.arqueo_id
            )
            WHERE tenant_id IS NULL
        ');
    }

    public function down(): void
    {
        Schema::table('cash_arqueo_detalles', function (Blueprint $table) {
            if (Schema::hasColumn('cash_arqueo_detalles', 'tenant_id')) {
                $table->dropForeign(['tenant_id']);
                $table->dropColumn('tenant_id');
            }
        });
    }
};
