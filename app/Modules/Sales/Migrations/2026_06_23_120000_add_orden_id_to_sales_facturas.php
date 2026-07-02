<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_facturas', 'orden_id')) {
                $table->foreignId('orden_id')
                    ->nullable()
                    ->after('cliente_id')
                    ->constrained('sd_ordenes')
                    ->nullOnDelete();
                $table->index(['tenant_id', 'orden_id']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            if (Schema::hasColumn('sales_facturas', 'orden_id')) {
                $table->dropForeign(['orden_id']);
                $table->dropIndex(['tenant_id', 'orden_id']);
                $table->dropColumn('orden_id');
            }
        });
    }
};
