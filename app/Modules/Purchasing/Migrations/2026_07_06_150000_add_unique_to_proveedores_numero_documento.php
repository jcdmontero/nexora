<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Unique en numero_documento por tenant (excluye soft-deletes)
        Schema::table('purchasing_proveedores', function (Blueprint $table) {
            $table->unique(['tenant_id', 'numero_documento']);
        });
    }

    public function down(): void
    {
        Schema::table('purchasing_proveedores', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'numero_documento']);
        });
    }
};
