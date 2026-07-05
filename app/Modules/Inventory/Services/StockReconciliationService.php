<?php
namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Stock;
use Illuminate\Support\Facades\DB;

class StockReconciliationService
{
    /**
     * Recalcula stock_actual de cada producto sumando sus Stock por bodega.
     * Retorna array con los productos corregidos.
     */
    public function reconcile(?int $tenantId = null): array
    {
        $query = Producto::query();

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $productos = $query->select('id', 'tenant_id', 'codigo', 'nombre', 'stock_actual')->get();
        $corregidos = [];

        DB::transaction(function () use ($productos, &$corregidos) {
            foreach ($productos as $producto) {
                $sumaBodegas = Stock::where('producto_id', $producto->id)->sum('cantidad');
                $sumaBodegas = (float) $sumaBodegas;
                $actual = (float) $producto->stock_actual;

                if (abs($sumaBodegas - $actual) > 0.0001) {
                    $diferencia = $sumaBodegas - $actual;
                    $producto->stock_actual = $sumaBodegas;
                    $producto->save();

                    $corregidos[] = [
                        'id' => $producto->id,
                        'codigo' => $producto->codigo,
                        'nombre' => $producto->nombre,
                        'anterior' => $actual,
                        'corregido' => $sumaBodegas,
                        'diferencia' => $diferencia,
                    ];
                }
            }
        });

        return $corregidos;
    }
}
