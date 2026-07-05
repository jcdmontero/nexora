<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Conceptos de nómina (catálogo)
        Schema::create('pay_conceptos_nomina', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('codigo', 20); // SAL01, DED01, PRO01, etc.
            $table->string('nombre', 200);
            $table->string('tipo', 30); // DEVENGADO, DEDUCCION, PROVISION, APORTE_PATRONAL
            $table->foreignId('cuenta_contable_id')->nullable()->index();
            $table->boolean('base_seguridad_social')->default(false);
            $table->boolean('base_parafiscales')->default(false);
            $table->boolean('base_prestaciones')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'codigo']);
        });

        // Períodos de nómina
        Schema::create('pay_periodos_nomina', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('codigo', 30); // NOM-2026-06
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('mes_contable', 7); // 2026-06
            $table->string('estado', 30)->default('BORRADOR');
            // BORRADOR, LIQUIDADA, CONTABILIZADA, PAGADA, ANULADA
            $table->decimal('total_devengado', 15, 2)->default(0);
            $table->decimal('total_deducciones', 15, 2)->default(0);
            $table->decimal('total_provisiones', 15, 2)->default(0);
            $table->decimal('total_aportes_patronales', 15, 2)->default(0);
            $table->decimal('neto_pagar', 15, 2)->default(0);
            $table->text('observaciones')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['tenant_id', 'codigo']);
            $table->index(['tenant_id', 'estado']);
        });

        // Provisiones acumuladas por empleado
        Schema::create('pay_provisiones_acumuladas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->string('tipo_provision', 30); // PRIMA, CESANTIAS, INT_CESANTIAS, VACACIONES
            $table->integer('ano');
            $table->decimal('saldo_inicial', 15, 2)->default(0);
            $table->decimal('movimiento_mes', 15, 2)->default(0);
            $table->decimal('saldo_final', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(['empleado_id', 'tipo_provision', 'ano']);
        });

        // Parámetros contables de nómina
        Schema::create('pay_parametros_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('concepto_id')->constrained('pay_conceptos_nomina')->cascadeOnDelete();
            $table->string('categoria_laboral', 50); // Administrativo, Operativo, Comercial
            $table->foreignId('cuenta_debito_id')->nullable()->index();
            $table->foreignId('cuenta_credito_id')->nullable()->index();
            $table->foreignId('centro_costo_id')->nullable()->index();
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['concepto_id', 'categoria_laboral']);
        });

        // Extender pay_nominas con campos necesarios
        Schema::table('pay_nominas', function (Blueprint $table) {
            $table->dropColumn('mes');
            $table->foreignId('periodo_id')->nullable()->after('id')->constrained('pay_periodos_nomina')->nullOnDelete();
            $table->foreignId('empleado_id')->nullable()->after('periodo_id')->constrained('hr_empleados')->nullOnDelete();
            $table->foreignId('contrato_id')->nullable()->after('empleado_id')->constrained('hr_contratos')->nullOnDelete();
            $table->decimal('ibc_seguridad_social', 15, 2)->default(0)->after('salario_base');
            $table->decimal('ibc_parafiscales', 15, 2)->default(0)->after('ibc_seguridad_social');
            $table->decimal('total_devengado', 15, 2)->default(0)->after('ibc_parafiscales');
            $table->decimal('total_deducciones', 15, 2)->default(0)->after('total_devengado');
            $table->decimal('neto_pagar', 15, 2)->default(0)->after('total_deducciones');
            $table->decimal('total_provisiones', 15, 2)->default(0)->after('neto_pagar');
            $table->decimal('total_aportes_patronales', 15, 2)->default(0)->after('total_provisiones');
            $table->decimal('costo_laboral_total', 15, 2)->default(0)->after('total_aportes_patronales');
            $table->decimal('auxilio_transporte', 15, 2)->default(0)->after('salario_base');
            $table->integer('dias_laborados')->default(30)->after('empleado_id');
            $table->foreignId('created_by')->nullable()->after('costo_laboral_total')->constrained('users')->nullOnDelete();
        });

        // Reestructurar pay_nomina_detalles para usar conceptos
        Schema::table('pay_nomina_detalles', function (Blueprint $table) {
            $table->dropColumn(['salario_base', 'auxilio_transporte', 'salud_deduccion', 'pension_deduccion', 'total_devengos', 'total_deducciones', 'neto_pagar', 'dias_laborados']);
            $table->foreignId('concepto_id')->nullable()->after('nomina_id')->constrained('pay_conceptos_nomina')->nullOnDelete();
            $table->foreignId('contrato_id')->nullable()->after('empleado_id')->constrained('hr_contratos')->nullOnDelete();
            $table->decimal('cantidad', 10, 2)->default(1)->after('concepto_id');
            $table->decimal('valor', 15, 2)->default(0)->after('cantidad');
            $table->decimal('base_calculo', 15, 2)->nullable()->after('valor');
        });

        // Extender pay_novedades
        Schema::table('pay_novedades', function (Blueprint $table) {
            $table->foreignId('concepto_id')->nullable()->after('empleado_id')->constrained('pay_conceptos_nomina')->nullOnDelete();
            $table->foreignId('periodo_id')->nullable()->after('nomina_id')->constrained('pay_periodos_nomina')->nullOnDelete();
            $table->nullableMorphs('referencia');
        });
    }

    public function down(): void
    {
        Schema::table('pay_novedades', function (Blueprint $table) {
            $table->dropMorphs('referencia');
            $table->dropForeign(['periodo_id']);
            $table->dropColumn('periodo_id');
            $table->dropForeign(['concepto_id']);
            $table->dropColumn('concepto_id');
        });

        Schema::table('pay_nomina_detalles', function (Blueprint $table) {
            $table->dropForeign(['concepto_id']);
            $table->dropColumn(['concepto_id', 'contrato_id', 'cantidad', 'valor', 'base_calculo']);
            // Restore original columns (simplified - in practice would need full column restore)
            $table->decimal('salario_base', 15, 2)->default(0);
            $table->decimal('auxilio_transporte', 15, 2)->default(0);
            $table->decimal('salud_deduccion', 15, 2)->default(0);
            $table->decimal('pension_deduccion', 15, 2)->default(0);
            $table->decimal('total_devengos', 15, 2)->default(0);
            $table->decimal('total_deducciones', 15, 2)->default(0);
            $table->decimal('neto_pagar', 15, 2)->default(0);
            $table->integer('dias_laborados')->default(30);
        });

        Schema::table('pay_nominas', function (Blueprint $table) {
            $table->dropForeign(['periodo_id']);
            $table->dropForeign(['contrato_id']);
            $table->dropForeign(['created_by']);
            $table->dropColumn(['periodo_id', 'contrato_id', 'dias_laborados', 'ibc_seguridad_social', 'ibc_parafiscales', 'auxilio_transporte', 'total_devengado', 'total_deducciones', 'neto_pagar', 'total_provisiones', 'total_aportes_patronales', 'costo_laboral_total', 'created_by']);
        });

        Schema::dropIfExists('pay_parametros_contables');
        Schema::dropIfExists('pay_provisiones_acumuladas');
        Schema::dropIfExists('pay_periodos_nomina');
        Schema::dropIfExists('pay_conceptos_nomina');
    }
};
