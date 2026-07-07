<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payroll\Models\Nomina;
use App\Modules\Payroll\Models\PeriodoNomina;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ReporteController extends Controller
{
    /**
     * Página índice de reportes de nómina disponibles.
     */
    public function index()
    {
        $periodos = PeriodoNomina::where('tenant_id', auth()->user()->tenant_id)
            ->orderByDesc('fecha_inicio')
            ->get(['id', 'codigo', 'mes_contable', 'fecha_inicio', 'fecha_fin', 'estado', 'total_devengado', 'neto_pagar']);

        return Inertia::render('Payroll/Reportes/Index', [
            'periodos' => $periodos,
        ]);
    }

    /**
     * Resumen consolidado de un período de nómina.
     */
    public function resumen(PeriodoNomina $periodo)
    {
        if ($periodo->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $periodo->load(['nominas.contrato.empleado', 'nominas.detalles.concepto']);

        // Consolidado por tipo de concepto
        $consolidado = [
            'DEVENGADO'       => ['total' => 0, 'conceptos' => []],
            'DEDUCCION'       => ['total' => 0, 'conceptos' => []],
            'PROVISION'       => ['total' => 0, 'conceptos' => []],
            'APORTE_PATRONAL' => ['total' => 0, 'conceptos' => []],
        ];

        foreach ($periodo->nominas as $nomina) {
            foreach ($nomina->detalles as $detalle) {
                $tipo = $detalle->concepto?->tipo;
                $codigo = $detalle->concepto?->codigo ?? 'SIN_CODIGO';
                $nombre = $detalle->concepto?->nombre ?? 'Sin concepto';
                $valor = (float) $detalle->valor;

                if (!isset($consolidado[$tipo])) {
                    Log::warning('Payroll resumen: concepto con tipo desconocido o null', [
                        'nomina_id' => $nomina->id,
                        'detalle_id' => $detalle->id,
                        'tipo' => $tipo,
                        'concepto_id' => $detalle->concepto_id,
                    ]);
                    continue;
                }

                $consolidado[$tipo]['total'] += $valor;

                $key = $codigo . '|' . $nombre;
                if (!isset($consolidado[$tipo]['conceptos'][$key])) {
                    $consolidado[$tipo]['conceptos'][$key] = [
                        'codigo' => $codigo,
                        'nombre' => $nombre,
                        'total'  => 0,
                        'empleados' => 0,
                    ];
                }
                $consolidado[$tipo]['conceptos'][$key]['total'] += $valor;
                $consolidado[$tipo]['conceptos'][$key]['empleados']++;
            }
        }

        // Estadísticas generales
        $totalEmpleados = $periodo->nominas->count();
        $totalDevengado = (float) $periodo->total_devengado;
        $totalDeducciones = (float) $periodo->total_deducciones;
        $totalProvisiones = (float) $periodo->total_provisiones;
        $totalAportes = (float) $periodo->total_aportes_patronales;
        $netoPagar = (float) $periodo->neto_pagar;
        $costoTotal = $totalDevengado + $totalProvisiones + $totalAportes;

        return Inertia::render('Payroll/Reportes/Resumen', [
            'periodo' => [
                'id'           => $periodo->id,
                'codigo'       => $periodo->codigo,
                'mes_contable' => $periodo->mes_contable,
                'fecha_inicio' => $periodo->fecha_inicio?->format('Y-m-d'),
                'fecha_fin'    => $periodo->fecha_fin?->format('Y-m-d'),
                'estado'       => $periodo->estado,
            ],
            'resumen' => [
                'total_empleados'      => $totalEmpleados,
                'total_devengado'      => $totalDevengado,
                'total_deducciones'    => $totalDeducciones,
                'total_provisiones'    => $totalProvisiones,
                'total_aportes'        => $totalAportes,
                'neto_pagar'           => $netoPagar,
                'costo_laboral_total'  => $costoTotal,
            ],
            'consolidado' => $consolidado,
        ]);
    }

    /**
     * Desprendible de pago (payslip) para un empleado.
     * Datos preparados para impresión / PDF.
     */
    public function desprendible(Nomina $nomina)
    {
        if ($nomina->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $nomina->load([
            'contrato.empleado',
            'contrato.cargoRel',
            'periodo',
            'detalles.concepto',
            'novedades',
        ]);

        $empleado = $nomina->contrato?->empleado;
        $contrato = $nomina->contrato;

        $devengados = $nomina->detalles->filter(
            fn ($d) => $d->concepto?->tipo === 'DEVENGADO'
        )->values();

        $deducciones = $nomina->detalles->filter(
            fn ($d) => $d->concepto?->tipo === 'DEDUCCION'
        )->values();

        $provisiones = $nomina->detalles->filter(
            fn ($d) => $d->concepto?->tipo === 'PROVISION'
        )->values();

        $aportes = $nomina->detalles->filter(
            fn ($d) => $d->concepto?->tipo === 'APORTE_PATRONAL'
        )->values();

        return Inertia::render('Payroll/Reportes/Desprendible', [
            'encabezado' => [
                'empresa'            => auth()->user()->tenant?->nombre,
                'nit'                => auth()->user()->tenant?->nit,
                'periodo'            => $nomina->periodo?->codigo,
                'mes_contable'       => $nomina->periodo?->mes_contable,
                'fecha_generacion'   => now()->format('Y-m-d'),
            ],
            'empleado' => [
                'nombres'            => $empleado?->nombres . ' ' . $empleado?->apellidos,
                'documento'          => $empleado?->documento,
                'cargo'              => $contrato?->cargoRel?->nombre ?? $contrato?->cargo,
                'fecha_ingreso'      => $contrato?->fecha_inicio?->format('Y-m-d'),
                'salario_base'       => (float) ($contrato?->salario_base ?? 0),
                'dias_laborados'     => $nomina->dias_laborados,
            ],
            'devengados' => $devengados->map(fn ($d) => [
                'codigo'   => $d->concepto?->codigo,
                'nombre'   => $d->concepto?->nombre,
                'cantidad' => (float) $d->cantidad,
                'valor'    => (float) $d->valor,
            ]),
            'deducciones' => $deducciones->map(fn ($d) => [
                'codigo'   => $d->concepto?->codigo,
                'nombre'   => $d->concepto?->nombre,
                'valor'    => (float) $d->valor,
            ]),
            'provisiones' => $provisiones->map(fn ($d) => [
                'codigo'   => $d->concepto?->codigo,
                'nombre'   => $d->concepto?->nombre,
                'valor'    => (float) $d->valor,
            ]),
            'aportes_patronales' => $aportes->map(fn ($d) => [
                'codigo'   => $d->concepto?->codigo,
                'nombre'   => $d->concepto?->nombre,
                'valor'    => (float) $d->valor,
            ]),
            'totales' => [
                'total_devengado'       => (float) $nomina->total_devengado,
                'total_deducciones'     => (float) $nomina->total_deducciones,
                'neto_pagar'            => (float) $nomina->neto_pagar,
                'ibc_seguridad_social'  => (float) $nomina->ibc_seguridad_social,
                'ibc_parafiscales'      => (float) $nomina->ibc_parafiscales,
                'costo_laboral_total'   => (float) $nomina->costo_laboral_total,
            ],
        ]);
    }
}
