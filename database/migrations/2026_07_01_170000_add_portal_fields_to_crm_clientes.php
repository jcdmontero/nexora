<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_clientes', function (Blueprint $table) {
            $table->string('password')->nullable()->after('email');
            $table->boolean('portal_active')->default(false)->after('password');
            $table->timestamp('last_login_at')->nullable()->after('portal_active');
            $table->rememberToken()->after('last_login_at');
        });
    }

    public function down(): void
    {
        Schema::table('crm_clientes', function (Blueprint $table) {
            $table->dropColumn(['password', 'portal_active', 'last_login_at', 'remember_token']);
        });
    }
};