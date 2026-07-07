<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bug #6, #13: Agregar BelongsToTenant a modelos faltantes.
     * Tablas que ya tienen tenant_id (migración original): hr_empleados, hr_departamentos,
     * hr_cargos, hr_configuracion_legal, hr_entidades_parafiscales.
     * Las siguientes NO lo tienen y se agregan aquí.
     */
    public function up(): void
    {
        // hr_contratos — Bug #6
        Schema::table('hr_contratos', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_contratos', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_asistencias — Bug #6
        Schema::table('hr_asistencias', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_asistencias', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_prestamos — Bug #6
        Schema::table('hr_prestamos', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_prestamos', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_prestamo_cuotas — Bug #6
        Schema::table('hr_prestamo_cuotas', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_prestamo_cuotas', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_incapacidades — Bug #6
        Schema::table('hr_incapacidades', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_incapacidades', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // hr_afiliaciones — Bug #6 (ya se agregaron tipo_afiliacion y numero_identificacion arriba)
        Schema::table('hr_afiliaciones', function (Blueprint $table) {
            if (!Schema::hasColumn('hr_afiliaciones', 'tipo_afiliacion')) {
                $table->string('tipo_afiliacion', 100)->nullable()->after('entidad_id');
            }
            if (!Schema::hasColumn('hr_afiliaciones', 'numero_identificacion')) {
                $table->string('numero_identificacion', 100)->nullable()->after('fecha_afiliacion');
            }
            if (!Schema::hasColumn('hr_afiliaciones', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        $tables = ['hr_contratos', 'hr_asistencias', 'hr_prestamos', 'hr_prestamo_cuotas', 'hr_incapacidades', 'hr_afiliaciones'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) use ($table) {
                if (Schema::hasColumn($table, 'tenant_id')) {
                    $t->dropForeign([$table . '_tenant_id_foreign']);
                    $t->dropColumn('tenant_id');
                }
            });
        }
    }
};
