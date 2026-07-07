<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropForeign(['sede_id']);
            $table->foreign('sede_id')->references('id')->on('core_sedes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('hr_empleados', function (Blueprint $table) {
            $table->dropForeign(['sede_id']);
            $table->foreign('sede_id')->references('id')->on('core_sedes')->cascadeOnDelete();
        });
    }
};
