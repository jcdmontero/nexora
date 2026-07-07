<?php

namespace App\Modules\Cash\Services;

use App\Modules\Accounting\Models\CuentaPorCobrar;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\ContabilidadConfig;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Sales\Models\Factura;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecaudoService
{
    public function __construct(
        private CajaService $cajaService,
        private ContabilidadService $contabilidadService,
    ) {}

    /**
     * Procesa un recaudo de cartera.
     *
     * @param Factura $factura Factura a crédito que se está pagando
     * @param float $monto Monto a recaudar
     * @param string $metodoPago efectivo|tarjeta|transferencia
     */
    public function procesarRecaudo(Factura $factura, float $monto, string $metodoPago = 'efectivo'): void
    {
        if ($monto <= 0) {
            throw new \Exception('El monto del recaudo debe ser mayor a cero.');
        }

        $sesion = $this->cajaService->getSesionAbierta(auth()->id());
        if (!$sesion) {
            throw new \Exception('Debes tener un turno de caja abierto para registrar recaudos.');
        }

        $cliente = $factura->cliente;
        if (!$cliente) {
            throw new \Exception('La factura no tiene un cliente asociado.');
        }

        DB::transaction(function () use ($factura, $cliente, $monto, $metodoPago, $sesion) {
            // 1. Registrar ingreso en caja
            $this->cajaService->registrarMovimiento(
                $sesion,
                'ingreso',
                $monto,
                $metodoPago,
                "Recaudo Factura {$factura->numero} — {$cliente->nombre_completo}",
                $factura,
            );

            // 2. Actualizar Cuenta por Cobrar
            $this->actualizarCuentaPorCobrar($factura, $monto);

            // 3. Registrar asiento contable: Caja (D) / Clientes (C)
            $this->registrarAsientoRecaudo($factura, $cliente, $monto, $metodoPago);
        });
    }

    /**
     * Actualiza el monto pagado y estado de la CxC.
     */
    private function actualizarCuentaPorCobrar(Factura $factura, float $monto): void
    {
        $cxc = CuentaPorCobrar::where('documento_origen_type', Factura::class)
            ->where('documento_origen_id', $factura->id)
            ->where('estado', 'pendiente')
            ->first();

        if (!$cxc) {
            Log::warning("No se encontró CxC pendiente para factura {$factura->numero}");
            return;
        }

        $nuevoPagado = (float) $cxc->monto_pagado + $monto;
        $nuevoEstado = $nuevoPagado >= (float) $cxc->monto_total ? 'pagado' : 'pendiente';

        $cxc->update([
            'monto_pagado' => $nuevoPagado,
            'estado' => $nuevoEstado,
        ]);

        // Si se pagó totalmente, actualizar estado de la factura
        if ($nuevoEstado === 'pagado') {
            $factura->update(['estado' => 'pagada']);
        }
    }

    /**
     * Registra el asiento contable: Caja/Bancos (D) / Clientes (C)
     */
    private function registrarAsientoRecaudo(Factura $factura, Cliente $cliente, float $monto, string $metodoPago): void
    {
        if (!class_exists(ContabilidadService::class)) {
            return;
        }

        $regimen = $this->determinarRegimen($factura->tenant_id);

        // Cuenta de débito según método de pago
        $codigoDebito = ContabilidadConfig::cuentaPorMetodoPago($metodoPago, $regimen, $factura->tenant_id);

        $cuentaDebito = $this->contabilidadService->getCuenta($codigoDebito);
        $cuentaClientes = $this->contabilidadService->getCuenta(ContabilidadConfig::clientes($factura->tenant_id));

        if (!$cuentaDebito || !$cuentaClientes) {
            Log::warning("No se pudo registrar asiento de recaudo: cuentas {$codigoDebito} o clientes no existen.");
            return;
        }

        $lineas = [
            [
                'cuenta_contable_id' => $cuentaDebito->id,
                'descripcion' => "Recaudo {$factura->numero}",
                'debito' => $monto,
                'credito' => 0,
            ],
            [
                'cuenta_contable_id' => $cuentaClientes->id,
                'descripcion' => "Pago {$factura->numero}",
                'debito' => 0,
                'credito' => $monto,
                'tercero_tipo_documento' => $cliente->tipo_documento ?? null,
                'tercero_numero_documento' => $cliente->numero_documento ?? null,
                'tercero_nombre' => $cliente->nombre_completo ?? null,
            ],
        ];

        try {
            $this->contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => "Recaudo Factura {$factura->numero} — {$cliente->nombre_completo}",
                'modulo_origen' => 'cash',
                'documento_tipo' => 'REC',
                'documento_numero' => $factura->numero,
                'tercero_tipo_documento' => $cliente->tipo_documento ?? null,
                'tercero_numero_documento' => $cliente->numero_documento ?? null,
                'tercero_nombre' => $cliente->nombre_completo ?? null,
                'referencia_type' => Factura::class,
                'referencia_id' => $factura->id,
            ], $lineas);
        } catch (\Exception $e) {
            Log::error("No se pudo registrar asiento de recaudo {$factura->numero}: {$e->getMessage()}");
            throw $e;
        }
    }

    private function determinarRegimen(int $tenantId): string
    {
        return \App\Core\Models\Configuracion::get('regimen_fiscal', 'simplificado', $tenantId);
    }
}
