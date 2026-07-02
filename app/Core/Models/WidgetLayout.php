<?php

namespace App\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WidgetLayout extends Model
{
    protected $fillable = [
        'user_id',
        'tenant_id',
        'view_name',
        'layout',
    ];

    protected $casts = [
        'layout' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public static function getForUser(int $userId, int $tenantId, string $viewName = 'default'): ?self
    {
        return static::where('user_id', $userId)
            ->where('tenant_id', $tenantId)
            ->where('view_name', $viewName)
            ->first();
    }

    public static function getOrCreateForUser(int $userId, int $tenantId, string $viewName = 'default'): self
    {
        return static::firstOrCreate(
            ['user_id' => $userId, 'tenant_id' => $tenantId, 'view_name' => $viewName],
            ['layout' => []]
        );
    }
}
