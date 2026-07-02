<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Categorías
        Schema::create('inventory_categorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['tenant_id', 'nombre']);
        });

        // 2. Marcas
        Schema::create('inventory_marcas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['tenant_id', 'nombre']);
        });

        // 3. Productos / Catálogo Base
        Schema::create('inventory_productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('codigo', 50); // SKU
            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->foreignId('categoria_id')->nullable()->constrained('inventory_categorias')->nullOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('inventory_marcas')->nullOnDelete();
            $table->string('unidad_medida', 20)->default('unidad'); // kg, mt, lt, unidad
            
            // Precios y Costos
            $table->decimal('precio_venta', 15, 2)->default(0);
            $table->decimal('costo_promedio', 15, 2)->default(0);
            
            // Stock (Caché rápido, alimentado por movimientos)
            $table->decimal('stock_actual', 15, 4)->default(0);
            $table->decimal('stock_minimo', 15, 4)->default(0);
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'codigo']);
        });

        // 3.5 Presentaciones / Empaques (Conversión de Unidades)
        Schema::create('inventory_product_packs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos')->cascadeOnDelete();
            $table->string('nombre', 100); // Ej: "Docena", "Caja x24"
            $table->string('unidad_medida', 20); // 'docena', 'caja'
            $table->decimal('factor_conversion', 10, 4); // Cuántas unidades base contiene
            $table->string('codigo_barras', 100)->nullable();
            $table->decimal('precio_venta', 15, 2)->nullable(); // Precio mayorista opcional
            $table->timestamps();
        });

        // 4. Ajustes y Movimientos (Kardex)
        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos')->cascadeOnDelete();
            $table->foreignId('pack_id')->nullable()->constrained('inventory_product_packs')->nullOnDelete();
            $table->enum('tipo', ['entrada', 'salida', 'ajuste', 'inicial']);
            $table->decimal('cantidad', 15, 4); // Cantidad en la unidad seleccionada (Ej: 3 docenas)
            $table->decimal('factor_conversion', 10, 4)->default(1); // Histórico del factor
            $table->decimal('cantidad_base', 15, 4); // Cantidad física real (Ej: 36 unidades)
            $table->decimal('costo_unitario', 15, 2)->nullable();
            $table->text('observaciones')->nullable();
            
            // Referencia polimórfica (ej: venta_id, compra_id)
            // NOTA: Se usa nullableMorphs en vez de nullableUuidMorphs porque las
            // referencias internas usan auto-increment (PostgreSQL no castea int→uuid).
            $table->nullableMorphs('referencia');
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            $table->index(['tenant_id', 'producto_id']);
            $table->index(['tenant_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustments');
        Schema::dropIfExists('inventory_product_packs');
        Schema::dropIfExists('inventory_productos');
        Schema::dropIfExists('inventory_marcas');
        Schema::dropIfExists('inventory_categorias');
    }
};
