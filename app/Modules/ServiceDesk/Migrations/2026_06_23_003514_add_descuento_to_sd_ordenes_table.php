<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->decimal('descuento', 12, 2)->default(0)->after('precio_cliente')->comment('Descuento global aplicado en liquidación');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropColumn('descuento');
        });
    }
};
