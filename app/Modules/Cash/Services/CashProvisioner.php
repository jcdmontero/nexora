<?php

namespace App\Modules\Cash\Services;

use App\Core\Models\Tenant;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\Denominacion;

/**
 * Siembra los datos iniciales del módulo Cash para un tenant:
 *  - Denominaciones estándar de la moneda colombiana (billetes y monedas).
 *  - Una caja principal por defecto para que el tenant pueda operar de inmediato.
 *
 * Idempotente: usa firstOrCreate para no duplicar al re-activar el módulo.
 */
class CashProvisioner
{
    /**
     * Denominaciones de la moneda colombiana (COP) en orden descendente.
     * 'tipo' = billete | moneda.
     */
    private const DENOMINACIONES_COP = [
        ['tipo' => 'billete', 'valor' => 100000],
        ['tipo' => 'billete', 'valor' => 50000],
        ['tipo' => 'billete', 'valor' => 20000],
        ['tipo' => 'billete', 'valor' => 10000],
        ['tipo' => 'billete', 'valor' => 5000],
        ['tipo' => 'moneda',  'valor' => 2000],
        ['tipo' => 'moneda',  'valor' => 1000],
        ['tipo' => 'moneda',  'valor' => 500],
        ['tipo' => 'moneda',  'valor' => 200],
        ['tipo' => 'moneda',  'valor' => 100],
    ];

    public function provisionForTenant(Tenant $tenant): void
    {
        $tenantId = $tenant->id;

        // ─── Denominaciones COP ───
        foreach (self::DENOMINACIONES_COP as $orden => $denom) {
            Denominacion::updateOrCreate(
                ['tenant_id' => $tenantId, 'valor' => $denom['valor']],
                [
                    'tipo' => $denom['tipo'],
                    'orden' => $orden,
                    'activo' => true,
                ]
            );
        }

        // ─── Caja principal por defecto ───
        // Garantiza que el tenant tenga al menos una caja activa para abrir turnos.
        Caja::firstOrCreate(
            ['tenant_id' => $tenantId, 'nombre' => 'Caja Principal'],
            ['activa' => true]
        );
    }
}
