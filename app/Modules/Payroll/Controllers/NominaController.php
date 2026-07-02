<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Payroll\Models\Nomina;
use App\Modules\Payroll\Models\ConceptoNomina;
use App\Modules\Payroll\Services\NominaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NominaController extends Controller
{
    public function __construct(
        private readonly NominaService $nominaService,
    ) {}

    /**
     * Listar nóminas individuales.
     */
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $nominas = Nomina::where('tenant_id', $tenantId)
            ->with(['contrato.empleado', 'periodo'])
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->through(fn ($n) => [
                'id'              => $n->id,
                'codigo_periodo'  => $n->periodo?->codigo,
                'mes_contable'    => $n->periodo?->mes_contable,
                'empleado_nombre' => $n->contrato?->empleado?->nombres
                    . ' ' . $n->contrato?->empleado?->apellidos,
                'documento'       => $n->contrato?->empleado?->documento,
                'dias_laborados'  => $n->dias_laborados,
                'total_devengado' => (float) $n->total_devengado,
                'total_deducciones'=> (float) $n->total_deducciones,
                'neto_pagar'      => (float) $n->neto_pagar,
                'estado_periodo'  => $n->periodo?->estado,
                'created_at'      => $n->created_at?->format('Y-m-d'),
            ]);

        return Inertia::render('Payroll/Nominas/Index', [
            'nominas' => $nominas,
        ]);
    }

    /**
     * Mostrar detalle de una nómina individual con conceptos.
     */
    public function show(Nomina $nomina)
    {
        if ($nomina->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $nomina->load([
            'contrato.empleado',
            'periodo',
            'detalles.concepto',
            'novedades',
        ]);

        $conceptos = ConceptoNomina::where('tenant_id', auth()->user()->tenant_id)
            ->where('activo', true)
            ->get(['id', 'codigo', 'nombre', 'tipo']);

        return Inertia::render('Payroll/Nominas/Show', [
            'nomina' => [
                'id'                  => $nomina->id,
                'periodo_id'          => $nomina->periodo_id,
                'codigo_periodo'      => $nomina->periodo?->codigo,
                'mes_contable'        => $nomina->periodo?->mes_contable,
                'estado_periodo'      => $nomina->periodo?->estado,
                'empleado_nombre'     => $nomina->contrato?->empleado?->nombres
                    . ' ' . $nomina->contrato?->empleado?->apellidos,
                'empleado_documento'  => $nomina->contrato?->empleado?->documento,
                'cargo'               => $nomina->contrato?->cargo,
                'fecha_inicio'        => $nomina->fecha_inicio?->format('Y-m-d'),
                'fecha_fin'           => $nomina->fecha_fin?->format('Y-m-d'),
                'dias_laborados'      => $nomina->dias_laborados,
                'ibc_seguridad_social'=> (float) $nomina->ibc_seguridad_social,
                'ibc_parafiscales'    => (float) $nomina->ibc_parafiscales,
                'auxilio_transporte'  => (float) $nomina->auxilio_transporte,
                'total_devengado'     => (float) $nomina->total_devengado,
                'total_deducciones'   => (float) $nomina->total_deducciones,
                'neto_pagar'          => (float) $nomina->neto_pagar,
                'total_provisiones'   => (float) $nomina->total_provisiones,
                'total_aportes_patronales' => (float) $nomina->total_aportes_patronales,
                'costo_laboral_total' => (float) $nomina->costo_laboral_total,
                'detalles'            => $nomina->detalles->map(fn ($d) => [
                    'id'              => $d->id,
                    'concepto_id'     => $d->concepto_id,
                    'concepto_codigo' => $d->concepto?->codigo,
                    'concepto_nombre' => $d->concepto?->nombre,
                    'concepto_tipo'   => $d->concepto?->tipo,
                    'cantidad'        => (float) $d->cantidad,
                    'valor'           => (float) $d->valor,
                    'base_calculo'    => (float) ($d->base_calculo ?? 0),
                ]),
                'novedades'           => $nomina->novedades->map(fn ($nv) => [
                    'id'          => $nv->id,
                    'tipo'        => $nv->tipo,
                    'descripcion' => $nv->descripcion,
                    'valor'       => (float) $nv->valor,
                ]),
            ],
            'conceptos_disponibles' => $conceptos,
        ]);
    }

    /**
     * Crear / actualizar el valor de un concepto en una nómina liquidada.
     */
    public function updateConcepto(Request $request, Nomina $nomina)
    {
        if ($nomina->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if (!in_array($nomina->periodo?->estado, ['BORRADOR', 'LIQUIDADA'], true)) {
            return back()->with('error', 'No se pueden modificar conceptos en una nómina ' . $nomina->periodo?->estado . '.');
        }

        $validated = $request->validate([
            'concepto_id' => 'required|exists:pay_conceptos_nomina,id',
            'valor'       => 'required|numeric|min:0',
        ]);

        try {
            $this->nominaService->actualizarConcepto(
                $nomina,
                (int) $validated['concepto_id'],
                (float) $validated['valor']
            );

            // Actualizar totales del período padre
            $periodo = $nomina->periodo;
            if ($periodo) {
                $totales = $periodo->nominas()
                    ->selectRaw('
                        COALESCE(SUM(total_devengado), 0) as td,
                        COALESCE(SUM(total_deducciones), 0) as tdd,
                        COALESCE(SUM(neto_pagar), 0) as np,
                        COALESCE(SUM(total_provisiones), 0) as tp,
                        COALESCE(SUM(total_aportes_patronales), 0) as tap
                    ')
                    ->first();

                $periodo->update([
                    'total_devengado'       => $totales->td,
                    'total_deducciones'     => $totales->tdd,
                    'neto_pagar'            => $totales->np,
                    'total_provisiones'     => $totales->tp,
                    'total_aportes_patronales' => $totales->tap,
                ]);
            }

            return back()->with('success', 'Concepto actualizado exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al actualizar concepto: ' . $e->getMessage());
        }
    }
}
