<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payroll\Models\PeriodoNomina;
use App\Modules\Payroll\Services\NominaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Controlador de Liquidaciones de Nómina.
 *
 * Migrated to NominaService — previous implementation used the deprecated
 * PayrollLiquidator. Now delegates all liquidation logic to NominaService
 * which handles full Colombian payroll calculation (devengados, deducciones,
 * provisiones, aportes patronales).
 */
class LiquidacionController extends Controller
{
    public function __construct(
        private readonly NominaService $nominaService,
    ) {}

    /**
     * Listar períodos de nómina.
     */
    public function index()
    {
        $tenantId = auth()->user()->tenant_id;

        $periodos = PeriodoNomina::where('tenant_id', $tenantId)
            ->withCount('nominas')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Payroll/Liquidaciones/Index', [
            'periodos' => $periodos,
        ]);
    }

    /**
     * Mostrar un período con sus nóminas individuales.
     */
    public function show(PeriodoNomina $periodo)
    {
        if ($periodo->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $periodo->load([
            'nominas.contrato.empleado',
            'nominas.detalles.concepto',
        ]);

        $nominas = $periodo->nominas->map(fn ($n) => [
            'id'                  => $n->id,
            'empleado_nombre'     => trim(
                ($n->contrato?->empleado?->nombres ?? '') . ' '
                . ($n->contrato?->empleado?->apellidos ?? '')
            ),
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

        return Inertia::render('Payroll/Liquidaciones/Show', [
            'periodo' => [
                'id'           => $periodo->id,
                'codigo'       => $periodo->codigo,
                'mes_contable' => $periodo->mes_contable,
                'fecha_inicio' => $periodo->fecha_inicio?->format('Y-m-d'),
                'fecha_fin'    => $periodo->fecha_fin?->format('Y-m-d'),
                'estado'       => $periodo->estado,
                'observaciones'=> $periodo->observaciones,
                'created_at'   => $periodo->created_at?->format('Y-m-d H:i'),
            ],
            'nominas' => $nominas,
            'resumen' => [
                'total_empleados'   => $periodo->nominas->count(),
                'total_devengado'   => (float) $periodo->total_devengado,
                'total_deducciones' => (float) $periodo->total_deducciones,
                'total_provisiones' => (float) $periodo->total_provisiones,
                'total_aportes'     => (float) $periodo->total_aportes_patronales,
                'neto_pagar'        => (float) $periodo->neto_pagar,
            ],
        ]);
    }

    /**
     * Crear un período y liquidar todos los empleados activos en una sola transacción.
     *
     * Delega la liquidación completa a NominaService::liquidarPeriodo() que
     * calcula devengados, deducciones, provisiones y aportes patronales
     * según la legislación laboral colombiana.
     */
    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'codigo'       => 'required|string|max:30',
            'mes_contable' => 'required|string|size:7', // YYYY-MM
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'observaciones'=> 'nullable|string|max:500',
        ]);

        // Validar duplicado de mes_contable por tenant
        $exists = PeriodoNomina::where('tenant_id', $tenantId)
            ->where('mes_contable', $validated['mes_contable'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'Ya existe un período para el mes contable seleccionado.');
        }

        DB::beginTransaction();
        try {
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

            // Liquidar todos los empleados activos del período.
            // NominaService::liquidarPeriodo() crea las Nóminas individuales,
            // persiste los detalles por concepto, aplica cuotas de préstamo
            // y actualiza provisiones acumuladas — todo dentro de una transacción.
            $totalLiquidados = $this->nominaService->liquidarPeriodo($periodo);

            DB::commit();

            if ($totalLiquidados === 0) {
                return back()->with('warning', 'Período creado pero no se encontraron empleados activos para liquidar.');
            }

            return redirect()->route('payroll.liquidaciones.show', $periodo->id)
                ->with('success', "Período liquidado exitosamente. {$totalLiquidados} empleado(s) procesado(s).");

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Error al liquidar el período: ' . $e->getMessage());
        }
    }
}
