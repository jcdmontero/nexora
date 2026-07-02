<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Payroll\Models\PeriodoNomina;

class ContabilidadNominaService
{
    public function __construct(private ContabilidadService $contabilidadService)
    {
    }

    public function contabilizarPeriodo(PeriodoNomina $periodo): void
    {
        $tenantId = $periodo->tenant_id;
        
        $cuentaSalariosPorPagar = CuentaContable::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('codigo', '2505')
            ->first();

        if (!$cuentaSalariosPorPagar) {
            throw new \Exception('No se encontró la cuenta contable 2505 (Salarios por pagar) para el tenant.');
        }

        $periodo->load([
            'nominas.empleado', 
            'nominas.detalles.concepto'
        ]);

        $centroCostoDefault = \App\Modules\Accounting\Models\CentroCosto::firstOrCreate(
            ['tenant_id' => $tenantId, 'codigo' => '01'],
            ['nombre' => 'General', 'es_activo' => true]
        );

        $lineas = [];

        foreach ($periodo->nominas as $nomina) {
            $empleado = $nomina->empleado;
            $documento = $empleado->documento;
            $nombre = $empleado->nombres . ' ' . $empleado->apellidos;

            foreach ($nomina->detalles as $detalle) {
                $concepto = $detalle->concepto;
                
                if (!$concepto->cuenta_contable_id) {
                    continue; 
                }

                if ($concepto->tipo === 'PROVISION') {
                    $cuentaGasto = CuentaContable::withoutGlobalScopes()
                        ->where('tenant_id', $tenantId)
                        ->where('codigo', '5105')
                        ->value('id');

                    // Débito al Gasto
                    $lineas[] = [
                        'cuenta_contable_id' => $cuentaGasto,
                        'centro_costo_id' => $centroCostoDefault->id,
                        'tercero_numero_documento' => $documento,
                        'tercero_nombre' => $nombre,
                        'debito' => $detalle->valor,
                        'credito' => 0,
                        'descripcion' => $concepto->nombre . ' - ' . $empleado->nombres,
                    ];

                    // Crédito al Pasivo (Provisiones)
                    $lineas[] = [
                        'cuenta_contable_id' => $concepto->cuenta_contable_id,
                        'centro_costo_id' => $centroCostoDefault->id,
                        'tercero_numero_documento' => $documento,
                        'tercero_nombre' => $nombre,
                        'debito' => 0,
                        'credito' => $detalle->valor,
                        'descripcion' => $concepto->nombre . ' - ' . $empleado->nombres,
                    ];

                } elseif ($concepto->tipo === 'APORTE_PATRONAL') {
                    // Débito Gasto
                    $lineas[] = [
                        'cuenta_contable_id' => $concepto->cuenta_contable_id, 
                        'centro_costo_id' => $centroCostoDefault->id,
                        'tercero_numero_documento' => $documento,
                        'tercero_nombre' => $nombre,
                        'debito' => $detalle->valor,
                        'credito' => 0,
                        'descripcion' => $concepto->nombre . ' - ' . $empleado->nombres,
                    ];

                    // Crédito Pasivo
                    $cuentaPasivoAporte = CuentaContable::withoutGlobalScopes()
                        ->where('tenant_id', $tenantId)
                        ->where('codigo', '2370')
                        ->value('id');
                        
                    $lineas[] = [
                        'cuenta_contable_id' => $cuentaPasivoAporte,
                        'centro_costo_id' => $centroCostoDefault->id,
                        'tercero_numero_documento' => $documento,
                        'tercero_nombre' => $nombre,
                        'debito' => 0,
                        'credito' => $detalle->valor,
                        'descripcion' => $concepto->nombre . ' - ' . $empleado->nombres,
                    ];

                } else {
                    $debito = $concepto->tipo === 'DEVENGADO' ? $detalle->valor : 0;
                    $credito = $concepto->tipo === 'DEDUCCION' ? $detalle->valor : 0;

                    $lineas[] = [
                        'cuenta_contable_id' => $concepto->cuenta_contable_id,
                        'centro_costo_id' => $centroCostoDefault->id,
                        'tercero_numero_documento' => $documento,
                        'tercero_nombre' => $nombre,
                        'debito' => $debito,
                        'credito' => $credito,
                        'descripcion' => $concepto->nombre . ' - ' . $empleado->nombres,
                    ];
                }
            }

            if ($nomina->neto_pagar > 0) {
                $lineas[] = [
                    'cuenta_contable_id' => $cuentaSalariosPorPagar->id,
                    'centro_costo_id' => $centroCostoDefault->id,
                    'tercero_numero_documento' => $documento,
                    'tercero_nombre' => $nombre,
                    'debito' => 0,
                    'credito' => $nomina->neto_pagar,
                    'descripcion' => 'Neto a pagar nómina - ' . $empleado->nombres,
                ];
            }
        }

        $cabecera = [
            'fecha' => clone $periodo->fecha_fin,
            'concepto' => 'Causación Nómina Periodo ' . $periodo->codigo,
            'modulo_origen' => 'PAYROLL',
            'referencia_id' => $periodo->id,
            'referencia_type' => PeriodoNomina::class,
        ];

        $this->contabilidadService->registrarAsiento($cabecera, $lineas);
    }
}
