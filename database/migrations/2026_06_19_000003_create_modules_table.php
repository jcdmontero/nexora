<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('modules', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('class'); // Directorio dentro de app/Modules/
            $table->string('version')->default('1.0.0');
            $table->text('description')->nullable();
            $table->boolean('is_core')->default(false);
            $table->json('dependencies')->nullable();
            $table->json('permissions')->nullable();
            $table->boolean('is_active_globally')->default(true);
            $table->string('estado')->default('desarrollo'); // desarrollo|qa|certificacion|publicado|deprecado|retirado
            $table->json('certificacion')->nullable(); // checklist de certificación
            $table->timestamps();
        });

        Schema::create('tenant_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            $table->string('module_code');
            $table->boolean('is_active')->default(false);
            $table->json('settings')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'module_code']);
            $table->foreign('module_code')->references('code')->on('modules')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_modules');
        Schema::dropIfExists('modules');
    }
};
