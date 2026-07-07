<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_contactos', function (Blueprint $table) {
            if (!Schema::hasColumn('crm_contactos', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('crm_oportunidades', function (Blueprint $table) {
            if (!Schema::hasColumn('crm_oportunidades', 'deleted_at')) {
                $table->softDeletes();
            }

            $indexes = collect(Schema::getIndexes('crm_oportunidades'))->pluck('name');
            if (!$indexes->contains('crm_oportunidades_tenant_id_etapa_index')) {
                $table->index(['tenant_id', 'etapa']);
            }
            if (!$indexes->contains('crm_oportunidades_cliente_id_index')) {
                $table->index('cliente_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('crm_oportunidades', function (Blueprint $table) {
            $indexes = collect(Schema::getIndexes('crm_oportunidades'))->pluck('name');
            if ($indexes->contains('crm_oportunidades_tenant_id_etapa_index')) {
                $table->dropIndex('crm_oportunidades_tenant_id_etapa_index');
            }
            if ($indexes->contains('crm_oportunidades_cliente_id_index')) {
                $table->dropIndex('crm_oportunidades_cliente_id_index');
            }
            if (Schema::hasColumn('crm_oportunidades', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        Schema::table('crm_contactos', function (Blueprint $table) {
            if (Schema::hasColumn('crm_contactos', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
