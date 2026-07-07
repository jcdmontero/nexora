<?php

namespace App\Modules\Cash\Services;

use App\Modules\Accounting\Services\ContabilidadConfig;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Cash\Models\ReciboCaja;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReciboService
{
    public function __construct(
        private CajaService $cajaService,
    ) {}

    /**
     * Registra un abono para una OT: crea movimiento de caja + recibo + actualiza OT + contabilidad.
     *
     * @throws \Exception si no hay caja abierta o el monto es inválido.
     */
    public function registrarAbono(
        OrdenReparacion $orden,
        float $monto,
        string $metodoPago = 'efectivo',
        ?string $notas = null,
    ): ReciboCaja {
        if ($monto <= 0) {
            throw new \Exception('El monto del abono debe ser mayor a cero.');
        }

        $sesion = $this->cajaService->getSesionAbierta(auth()->id());
        if (!$sesion) {
            throw new \Exception('No tienes una caja abierta. Abre una caja antes de registrar el abono.');
        }

        return DB::transaction(function () use ($orden, $monto, $metodoPago, $notas, $sesion) {
            // 1. Registrar movimiento de caja (ingreso)
            $this->cajaService->registrarMovimiento(
                $sesion,
                'ingreso',
                $monto,
                $metodoPago,
                "Abono OT {$orden->numero_orden} — {$orden->cliente?->nombre_completo}",
                $orden,
            );

            // 2. Generar número secuencial de recibo
            $numero = $this->siguienteNumero();

            // 3. Crear recibo de caja
            $recibo = ReciboCaja::create([
                'tenant_id' => $orden->tenant_id,
                'numero' => $numero,
                'fecha' => now(),
                'sesion_id' => $sesion->id,
                'user_id' => auth()->id(),
                'cliente_id' => $orden->cliente_id,
                'referencia_type' => get_class($orden),
                'referencia_id' => $orden->id,
                'concepto' => "Abono OT {$orden->numero_orden} — " . ($orden->modelo?->nombre ?? $orden->tipo_equipo_manual),
                'monto' => $monto,
                'metodo_pago' => $metodoPago,
                'estado' => 'activo',
                'notas' => $notas,
            ]);

            // 4. Actualizar abono_inicial en la OT
            $totalAbonos = ReciboCaja::where('referencia_type', get_class($orden))
                ->where('referencia_id', $orden->id)
                ->where('estado', 'activo')
                ->sum('monto');

            $orden->update(['abono_inicial' => $totalAbonos]);

            // 5. Registrar asiento contable: Caja (D) / Anticipos de clientes (C)
            $this->registrarContabilidadAbono($recibo, $orden, $metodoPago);

            return $recibo;
        });
    }

    /**
     * Anula un recibo de caja (no elimina, marca como anulado) + reverso contable.
     */
    public function anularRecibo(ReciboCaja $recibo): ReciboCaja
    {
        if ($recibo->estado === 'anulado') {
            throw new \Exception('El recibo ya está anulado.');
        }

        return DB::transaction(function () use ($recibo) {
            $recibo->update(['estado' => 'anulado']);

            // 1. Crear egreso en caja para reversar
            $this->cajaService->registrarMovimiento(
                $recibo->sesion,
                'egreso',
                (float) $recibo->monto,
                $recibo->metodo_pago,
                "Anulación recibo " . $recibo->numero_formateado,
                $recibo->referencia,
            );

            // 2. Reversar asiento contable
            $this->revertirContabilidadAbono($recibo);

            // 3. Actualizar abono_inicial en la OT
            if ($recibo->referencia_type && $recibo->referencia_id) {
                $orden = $recibo->referencia;
                if ($orden) {
                    $totalAbonos = ReciboCaja::where('referencia_type', $recibo->referencia_type)
                        ->where('referencia_id', $recibo->referencia_id)
                        ->where('estado', 'activo')
                        ->sum('monto');
                    $orden->update(['abono_inicial' => $totalAbonos]);
                }
            }

            return $recibo;
        });
    }

    /**
     * Asiento contable del abono:
     * Débito:  Caja (110505) o Bancos (111005) — según método de pago
     * Crédito: Anticipos de clientes (2815)
     */
    private function registrarContabilidadAbono(ReciboCaja $recibo, OrdenReparacion $orden, string $metodoPago): void
    {
        if (!class_exists(ContabilidadService::class)) {
            return;
        }

        $contabilidadService = app(ContabilidadService::class);
        $tenantId = $orden->tenant_id;

        // Determinar cuenta de débito según método de pago y régimen
        $regimen = \App\Core\Models\Configuracion::get('regimen_fiscal', 'simplificado', $tenantId);
        $cuentaDebito = ContabilidadConfig::cuentaPorMetodoPago($metodoPago, $regimen, $tenantId);

        $cuentaDebitoModel = $contabilidadService->getCuenta($cuentaDebito);
        $cuentaCreditoModel = $contabilidadService->getCuenta(ContabilidadConfig::anticipos($tenantId)); // Anticipos de clientes

        if (!$cuentaDebitoModel || !$cuentaCreditoModel) {
            return;
        }

        $lineas = [
            [
                'cuenta_contable_id' => $cuentaDebitoModel->id,
                'descripcion' => "Abono OT {$orden->numero_orden}",
                'debito' => (float) $recibo->monto,
                'credito' => 0,
            ],
            [
                'cuenta_contable_id' => $cuentaCreditoModel->id,
                'descripcion' => "Abono OT {$orden->numero_orden}",
                'debito' => 0,
                'credito' => (float) $recibo->monto,
            ],
        ];

        try {
            $contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => "Abono OT {$orden->numero_orden} — " . $recibo->numero_formateado,
                'modulo_origen' => 'service-desk',
                'documento_tipo' => 'RC',
                'documento_numero' => $recibo->numero,
                'referencia_type' => ReciboCaja::class,
                'referencia_id' => $recibo->id,
            ], $lineas);
        } catch (\Exception $e) {
            Log::error("No se pudo registrar asiento contable para abono RC-{$recibo->numero}: {$e->getMessage()}");
            throw $e;
        }
    }

    /**
     * Reverso del asiento contable del abono (al anular recibo).
     */
    private function revertirContabilidadAbono(ReciboCaja $recibo): void
    {
        if (!class_exists(ContabilidadService::class)) {
            return;
        }

        $contabilidadService = app(ContabilidadService::class);

        try {
            $contabilidadService->revertirAsiento(
                'service-desk',
                ReciboCaja::class,
                $recibo->id,
                "Anulación " . $recibo->numero_formateado
            );
        } catch (\Exception $e) {
            Log::warning("No se pudo reversar asiento contable para RC-{$recibo->numero}: {$e->getMessage()}");
        }
    }

    private function siguienteNumero(): string
    {
        $prefijo = now()->format('Ymd');
        $ultimo = ReciboCaja::where('numero', 'like', "{$prefijo}-%")
            ->lockForUpdate()
            ->orderByDesc('numero')
            ->value('numero');

        if ($ultimo) {
            $consecutivo = (int) substr($ultimo, -3) + 1;
        } else {
            $consecutivo = 1;
        }

        return $prefijo . '-' . str_pad($consecutivo, 3, '0', STR_PAD_LEFT);
    }
}
