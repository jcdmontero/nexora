<?php

namespace Tests\Feature\Core;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CajaTest extends TestCase
{
    use RefreshDatabase;

    public function test_caja_estado_requires_auth(): void
    {
        $response = $this->getJson(route('cash.caja.estado'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_caja_estado_returns_closed_status_initially(): void
    {
        $tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'cash',
            'name' => 'Tesorería',
            'class' => 'Cash',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $tenant->id,
            'module_code' => 'cash',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'is_superadmin' => true,
        ]);
        
        $this->actingAs($user);
        
        // Simular tenant en el container
        app()->instance('current_tenant', $tenant);

        // Crear una caja
        $caja = Caja::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Caja Principal',
            'activa' => true,
        ]);

        $response = $this->getJson(route('cash.caja.estado'));

        $response->assertStatus(200)
            ->assertJson([
                'cajaAbierta' => false,
                'sesionActiva' => null,
            ]);
            
        $this->assertCount(1, $response->json('cajasDisponibles'));
        $this->assertEquals($caja->id, $response->json('cajasDisponibles.0.id'));
    }

    public function test_caja_estado_returns_open_status_when_active_session(): void
    {
        $tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'cash',
            'name' => 'Tesorería',
            'class' => 'Cash',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $tenant->id,
            'module_code' => 'cash',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
            'is_superadmin' => true,
        ]);
        
        $this->actingAs($user);
        app()->instance('current_tenant', $tenant);

        $caja = Caja::create([
            'tenant_id' => $tenant->id,
            'nombre' => 'Caja Principal',
            'activa' => true,
        ]);

        $sesion = CajaSesion::create([
            'caja_id' => $caja->id,
            'user_id' => $user->id,
            'saldo_inicial' => 10000,
            'estado' => 'abierta',
            'fecha_apertura' => now(),
        ]);

        $response = $this->getJson(route('cash.caja.estado'));

        $response->assertStatus(200)
            ->assertJson([
                'cajaAbierta' => true,
            ]);
            
        $this->assertEquals($sesion->id, $response->json('sesionActiva.id'));
        $this->assertEmpty($response->json('cajasDisponibles'));
    }
}
