<?php

namespace App\Modules\Purchasing\Services;

use App\Modules\Purchasing\Models\Proveedor;

class PurchasingService
{
    /**
     * Verifica si un proveedor puede ser eliminado.
     * No se puede eliminar si tiene órdenes de compra activas (no canceladas/recibidas/facturadas).
     *
     * @return array{can_delete: bool, reason: string|null, pending_count: int}
     */
    public function canDeleteProveedor(Proveedor $proveedor): array
    {
        $pendingCount = $proveedor->ordenes()
            ->whereNotIn('estado', ['cancelada', 'recibida', 'facturada'])
            ->count();

        if ($pendingCount > 0) {
            return [
                'can_delete' => false,
                'reason' => "Tiene {$pendingCount} órden(es) de compra activa(s).",
                'pending_count' => $pendingCount,
            ];
        }

        return [
            'can_delete' => true,
            'reason' => null,
            'pending_count' => 0,
        ];
    }
}
