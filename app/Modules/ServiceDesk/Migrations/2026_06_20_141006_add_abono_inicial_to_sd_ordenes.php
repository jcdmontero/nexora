<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->decimal('abono_inicial', 15, 2)->default(0)->after('total_final');
        });
    }

    public function down(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropColumn('abono_inicial');
        });
    }
};
