<?php

namespace App\Modules\Cash\Concerns;

use App\Modules\Cash\Models\ReciboCaja;

trait HasReciboLoader
{
    /**
     * Carga en una sola consulta los recibos asociados a una colección
     * de movimientos de caja, eliminando el N+1.
     *
     * @param  iterable  $movimientos
     * @return array<string, int>  mapa "type::id::monto" => recibo_id
     */
    private function loadRecibosParaMovimientos(iterable $movimientos): array
    {
        $movimientos = collect($movimientos);
        
        $pares = $movimientos->filter(fn ($m) => $m->referencia_type && $m->referencia_id)
            ->map(fn ($m) => [
                'type' => $m->referencia_type,
                'id' => $m->referencia_id,
                'monto' => (float) $m->monto,
            ])
            ->unique()
            ->values();

        if ($pares->isEmpty()) {
            return [];
        }

        $tipos = $pares->pluck('type')->unique()->values()->all();
        $ids = $pares->pluck('id')->unique()->values()->all();

        $recibos = ReciboCaja::where('estado', 'activo')
            ->whereIn('referencia_type', $tipos)
            ->whereIn('referencia_id', $ids)
            ->get();

        $map = [];
        foreach ($recibos as $r) {
            $map[$r->referencia_type . '::' . $r->referencia_id . '::' . (float) $r->monto] = $r->id;
        }

        return $map;
    }
}
