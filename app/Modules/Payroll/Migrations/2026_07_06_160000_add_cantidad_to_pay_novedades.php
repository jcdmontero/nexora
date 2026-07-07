<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // C-04: Agregar columna cantidad que NominaService lee pero no existía
        Schema::table('pay_novedades', function (Blueprint $table) {
            if (!Schema::hasColumn('pay_novedades', 'cantidad')) {
                $table->decimal('cantidad', 10, 2)->nullable()->after('valor');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pay_novedades', function (Blueprint $table) {
            if (Schema::hasColumn('pay_novedades', 'cantidad')) {
                $table->dropColumn('cantidad');
            }
        });
    }
};
