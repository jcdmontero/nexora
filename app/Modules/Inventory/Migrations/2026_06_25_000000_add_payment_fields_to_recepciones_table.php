<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->string('metodo_pago', 20)->default('efectivo')->after('fecha');
            $table->decimal('monto_total', 15, 2)->default(0)->after('metodo_pago');
            $table->foreignId('caja_sesion_id')->nullable()->after('monto_total')->constrained('cash_caja_sesiones')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('caja_sesion_id');
            $table->dropColumn(['metodo_pago', 'monto_total']);
        });
    }
};
