<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payroll\Models\PeriodoNomina;
use App\Modules\Payroll\Services\NominaService;
use App\Modules\Payroll\Services\ContabilidadNominaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PeriodoController extends Controller
{
    public function __construct(
        private readonly NominaService $nominaService,
    ) {}

    /**
     * Listar períodos de nómina con estadísticas.
     */
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $periodos = PeriodoNomina::where('tenant_id', $tenantId)
            ->withCount('nominas')
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('codigo', 'ilike', "%{$search}%")
                        ->orWhere('mes_contable', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15)
            ->through(fn ($p) => [
                'id'              => $p->id,
                'codigo'          => $p->codigo,
                'mes_contable'    => $p->mes_contable,
                'fecha_inicio'    => $p->fecha_inicio?->format('Y-m-d'),
                'fecha_fin'       => $p->fecha_fin?->format('Y-m-d'),
                'estado'          => $p->estado,
                'total_devengado' => (float) $p->total_devengado,
                'total_deducciones'=> (float) $p->total_deducciones,
                'neto_pagar'      => (float) $p->neto_pagar,
                'nominas_count'   => $p->nominas_count,
                'created_at'      => $p->created_at?->format('Y-m-d H:i'),
            ]);

        return Inertia::render('Payroll/Periodos/Index', [
            'periodos' => $periodos,
            'filters'  => $request->only(['search']),
        ]);
    }

    /**
     * Crear un nuevo período de nómina.
     */
    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'codigo'       => 'required|string|max:30',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'mes_contable' => 'required|string|regex:/^\d{4}-\d{2}$/|size:7',
            'observaciones'=> 'nullable|string|max:500',
        ]);

        // Validar duplicado de mes_contable por tenant
        $exists = PeriodoNomina::where('tenant_id', $tenantId)
            ->where('mes_contable', $validated['mes_contable'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'Ya existe un período para el mes contable seleccionado.');
        }

        // Validar duplicado de código
        $codigoExists = PeriodoNomina::where('tenant_id', $tenantId)
            ->where('codigo', $validated['codigo'])
            ->exists();

        if ($codigoExists) {
            return back()->with('error', 'El código de período ya está en uso.');
        }

        $periodo = PeriodoNomina::create([
            'tenant_id'    => $tenantId,
            'codigo'       => $validated['codigo'],
            'fecha_inicio' => $validated['fecha_inicio'],
            'fecha_fin'    => $validated['fecha_fin'],
            'mes_contable' => $validated['mes_contable'],
            'estado'       => 'BORRADOR',
            'observaciones'=> $validated['observaciones'] ?? null,
            'created_by'   => auth()->id(),
        ]);

        return redirect()->route('payroll.periodos.show', $periodo->id)
            ->with('success', 'Período creado exitosamente.');
    }

    /**
     * Mostrar detalle de un período con todas sus nóminas.
     */
    public function show(PeriodoNomina $periodo)
    {
        $this->authorizeTenant($periodo);

        $periodo->load([
            'nominas.contrato.empleado',
            'nominas.detalles.concepto',
            'creador',
        ]);

        $nominas = $periodo->nominas->map(fn ($n) => [
            'id'                  => $n->id,
            'empleado_nombre'     => $n->contrato?->empleado?->nombres
                . ' ' . $n->contrato?->empleado?->apellidos,
            'empleado_documento'  => $n->contrato?->empleado?->documento,
            'dias_laborados'      => $n->dias_laborados,
            'total_devengado'     => (float) $n->total_devengado,
            'total_deducciones'   => (float) $n->total_deducciones,
            'neto_pagar'          => (float) $n->neto_pagar,
            'ibc_seguridad_social'=> (float) $n->ibc_seguridad_social,
            'costo_laboral_total' => (float) $n->costo_laboral_total,
            'detalles'            => $n->detalles->map(fn ($d) => [
                'concepto_codigo' => $d->concepto?->codigo,
                'concepto_nombre' => $d->concepto?->nombre,
                'concepto_tipo'   => $d->concepto?->tipo,
                'cantidad'        => (float) $d->cantidad,
                'valor'           => (float) $d->valor,
            ]),
        ]);

        $resumen = [
            'total_empleados'     => $periodo->nominas->count(),
            'total_devengado'     => (float) $periodo->total_devengado,
            'total_deducciones'   => (float) $periodo->total_deducciones,
            'total_provisiones'   => (float) $periodo->total_provisiones,
            'total_aportes'       => (float) $periodo->total_aportes_patronales,
            'neto_pagar'          => (float) $periodo->neto_pagar,
        ];

        return Inertia::render('Payroll/Periodos/Show', [
            'periodo' => [
                'id'           => $periodo->id,
                'codigo'       => $periodo->codigo,
                'mes_contable' => $periodo->mes_contable,
                'fecha_inicio' => $periodo->fecha_inicio?->format('Y-m-d'),
                'fecha_fin'    => $periodo->fecha_fin?->format('Y-m-d'),
                'estado'       => $periodo->estado,
                'observaciones'=> $periodo->observaciones,
                'creado_por'   => $periodo->creador?->name,
                'created_at'   => $periodo->created_at?->format('Y-m-d H:i'),
            ],
            'nominas' => $nominas,
            'resumen' => $resumen,
        ]);
    }

    /**
     * Liquidar TODOS los empleados activos para el período.
     *
     * Delega completamente a NominaService::liquidarPeriodo() que:
     *  1. Obtiene ConfiguracionLegal del año vigente
     *  2. Encuentra contratos activos dentro del período
     *  3. Calcula devengados, deducciones, provisiones y aportes patronales
     *  4. Persiste Nóminas y NominaDetalles
     *  5. Aplica cuotas de préstamo y actualiza provisiones acumuladas
     *  6. Actualiza totales del período
     */
    public function liquidar(PeriodoNomina $periodo)
    {
        $this->authorizeTenant($periodo);

        // C-02: Cambiar estado atómicamente ANTES de despachar el job
        $updated = PeriodoNomina::where('id', $periodo->id)
            ->where('estado', 'BORRADOR')
            ->update(['estado' => 'PROCESANDO']);

        if (!$updated) {
            return back()->with('error', 'El período no está en estado BORRADOR. No se puede liquidar.');
        }

        $tenantId = auth()->user()->tenant_id;

        \App\Jobs\LiquidarNominaJob::dispatch($periodo->id, $tenantId)
            ->onQueue('payroll');

        return redirect()->route('payroll.periodos.show', $periodo->id)
            ->with('success', 'Liquidación enviada a cola de procesamiento. Se notificará al finalizar.');
    }

    /**
     * Aprobar / contabilizar el período.
     */
    public function aprobar(PeriodoNomina $periodo, ContabilidadNominaService $contabilidadService)
    {
        $this->authorizeTenant($periodo);

        if ($periodo->estado !== 'LIQUIDADA') {
            return back()->with('error', 'Solo se puede aprobar un período en estado LIQUIDADA.');
        }

        DB::transaction(function () use ($periodo, $contabilidadService) {
            $contabilidadService->contabilizarPeriodo($periodo);
            $periodo->update(['estado' => 'CONTABILIZADA']);
        });

        return back()->with('success', 'Período contabilizado exitosamente.');
    }

    /**
     * Anular período y eliminar sus nóminas.
     */
    public function anular(PeriodoNomina $periodo)
    {
        $this->authorizeTenant($periodo);

        if (!in_array($periodo->estado, ['BORRADOR', 'LIQUIDADA', 'PROCESANDO'], true)) {
            return back()->with('error', 'No se puede anular un período en estado ' . $periodo->estado . '.');
        }

        DB::transaction(function () use ($periodo) {
            // C-03: Revertir cuotas de préstamo del período
            $this->nominaService->revertirCuotasDelPeriodoPublico($periodo);

            // C-03: Revertir provisiones acumuladas del período
            $this->nominaService->revertirProvisionesDelPeriodo($periodo);

            // Liberar novedades asociadas
            $periodo->nominas()->with('novedades', 'detalles')->each(function ($nomina) {
                $nomina->novedades()->update([
                    'estado'    => 'pendiente',
                    'nomina_id' => null,
                ]);
                $nomina->detalles()->delete();
            });

            $periodo->nominas()->delete();

            $periodo->update([
                'estado'               => 'ANULADA',
                'total_devengado'      => 0,
                'total_deducciones'    => 0,
                'total_provisiones'    => 0,
                'total_aportes_patronales' => 0,
                'neto_pagar'           => 0,
            ]);
        });

        return redirect()->route('payroll.periodos.index')
            ->with('success', 'Período anulado, nóminas eliminadas y efectos colaterales revertidos.');
    }

    /**
     * Verificar que el período pertenece al tenant del usuario autenticado.
     */
    private function authorizeTenant(PeriodoNomina $periodo): void
    {
        if ($periodo->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Este período no pertenece a su empresa.');
        }
    }
}
