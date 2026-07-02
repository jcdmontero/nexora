<?php

use App\Core\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('periodos_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('anio');
            $table->unsignedTinyInteger('mes');
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->enum('estado', ['abierto', 'cerrado'])->default('abierto');
            $table->timestamp('cerrado_at')->nullable();
            $table->foreignId('cerrado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['tenant_id', 'anio', 'mes']);
            $table->index(['tenant_id', 'estado']);
        });

        Schema::table('cuentas_contables', function (Blueprint $table) {
            $table->enum('naturaleza', ['debito', 'credito'])->default('debito')->after('tipo');
            $table->unsignedTinyInteger('nivel')->default(1)->after('naturaleza');
            $table->string('clase', 1)->nullable()->after('nivel');
            $table->boolean('requiere_tercero')->default(false)->after('acepta_movimientos');
            $table->boolean('requiere_centro_costo')->default(false)->after('requiere_tercero');
        });

        Schema::table('asientos_contables', function (Blueprint $table) {
            $table->foreignId('periodo_contable_id')->nullable()->after('tenant_id')->constrained('periodos_contables')->nullOnDelete();
            $table->string('numero', 30)->nullable()->after('fecha');
            $table->enum('estado', ['borrador', 'contabilizado', 'reversado'])->default('contabilizado')->after('concepto');
            $table->string('documento_tipo', 50)->nullable()->after('modulo_origen');
            $table->string('documento_prefijo', 10)->nullable()->after('documento_tipo');
            $table->string('documento_numero', 50)->nullable()->after('documento_prefijo');
            $table->string('tercero_tipo_documento', 10)->nullable()->after('documento_numero');
            $table->string('tercero_numero_documento', 30)->nullable()->after('tercero_tipo_documento');
            $table->string('tercero_nombre', 180)->nullable()->after('tercero_numero_documento');
            $table->foreignId('reverso_de_id')->nullable()->after('referencia_type')->constrained('asientos_contables')->nullOnDelete();
            $table->timestamp('contabilizado_at')->nullable()->after('registrado_por');

            $table->unique(['tenant_id', 'numero']);
            $table->index(['tenant_id', 'fecha']);
            $table->index(['tenant_id', 'estado']);
            $table->index(['tenant_id', 'documento_tipo', 'documento_prefijo', 'documento_numero'], 'asientos_documento_idx');
        });

        Schema::table('asiento_lineas', function (Blueprint $table) {
            $table->string('tercero_tipo_documento', 10)->nullable()->after('centro_costo_id');
            $table->string('tercero_numero_documento', 30)->nullable()->after('tercero_tipo_documento');
            $table->string('tercero_nombre', 180)->nullable()->after('tercero_numero_documento');
            $table->decimal('base_gravable', 15, 2)->nullable()->after('credito');
            $table->string('impuesto_tipo', 20)->nullable()->after('base_gravable');
            $table->decimal('impuesto_tarifa', 7, 4)->nullable()->after('impuesto_tipo');

            $table->index(['cuenta_contable_id']);
            $table->index(['centro_costo_id']);
            $table->index(['tercero_numero_documento']);
        });
    }

    public function down(): void
    {
        Schema::table('asiento_lineas', function (Blueprint $table) {
            $table->dropIndex(['cuenta_contable_id']);
            $table->dropIndex(['centro_costo_id']);
            $table->dropIndex(['tercero_numero_documento']);
            $table->dropColumn([
                'tercero_tipo_documento',
                'tercero_numero_documento',
                'tercero_nombre',
                'base_gravable',
                'impuesto_tipo',
                'impuesto_tarifa',
            ]);
        });

        Schema::table('asientos_contables', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'numero']);
            $table->dropIndex(['tenant_id', 'fecha']);
            $table->dropIndex(['tenant_id', 'estado']);
            $table->dropIndex('asientos_documento_idx');
            $table->dropConstrainedForeignId('periodo_contable_id');
            $table->dropConstrainedForeignId('reverso_de_id');
            $table->dropColumn([
                'numero',
                'estado',
                'documento_tipo',
                'documento_prefijo',
                'documento_numero',
                'tercero_tipo_documento',
                'tercero_numero_documento',
                'tercero_nombre',
                'contabilizado_at',
            ]);
        });

        Schema::table('cuentas_contables', function (Blueprint $table) {
            $table->dropColumn([
                'naturaleza',
                'nivel',
                'clase',
                'requiere_tercero',
                'requiere_centro_costo',
            ]);
        });

        Schema::dropIfExists('periodos_contables');
    }
};
