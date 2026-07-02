<?php

namespace Tests\Feature\Core;

use App\Core\Models\Tenant;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Sales\Models\Factura;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PortalClientesTest extends TestCase
{
    use RefreshDatabase;

    private $tenant;
    private $cliente;
    private $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Company A',
            'slug' => 'company-a',
            'email' => 'company@a.com',
        ]);

        $this->user = \App\Models\User::create([
            'name' => 'System User',
            'email' => 'system@user.com',
            'password' => Hash::make('password'),
            'tenant_id' => $this->tenant->id,
        ]);

        $this->cliente = Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Carlos',
            'apellidos' => 'Gómez',
            'email' => 'carlos@gomez.com',
            'password' => Hash::make('secret123'),
            'portal_active' => true,
            'tipo_documento' => 'CC',
            'numero_documento' => '87654321',
        ]);
    }

    public function test_guest_is_redirected_to_portal_login()
    {
        $response = $this->get('/portal/dashboard');

        $response->assertRedirect('/portal/login');
    }

    public function test_client_cannot_login_if_portal_inactive()
    {
        $this->cliente->update(['portal_active' => false]);

        $response = $this->post('/portal/login', [
            'email' => 'carlos@gomez.com',
            'password' => 'secret123',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertFalse(auth('cliente')->check());
    }

    public function test_client_can_login_successfully()
    {
        $response = $this->post('/portal/login', [
            'email' => 'carlos@gomez.com',
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/portal/dashboard');
        $this->assertTrue(auth('cliente')->check());
        $this->assertEquals($this->cliente->id, auth('cliente')->id());
    }

    public function test_authenticated_client_can_access_dashboard()
    {
        $this->actingAs($this->cliente, 'cliente');

        $response = $this->get('/portal/dashboard');

        $response->assertStatus(200);
    }

    public function test_authenticated_client_can_access_ordenes_list()
    {
        $this->actingAs($this->cliente, 'cliente');

        // Crear una orden
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'numero_orden' => 'ORD-1234',
            'precio_cliente' => 50000,
            'total_final' => 50000,
            'estado' => 'recibido',
        ]);

        $response = $this->get('/portal/ordenes');

        $response->assertStatus(200);
    }

    public function test_authenticated_client_can_access_facturas_list()
    {
        $this->actingAs($this->cliente, 'cliente');

        // Crear una factura
        $factura = Factura::create([
            'tenant_id' => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'user_id' => $this->user->id,
            'numero' => 'FAC-1234',
            'subtotal' => 100000,
            'impuestos' => 19000,
            'total' => 119000,
            'estado' => 'pendiente',
            'metodo_pago' => 'efectivo',
        ]);

        $response = $this->get('/portal/facturas');

        $response->assertStatus(200);
    }
}
