<?php

namespace App\Modules\Cash\Services;

use App\Modules\Accounting\Models\CuentaPorPagar;
use App\Modules\Accounting\Services\ContabilidadConfig;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Inventory\Models\Recepcion;
use App\Modules\Purchasing\Models\Proveedor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PagoProveedorService
{
    public function __construct(
        private CajaService $cajaService,
        private ContabilidadService $contabilidadService,
    ) {}

    /**
     * Procesa el pago a un proveedor contra una recepción / CxP.
     *
     * @param CuentaPorPagar $cxp Cuenta por pagar a cancelar
     * @param float $monto Monto a pagar
     * @param string $metodoPago efectivo|tarjeta|transferencia
     */
    public function procesarPago(CuentaPorPagar $cxp, float $monto, string $metodoPago = 'efectivo'): void
    {
        if ($monto <= 0) {
            throw new \Exception('El monto del pago debe ser mayor a cero.');
        }

        $sesion = $this->cajaService->getSesionAbierta(auth()->id());
        if (!$sesion) {
            throw new \Exception('Debes tener un turno de caja abierto para registrar pagos.');
        }

        $proveedor = $cxp->acreedor;
        if (!$proveedor) {
            throw new \Exception('La CxP no tiene un proveedor asociado.');
        }

        DB::transaction(function () use ($cxp, $proveedor, $monto, $metodoPago, $sesion) {
            // 1. Registrar egreso en caja
            $this->cajaService->registrarMovimiento(
                $sesion,
                'egreso',
                $monto,
                $metodoPago,
                "Pago Proveedor {$proveedor->razon_social} — Recepción #{$cxp->documento_origen_id}",
                $cxp->documentoOrigen,
            );

            // 2. Actualizar Cuenta por Pagar
            $this->actualizarCuentaPorPagar($cxp, $monto);

            // 3. Registrar asiento contable: Proveedores (D) / Caja (C)
            $this->registrarAsientoPago($cxp, $proveedor, $monto, $metodoPago);
        });
    }

    /**
     * Actualiza el monto pagado y estado de la CxP.
     */
    private function actualizarCuentaPorPagar(CuentaPorPagar $cxp, float $monto): void
    {
        $nuevoPagado = (float) $cxp->monto_pagado + $monto;
        $nuevoEstado = $nuevoPagado >= (float) $cxp->monto_total ? 'pagado' : 'pendiente';

        $cxp->update([
            'monto_pagado' => $nuevoPagado,
            'estado' => $nuevoEstado,
        ]);
    }

    /**
     * Registra el asiento contable: Proveedores (D) / Caja (C)
     */
    private function registrarAsientoPago(CuentaPorPagar $cxp, Proveedor $proveedor, float $monto, string $metodoPago): void
    {
        if (!class_exists(ContabilidadService::class)) {
            return;
        }

        $regimen = $this->determinarRegimen($cxp->tenant_id);

        // Cuenta de crédito según método de pago
        $codigoCredito = ContabilidadConfig::cuentaPorMetodoPago($metodoPago, $regimen, $cxp->tenant_id);

        $cuentaProveedores = $this->contabilidadService->getCuenta(ContabilidadConfig::proveedores($cxp->tenant_id));
        $cuentaCredito = $this->contabilidadService->getCuenta($codigoCredito);

        if (!$cuentaProveedores || !$cuentaCredito) {
            Log::warning("No se pudo registrar asiento de pago proveedor: cuentas proveedores o {$codigoCredito} no existen.");
            return;
        }

        $lineas = [
            [
                'cuenta_contable_id' => $cuentaProveedores->id,
                'descripcion' => "Pago Recepción #{$cxp->documento_origen_id}",
                'debito' => $monto,
                'credito' => 0,
                'tercero_tipo_documento' => $proveedor->tipo_documento ?? null,
                'tercero_numero_documento' => $proveedor->numero_documento ?? null,
                'tercero_nombre' => $proveedor->razon_social ?? null,
            ],
            [
                'cuenta_contable_id' => $cuentaCredito->id,
                'descripcion' => "Pago a {$proveedor->razon_social}",
                'debito' => 0,
                'credito' => $monto,
            ],
        ];

        try {
            $this->contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => "Pago Proveedor {$proveedor->razon_social} — Recepción #{$cxp->documento_origen_id}",
                'modulo_origen' => 'cash',
                'documento_tipo' => 'EGR',
                'documento_numero' => "CXP-{$cxp->id}",
                'tercero_tipo_documento' => $proveedor->tipo_documento ?? null,
                'tercero_numero_documento' => $proveedor->numero_documento ?? null,
                'tercero_nombre' => $proveedor->razon_social ?? null,
                'referencia_type' => CuentaPorPagar::class,
                'referencia_id' => $cxp->id,
            ], $lineas);
        } catch (\Exception $e) {
            Log::warning("No se pudo registrar asiento de pago proveedor: {$e->getMessage()}");
        }
    }

    private function determinarRegimen(int $tenantId): string
    {
        return \App\Core\Models\Configuracion::get('regimen_fiscal', 'simplificado', $tenantId);
    }
}
