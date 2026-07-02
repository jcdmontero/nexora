<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Extiende el módulo Cash a multicaja completo:
     * - Totales de ingreso/egreso por sesión para cuadre automático.
     * - Catálogo de denominaciones (billetes/monedas) por tenant.
     * - Arqueo de caja con detalle por denominación.
     * - Transferencias entre cajas.
     */
    public function up(): void
    {
        // 1. Extender sesiones con totales para el cuadre y datos de cierre/arqueo.
        Schema::table('cash_caja_sesiones', function (Blueprint $table) {
            if (!Schema::hasColumn('cash_caja_sesiones', 'ingresos_totales')) {
                $table->decimal('ingresos_totales', 15, 2)->default(0)->after('saldo_inicial');
            }
            if (!Schema::hasColumn('cash_caja_sesiones', 'egresos_totales')) {
                $table->decimal('egresos_totales', 15, 2)->default(0)->after('ingresos_totales');
            }
            if (!Schema::hasColumn('cash_caja_sesiones', 'observaciones_cierre')) {
                $table->text('observaciones_cierre')->nullable()->after('notas');
            }
            if (!Schema::hasColumn('cash_caja_sesiones', 'arqueado')) {
                $table->boolean('arqueado')->default(false)->after('observaciones_cierre');
            }
            if (!Schema::hasColumn('cash_caja_sesiones', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // 2. Catálogo de denominaciones (billetes y monedas) por tenant.
        Schema::create('cash_denominaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('tipo', 10); // billete | moneda
            $table->decimal('valor', 15, 2);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'orden']);
            $table->unique(['tenant_id', 'valor']);
        });

        // 3. Arqueos de caja (conteo físico al cerrar turno).
        Schema::create('cash_arqueos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sesion_id')->constrained('cash_caja_sesiones')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // quien arquea
            $table->decimal('total_sistema', 15, 2)->default(0);  // saldo esperado
            $table->decimal('total_contado', 15, 2)->default(0);  // conteo físico
            $table->decimal('diferencia', 15, 2)->default(0);     // contado - sistema
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'sesion_id']);
        });

        // 4. Detalle del arqueo: cantidad contada por denominación.
        Schema::create('cash_arqueo_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('arqueo_id')->constrained('cash_arqueos')->cascadeOnDelete();
            $table->foreignId('denominacion_id')->constrained('cash_denominaciones')->cascadeOnDelete();
            $table->unsignedInteger('cantidad')->default(0);
            $table->decimal('subtotal', 15, 2)->default(0); // cantidad * valor
            $table->timestamps();

            $table->unique(['arqueo_id', 'denominacion_id']);
        });

        // 5. Transferencias entre cajas (traslado de efectivo).
        Schema::create('cash_transferencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('caja_origen_id')->constrained('cash_cajas')->cascadeOnDelete();
            $table->foreignId('caja_destino_id')->constrained('cash_cajas')->cascadeOnDelete();
            $table->foreignId('sesion_origen_id')->nullable()->constrained('cash_caja_sesiones')->nullOnDelete();
            $table->foreignId('sesion_destino_id')->nullable()->constrained('cash_caja_sesiones')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // quien transfiere
            $table->decimal('monto', 15, 2);
            $table->string('concepto', 255)->nullable();
            $table->string('estado', 20)->default('completada'); // completada | anulada
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_transferencias');
        Schema::dropIfExists('cash_arqueo_detalles');
        Schema::dropIfExists('cash_arqueos');
        Schema::dropIfExists('cash_denominaciones');

        Schema::table('cash_caja_sesiones', function (Blueprint $table) {
            foreach (['arqueado', 'observaciones_cierre', 'egresos_totales', 'ingresos_totales'] as $col) {
                if (Schema::hasColumn('cash_caja_sesiones', $col)) {
                    $table->dropColumn($col);
                }
            }
            // No eliminamos tenant_id por seguridad (podría estar referenciado).
        });
    }
};
