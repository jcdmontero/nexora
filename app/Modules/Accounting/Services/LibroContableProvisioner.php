<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\LibroContable;

class LibroContableProvisioner
{
    /**
     * Crea los libros contables por defecto para un tenant.
     */
    public function provisionForTenant(Tenant $tenant): void
    {
        foreach (LibroContable::DEFAULT_BOOKS as $book) {
            LibroContable::withoutGlobalScopes()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'codigo' => $book['codigo'],
                ],
                [
                    'nombre' => $book['nombre'],
                    'tipo' => $book['tipo'],
                    'descripcion' => $book['descripcion'],
                    'filtro_cuentas' => $book['filtro_cuentas'],
                    'filtro_modulo' => $book['filtro_modulo'],
                    'is_sistema' => true,
                    'activo' => true,
                ]
            );
        }
    }
}
