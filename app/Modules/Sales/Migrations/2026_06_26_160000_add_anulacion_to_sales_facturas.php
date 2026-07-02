<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            if (!Schema::hasColumn('sales_facturas', 'anulada')) {
                $table->boolean('anulada')->default(false)->after('estado');
            }
            if (!Schema::hasColumn('sales_facturas', 'anulada_at')) {
                $table->timestamp('anulada_at')->nullable()->after('anulada');
            }
            if (!Schema::hasColumn('sales_facturas', 'anulada_por')) {
                $table->foreignId('anulada_por')->nullable()->constrained('users')->nullOnDelete()->after('anulada_at');
            }
            if (!Schema::hasColumn('sales_facturas', 'motivo_anulacion')) {
                $table->text('motivo_anulacion')->nullable()->after('anulada_por');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->dropColumn(['anulada', 'anulada_at', 'anulada_por', 'motivo_anulacion']);
        });
    }
};
