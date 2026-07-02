<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_facturas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sede_id')->nullable()->constrained('core_sedes')->nullOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('crm_clientes')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Vendedor/Cajero
            $table->string('numero', 50)->unique(); // Ej: POS-0001
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('impuestos', 15, 2)->default(0);
            $table->decimal('descuento', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->string('estado', 20)->default('pagada'); // pagada, pendiente (credito), anulada
            $table->string('metodo_pago', 50)->default('efectivo'); // efectivo, tarjeta, transferencia, credito
            $table->text('notas')->nullable();
            
            // Campos para Facturación Electrónica DIAN
            $table->string('cufe', 255)->nullable();
            $table->text('qr_code')->nullable();
            
            $table->timestamps();
            
            $table->index(['tenant_id', 'estado']);
            $table->index(['tenant_id', 'numero']);
        });

        Schema::create('sales_factura_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('factura_id')->constrained('sales_facturas')->cascadeOnDelete();
            $table->foreignId('producto_id')->nullable()->constrained('inventory_productos')->nullOnDelete();
            $table->string('descripcion', 255);
            $table->decimal('cantidad', 10, 2);
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('tasa_impuesto', 5, 2)->default(0); // Ej: 19.00
            $table->decimal('subtotal', 15, 2); // cantidad * precio
            $table->decimal('impuesto_total', 15, 2); 
            $table->decimal('total', 15, 2); // subtotal + impuesto
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_factura_items');
        Schema::dropIfExists('sales_facturas');
    }
};
