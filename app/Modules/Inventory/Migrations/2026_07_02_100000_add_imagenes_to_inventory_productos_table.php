<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_productos', function (Blueprint $table) {
            $table->json('imagenes')->nullable()->after('imagen_url');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_productos', function (Blueprint $table) {
            $table->dropColumn('imagenes');
        });
    }
};
