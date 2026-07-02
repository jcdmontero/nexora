<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Campo imagen en productos
        Schema::table('inventory_productos', function (Blueprint $table) {
            $table->string('imagen_url', 500)->nullable()->after('nombre');
        });

        // Campo imagen en servicios
        Schema::table('sd_servicios', function (Blueprint $table) {
            $table->string('imagen_url', 500)->nullable()->after('nombre');
        });

        // Enriquecer tabla de multimedia de órdenes
        Schema::table('sd_orden_multimedia', function (Blueprint $table) {
            $table->string('fase', 30)->nullable()->after('tipo');
            $table->string('mime_type', 50)->nullable()->after('fase');
            $table->unsignedBigInteger('tamaño')->nullable()->after('mime_type');
            $table->decimal('duracion', 8, 2)->nullable()->after('tamaño');
            $table->string('nombre_original', 255)->nullable()->after('duracion');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_productos', function (Blueprint $table) {
            $table->dropColumn('imagen_url');
        });

        Schema::table('sd_servicios', function (Blueprint $table) {
            $table->dropColumn('imagen_url');
        });

        Schema::table('sd_orden_multimedia', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['fase', 'mime_type', 'tamaño', 'duracion', 'nombre_original']);
        });
    }
};
