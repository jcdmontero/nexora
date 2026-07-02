<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Certificados Digitales
        Schema::create('sales_certificados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre_archivo', 255);
            $table->text('pfx_path');
            $table->text('password'); // Deberá ir encriptado
            $table->date('fecha_vencimiento')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Resoluciones de Facturación
        Schema::create('sales_resoluciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('tipo_documento', 50)->default('factura'); // factura, nota_credito, nota_debito
            $table->string('numero_resolucion', 100);
            $table->string('prefijo', 10)->nullable();
            $table->unsignedBigInteger('rango_desde');
            $table->unsignedBigInteger('rango_hasta');
            $table->unsignedBigInteger('consecutivo_actual');
            $table->date('fecha_desde');
            $table->date('fecha_hasta');
            $table->string('clave_tecnica', 255)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Modificaciones a facturas
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->string('tipo_documento', 50)->default('factura')->after('estado'); // factura, nota_credito, nota_debito
            $table->string('dian_estado', 50)->default('borrador')->after('qr_code'); // borrador, pendiente_envio, enviado, aceptado, rechazado
            $table->text('dian_mensaje')->nullable()->after('dian_estado');
            $table->timestamp('dian_fecha_envio')->nullable()->after('dian_mensaje');
            $table->string('dian_track_id', 255)->nullable()->after('dian_fecha_envio');
            $table->foreignId('resolucion_id')->nullable()->after('dian_track_id')->constrained('sales_resoluciones')->nullOnDelete();
            $table->foreignId('factura_origen_id')->nullable()->after('resolucion_id')->constrained('sales_facturas')->nullOnDelete(); // Para notas crédito/débito
            
            $table->index(['tenant_id', 'dian_estado']);
        });

        // Historial de eventos DIAN
        Schema::create('sales_dian_eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('factura_id')->constrained('sales_facturas')->cascadeOnDelete();
            $table->string('estado', 50);
            $table->text('mensaje')->nullable();
            $table->text('xml_enviado')->nullable();
            $table->text('xml_respuesta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_dian_eventos');
        
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->dropForeign(['resolucion_id']);
            $table->dropForeign(['factura_origen_id']);
            $table->dropIndex(['tenant_id', 'dian_estado']);
            $table->dropColumn([
                'tipo_documento',
                'dian_estado',
                'dian_mensaje',
                'dian_fecha_envio',
                'dian_track_id',
                'resolucion_id',
                'factura_origen_id'
            ]);
        });

        Schema::dropIfExists('sales_resoluciones');
        Schema::dropIfExists('sales_certificados');
    }
};
