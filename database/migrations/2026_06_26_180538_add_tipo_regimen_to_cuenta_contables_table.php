<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cuentas_contables', function (Blueprint $table) {
            $table->string('tipo_regimen', 30)->default('TODOS')->after('nombre');
            $table->index('tipo_regimen');
        });
    }

    public function down(): void
    {
        Schema::table('cuentas_contables', function (Blueprint $table) {
            $table->dropColumn('tipo_regimen');
        });
    }
};
