<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sd_ordenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('numero_orden', 50);

            // Cliente y equipo
            $table->foreignId('cliente_id')->constrained('crm_clientes');
            $table->foreignId('modelo_id')->nullable()->constrained('sd_modelos')->nullOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('tipo_equipo_manual', 150)->nullable();
            $table->string('numero_serie', 100)->nullable();

            // Recepción
            $table->text('accesorios_equipo')->nullable();
            $table->text('observaciones_equipo')->nullable();
            $table->text('condicion_inicial')->nullable();

            // Checklist (se activan por tipo de equipo)
            $table->json('fallas_checklist')->nullable();
            $table->json('accesorios_checklist')->nullable();
            $table->text('fallas_otras')->nullable();
            $table->text('accesorios_otros')->nullable();

            // Bloqueo del equipo (celulares): pin, patron, contrasena, huella, ninguno
            $table->boolean('bloqueado')->default(false);
            $table->timestamp('bloqueado_en')->nullable();
            $table->string('tipo_bloqueo', 20)->nullable();
            $table->text('codigo_bloqueo')->nullable(); // PIN/clave o secuencia del patrón "1-2-3-6-9"

            // Flujo / estado
            $table->string('estado', 20)->default('recibido');
            $table->json('notas_fases')->nullable();
            $table->timestamp('fecha_recibido')->useCurrent();
            $table->timestamp('fecha_entregado')->nullable();

            // Técnico asignado
            $table->foreignId('tecnico_id')->nullable()->constrained('users')->nullOnDelete();

            // Mano de obra
            $table->string('tipo_mano_obra', 30)->nullable();
            $table->text('mano_obra_descripcion')->nullable();

            // Costos
            $table->decimal('precio_cliente', 15, 2)->default(0);
            $table->decimal('costo_tecnico', 15, 2)->default(0);
            $table->boolean('costo_tecnico_manual')->default(false);
            $table->decimal('costo_diagnostico', 15, 2)->default(0);
            $table->decimal('costo_revision', 15, 2)->default(0);
            $table->decimal('total_final', 15, 2)->default(0);

            // Auditoría
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'numero_orden']);
            $table->index(['tenant_id', 'estado']);
            $table->index(['tenant_id', 'cliente_id']);
        });

        // Servicios aplicados a la orden
        Schema::create('sd_orden_servicio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->foreignId('servicio_id')->nullable()->constrained('sd_servicios')->nullOnDelete();
            $table->string('descripcion', 200)->nullable();
            $table->decimal('cantidad', 10, 2)->default(1);
            $table->decimal('precio_aplicado', 15, 2)->default(0);
            $table->decimal('costo_tecnico_aplicado', 15, 2)->default(0);
            $table->timestamps();
        });

        // Repuestos aplicados a la orden (provienen del inventario)
        Schema::create('sd_orden_repuesto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->foreignId('producto_id')->nullable()->constrained('inventory_productos')->nullOnDelete();
            $table->string('descripcion', 200)->nullable();
            $table->decimal('cantidad', 10, 2)->default(1);
            $table->decimal('precio_unitario', 15, 2)->default(0);
            $table->timestamps();
        });

        // Fotos / multimedia del equipo
        Schema::create('sd_orden_multimedia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->string('ruta', 255);
            $table->string('tipo', 20)->default('imagen');
            $table->string('descripcion', 200)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_orden_multimedia');
        Schema::dropIfExists('sd_orden_repuesto');
        Schema::dropIfExists('sd_orden_servicio');
        Schema::dropIfExists('sd_ordenes');
    }
};
