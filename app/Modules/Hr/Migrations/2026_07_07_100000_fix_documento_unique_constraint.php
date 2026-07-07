<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return; // SQLite: unique constraints are managed differently
        }

        // HR-001: Cambiar unique global de documento a unique compuesto con tenant_id
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropUnique(['documento']);
            $table->unique(['tenant_id', 'documento']);
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'documento']);
            $table->unique(['documento']);
        });
    }
};
