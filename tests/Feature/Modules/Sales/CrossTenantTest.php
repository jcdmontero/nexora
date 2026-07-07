<?php

namespace Tests\Feature\Modules\Sales;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Sales\Models\Factura;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CrossTenantTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private User $userA;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            ['code' => 'sales', 'name' => 'Ventas', 'class' => 'Sales', 'version' => '1.0.0', 'is_active_globally' => true, 'estado' => 'publicado'],
        ]);

        // Tenant A
        $this->tenantA = Tenant::create(['name' => 'Empresa A', 'slug' => uniqid('sta-'), 'email' => 'a@test.com', 'is_active' => true]);
        app()->bind('current_tenant', fn () => $this->tenantA);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->tenantA->id);

        TenantModule::create(['tenant_id' => $this->tenantA->id, 'module_code' => 'sales', 'is_active' => true]);

        $this->userA = User::factory()->create(['tenant_id' => $this->tenantA->id, 'is_superadmin' => true]);
        foreach (['sales:view', 'sales:create', 'sales:edit', 'sales:delete', 'sales:anular'] as $perm) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
        $this->userA->givePermissionTo(...['sales:view', 'sales:create', 'sales:edit', 'sales:delete', 'sales:anular']);
        $this->actingAs($this->userA);

        // Tenant B
        $this->tenantB = Tenant::create(['name' => 'Empresa B', 'slug' => uniqid('stb-'), 'email' => 'b@test.com', 'is_active' => true]);

        // Factura del Tenant B
        $userB = User::factory()->create(['tenant_id' => $this->tenantB->id]);
        $this->facturaBId = \DB::table('sales_facturas')->insertGetId([
            'tenant_id' => $this->tenantB->id,
            'user_id' => $userB->id,
            'numero' => 'FAC-B-001',
            'subtotal' => 100000,
            'impuestos' => 19000,
            'total' => 119000,
            'estado' => 'emitida',
            'metodo_pago' => 'efectivo',
            'verification_token' => \Illuminate\Support\Str::uuid(),
        ]);
    }

    // ── VISIBILIDAD ──────────────────────────────────────────────────────

    public function test_factura_no_visible_en_otro_tenant(): void
    {
        $this->get(route('sales.facturas.index'))->assertOk();

        $facturas = Factura::all();
        $this->assertEmpty($facturas->where('tenant_id', $this->tenantB->id));
    }

    // ── ACCESO DIRECTO POR ID ────────────────────────────────────────────

    public function test_show_factura_rechaza_id_de_otro_tenant(): void
    {
        // BelongsToTenant oculta la factura → 404 (no encontrada), no 403
        $this->get(route('sales.facturas.show', $this->facturaBId))->assertNotFound();
    }

    public function test_pdf_factura_rechaza_id_de_otro_tenant(): void
    {
        $this->get(route('sales.facturas.pdf', $this->facturaBId))->assertNotFound();
    }

    public function test_anular_factura_rechaza_id_de_otro_tenant(): void
    {
        $this->post(route('sales.facturas.anular', $this->facturaBId), [
            'motivo' => 'Intento cross tenant',
        ])->assertNotFound();
    }

    public function test_emitir_factura_rechaza_id_de_otro_tenant(): void
    {
        $this->post(route('sales.facturas.emitir', $this->facturaBId))->assertNotFound();
    }

    // ── AISLAMIENTO POST-CREACIÓN ────────────────────────────────────────

    public function test_factura_creada_en_tenant_a_no_visible_para_tenant_b(): void
    {
        // Crear factura para tenant A
        \DB::table('sales_facturas')->insert([
            'tenant_id' => $this->tenantA->id,
            'user_id' => $this->userA->id,
            'numero' => 'FAC-A-001',
            'subtotal' => 50000,
            'impuestos' => 9500,
            'total' => 59500,
            'estado' => 'emitida',
            'metodo_pago' => 'efectivo',
            'verification_token' => \Illuminate\Support\Str::uuid(),
        ]);

        $this->get(route('sales.facturas.index'))->assertOk();

        $allFacturas = Factura::withoutGlobalScopes()->where('tenant_id', $this->tenantB->id)->get();
        $visibleFacturas = Factura::all();

        $this->assertNotEmpty($allFacturas, 'Factura B debe existir en BD');
        $this->assertEmpty($visibleFacturas->where('id', $this->facturaBId), 'Factura B no debe ser visible');
    }
}
