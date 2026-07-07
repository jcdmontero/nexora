<?php

namespace Tests\Feature\Core;

use App\Core\Models\Module;
use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Core\Services\ModuleRegistry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SuperAdminTenantTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_creates_tenant_with_module_and_runs_its_migrations(): void
    {
        $this->withoutMiddleware();

        // Registrar el catálogo real de módulos
        app(ModuleRegistry::class)->scanAndRegister();
        // 'core' vive en app/Core (no en app/Modules), lo registra el seeder en producción
        Module::firstOrCreate(['code' => 'core'], [
            'name' => 'Core', 'class' => 'Core', 'version' => '1.0.0',
            'is_core' => true, 'is_active_globally' => true, 'estado' => 'publicado',
        ]);
        // Usar notifications (sin dependencias, liviano) en vez de inventory (3 dependencias pesadas)
        Module::where('code', 'notifications')->update(['estado' => 'publicado']);

        $superadmin = User::factory()->create(['is_superadmin' => true]);
        $this->actingAs($superadmin);

        $this->post(route('superadmin.tenants.store'), [
            'name' => 'Taller Demo',
            'slug' => 'taller-demo',
            'email' => 'contacto@taller.com',
            'plan' => 'Pro',
            'modulos' => ['notifications'],
            'admin_name' => 'Ana Gómez',
            'admin_email' => 'ana@taller.com',
            'admin_password' => 'password123',
            'admin_password_confirmation' => 'password123',
        ]);

        $tenant = Tenant::where('slug', 'taller-demo')->first();
        $this->assertNotNull($tenant, 'La empresa debió crearse');

        // Módulo core + notifications activos
        $this->assertTrue(TenantModule::where('tenant_id', $tenant->id)->where('module_code', 'core')->where('is_active', true)->exists());
        $this->assertTrue(TenantModule::where('tenant_id', $tenant->id)->where('module_code', 'notifications')->where('is_active', true)->exists());

        // La activación corrió las migraciones del módulo
        $this->assertTrue(Schema::hasTable('notif_notificaciones'), 'Las migraciones de notifications debieron ejecutarse');

        // El administrador de la empresa fue creado y vinculado
        $this->assertDatabaseHas('users', [
            'email' => 'ana@taller.com',
            'tenant_id' => $tenant->id,
            'is_superadmin' => false,
        ]);
    }

    public function test_non_superadmin_cannot_access_portal(): void
    {
        $user = User::factory()->create(['is_superadmin' => false]);
        $this->actingAs($user);

        $this->get(route('superadmin.tenants.index'))->assertForbidden();
    }
}
