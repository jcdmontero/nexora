<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchasing_proveedores', function (Blueprint $table) {
            $table->string('regimen_tributario', 30)->default('simplificado')->after('razon_social');
            $table->decimal('porcentaje_retencion_fuente', 5, 2)->default(0)->after('regimen_tributario');
            $table->decimal('porcentaje_retencion_iva', 5, 2)->default(0)->after('porcentaje_retencion_fuente');
            $table->decimal('porcentaje_retencion_ica', 5, 2)->default(0)->after('porcentaje_retencion_iva');
            $table->index('regimen_tributario');
        });
    }

    public function down(): void
    {
        Schema::table('purchasing_proveedores', function (Blueprint $table) {
            $table->dropColumn([
                'regimen_tributario',
                'porcentaje_retencion_fuente',
                'porcentaje_retencion_iva',
                'porcentaje_retencion_ica',
            ]);
        });
    }
};
