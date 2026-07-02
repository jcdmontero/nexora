<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->string('verification_token', 100)->nullable()->unique()->after('qr_code');
        });

        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->string('verification_token', 100)->nullable()->unique()->after('estado');
        });
    }

    public function down(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->dropColumn('verification_token');
        });

        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropColumn('verification_token');
        });
    }
};