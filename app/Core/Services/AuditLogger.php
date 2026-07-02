<?php
namespace App\Core\Services;

use App\Core\Models\AuditLog;
use App\Models\User;

class AuditLogger
{
    public static function log(
        string $event,
        string $auditableType,
        int|string $auditableId,
        array $oldValues = [],
        array $newValues = [],
        ?string $description = null,
        ?User $user = null,
    ): AuditLog {
        $user ??= auth()->user();

        return AuditLog::create([
            'user_id' => $user?->id,
            'tenant_id' => $user?->tenant_id ?? app()->has('current_tenant') ? app('current_tenant')?->id : null,
            'event' => $event,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'url' => request()->fullUrl(),
            'description' => $description,
        ]);
    }
}
