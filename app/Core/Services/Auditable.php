<?php
namespace App\Core\Services;

trait Auditable
{
    /** Keys that represent tax-related amounts in model data. */
    private const TAX_KEYS = [
        'iva',
        'rete_fuente',
        'rete_iva',
        'rete_ica',
        'base_gravable',
        'total_retenciones',
    ];

    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->audit('created', [], $model->toArray());
        });

        static::updated(function ($model) {
            $changed = $model->getDirty();
            $old = array_intersect_key($model->getOriginal(), $changed);

            if (!empty($changed)) {
                $model->audit('updated', $old, $changed);
            }
        });

        static::deleted(function ($model) {
            $model->audit('deleted', $model->toArray(), []);
        });

        if (method_exists(static::class, 'restored')) {
            static::restored(function ($model) {
                $model->audit('restored', [], $model->toArray());
            });
        }
    }

    public function audit(string $event, array $oldValues, array $newValues): void
    {
        $user = auth()->user();
        $userId = ($user instanceof \App\Models\User) ? $user->id : null;
        $currentTenantId = app()->has('current_tenant') ? app('current_tenant')?->id : null;

        // Extract tax-related amounts into dedicated metadata for fast auditing.
        // For 'updated', $newValues contains only the changed (dirty) fields.
        $metadata = $this->extractTaxMetadata($newValues);

        \App\Core\Models\AuditLog::create([
            'user_id' => $userId,
            'tenant_id' => ($user instanceof \App\Models\User) ? $user->tenant_id : $currentTenantId,
            'event' => $event,
            'auditable_type' => static::class,
            'auditable_id' => $this->getKey(),
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'url' => request()->fullUrl(),
            'description' => $this->auditDescription($event, $oldValues, $newValues),
            'metadata' => $metadata ?: null,
        ]);
    }

    /**
     * Extract tax-related keys from the given values array.
     *
     * Only non-null, non-zero values are included so the metadata stays clean.
     */
    protected function extractTaxMetadata(array $values): array
    {
        $filtered = array_filter(
            array_intersect_key($values, array_flip(self::TAX_KEYS)),
            static fn ($v) => $v !== null && $v !== 0 && $v !== '0' && $v !== 0.0,
        );

        return $filtered;
    }

    protected function auditDescription(string $event, array $oldValues, array $newValues): ?string
    {
        $name = class_basename(static::class);

        return match ($event) {
            'created' => "{$name} creado",
            'updated' => "{$name} actualizado",
            'deleted' => "{$name} eliminado",
            'restored' => "{$name} restaurado",
            default => null,
        };
    }

    public function auditLogs()
    {
        return $this->morphMany(\App\Core\Models\AuditLog::class, 'auditable');
    }
}
