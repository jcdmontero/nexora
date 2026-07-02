<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * NOTA DE DISEÑO (cambio respecto al legacy servicemanager):
     * 
     * En el legacy (servicemanager), los técnicos eran usuarios del sistema
     * con rol TECNICO, y más tarde se migraron a empleados (rh_empleados)
     * con cargo productivo. Esto OBLIGABA a tener RRHH/Nómina activo.
     * 
     * En Nexora separamos el concepto:
     * - "Prestador" = entidad única que puede recibir órdenes de trabajo.
     * - tipo_vinculacion = CONTRATISTA | EMPLEADO | FREELANCE | COMISIONISTA
     * - Si es EMPLEADO → tiene un empleado_id que lo vincula a RRHH (opcional).
     * - Si es CONTRATISTA → solo existe aquí, sin RRHH.
     * 
     * Esto permite que ServiceDesk funcione SIN RRHH activo (ideal para
     * talleres pequeños que solo pagan comisiones).
     * 
     * @see \App\Modules\Hr\Models\Empleado para el vínculo opcional.
     */
    public function up(): void
    {
        Schema::create('sd_prestadores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            // Datos básicos
            $table->string('tipo_documento', 20)->default('CC');
            $table->string('numero_documento', 50)->nullable();
            $table->string('nombre_completo', 200);
            $table->string('email', 150)->nullable();
            $table->string('telefono', 50)->nullable();

            // Tipo de vinculación
            $table->string('tipo_vinculacion', 30)->default('CONTRATISTA');
            // CONTRATISTA = pago por comisión (default)
            // EMPLEADO = vinculado a RRHH, puede tener comisión adicional
            // FREELANCE = externo esporádico
            // COMISIONISTA = solo comisión, sin otro vínculo

            // Comisión default (sobreescribible por servicio)
            $table->decimal('porcentaje_comision', 5, 2)->nullable();

            // Vínculo opcional a RRHH (solo si tipo_vinculacion = EMPLEADO)
            // La FK se omite si hr_empleados aún no existe (RRHH no está instalado).
            $table->unsignedBigInteger('empleado_id')->nullable();
            if (Schema::hasTable('hr_empleados')) {
                $table->foreign('empleado_id')->references('id')->on('hr_empleados')->nullOnDelete();
            }

            // Usuario de sistema (si aplica)
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Si una orden de servicio puede asignarse sin costo (no paga comisión)
            $table->boolean('es_gratuito')->default(false);

            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'activo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_prestadores');
    }
};
