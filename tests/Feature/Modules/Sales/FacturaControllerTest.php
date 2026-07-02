<?php

namespace Tests\Feature\Modules\Sales;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Sales\Models\Factura;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FacturaControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'sales',
            'name' => 'Ventas / POS',
            'class' => 'Sales',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'sales',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    public function test_facturas_index_requires_auth(): void
    {
        auth()->logout();
        $response = $this->get(route('sales.facturas.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_facturas_index_requires_permission(): void
    {
        $userSinPermiso = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => false]);
        $this->actingAs($userSinPermiso);

        $response = $this->get(route('sales.facturas.index'));
        $response->assertStatus(403);
    }

    public function test_facturas_index_muestra_facturas_del_tenant(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
            'numero' => 'POS-20260101-123',
            'total' => 50000,
        ]);

        $response = $this->get(route('sales.facturas.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('facturas.data.0.numero', 'POS-20260101-123')
        );
    }

    public function test_facturas_index_no_muestra_facturas_de_otro_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        Factura::factory()->create([
            'tenant_id' => $tenantB->id,
            'numero' => 'POS-B-0001',
        ]);

        $response = $this->get(route('sales.facturas.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('facturas.data', [])
        );
    }

    public function test_facturas_index_filtra_por_numero(): void
    {
        Factura::factory()->create(['tenant_id' => $this->tenant->id, 'user_id' => $this->user->id, 'numero' => 'POS-ABC-001']);
        Factura::factory()->create(['tenant_id' => $this->tenant->id, 'user_id' => $this->user->id, 'numero' => 'POS-XYZ-002']);

        $response = $this->get(route('sales.facturas.index', ['search' => 'ABC']));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('facturas.data.0.numero', 'POS-ABC-001')
            ->where('facturas.data', fn ($data) => count($data) === 1)
        );
    }

    public function test_facturas_index_pagina_correctamente(): void
    {
        for ($i = 0; $i < 20; $i++) {
            Factura::factory()->create([
                'tenant_id' => $this->tenant->id,
                'user_id' => $this->user->id,
                'numero' => "POS-PAGE-{$i}",
            ]);
        }

        $response = $this->get(route('sales.facturas.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('facturas.per_page', 15)
        );
    }

    public function test_facturas_show_bloquea_acceso_de_otro_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        $facturaB = Factura::factory()->create(['tenant_id' => $tenantB->id]);

        $response = $this->get(route('sales.facturas.show', $facturaB));
        $response->assertStatus(404);
    }

    public function test_facturas_show_carga_factura_con_rels(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->get(route('sales.facturas.show', $factura));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('factura.id', $factura->id)
            ->where('factura.numero', $factura->numero)
        );
    }

    public function test_facturas_pdf_bloquea_acceso_de_otro_tenant(): void
    {
        $tenantB = Tenant::factory()->create();
        $facturaB = Factura::factory()->create(['tenant_id' => $tenantB->id]);

        $response = $this->get(route('sales.facturas.pdf', $facturaB));
        $response->assertStatus(404);
    }

    public function test_facturas_pdf_devuelve_stream(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->get(route('sales.facturas.pdf', $factura));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    public function test_facturas_pdf_debug_mode_devuelve_html(): void
    {
        $factura = Factura::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->user->id,
        ]);

        $response = $this->get(route('sales.facturas.pdf', [$factura, 'debug' => true]));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');
    }
}