<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // C-06: Corregir naturaleza para cuentas con tipo que exige credito pero que
        // pudieran tener el default 'debito' de la migración original.
        // Solo corregimos pasivo y patrimonio (siempre naturaleza credito).
        // NO corregimos ingreso porque algunas cuentas de ingreso son contra-naturaleza
        // (ej. 4175 Devoluciones en ventas) y correctamente tienen naturaleza='debito'.
        DB::table('cuentas_contables')
            ->whereIn('tipo', ['pasivo', 'patrimonio'])
            ->where('naturaleza', '!=', 'credito')
            ->update(['naturaleza' => 'credito']);
    }

    public function down(): void
    {
        // No se puede revertir de forma segura sin conocer el estado anterior.
    }
};
