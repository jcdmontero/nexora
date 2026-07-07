<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            // #11: user_id cascadeOnDelete → restrictOnDelete
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->restrictOnDelete();
        });

        // #1: Fix UNIQUE global → UNIQUE scoped por tenant
        // SQLite usa nombres de índice diferentes, así que usamos SQL directo
        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            // Buscar y eliminar el índice unique existente en numero
            $indexes = DB::select("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='sales_facturas' AND sql LIKE '%UNIQUE%numero%'");
            foreach ($indexes as $idx) {
                DB::statement("DROP INDEX IF EXISTS \"{$idx->name}\"");
            }
        } else {
            // Postgres / MySQL
            $driver = DB::getDriverName();
            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE sales_facturas DROP CONSTRAINT IF EXISTS sales_facturas_numero_unique');
                DB::statement('DROP INDEX IF EXISTS sales_facturas_numero_index');
            } else {
                try {
                    Schema::table('sales_facturas', function (Blueprint $table) {
                        $table->dropUnique('sales_facturas_numero_unique');
                    });
                } catch (\Exception $e) {}
            }
        }

        $exists = false;
        if ($driver === 'pgsql') {
            $exists = count(DB::select("SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'sales_facturas' AND constraint_name = 'sales_facturas_tenant_id_numero_unique'")) > 0;
        }
        
        if (!$exists) {
            try {
                Schema::table('sales_facturas', function (Blueprint $table) {
                    $table->unique(['tenant_id', 'numero']);
                });
            } catch (\Exception $e) {}
        }
    }

    public function down(): void
    {
        Schema::table('sales_facturas', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'numero']);
            $table->unique(['numero']);
            $table->dropForeign(['user_id']);
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
