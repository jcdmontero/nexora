<?php

use App\Core\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('libros_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->string('codigo', 10);                // DG, MB, CJ, VI
            $table->string('nombre', 100);                // Diario General, Mayor y Balances, etc.
            $table->string('tipo', 30);                   // diario, mayor, caja, ventas
            $table->string('descripcion', 255)->nullable();
            $table->string('filtro_cuentas', 100)->nullable(); // ej: "1105%" para libro caja
            $table->string('filtro_modulo', 50)->nullable();   // ej: "ventas,service-desk" para libro ventas
            $table->boolean('is_sistema')->default(false);     // true si es creado por el sistema (no se puede eliminar)
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'codigo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('libros_contables');
    }
};
