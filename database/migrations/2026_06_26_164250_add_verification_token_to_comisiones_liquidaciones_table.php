<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sd_comisiones_liquidaciones', function (Blueprint $table) {
            $table->string('verification_token', 64)->nullable()->unique()->after('codigo');
        });
    }

    public function down(): void
    {
        Schema::table('sd_comisiones_liquidaciones', function (Blueprint $table) {
            $table->dropColumn('verification_token');
        });
    }
};
