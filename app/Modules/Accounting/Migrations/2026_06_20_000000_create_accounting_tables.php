<?php

use App\Core\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('centros_costo', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->string('codigo', 20);
            $table->string('nombre', 100);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['tenant_id', 'codigo']);
        });

        Schema::create('cuentas_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->string('codigo', 20);
            $table->string('nombre', 150);
            $table->enum('tipo', ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'costo']);
            $table->boolean('acepta_movimientos')->default(true);
            $table->foreignId('parent_id')->nullable()->constrained('cuentas_contables')->cascadeOnDelete();
            $table->text('descripcion')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'codigo']);
        });

        Schema::create('asientos_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->date('fecha');
            $table->string('concepto');
            $table->string('modulo_origen', 50)->nullable();
            $table->nullableMorphs('referencia'); // crea referencia_id y referencia_type
            $table->foreignId('registrado_por')->nullable()->constrained('users');
            $table->timestamps();
        });

        Schema::create('asiento_lineas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asiento_contable_id')->constrained('asientos_contables')->cascadeOnDelete();
            $table->foreignId('cuenta_contable_id')->constrained('cuentas_contables');
            $table->foreignId('centro_costo_id')->nullable()->constrained('centros_costo')->nullOnDelete();
            $table->decimal('debito', 15, 2)->default(0);
            $table->decimal('credito', 15, 2)->default(0);
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });

        Schema::create('cuentas_por_cobrar', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->nullableMorphs('deudor');
            $table->nullableMorphs('documento_origen');
            $table->decimal('monto_total', 15, 2);
            $table->decimal('monto_pagado', 15, 2)->default(0);
            $table->enum('estado', ['pendiente', 'pagado', 'anulado'])->default('pendiente');
            $table->date('fecha_vencimiento')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });

        Schema::create('cuentas_por_pagar', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->nullableMorphs('acreedor');
            $table->nullableMorphs('documento_origen');
            $table->decimal('monto_total', 15, 2);
            $table->decimal('monto_pagado', 15, 2)->default(0);
            $table->enum('estado', ['pendiente', 'pagado', 'anulado'])->default('pendiente');
            $table->date('fecha_vencimiento')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuentas_por_pagar');
        Schema::dropIfExists('cuentas_por_cobrar');
        Schema::dropIfExists('asiento_lineas');
        Schema::dropIfExists('asientos_contables');
        Schema::dropIfExists('cuentas_contables');
        Schema::dropIfExists('centros_costo');
    }
};
