<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            if (!Schema::hasColumn('sd_ordenes', 'verification_token')) {
                $table->uuid('verification_token')->nullable()->after('numero_orden');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropColumn('verification_token');
        });
    }
};
