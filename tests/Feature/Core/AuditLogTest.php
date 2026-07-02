<?php

namespace Tests\Feature\Core;

use App\Core\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_created_event_logs_audit(): void
    {
        $user = User::factory()->create(['is_superadmin' => true]);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => User::class,
            'auditable_id' => $user->id,
            'event' => 'created',
        ]);
    }

    public function test_user_updated_event_logs_audit(): void
    {
        $user = User::factory()->create(['is_superadmin' => true]);
        $user->update(['name' => 'Updated Name']);

        $this->assertDatabaseHas('audit_logs', [
            'auditable_type' => User::class,
            'auditable_id' => $user->id,
            'event' => 'updated',
        ]);
    }
}
