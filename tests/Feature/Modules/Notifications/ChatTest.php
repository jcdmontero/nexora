<?php

namespace Tests\Feature\Modules\Notifications;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Notifications\Models\ChatConversacion;
use App\Modules\Notifications\Models\ChatMensaje;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant1;
    private Tenant $tenant2;
    private User $user1;
    private User $user2;
    private User $otherTenantUser;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'notifications',
            'name' => 'Notificaciones',
            'class' => 'Notifications',
            'version' => '1.0.0',
        ]);

        $this->tenant1 = Tenant::factory()->create(['name' => 'Empresa A']);
        $this->tenant2 = Tenant::factory()->create(['name' => 'Empresa B']);

        foreach ([$this->tenant1, $this->tenant2] as $t) {
            TenantModule::create([
                'tenant_id' => $t->id,
                'module_code' => 'notifications',
                'is_active' => true,
            ]);
        }

        $this->user1 = User::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'is_superadmin' => true,
            'name' => 'Usuario T1',
        ]);
        $this->user2 = User::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'is_superadmin' => true,
            'name' => 'Otro T1',
        ]);
        $this->otherTenantUser = User::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'is_superadmin' => true,
            'name' => 'Usuario T2',
        ]);
    }

    public function test_chat_store_creates_conversacion(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        $response = $this->postJson(route('chat.store'), [
            'user_id' => $this->user2->id,
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['conversacion' => ['id']]);

        $this->assertDatabaseHas('chat_conversaciones', [
            'tenant_id' => $this->tenant1->id,
            'tipo' => 'directo',
        ]);
    }

    public function test_chat_store_rejects_self_chat(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        $response = $this->postJson(route('chat.store'), [
            'user_id' => $this->user1->id,
        ]);

        $response->assertStatus(422);
        $response->assertJson(['error' => 'No puedes crear un chat contigo mismo']);
    }

    public function test_chat_store_rejects_cross_tenant_user(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        // El user_id existe pero pertenece a otro tenant → validation debe fallar
        $response = $this->postJson(route('chat.store'), [
            'user_id' => $this->otherTenantUser->id,
        ]);

        $this->assertTrue(
            $response->status() === 422 || $response->status() === 302,
            'Debe rechazar usuario de otro tenant (422 o redirect)'
        );
    }

    public function test_chat_mensajes_isolates_by_tenant(): void
    {
        // user1 crea conversación con user2 (ambos tenant1)
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        $conv = ChatConversacion::create([
            'tenant_id' => $this->tenant1->id,
            'tipo' => 'directo',
            'participantes' => [$this->user1->id, $this->user2->id],
        ]);

        ChatMensaje::create([
            'tenant_id' => $this->tenant1->id,
            'conversacion_id' => $conv->id,
            'user_id' => $this->user1->id,
            'mensaje' => 'Hola mundo',
        ]);

        // Crear usuario en tenant2 para FK consistency
        $userT2 = User::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'is_superadmin' => true,
        ]);

        $conv2 = ChatConversacion::create([
            'tenant_id' => $this->tenant2->id,
            'tipo' => 'directo',
            'participantes' => [$userT2->id, $this->otherTenantUser->id],
        ]);
        ChatMensaje::create([
            'tenant_id' => $this->tenant2->id,
            'conversacion_id' => $conv2->id,
            'user_id' => $userT2->id,
            'mensaje' => 'Mensaje secreto de otro tenant',
        ]);

        // user1 intenta acceder a mensajes de tenant2 — BelongsToTenant scope → 404
        $response = $this->getJson(route('chat.mensajes', $conv2->id));
        $response->assertStatus(404);

        // user1 intenta enviar mensaje a conversación de tenant2
        $response = $this->postJson(route('chat.enviar', $conv2->id), [
            'mensaje' => 'Hacked',
        ]);
        $response->assertStatus(404);
    }

    public function test_chat_enviar_mensaje(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        $conv = ChatConversacion::create([
            'tenant_id' => $this->tenant1->id,
            'tipo' => 'directo',
            'participantes' => [$this->user1->id, $this->user2->id],
        ]);

        $response = $this->postJson(route('chat.enviar', $conv->id), [
            'mensaje' => 'Nuevo mensaje de prueba',
        ]);

        $response->assertOk();
        $response->assertJsonPath('mensaje.mensaje', 'Nuevo mensaje de prueba');

        $this->assertDatabaseHas('chat_mensajes', [
            'conversacion_id' => $conv->id,
            'user_id' => $this->user1->id,
            'mensaje' => 'Nuevo mensaje de prueba',
        ]);
    }

    public function test_chat_index_returns_only_own_tenant_conversations(): void
    {
        $this->actingAs($this->user1);
        app()->instance('current_tenant', $this->tenant1);

        // Conversación en tenant1
        ChatConversacion::create([
            'tenant_id' => $this->tenant1->id,
            'tipo' => 'directo',
            'participantes' => [$this->user1->id, $this->user2->id],
        ]);

        // Conversación en tenant2
        ChatConversacion::create([
            'tenant_id' => $this->tenant2->id,
            'tipo' => 'directo',
            'participantes' => [$this->otherTenantUser->id, 999],
        ]);

        $response = $this->getJson(route('chat.index'));
        $response->assertOk();
        $response->assertJsonCount(1, 'conversaciones');
    }
}
