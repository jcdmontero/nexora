<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('asiento_lineas', function (Blueprint $table) {
            if (!Schema::hasColumn('asiento_lineas', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // A-09: Backfill en lotes para evitar bloqueos prolongados en tablas grandes
        if (DB::getDriverName() === 'sqlite') {
            // SQLite: procesar en lotes por rango de ID
            $batchSize = 1000;
            $maxId = DB::table('asiento_lineas')->max('id') ?? 0;
            for ($start = 0; $start <= $maxId; $start += $batchSize) {
                DB::statement("
                    UPDATE asiento_lineas
                    SET tenant_id = (
                        SELECT tenant_id FROM asientos_contables
                        WHERE asientos_contables.id = asiento_lineas.asiento_contable_id
                    )
                    WHERE tenant_id IS NULL AND id BETWEEN {$start} AND " . ($start + $batchSize - 1)
                );
            }
        } else {
            // PostgreSQL: procesar en lotes por rango de ID
            $batchSize = 1000;
            $maxId = DB::table('asiento_lineas')->max('id') ?? 0;
            for ($start = 0; $start <= $maxId; $start += $batchSize) {
                DB::statement("
                    UPDATE asiento_lineas
                    SET tenant_id = (
                        SELECT tenant_id FROM asientos_contables
                        WHERE asientos_contables.id = asiento_lineas.asiento_contable_id
                    )
                    WHERE tenant_id IS NULL AND id BETWEEN {$start} AND " . ($start + $batchSize - 1)
                );
            }
        }
    }

    public function down(): void
    {
        Schema::table('asiento_lineas', function (Blueprint $table) {
            if (Schema::hasColumn('asiento_lineas', 'tenant_id')) {
                $table->dropForeign(['tenant_id']);
                $table->dropColumn('tenant_id');
            }
        });
    }
};
