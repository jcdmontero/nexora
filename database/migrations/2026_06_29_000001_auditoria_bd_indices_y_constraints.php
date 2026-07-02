<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Auditoría BD — Fase 5.
 *
 * Correcciones aplicadas:
 *  1. inventory_recepciones.orden_compra_id → índice (soft reference sin índice)
 *  2. sd_servicios(tenant_id, codigo)       → unique constraint
 *  3. crm_contactos                         → soft deletes
 *  4. crm_oportunidades                     → soft deletes
 *  5. Índices compuestos de rendimiento en tablas de alta consulta
 *
 * Nota: Las tablas de módulos se crean DESPUÉS de las migraciones core en el entorno
 * de tests (SQLite :memory:), por lo que se usan guards hasTable()/hasColumn().
 * En producción (PostgreSQL) todas las tablas existen antes de ejecutar esta migración.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ─── 1. inventory_recepciones.orden_compra_id ─────────────────────
        // Soft reference a purchasing_ordenes sin índice → búsquedas O(n)
        if (Schema::hasTable('inventory_recepciones')) {
            Schema::table('inventory_recepciones', function (Blueprint $table) {
                $table->index('orden_compra_id', 'inv_recepciones_orden_compra_idx');
            });
        }

        // ─── 2. sd_servicios — unique por tenant+codigo ───────────────────
        // El catálogo de servicios no tenía unicidad por código dentro del tenant
        if (Schema::hasTable('sd_servicios')) {
            Schema::table('sd_servicios', function (Blueprint $table) {
                $table->unique(['tenant_id', 'codigo'], 'sd_servicios_tenant_codigo_unique');
            });
        }

        // ─── 3. crm_contactos — soft deletes ──────────────────────────────
        // Registros de contacto eliminados deben conservarse por auditoría
        if (Schema::hasTable('crm_contactos') && !Schema::hasColumn('crm_contactos', 'deleted_at')) {
            Schema::table('crm_contactos', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // ─── 4. crm_oportunidades — soft deletes ──────────────────────────
        // El historial del pipeline de ventas no debe perderse al eliminar
        if (Schema::hasTable('crm_oportunidades') && !Schema::hasColumn('crm_oportunidades', 'deleted_at')) {
            Schema::table('crm_oportunidades', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // ─── 5. Índices de rendimiento ────────────────────────────────────

        // users: filtros por tenant + estado activo (dashboard, listados)
        // users es tabla core → siempre existe
        Schema::table('users', function (Blueprint $table) {
            $table->index(['tenant_id', 'is_active'], 'users_tenant_active_idx');
        });

        // crm_clientes: filtros por activo (listas de clientes vigentes)
        if (Schema::hasTable('crm_clientes')) {
            Schema::table('crm_clientes', function (Blueprint $table) {
                $table->index(['tenant_id', 'activo'], 'crm_clientes_tenant_activo_idx');
            });
        }

        // sales_facturas: reportes por rango de fecha
        if (Schema::hasTable('sales_facturas')) {
            Schema::table('sales_facturas', function (Blueprint $table) {
                $table->index(['tenant_id', 'created_at'], 'sales_facturas_tenant_fecha_idx');
            });
        }

        // sd_ordenes: búsquedas cronológicas de órdenes de servicio
        if (Schema::hasTable('sd_ordenes')) {
            Schema::table('sd_ordenes', function (Blueprint $table) {
                $table->index(['tenant_id', 'created_at'], 'sd_ordenes_tenant_fecha_idx');
            });
        }

        // purchasing_ordenes: seguimiento por estado (pendiente, recibida, etc.)
        if (Schema::hasTable('purchasing_ordenes')) {
            Schema::table('purchasing_ordenes', function (Blueprint $table) {
                $table->index(['tenant_id', 'estado'], 'purchasing_ordenes_tenant_estado_idx');
            });
        }

        // hr_contratos: obtención del contrato activo por empleado (NominaService)
        if (Schema::hasTable('hr_contratos')) {
            Schema::table('hr_contratos', function (Blueprint $table) {
                $table->index(['empleado_id', 'fecha_inicio'], 'hr_contratos_empleado_fecha_idx');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('hr_contratos')) {
            Schema::table('hr_contratos', function (Blueprint $table) {
                $table->dropIndex('hr_contratos_empleado_fecha_idx');
            });
        }

        if (Schema::hasTable('purchasing_ordenes')) {
            Schema::table('purchasing_ordenes', function (Blueprint $table) {
                $table->dropIndex('purchasing_ordenes_tenant_estado_idx');
            });
        }

        if (Schema::hasTable('sd_ordenes')) {
            Schema::table('sd_ordenes', function (Blueprint $table) {
                $table->dropIndex('sd_ordenes_tenant_fecha_idx');
            });
        }

        if (Schema::hasTable('sales_facturas')) {
            Schema::table('sales_facturas', function (Blueprint $table) {
                $table->dropIndex('sales_facturas_tenant_fecha_idx');
            });
        }

        if (Schema::hasTable('crm_clientes')) {
            Schema::table('crm_clientes', function (Blueprint $table) {
                $table->dropIndex('crm_clientes_tenant_activo_idx');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_tenant_active_idx');
        });

        if (Schema::hasTable('crm_oportunidades') && Schema::hasColumn('crm_oportunidades', 'deleted_at')) {
            Schema::table('crm_oportunidades', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('crm_contactos') && Schema::hasColumn('crm_contactos', 'deleted_at')) {
            Schema::table('crm_contactos', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('sd_servicios')) {
            Schema::table('sd_servicios', function (Blueprint $table) {
                $table->dropUnique('sd_servicios_tenant_codigo_unique');
            });
        }

        if (Schema::hasTable('inventory_recepciones')) {
            Schema::table('inventory_recepciones', function (Blueprint $table) {
                $table->dropIndex('inv_recepciones_orden_compra_idx');
            });
        }
    }
};
