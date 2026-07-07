<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pay_periodos_nomina', function (Blueprint $table) {
            $table->unique(['tenant_id', 'mes_contable']);
        });
    }

    public function down(): void
    {
        Schema::table('pay_periodos_nomina', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'mes_contable']);
        });
    }
};
