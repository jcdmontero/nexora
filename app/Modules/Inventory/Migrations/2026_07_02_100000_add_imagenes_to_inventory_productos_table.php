<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_productos', function (Blueprint $table) {
            // C-05: imagen_url no existe en la migración base; agregar imagenes después de is_active
            if (!Schema::hasColumn('inventory_productos', 'imagenes')) {
                $table->json('imagenes')->nullable()->after('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('inventory_productos', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_productos', 'imagenes')) {
                $table->dropColumn('imagenes');
            }
        });
    }
};
