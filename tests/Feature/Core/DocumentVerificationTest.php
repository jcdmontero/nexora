<?php

namespace Tests\Feature\Core;

use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Sales\Models\Factura;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DocumentVerificationTest extends TestCase
{
    use RefreshDatabase;

    private $tenant;
    private $user;
    private $cliente;

    protected function setUp(): void
    {
        parent::setUp();

        // Crear base para las pruebas
        $this->tenant = Tenant::create([
            'name' => 'Test Company',
            'slug' => 'test-company',
            'email' => 'test@test.com',
        ]);

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'tenant_id' => $this->tenant->id,
        ]);

        $this->cliente = Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'juan@perez.com',
            'tipo_documento' => 'CC',
            'numero_documento' => '12345678',
        ]);
    }

    public function test_fails_verification_with_invalid_token()
    {
        $response = $this->get('/verificar/factura/invalid-token-1234');

        $response->assertStatus(200);
        $response->assertSee('Error de Validación');
        $response->assertSee('El código de verificación no corresponde a ningún documento registrado');
    }

    public function test_verifies_factura_successfully()
    {
        $factura = Factura::create([
            'tenant_id' => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'user_id' => $this->user->id,
            'numero' => 'FAC-9999',
            'subtotal' => 100000,
            'impuestos' => 19000,
            'total' => 119000,
            'estado' => 'pagada',
            'metodo_pago' => 'efectivo',
        ]);

        $this->assertNotEmpty($factura->verification_token);

        $response = $this->get("/verificar/factura/{$factura->verification_token}");

        $response->assertStatus(200);
        $response->assertSee('Documento Válido');
        $response->assertSee('Original');
        $response->assertSee('Factura de Venta');
        $response->assertSee('FAC-9999');
        $response->assertSee('Juan Pérez');
    }

    public function test_verifies_orden_reparacion_successfully()
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'cliente_id' => $this->cliente->id,
            'numero_orden' => 'ORD-9999',
            'precio_cliente' => 80000,
            'total_final' => 80000,
            'estado' => 'recibido',
        ]);

        $this->assertNotEmpty($orden->verification_token);

        $response = $this->get("/verificar/orden/{$orden->verification_token}");

        $response->assertStatus(200);
        $response->assertSee('Documento Válido');
        $response->assertSee('Original');
        $response->assertSee('Orden de Servicio');
        $response->assertSee('ORD-9999');
        $response->assertSee('Juan Pérez');
    }
}
