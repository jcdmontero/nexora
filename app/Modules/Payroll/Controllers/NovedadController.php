<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Payroll\Models\Novedad;
use App\Modules\Payroll\Models\PeriodoNomina;
use App\Modules\Payroll\Models\ConceptoNomina;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class NovedadController extends Controller
{
    /**
     * Listar novedades con filtros.
     */
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $query = Novedad::with(['empleado', 'concepto', 'periodo'])
            ->whereHas('empleado', fn ($q) => $q->where('tenant_id', $tenantId));

        if ($request->periodo_id) {
            $query->where('periodo_id', $request->periodo_id);
        }

        if ($request->concepto_id) {
            $query->where('concepto_id', $request->concepto_id);
        }

        if ($request->tipo) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->estado) {
            $query->where('estado', $request->estado);
        }

        $novedades = $query->orderBy('fecha_registro', 'desc')
            ->paginate(15)
            ->through(fn ($nv) => [
                'id'            => $nv->id,
                'empleado_id'   => $nv->empleado_id,
                'empleado_nombre' => $nv->empleado?->nombres . ' ' . $nv->empleado?->apellidos,
                'empleado_documento' => $nv->empleado?->documento,
                'tipo'          => $nv->tipo,
                'codigo'        => $nv->codigo,
                'descripcion'   => $nv->descripcion,
                'concepto_id'   => $nv->concepto_id,
                'concepto_codigo' => $nv->concepto?->codigo,
                'concepto_nombre' => $nv->concepto?->nombre,
                'periodo_id'    => $nv->periodo_id,
                'periodo_codigo' => $nv->periodo?->codigo,
                'valor'         => (float) $nv->valor,
                'fecha_registro'=> $nv->fecha_registro?->format('Y-m-d'),
                'estado'        => $nv->estado,
                'created_at'    => $nv->created_at?->format('Y-m-d H:i'),
            ]);

        // Datos para selects
        $empleados = Empleado::where('tenant_id', $tenantId)
            ->where('estado', true)
            ->get(['id', 'nombres', 'apellidos', 'documento']);

        $conceptos = ConceptoNomina::where('tenant_id', $tenantId)
            ->where('activo', true)
            ->whereIn('tipo', ['DEVENGADO', 'DEDUCCION'])
            ->get(['id', 'codigo', 'nombre', 'tipo']);

        $periodos = PeriodoNomina::where('tenant_id', $tenantId)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'codigo', 'mes_contable', 'estado']);

        return Inertia::render('Payroll/Novedades/Index', [
            'novedades' => $novedades,
            'empleados' => $empleados,
            'conceptos' => $conceptos,
            'periodos'  => $periodos,
            'filters'   => $request->only(['periodo_id', 'concepto_id', 'tipo', 'estado']),
        ]);
    }

    /**
     * Crear una novedad individual.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'empleado_id'  => 'required|exists:hr_empleados,id',
            'tipo'         => 'required|in:ingreso,descuento',
            'descripcion'  => 'nullable|string|max:250',
            'concepto_id'  => 'nullable|exists:pay_conceptos_nomina,id',
            'periodo_id'   => 'nullable|exists:pay_periodos_nomina,id',
            'codigo'       => 'nullable|string|max:30',
            'valor'        => 'required|numeric|min:1',
            'fecha_registro'=> 'required|date',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $empleado = Empleado::findOrFail($validated['empleado_id']);
        if ($empleado->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $validated['tenant_id'] = auth()->user()->tenant_id;
        $validated['estado'] = 'pendiente';

        Novedad::create($validated);

        return back()->with('success', 'Novedad registrada con éxito.');
    }

    /**
     * Crear novedades en lote para múltiples empleados.
     */
    public function storeBulk(Request $request)
    {
        $validated = $request->validate([
            'empleados_ids' => 'required|array|min:1',
            'empleados_ids.*' => 'exists:hr_empleados,id',
            'tipo'          => 'required|in:ingreso,descuento',
            'descripcion'   => 'nullable|string|max:250',
            'concepto_id'   => 'nullable|exists:pay_conceptos_nomina,id',
            'periodo_id'    => 'nullable|exists:pay_periodos_nomina,id',
            'codigo'        => 'nullable|string|max:30',
            'valor'         => 'required|numeric|min:1',
            'fecha_registro'=> 'required|date',
        ]);

        $tenantId = auth()->user()->tenant_id;

        $empleadosValidos = Empleado::whereIn('id', $validated['empleados_ids'])
            ->where('tenant_id', $tenantId)
            ->pluck('id')
            ->toArray();

        if (empty($empleadosValidos)) {
            return back()->with('error', 'Ningún empleado válido encontrado.');
        }

        $creadas = 0;
        $data = [];

        foreach ($empleadosValidos as $empleadoId) {
            $data[] = [
                'tenant_id'     => $tenantId,
                'empleado_id'   => $empleadoId,
                'tipo'          => $validated['tipo'],
                'descripcion'   => $validated['descripcion'] ?? null,
                'concepto_id'   => $validated['concepto_id'] ?? null,
                'periodo_id'    => $validated['periodo_id'] ?? null,
                'codigo'        => $validated['codigo'] ?? null,
                'valor'         => $validated['valor'],
                'fecha_registro'=> $validated['fecha_registro'],
                'estado'        => 'pendiente',
                'created_at'    => now(),
                'updated_at'    => now(),
            ];
            $creadas++;
        }

        Novedad::insert($data);

        return back()->with('success', "{$creadas} novedad(es) creada(s) en lote.");
    }

    /**
     * Eliminar una novedad.
     */
    public function destroy(Novedad $novedad)
    {
        $tenantId = auth()->user()->tenant_id;

        // Verificar pertenencia al tenant vía empleado
        $empleado = $novedad->empleado;
        if (!$empleado || $empleado->tenant_id !== $tenantId) {
            abort(403);
        }

        if ($novedad->estado === 'aplicada') {
            return back()->with('error', 'No se puede eliminar una novedad ya aplicada a una nómina.');
        }

        $novedad->delete();

        return back()->with('success', 'Novedad eliminada correctamente.');
    }
}
