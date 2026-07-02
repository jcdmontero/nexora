<?php

use App\Core\Models\Tenant;

if (!function_exists('tenant')) {
    /**
     * Obtiene el tenant actual de la aplicación.
     */
    function tenant(): ?Tenant
    {
        return app()->has('current_tenant') ? app('current_tenant') : null;
    }
}

if (!function_exists('tenantId')) {
    /**
     * Obtiene el ID del tenant actual.
     */
    function tenantId(): ?int
    {
        $t = tenant();
        return $t?->id;
    }
}
