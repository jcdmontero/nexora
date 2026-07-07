<?php

namespace App\Modules\ServiceDesk\Services;

use App\Modules\Cash\Services\CajaService;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrdenService
{
    public function __construct(
        private CajaService $cajaService,
    ) {}

    public function crear(array $data, int $userId): OrdenReparacion
    {
        return DB::transaction(function () use ($data, $userId) {
            $data['estado'] = OrdenEstado::Diagnostico->value;

            $orden = OrdenReparacion::create([
                ...collect($data)->except(['servicios', 'repuestos'])->all(),
                'numero_orden' => $this->siguienteNumero(),
                'created_by' => $userId,
                'fecha_recibido' => now(),
            ]);

            $this->syncLineas($orden, $data);
            $orden->load('servicios', 'repuestos');
            $orden->update(['total_final' => $orden->total_cliente]);

            return $orden;
        });
    }

    public function actualizar(OrdenReparacion $orden, array $data, int $userId): void
    {
        DB::transaction(function () use ($data, $userId, $orden) {
            if (!empty($data['prestador_id'])
                && empty($data['estado'])
                && $orden->estado === OrdenEstado::Recibido) {
                $data['estado'] = OrdenEstado::Diagnostico->value;
            }

            $orden->update([
                ...collect($data)->except(['servicios', 'repuestos'])->all(),
                'updated_by' => $userId,
            ]);

            // SD-003: Solo detach si el frontend envía arrays de servicios/repuestos
            if (array_key_exists('servicios', $data)) {
                $orden->servicios()->detach();
            }
            if (array_key_exists('repuestos', $data)) {
                $orden->repuestos()->detach();
            }
            $this->syncLineas($orden, $data);

            $orden->load('servicios', 'repuestos');
            $orden->update(['total_final' => $orden->total_cliente]);
        });
    }

    public function cancelar(OrdenReparacion $orden): void
    {
        $this->revertirAbonos($orden);
        $this->restaurarInventario($orden);

        $factura = $orden->factura;
        if ($factura && !$factura->anulada) {
            $this->anularFactura($factura, $orden);
        }
    }

    public function restaurarInventario(OrdenReparacion $orden): void
    {
        $orden->load('repuestos');

        foreach ($orden->repuestos as $repuesto) {
            $cantidad = (float) $repuesto->pivot->cantidad;
            if ($cantidad > 0) {
                $producto = \App\Modules\Inventory\Models\Producto::find($repuesto->id);
                if ($producto) {
                    $producto->increment('stock_actual', $cantidad);
                }
            }
        }
    }

    public function revertirAbonos(OrdenReparacion $orden): void
    {
        $recibos = \App\Modules\Cash\Models\ReciboCaja::where('referencia_type', get_class($orden))
            ->where('referencia_id', $orden->id)
            ->where('estado', 'activo')
            ->get();

        if ($recibos->isEmpty()) {
            return;
        }

        $reciboService = app(\App\Modules\Cash\Services\ReciboService::class);

        foreach ($recibos as $recibo) {
            try {
                $reciboService->anularRecibo($recibo);
            } catch (\Exception $e) {
                Log::warning("No se pudo anular recibo RC-{$recibo->numero} en cancelación de OT {$orden->numero_orden}: {$e->getMessage()}");
            }
        }

        $orden->update(['abono_inicial' => 0]);
    }

    public function anularFactura(\App\Modules\Sales\Models\Factura $factura, OrdenReparacion $orden): void
    {
        $movimientos = \App\Modules\Cash\Models\MovimientoCaja::where('referencia_type', get_class($factura))
            ->where('referencia_id', $factura->id)
            ->where('tipo', 'ingreso')
            ->get();

        foreach ($movimientos as $movimiento) {
            $sesion = $movimiento->sesion;
            if ($sesion && $sesion->estado === 'abierta') {
                $this->cajaService->registrarMovimiento(
                    $sesion,
                    'egreso',
                    (float) $movimiento->monto,
                    $movimiento->metodo_pago,
                    "Anulación factura {$factura->numero} — OT {$orden->numero_orden}",
                    $factura,
                );
            }
        }

        if (class_exists(\App\Modules\Accounting\Services\ContabilidadService::class)) {
            $contabilidadService = app(\App\Modules\Accounting\Services\ContabilidadService::class);
            try {
                $contabilidadService->revertirAsiento(
                    'ventas',
                    \App\Modules\Sales\Models\Factura::class,
                    $factura->id,
                    "Anulación factura {$factura->numero}"
                );
            } catch (\Exception $e) {
                Log::warning("No se pudo reversar asiento contable para {$factura->numero}: {$e->getMessage()}");
            }
        }

        $factura->update([
            'anulada' => true,
            'anulada_at' => now(),
            'anulada_por' => auth()->id(),
            'estado' => 'anulada',
        ]);
    }

    public function siguienteNumero(): string
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $numero = 'OR-' . now()->format('YmdHis') . '-' . random_int(100, 999);
            if (!OrdenReparacion::where('numero_orden', $numero)->exists()) {
                return $numero;
            }
            usleep(100000);
        }

        throw new \RuntimeException('No se pudo generar un número de orden único. Intenta nuevamente.');
    }

    public function syncLineas(OrdenReparacion $orden, array $data): void
    {
        foreach ($data['servicios'] ?? [] as $s) {
            $orden->servicios()->attach($s['servicio_id'], [
                'cantidad' => $s['cantidad'] ?? 1,
                'precio_aplicado' => $s['precio_aplicado'] ?? 0,
                'costo_tecnico_aplicado' => $s['costo_tecnico_aplicado'] ?? 0,
            ]);
        }
        foreach ($data['repuestos'] ?? [] as $r) {
            $orden->repuestos()->attach($r['producto_id'], [
                'cantidad' => $r['cantidad'] ?? 1,
                'precio_unitario' => $r['precio_unitario'] ?? 0,
            ]);
        }
    }

    public function registrarAbono(OrdenReparacion $orden, float $diferencia, string $metodoPago): void
    {
        $reciboService = app(\App\Modules\Cash\Services\ReciboService::class);
        $reciboService->registrarAbono($orden, $diferencia, $metodoPago);
    }

    public function anularAbonos(OrdenReparacion $orden, float $montoRevertir): void
    {
        $reciboService = app(\App\Modules\Cash\Services\ReciboService::class);
        $recibos = \App\Modules\Cash\Models\ReciboCaja::where('referencia_type', get_class($orden))
            ->where('referencia_id', $orden->id)
            ->where('estado', 'activo')
            ->orderByDesc('fecha')
            ->get();

        $restante = $montoRevertir;
        foreach ($recibos as $recibo) {
            if ($restante <= 0) break;
            if ((float) $recibo->monto <= $restante) {
                $reciboService->anularRecibo($recibo);
                $restante -= (float) $recibo->monto;
            }
        }
    }
}
