<?php
namespace App\Core\Concerns;

use Illuminate\Database\Eloquent\Builder;

/**
 * Aislamiento multi-tenant para modelos de módulos.
 * - Autoasigna tenant_id al crear (desde el tenant actual).
 * - Aplica un global scope que filtra por el tenant actual.
 * Usar en todos los modelos dentro de app/Modules/.
 */
trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        static::creating(function ($model) {
            if (empty($model->tenant_id) && app()->has('current_tenant')) {
                $model->tenant_id = app('current_tenant')->id;
            }
        });

        static::addGlobalScope('tenant', function (Builder $query) {
            if (app()->has('current_tenant')) {
                $table = $query->getModel()->getTable();
                $query->where("{$table}.tenant_id", app('current_tenant')->id);
            }
        });
    }
}
