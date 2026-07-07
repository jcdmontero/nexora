# Auditoría: Payroll (Nómina)
> Actualizado: 2026-07-06

---

## Tabla de Contenidos

1. [module.json](#modulejson)
2. [Routes](#routes)
3. [Controllers](#controllers)
4. [Models](#models)
5. [Services](#services)
6. [Migrations](#migrations)
7. [Frontend Pages](#frontend-pages)
8. [Tests](#tests)
9. [Correcciones](#correcciones)

---

## module.json
**Ruta:** `app/Modules/Payroll/module.json`
```json
{
    "code": "payroll",
    "name": "Nómina",
    "version": "1.0.0",
    "description": "Liquidación de nómina, novedades, prestaciones y seguridad social.",
    "icon": "Banknote",
    "core": false,
    "dependencies": ["hr"],
    "permissions": [
        "payroll:view",
        "payroll:create",
        "payroll:edit",
        "payroll:delete",
        "payroll:liquidate",
        "payroll:manage",
        "payroll:report"
    ],
    "menus": [
        {
            "section": "RECURSOS HUMANOS",
            "icon": "Users",
            "items": [
                { "type": "label", "label": "NÓMINA" },
                { "label": "Períodos", "route": "payroll.periodos.index", "permission": "payroll:view" },
                { "label": "Novedades", "route": "payroll.novedades.index", "permission": "payroll:view" }
            ]
        }
    ]
}
```

---

## Providers
**Ruta:** `app/Modules/Payroll/Providers/`

> No existen archivos de Provider en el módulo Payroll. El módulo depende del módulo HR (`"dependencies": ["hr"]`) y no declara providers propios.

---

## Routes
**Ruta:** `app/Modules/Payroll/Routes/web.php`
```php
<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Payroll\Controllers\LiquidacionController;
use App\Modules\Payroll\Controllers\NovedadController;
use App\Modules\Payroll\Controllers\NominaController;
use App\Modules\Payroll\Controllers\PeriodoController;
use App\Modules\Payroll\Controllers\ReporteController;
use App\Modules\Payroll\Models\PeriodoNomina;

Route::middleware(['web', 'auth', 'tenant', 'module:payroll'])->group(function () {
    Route::prefix('payroll')->name('payroll.')->group(function () {

        // ========================================================================
        // PERÍODOS DE NÓMINA (reemplazan LiquidacionController legacy)
        // ========================================================================
        Route::get('periodos', [PeriodoController::class, 'index'])
            ->name('periodos.index')
            ->middleware('permission:payroll:view');

        Route::post('periodos', [PeriodoController::class, 'store'])
            ->name('periodos.store')
            ->middleware('permission:payroll:liquidate');

        Route::get('periodos/{periodo}', [PeriodoController::class, 'show'])
            ->name('periodos.show')
            ->middleware('permission:payroll:view');

        Route::post('periodos/{periodo}/liquidar', [PeriodoController::class, 'liquidar'])
            ->name('periodos.liquidar')
            ->middleware('permission:payroll:liquidate');

        Route::post('periodos/{periodo}/aprobar', [PeriodoController::class, 'aprobar'])
            ->name('periodos.aprobar')
            ->middleware('permission:payroll:manage');

        Route::post('periodos/{periodo}/anular', [PeriodoController::class, 'anular'])
            ->name('periodos.anular')
            ->middleware('permission:payroll:manage');

        // ========================================================================
        // NÓMINAS INDIVIDUALES
        // ========================================================================
        Route::get('nominas', [NominaController::class, 'index'])
            ->name('nominas.index')
            ->middleware('permission:payroll:view');

        Route::get('nominas/{nomina}', [NominaController::class, 'show'])
            ->name('nominas.show')
            ->middleware('permission:payroll:view');

        Route::post('nominas/{nomina}/concepto', [NominaController::class, 'updateConcepto'])
            ->name('nominas.update-concepto')
            ->middleware('permission:payroll:edit');

        // ========================================================================
        // NOVEDADES
        // ========================================================================
        Route::get('novedades', [NovedadController::class, 'index'])
            ->name('novedades.index')
            ->middleware('permission:payroll:view');

        Route::post('novedades', [NovedadController::class, 'store'])
            ->name('novedades.store')
            ->middleware('permission:payroll:create');

        Route::post('novedades/bulk', [NovedadController::class, 'storeBulk'])
            ->name('novedades.store-bulk')
            ->middleware('permission:payroll:create');

        Route::delete('novedades/{novedad}', [NovedadController::class, 'destroy'])
            ->name('novedades.destroy')
            ->middleware('permission:payroll:delete');

        // ========================================================================
        // REPORTES
        // ========================================================================
        Route::get('reportes', [ReporteController::class, 'index'])
            ->name('reportes.index')
            ->middleware('permission:payroll:report');

        Route::get('reportes/resumen/{periodo}', [ReporteController::class, 'resumen'])
            ->name('reportes.resumen')
            ->middleware('permission:payroll:report');

        Route::get('reportes/desprendible/{nomina}', [ReporteController::class, 'desprendible'])
            ->name('reportes.desprendible')
            ->middleware('permission:payroll:report');

        // ========================================================================
        // LIQUIDACIONES LEGACY (compatibilidad — se mantienen temporalmente)
        // ========================================================================
        Route::get('liquidaciones', [LiquidacionController::class, 'index'])
            ->name('liquidaciones.index')
            ->middleware('permission:payroll:view');

        Route::post('liquidaciones', [LiquidacionController::class, 'store'])
            ->name('liquidaciones.store')
            ->middleware('permission:payroll:liquidate');

        Route::get('liquidaciones/{periodo}', [LiquidacionController::class, 'show'])
            ->name('liquidaciones.show')
            ->middleware('permission:payroll:view');

    });
});
```

---

## Controllers

### NovedadController
**Ruta:** `app/Modules/Payroll/Controllers/NovedadController.php`
```php
<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Payroll\Models\Novedad;
use App\Modules\Payroll\Models\PeriodoNomina;
use App\Modules\Payroll\Models\ConceptoNomina;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
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
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'empleado_id'  => ['required', Rule::in(Empleado::where('tenant_id', $tenantId)->pluck('id'))],
            'tipo'         => 'required|in:ingreso,descuento',
            'descripcion'  => 'nullable|string|max:250',
            'concepto_id'  => ['nullable', Rule::in(ConceptoNomina::where('tenant_id', $tenantId)->pluck('id'))],
            'periodo_id'   => ['nullable', Rule::in(PeriodoNomina::where('tenant_id', $tenantId)->pluck('id'))],
            'codigo'       => 'nullable|string|max:30',
            'valor'        => 'required|numeric|min:1',
            'fecha_registro'=> 'required|date',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin'    => 'nullable|date|after_or_equal:fecha_inicio',
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['estado'] = 'pendiente';

        Novedad::create($validated);

        return back()->with('success', 'Novedad registrada con éxito.');
    }

    /**
     * Crear novedades en lote para múltiples empleados.
     */
    public function storeBulk(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'empleados_ids' => 'required|array|min:1',
            'empleados_ids.*' => ['exists:hr_empleados,id'],
            'tipo'          => 'required|in:ingreso,descuento',
            'descripcion'   => 'nullable|string|max:250',
            'concepto_id'   => ['nullable', Rule::in(ConceptoNomina::where('tenant_id', $tenantId)->pluck('id'))],
            'periodo_id'    => ['nullable', Rule::in(PeriodoNomina::where('tenant_id', $tenantId)->pluck('id'))],
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

        foreach ($empleadosValidos as $empleadoId) {
            Novedad::create([
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
            ]);
            $creadas++;
        }

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
```

### NominaController
**Ruta:** `app/Modules/Payroll/Controllers/NominaController.php`
```php
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
            ->when($request->search, function ($q, $search) {
                $q->whereHas('contrato.empleado', function ($sub) use ($search) {
                    $sub->where('nombres', 'ilike', "%{$search}%")
                        ->orWhere('apellidos', 'ilike', "%{$search}%")
                        ->orWhere('documento', 'like', "%{$search}%");
                });
            })
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

        if ($nomina->periodo?->estado !== 'BORRADOR') {
            return back()->with('error', 'Solo se pueden modificar conceptos en períodos en estado BORRADOR.');
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
```

### PeriodoController
**Ruta:** `app/Modules/Payroll/Controllers/PeriodoController.php`
```php
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

        if ($periodo->estado !== 'BORRADOR') {
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

        if (!in_array($periodo->estado, ['BORRADOR', 'LIQUIDADA'], true)) {
            return back()->with('error', 'No se puede anular un período en estado ' . $periodo->estado . '.');
        }

        DB::transaction(function () use ($periodo) {
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
            ->with('success', 'Período anulado y nóminas eliminadas.');
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
```

### LiquidacionController (LEGACY)
**Ruta:** `app/Modules/Payroll/Controllers/LiquidacionController.php`
```php
<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payroll\Models\PeriodoNomina;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Controlador de Liquidaciones de Nómina.
 *
 * La liquidación se procesa de forma asíncrona vía LiquidarNominaJob.
 */
class LiquidacionController extends Controller
{
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

        $nominasPaginadas = $periodo->nominas()
            ->with(['contrato.empleado', 'detalles.concepto'])
            ->orderBy('id')
            ->paginate(20)
            ->through(fn ($n) => [
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
            'nominas' => $nominasPaginadas,
            'resumen' => [
                'total_empleados'   => $periodo->nominas()->count(),
                'total_devengado'   => (float) $periodo->total_devengado,
                'total_deducciones' => (float) $periodo->total_deducciones,
                'total_provisiones' => (float) $periodo->total_provisiones,
                'total_aportes'     => (float) $periodo->total_aportes_patronales,
                'neto_pagar'        => (float) $periodo->neto_pagar,
            ],
        ]);
    }

    /**
     * Crear un período y despachar liquidación asíncrona.
     */
    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'codigo'       => 'required|string|max:30',
            'mes_contable' => 'required|string|size:7',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'observaciones'=> 'nullable|string|max:500',
        ]);

        $exists = PeriodoNomina::where('tenant_id', $tenantId)
            ->where('mes_contable', $validated['mes_contable'])
            ->exists();

        if ($exists) {
            return back()->with('error', 'Ya existe un período para el mes contable seleccionado.');
        }

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

        \App\Jobs\LiquidarNominaJob::dispatch($periodo->id, $tenantId)
            ->onQueue('payroll');

        return redirect()->route('payroll.liquidaciones.show', $periodo->id)
            ->with('success', 'Período creado. Liquidación enviada a cola de procesamiento.');
    }
}
```

### ReporteController
**Ruta:** `app/Modules/Payroll/Controllers/ReporteController.php`
```php
<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payroll\Models\Nomina;
use App\Modules\Payroll\Models\PeriodoNomina;
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

                if (!isset($consolidado[$tipo])) continue;

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
```

---

## Models

### ConceptoNomina
**Ruta:** `app/Modules/Payroll/Models/ConceptoNomina.php`
```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo de Concepto de Nómina.
 * Catalogo fijo de conceptos retributivos (devengados, deducciones,
 * provisiones y aportes patronales) parametrizables por empresa.
 */
class ConceptoNomina extends Model
{
    use SoftDeletes;

    protected $table = 'pay_conceptos_nomina';

    protected $fillable = [
        'tenant_id',
        'codigo',
        'nombre',
        'tipo',
        'cuenta_contable_id',
        'base_seguridad_social',
        'base_parafiscales',
        'base_prestaciones',
        'activo',
    ];

    protected $casts = [
        'base_seguridad_social' => 'boolean',
        'base_parafiscales' => 'boolean',
        'base_prestaciones' => 'boolean',
        'activo' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function cuentaContable(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_contable_id');
    }
}
```

### PeriodoNomina
**Ruta:** `app/Modules/Payroll/Models/PeriodoNomina.php`
```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo de Periodo de Nómina.
 * Agrupa las liquidaciones individuales dentro de un mismo ciclo de pago.
 */
class PeriodoNomina extends Model
{
    public const ESTADOS = ['BORRADOR', 'LIQUIDADA', 'CONTABILIZADA', 'PAGADA', 'ANULADA'];

    protected $table = 'pay_periodos_nomina';

    protected $fillable = [
        'tenant_id',
        'codigo',
        'fecha_inicio',
        'fecha_fin',
        'mes_contable',
        'estado',
        'observaciones',
        'total_devengado',
        'total_deducciones',
        'total_provisiones',
        'total_aportes_patronales',
        'neto_pagar',
        'created_by',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'total_devengado' => 'decimal:2',
        'total_deducciones' => 'decimal:2',
        'total_provisiones' => 'decimal:2',
        'total_aportes_patronales' => 'decimal:2',
        'neto_pagar' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function nominas(): HasMany
    {
        return $this->hasMany(Nomina::class, 'periodo_id');
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
```

### Nomina
**Ruta:** `app/Modules/Payroll/Models/Nomina.php`
```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\Contrato;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo de Nómina Individual.
 * Representa la liquidación de un empleado dentro de un período.
 */
class Nomina extends Model
{
    protected $table = 'pay_nominas';

    protected $fillable = [
        'tenant_id',
        'periodo_id',
        'empleado_id',
        'contrato_id',
        'fecha_inicio',
        'fecha_fin',
        'ibc_seguridad_social',
        'ibc_parafiscales',
        'auxilio_transporte',
        'total_devengado',
        'total_deducciones',
        'neto_pagar',
        'total_provisiones',
        'total_aportes_patronales',
        'costo_laboral_total',
        'dias_laborados',
        'created_by',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'ibc_seguridad_social' => 'decimal:2',
        'ibc_parafiscales' => 'decimal:2',
        'auxilio_transporte' => 'decimal:2',
        'total_devengado' => 'decimal:2',
        'total_deducciones' => 'decimal:2',
        'neto_pagar' => 'decimal:2',
        'total_provisiones' => 'decimal:2',
        'total_aportes_patronales' => 'decimal:2',
        'costo_laboral_total' => 'decimal:2',
        'dias_laborados' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(PeriodoNomina::class, 'periodo_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(\App\Modules\Hr\Models\Empleado::class, 'empleado_id');
    }

    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class, 'contrato_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(NominaDetalle::class, 'nomina_id');
    }

    public function novedades(): HasMany
    {
        return $this->hasMany(Novedad::class, 'nomina_id');
    }

    public function creador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
```

### NominaDetalle
**Ruta:** `app/Modules/Payroll/Models/NominaDetalle.php`
```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Detalle de Nómina.
 * Desagregación por concepto de cada liquidación individual.
 */
class NominaDetalle extends Model
{
    use BelongsToTenant;

    protected $table = 'pay_nomina_detalles';

    protected $fillable = [
        'tenant_id',
        'nomina_id',
        'concepto_id',
        'empleado_id',
        'contrato_id',
        'cantidad',
        'valor',
        'base_calculo',
    ];

    protected $casts = [
        'cantidad' => 'decimal:2',
        'valor' => 'decimal:2',
        'base_calculo' => 'decimal:2',
    ];

    public function nomina(): BelongsTo
    {
        return $this->belongsTo(Nomina::class, 'nomina_id');
    }

    public function concepto(): BelongsTo
    {
        return $this->belongsTo(ConceptoNomina::class, 'concepto_id');
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class, 'contrato_id');
    }
}
```

### Novedad
**Ruta:** `app/Modules/Payroll/Models/Novedad.php`
```php
<?php

namespace App\Modules\Payroll\Models;

use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Contrato;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Modelo de Novedad de Nómina.
 * Incidencias que afectan la liquidación: incapacidades,
 * licencias, horas extras, bonificaciones, descuentos, etc.
 */
class Novedad extends Model
{
    protected $table = 'pay_novedades';

    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'contrato_id',
        'nomina_id',
        'concepto_id',
        'periodo_id',
        'tipo',
        'codigo',
        'concepto',
        'descripcion',
        'valor',
        'fecha_registro',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'referencia_type',
        'referencia_id',
    ];

    protected $casts = [
        'valor' => 'decimal:2',
        'fecha_registro' => 'date',
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class, 'contrato_id');
    }

    public function nomina(): BelongsTo
    {
        return $this->belongsTo(Nomina::class, 'nomina_id');
    }

    public function conceptoNomina(): BelongsTo
    {
        return $this->belongsTo(ConceptoNomina::class, 'concepto_id');
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(PeriodoNomina::class, 'periodo_id');
    }

    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }
}
```

### ParametroContable
**Ruta:** `app/Modules/Payroll/Models/ParametroContable.php`
```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CentroCosto;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Parámetro Contable de Nómina.
 * Define la contrapartida contable de cada concepto de nómina
 * según la categoría laboral del empleado.
 */
class ParametroContable extends Model
{
    protected $table = 'pay_parametros_contables';

    protected $fillable = [
        'tenant_id',
        'concepto_id',
        'categoria_laboral',
        'cuenta_debito_id',
        'cuenta_credito_id',
        'centro_costo_id',
        'fecha_inicio',
        'fecha_fin',
        'activo',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'activo' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function concepto(): BelongsTo
    {
        return $this->belongsTo(ConceptoNomina::class, 'concepto_id');
    }

    public function cuentaDebito(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_debito_id');
    }

    public function cuentaCredito(): BelongsTo
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_credito_id');
    }

    public function centroCosto(): BelongsTo
    {
        return $this->belongsTo(CentroCosto::class, 'centro_costo_id');
    }
}
```

### ProvisionAcumulada
**Ruta:** `app/Modules/Payroll/Models/ProvisionAcumulada.php`
```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Modelo de Provisión Acumulada.
 * Registro anual del acumulado de prestaciones sociales
 * para efectos contables y de liquidación.
 */
class ProvisionAcumulada extends Model
{
    protected $table = 'pay_provisiones_acumuladas';

    protected $fillable = [
        'tenant_id',
        'empleado_id',
        'tipo_provision',
        'ano',
        'saldo_inicial',
        'movimiento_mes',
        'saldo_final',
    ];

    protected $casts = [
        'saldo_inicial' => 'decimal:2',
        'movimiento_mes' => 'decimal:2',
        'saldo_final' => 'decimal:2',
        'ano' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }
}
```

---

## Services

### NominaService
**Ruta:** `app/Modules/Payroll/Services/NominaService.php`
```php
<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Services;

use App\Modules\Hr\Models\ConfiguracionLegal;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Incapacidad;
use App\Modules\Hr\Models\Prestamo;
use App\Modules\Payroll\Models\ConceptoNomina;
use App\Modules\Payroll\Models\Nomina;
use App\Modules\Payroll\Models\NominaDetalle;
use App\Modules\Payroll\Models\Novedad;
use App\Modules\Payroll\Models\PeriodoNomina;
use App\Modules\Payroll\Models\ProvisionAcumulada;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de Liquidación de Nómina Colombiana.
 *
 * Motor central de nómina que calcula todos los conceptos retributivos
 * (devengados, deducciones, provisiones y aportes patronales) según la
 * legislación laboral colombiana (CST, Ley 100/93, Ley 797/2003,
 * Ley 2101 de 2021, Estatuto Tributario Art. 383).
 *
 * Convenciones:
 *   - Mes de 30 días para cálculos proporcionales.
 *   - Horas semanales según Ley 2101 (reducción gradual: 46h → 42h desde jul/2026).
 *   - IBC mínimo: 1 SMMLV proporcional; máximo: 25 SMMLV.
 *   - Retefuente: Procedimiento 2 (Art. 383 ET) con tabla de 7 tramos marginales en UVT.
 */
class NominaService
{
    /** Cache de modelos ConceptoNomina por código */
    private array $conceptoCache = [];

    // -------------------------------------------------------------------------
    //  MÉTODOS PÚBLICOS
    // -------------------------------------------------------------------------

    /**
     * Liquida un empleado para un período de nómina.
     */
    public function liquidarEmpleado(
        Empleado $empleado,
        PeriodoNomina $periodo,
        ConfiguracionLegal $configLegal,
    ): array {
        // Preliminares
        $contrato = $this->getContratoActivo($empleado, $periodo);
        $datosPeriodo = $this->calcularDiasProporcionales($contrato, $periodo);
        $diasTrabajados = $datosPeriodo['dias_trabajados'];

        $horasSemanales = $this->getHorasSemanales($periodo, $configLegal);
        $valorHoraOrdinaria = $this->calcularValorHoraOrdinaria(
            (float) $contrato->salario_base,
            $horasSemanales,
        );

        $incapacidades = $this->obtenerIncapacidades($empleado, $periodo);
        $diasIncapacidad = (int) $incapacidades->sum('dias');
        $diasEfectivos = max(0, $diasTrabajados - $diasIncapacidad);

        $novedades = $this->obtenerNovedades($empleado, $periodo);

        // Acumuladores
        $conceptos = [];
        $totalDevengado = 0.0;
        $totalDeducciones = 0.0;

        $ibcSeguridadSocial = 0.0;
        $ibcParafiscales = 0.0;
        $basePrestaciones = 0.0;
        $baseVacaciones = 0.0;

        // 1. SALARIO BÁSICO PROPORCIONAL (SAL01)
        {
            $salarioProporcional = round(((float) $contrato->salario_base / 30) * $diasEfectivos);
            $conceptos[] = $this->entry('SAL01', $salarioProporcional, (float) $contrato->salario_base);
            $totalDevengado += $salarioProporcional;
            $ibcSeguridadSocial += $salarioProporcional;
            $ibcParafiscales += $salarioProporcional;
            $basePrestaciones += $salarioProporcional;
            $baseVacaciones += $salarioProporcional;
        }

        // 2. INCAPACIDADES (INC01)
        foreach ($incapacidades as $incapacidad) {
            $diasInc = (int) $incapacidad->dias;
            if ($diasInc <= 0) continue;

            $tasa = (float) ($incapacidad->porcentaje_pago ?? 66.67) / 100;
            $valorInc = round(((float) $contrato->salario_base / 30) * $diasInc * $tasa);

            if ($valorInc > 0) {
                $conceptos[] = $this->entry('INC01', $valorInc, round(((float) $contrato->salario_base / 30) * $diasInc));
                $totalDevengado += $valorInc;
                $ibcSeguridadSocial += $valorInc;
                $basePrestaciones += $valorInc;
            }
        }

        // 3. NOVEDADES (horas extras, recargos, bonos, comisiones)
        foreach ($novedades as $novedad) {
            $codigoConcepto = $novedad->codigo ?? $novedad->conceptoNomina?->codigo ?? 'NOV01';
            $multiplicador = $this->getMultiplicadorConcepto($codigoConcepto);

            $valorNovedad = (float) ($novedad->valor ?? 0);
            if ($valorNovedad <= 0) {
                $cantidad = \is_numeric($novedad->getAttribute('cantidad') ?? null) ? (float) $novedad->cantidad : 0;
                $unidades = max(1, $cantidad);
                $valorNovedad = round($valorHoraOrdinaria * $multiplicador * $unidades);
            }

            if ($valorNovedad <= 0) continue;

            $conceptos[] = $this->entry($codigoConcepto, $valorNovedad, round($valorNovedad / max($multiplicador, 1)));
            $totalDevengado += $valorNovedad;

            if ($novedad->conceptoNomina?->base_seguridad_social) $ibcSeguridadSocial += $valorNovedad;
            if ($novedad->conceptoNomina?->base_parafiscales) $ibcParafiscales += $valorNovedad;
            if ($novedad->conceptoNomina?->base_prestaciones) $basePrestaciones += $valorNovedad;
        }

        // 4. AUXILIO DE TRANSPORTE (AUX01)
        {
            $salarioMinimo = (float) $configLegal->salario_minimo;
            $topeSalarios = (float) ($configLegal->tope_auxilio_transporte_salarios ?? 2);
            $topeAuxilio = $salarioMinimo * $topeSalarios;

            if ((float) $contrato->salario_base <= $topeAuxilio && $diasEfectivos > 0) {
                $valorAuxilio = round(((float) $configLegal->auxilio_transporte / 30) * $diasEfectivos);
                if ($valorAuxilio > 0) {
                    $conceptos[] = $this->entry('AUX01', $valorAuxilio, $valorAuxilio);
                    $totalDevengado += $valorAuxilio;
                    $basePrestaciones += $valorAuxilio;
                }
            }
        }

        // 5. IBC — INGRESO BASE DE COTIZACIÓN
        {
            $ibcMinimo = round($salarioMinimo / 30 * $diasTrabajados);
            $ibcSeguridadSocial = max($ibcSeguridadSocial, (float) $ibcMinimo);
            $ibcParafiscales = max($ibcParafiscales, (float) $ibcMinimo);

            $ibcMaximo = 25 * $salarioMinimo;
            $ibcSeguridadSocial = min($ibcSeguridadSocial, (float) $ibcMaximo);
        }

        // 6. SALUD (DED01) — 4% empleado
        {
            $tasaSalud = (float) ($configLegal->aporte_salud_empleado ?? 4) / 100;
            $valorSalud = round($ibcSeguridadSocial * $tasaSalud);
            $conceptos[] = $this->entry('DED01', $valorSalud, $ibcSeguridadSocial);
            $totalDeducciones += $valorSalud;
        }

        // 7. PENSIÓN (DED02) — 4% empleado
        {
            $tasaPension = (float) ($configLegal->aporte_pension_empleado ?? 4) / 100;
            $valorPension = round($ibcSeguridadSocial * $tasaPension);
            $conceptos[] = $this->entry('DED02', $valorPension, $ibcSeguridadSocial);
            $totalDeducciones += $valorPension;
        }

        // 8. FONDO DE SOLIDARIDAD PENSIONAL (DED05)
        {
            $salariosMinimos = $salarioMinimo > 0 ? $ibcSeguridadSocial / $salarioMinimo : 0;
            $tasaFsp = $this->getTasaFondoSolidaridad($salariosMinimos);

            if ($tasaFsp > 0) {
                $valorFsp = round($ibcSeguridadSocial * ($tasaFsp / 100));
                $conceptos[] = $this->entry('DED05', $valorFsp, $ibcSeguridadSocial);
                $totalDeducciones += $valorFsp;
            }
        }

        // 9. RETENCIÓN EN LA FUENTE (DED03) — Procedimiento 2 Art. 383 ET
        {
            $valorRetefuente = $this->calcularRetefuente(
                ingresoLaboral: $totalDevengado,
                deducciones: $totalDeducciones,
                configLegal: $configLegal,
            );

            if ($valorRetefuente > 0) {
                $conceptos[] = $this->entry('DED03', $valorRetefuente, $totalDevengado);
                $totalDeducciones += $valorRetefuente;
            }
        }

        // 10. PRÉSTAMOS (DED04)
        {
            $fechaFinStr = $this->dateToString($periodo->fecha_fin);

            $prestamosActivos = Prestamo::with('cuotas')
                ->where('empleado_id', $empleado->id)
                ->where('estado', 'ACTIVO')
                ->get();

            foreach ($prestamosActivos as $prestamo) {
                $cuotaVencida = $prestamo->cuotas()
                    ->where('estado', 'PENDIENTE')
                    ->where('fecha_vencimiento', '<=', $fechaFinStr)
                    ->orderBy('numero_cuota')
                    ->first();

                if (!$cuotaVencida) continue;

                $conceptos[] = $this->entry('DED04', (float) $cuotaVencida->monto, (float) $cuotaVencida->monto);
                $totalDeducciones += (float) $cuotaVencida->monto;
            }
        }

        // 11. PROVISIONES
        $totalProvisiones = 0.0;
        foreach ($this->calcularProvisiones($basePrestaciones, $baseVacaciones) as $entry) {
            $conceptos[] = $entry;
            $totalProvisiones += $entry['valor'];
        }

        // 12. APORTES PATRONALES
        $riesgoArl = $contrato->getAttribute('riesgo_arl_clase') ?? 'I';
        $exonerado = (bool) ($contrato->getAttribute('aplica_exoneracion_aportes') ?? false);

        $totalPatronales = 0.0;
        foreach ($this->calcularAportesPatronales(
            ibcSeguridadSocial: $ibcSeguridadSocial,
            ibcParafiscales: $ibcParafiscales,
            configLegal: $configLegal,
            riesgoArlClase: $riesgoArl,
            exonerado: $exonerado,
        ) as $entry) {
            $conceptos[] = $entry;
            $totalPatronales += $entry['valor'];
        }

        // Vincular novedades al período
        $this->vincularNovedades($novedades, $periodo);

        // Resumen
        $netoPagar = $totalDevengado - $totalDeducciones;

        return [
            'conceptos' => $conceptos,
            'resumen'   => [
                'dias_laborados'           => $diasTrabajados,
                'dias_incapacidad'         => $diasIncapacidad,
                'ibc_seguridad_social'     => $ibcSeguridadSocial,
                'ibc_parafiscales'         => $ibcParafiscales,
                'total_devengado'          => $totalDevengado,
                'total_deducciones'        => $totalDeducciones,
                'neto_pagar'               => $netoPagar,
                'total_provisiones'        => $totalProvisiones,
                'total_aportes_patronales' => $totalPatronales,
                'costo_laboral_total'      => $totalDevengado + $totalProvisiones + $totalPatronales,
            ],
        ];
    }

    /**
     * Liquida la nómina completa para todos los empleados activos.
     */
    public function liquidarPeriodo(PeriodoNomina $periodo): int
    {
        $estado = strtoupper($periodo->estado ?? '');
        if (!\in_array($estado, ['BORRADOR', 'DRAFT'], true)) {
            throw new \RuntimeException("El período {$periodo->codigo} no está en estado BORRADOR ({$periodo->estado}).");
        }

        return DB::transaction(function () use ($periodo): int {
            $this->revertirCuotasDelPeriodo($periodo);

            $periodo->nominas()->each(function (Nomina $nomina): void {
                $nomina->detalles()->delete();
                $nomina->delete();
            });

            $fechaInicio = $this->dateToString($periodo->fecha_inicio);
            $ano = (int) date('Y', strtotime($fechaInicio));

            $configLegal = ConfiguracionLegal::where('ano_vigencia', $ano)
                ->where('tenant_id', $periodo->tenant_id)
                ->first();

            if (!$configLegal) {
                throw new \RuntimeException("No se encontró configuración legal para el año {$ano}.");
            }

            $fechaFin = $this->dateToString($periodo->fecha_fin);

            $contratos = Contrato::with('empleado')
                ->where('estado', true)
                ->where('fecha_inicio', '<=', $fechaFin)
                ->where(function ($q) use ($fechaInicio): void {
                    $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $fechaInicio);
                })
                ->get();

            $contador = 0;

            foreach ($contratos as $contrato) {
                $empleado = $contrato->empleado;
                if (!$empleado) continue;

                $resultado = $this->liquidarEmpleado($empleado, $periodo, $configLegal);
                $this->persistirLiquidacion($periodo, $contrato, $empleado, $resultado, $ano);
                $contador++;
            }

            $periodo->refresh();
            $periodo->update([
                'total_devengado'          => round($periodo->nominas()->sum('total_devengado'), 2),
                'total_deducciones'        => round($periodo->nominas()->sum('total_deducciones'), 2),
                'total_provisiones'        => round($periodo->nominas()->sum('total_provisiones'), 2),
                'total_aportes_patronales' => round($periodo->nominas()->sum('total_aportes_patronales'), 2),
                'neto_pagar'               => round($periodo->nominas()->sum('neto_pagar'), 2),
                'estado'                   => 'LIQUIDADA',
            ]);

            return $contador;
        });
    }

    /**
     * Recalcula los totales de una nómina a partir de sus detalles.
     */
    public function recalcularTotales(Nomina $nomina): void { /* ... */ }

    /**
     * Actualiza un concepto individual en una nómina ya liquidada.
     */
    public function actualizarConcepto(Nomina $nomina, int $conceptoId, float $nuevoValor): void { /* ... */ }

    // -------------------------------------------------------------------------
    //  CÁLCULOS ESPECÍFICOS
    // -------------------------------------------------------------------------

    public function calcularRetefuente(
        float $ingresoLaboral,
        float $deducciones,
        ConfiguracionLegal $configLegal,
    ): float { /* ... tramos Art. 383 ET ... */ }

    public function calcularProvisiones(float $basePrestaciones, float $baseVacaciones): array
    {
        // PRO01: Prima = base / 12
        // PRO02: Cesantías = base / 12
        // PRO03: Intereses Cesantías = cesantías × 12%
        // PRO04: Vacaciones = baseVacaciones / 24
    }

    public function calcularAportesPatronales(
        float $ibcSeguridadSocial,
        float $ibcParafiscales,
        ConfiguracionLegal $configLegal,
        string $riesgoArlClase = 'I',
        bool $exonerado = false,
    ): array
    {
        // PAT01: Pensión patronal 12%
        // PAT02: Salud patronal 8.5% (si no exonerado)
        // PAT03: ARL según clase (0.522% a 6.960%)
        // PAT04: Caja Compensación 4%
        // PAT05: SENA 2% (si no exonerado)
        // PAT06: ICBF 3% (si no exonerado)
    }

    // -------------------------------------------------------------------------
    //  CÓDIGOS DE CONCEPTOS
    // -------------------------------------------------------------------------
    // SAL01  — Salario Básico Proporcional
    // INC01  — Auxilio por Incapacidad
    // AUX01  — Auxilio de Transporte
    // HEX01  — Hora Extra Diurna (×1.25)
    // HEX02  — Hora Extra Nocturna (×1.75)
    // HEX03  — Hora Extra Diurna Festiva (×2.00)
    // HEX04  — Hora Extra Nocturna Festiva (×2.50)
    // REC01  — Recargo Nocturno (×1.35)
    // REC02  — Recargo Festivo (×1.75)
    // REC03  — Recargo Nocturno Festivo (×2.10)
    // EDF01  — Dominical/Festivo diurno (×1.75)
    // ENF01  — Dominical/Festivo nocturno (×2.10)
    // BON01  — Bonificación No Salarial
    // BON02  — Bonificación Salarial
    // COM01  — Comisiones
    // DED01  — Aporte Salud (4%)
    // DED02  — Aporte Pensión (4%)
    // DED03  — Retención en la Fuente
    // DED04  — Préstamos
    // DED05  — Fondo Solidaridad Pensional
    // PRO01  — Prima de Servicios
    // PRO02  — Cesantías
    // PRO03  — Intereses a las Cesantías
    // PRO04  — Vacaciones
    // PAT01  — Pensión Patronal (12%)
    // PAT02  — Salud Patronal (8.5%)
    // PAT03  — ARL
    // PAT04  — Caja de Compensación (4%)
    // PAT05  — SENA (2%)
    // PAT06  — ICBF (3%)
}
```

### PayrollLiquidator (DEPRECATED)
**Ruta:** `app/Modules/Payroll/Services/PayrollLiquidator.php`
```php
<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Hr\Models\Empleado;
use App\Modules\Payroll\Models\Novedad;

/**
 * @deprecated 2026-06-26 — Eliminado de LiquidacionController y PeriodoController.
 *             Ambos controladores ahora usan NominaService exclusivamente.
 *             Este archivo solo se mantiene por referencia histórica.
 */
class PayrollLiquidator
{
    public const SMLMV = 1400000;
    public const AUXILIO_TRANSPORTE = 200000;
    public const PORCENTAJE_SALUD = 0.04;
    public const PORCENTAJE_PENSION = 0.04;

    public function liquidarMensualidad(Empleado $empleado, array $novedadesPeriodo = []): array
    {
        // Cálculo simplificado (legacy) — no usa ConfiguracionLegal
    }
}
```

### PayrollProvisioner
**Ruta:** `app/Modules/Payroll/Services/PayrollProvisioner.php`
```php
<?php

namespace App\Modules\Payroll\Services;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\ConfiguracionLegal;
use App\Modules\Payroll\Models\ConceptoNomina;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PayrollProvisioner
{
    public function provisionForTenant(Tenant $tenant): void
    {
        // 1. Configuración legal por defecto (año actual)
        // 2. Catálogo de 27 conceptos de nómina (DEVENGADO, DEDUCCION, PROVISION, APORTE_PATRONAL)
        // 3. Permisos extra (payroll:edit, payroll:delete, payroll:manage) al rol ADMIN_EMPRESA
    }
}
```

### ContabilidadNominaService
**Ruta:** `app/Modules/Payroll/Services/ContabilidadNominaService.php`
```php
<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Payroll\Models\PeriodoNomina;

class ContabilidadNominaService
{
    public function __construct(private ContabilidadService $contabilidadService) {}

    public function contabilizarPeriodo(PeriodoNomina $periodo): void
    {
        $tenantId = $periodo->tenant_id;

        // Cuentas contables requeridas:
        // 2505 — Salarios por pagar (pasivo)
        // 5105 — Gastos de nómina (gasto)
        // 2370 — Aportes parafiscales por pagar (pasivo)

        $periodo->load(['nominas.empleado', 'nominas.detalles.concepto']);

        $centroCostoDefault = CentroCosto::firstOrCreate(
            ['tenant_id' => $tenantId, 'codigo' => '01'],
            ['nombre' => 'General', 'es_activo' => true]
        );

        $lineas = [];

        foreach ($periodo->nominas as $nomina) {
            $empleado = $nomina->empleado;
            if (!$empleado) continue;

            foreach ($nomina->detalles as $detalle) {
                $concepto = $detalle->concepto;
                if (!$concepto->cuenta_contable_id) continue;

                if ($concepto->tipo === 'PROVISION') {
                    // Débito al Gasto (5105), Crédito al Pasivo (cuenta del concepto)
                } elseif ($concepto->tipo === 'APORTE_PATRONAL') {
                    // Débito al Gasto (cuenta del concepto), Crédito al Pasivo (2370)
                } else {
                    // DEVENGADO: Débito | DEDUCCION: Crédito
                }
            }

            // Neto a pagar → Crédito cuenta 2505 (Salarios por pagar)
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
```

---

## Migrations

### 2026_06_20_135501_create_payroll_tables
**Ruta:** `app/Modules/Payroll/Migrations/2026_06_20_135501_create_payroll_tables.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pay_nominas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('mes', 7);
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('estado', 50)->default('borrador');
            $table->timestamps();
        });

        Schema::create('pay_nomina_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nomina_id')->constrained('pay_nominas')->cascadeOnDelete();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();

            $table->integer('dias_laborados');
            $table->decimal('salario_base', 15, 2);
            $table->decimal('auxilio_transporte', 15, 2)->default(0);

            $table->decimal('salud_deduccion', 15, 2)->default(0);
            $table->decimal('pension_deduccion', 15, 2)->default(0);

            $table->decimal('total_devengos', 15, 2);
            $table->decimal('total_deducciones', 15, 2);
            $table->decimal('neto_pagar', 15, 2);
            $table->timestamps();
        });

        Schema::create('pay_novedades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->foreignId('nomina_id')->nullable()->constrained('pay_nominas')->nullOnDelete();

            $table->string('tipo', 50);
            $table->string('concepto', 150);
            $table->decimal('valor', 15, 2);
            $table->date('fecha_registro');
            $table->string('estado', 50)->default('pendiente');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pay_novedades');
        Schema::dropIfExists('pay_nomina_detalles');
        Schema::dropIfExists('pay_nominas');
    }
};
```

### 2026_06_20_135502_create_payroll_conceptos_tables
**Ruta:** `app/Modules/Payroll/Migrations/2026_06_20_135502_create_payroll_conceptos_tables.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // pay_conceptos_nomina — catálogo de conceptos retributivos
        // pay_periodos_nomina — períodos de liquidación
        // pay_provisiones_acumuladas — acumulado anual de prestaciones
        // pay_parametros_contables — contrapartida contable por concepto
        // Extiende pay_nominas con campos de liquidación
        // Reestructura pay_nomina_detalles para usar conceptos
        // Extiende pay_novedades con concepto_id, periodo_id, referencia
    }

    public function down(): void { /* ... */ }
};
```

### 2026_07_05_300000_add_tenant_id_to_pay_nomina_detalles
**Ruta:** `app/Modules/Payroll/Migrations/2026_07_05_300000_add_tenant_id_to_pay_nomina_detalles.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Agrega tenant_id a pay_nomina_detalles
        // Backfill desde pay_nominas.tenant_id
        // Agrega FK y índice
    }

    public function down(): void
    {
        // Elimina FK, índice y columna tenant_id
    }
};
```

---

## Frontend Pages

### Periodos/Index.jsx
**Ruta:** `resources/js/Pages/Payroll/Periodos/Index.jsx`
> 319 líneas. Componente funcional con DataTable, Dialog para crear período, búsqueda en tiempo real, Badges de estado con colores. Usa `usePermissions`, `useForm`, `router`. Formateo de fechas con `date-fns/locale es`.

### Periodos/Show.jsx
**Ruta:** `resources/js/Pages/Payroll/Periodos/Show.jsx`
> 363 líneas. Detalle de período con StatsCards (Empleados, Devengado, Deducciones, Provisiones, Aportes, Neto). Sábana de nómina con DataTable. Acciones: Liquidar, Aprobar/Contabilizar, Anular. EmptyState personalizado.

### Nominas/Index.jsx
**Ruta:** `resources/js/Pages/Payroll/Nominas/Index.jsx`
> 311 líneas. Listado de nóminas individuales con búsqueda, badges de estado, links a detalle. Dialog de "Generar Nómina" (legacy, apunta a `payroll.nominas.store` que no existe en rutas actuales).

### Nominas/Show.jsx
**Ruta:** `resources/js/Pages/Payroll/Nominas/Show.jsx`
> 450 líneas. Detalle completo de nómina: StatsCards, Neto a Pagar destacado, Costo Laboral Total, desglose de conceptos por tipo (DEVENGADO, DEDUCCION, PROVISION, APORTE_PATRONAL) con tablas desktop y cards móvil. Novedades aplicadas. Links a Desprendible PDF e Imprimir.

### Novedades/Index.jsx
**Ruta:** `resources/js/Pages/Payroll/Novedades/Index.jsx`
> 549 líneas. Layout 2 columnas: formulario de registro (izq) + listado con filtros (der). Filtros expandibles por período, concepto, tipo, estado. Toggle Ingreso/Descuento. Eliminación con confirmación.

### Reportes/Index.jsx
**Ruta:** `resources/js/Pages/Payroll/Reportes/Index.jsx`
> 60 líneas. Índice de reportes: lista de períodos con link a Resumen.

### Reportes/Desprendible.jsx
**Ruta:** `resources/js/Pages/Payroll/Reportes/Desprendible.jsx`
> 475 líneas. Desprendible de pago (payslip) para impresión/PDF. Secciones: Encabezado empresa, datos empleado, Devengados (tabla), Deducciones (tabla), Neto a Pagar, IBC, Provisiones, Aportes Patronales. CSS `@media print` con `@page A4`. Botón "Imprimir / PDF".

### Liquidaciones/Index.tsx (LEGACY)
**Ruta:** `resources/js/Pages/Payroll/Liquidaciones/Index.tsx`
> 169 líneas. Página legacy de liquidaciones con formulario inline para crear período y despachar liquidación asíncrona. DataTable con tipos TypeScript.

### Liquidaciones/Show.tsx (LEGACY)
**Ruta:** `resources/js/Pages/Payroll/Liquidaciones/Show.tsx`
> 128 líneas. Detalle legacy de período con StatsCards y sábana de nómina. Botón "Cerrar y Liquidar" que despacha `payroll.periodos.liquidar`.

---

## Tests

### NominaServiceTest
**Ruta:** `tests/Feature/Modules/Payroll/NominaServiceTest.php`
> 513 líneas. 10 tests que validan: salud/pensión 4%, auxilio de transporte (umbral 2 SMMLV), IBC mínimo, novedades, persistencia de liquidación de período, múltiples empleados, rechazo de estado no BORRADOR, falla sin configuración legal, provisiones, aportes patronales, consistencia del resumen numérico.

### CertificacionNominaTest
**Ruta:** `tests/Feature/Modules/Payroll/CertificacionNominaTest.php`
> 489 líneas. 4 tests de certificación end-to-end que validan: configuración del entorno, salario mínimo con extras y auxilio, salario alto sin auxilio con retefuente, empleado con incapacidad, y aprobación de nómina generando asientos contables cuadrados.

---

## Correcciones

### CRÍTICO — Columna `concepto` legacy en `pay_novedades`

**Problema:** La migración `2026_06_20_135501` crea `pay_novedades.concepto` (string), pero el modelo `Novedad` tiene `$fillable` con `'concepto'` y también una relación `conceptoNomina()` BelongsTo a `ConceptoNomina`. Esto genera un conflicto: la columna string `concepto` en la BD no es una relación Eloquent, así que `$novedad->concepto` retorna el string en lugar del modelo.

**Impacto:** En `NominaService::obtenerNovedades()`, cuando hace `Novedad::with('conceptoNomina')`, el accessor `concepto` no funciona como relación. El servicio resuelve esto usando `->conceptoNomina?->codigo` explícitamente, pero la columna `concepto` (string) en `$fillable` entra en conflicto con la relación `concepto()` si se hubiera definido como `BelongsTo('concepto')`.

**Corrección recomendada:** Renombrar la columna `concepto` a `concepto_legacy` o eliminarla, ya que ahora se usa `concepto_id` (FK a `pay_conceptos_nomina`). Agregar migración:
```php
Schema::table('pay_novedades', function (Blueprint $table) {
    $table->renameColumn('concepto', 'concepto_legacy');
});
```
Y quitar `'concepto'` de `$fillable` en `Novedad.php`.

### ALTO — LiquidacionController duplica lógica de PeriodoController

**Problema:** `LiquidacionController::store()` crea períodos y despacha `LiquidarNominaJob` directamente, duplicando la validación de `PeriodoController::store()`. Las rutas `/payroll/liquidaciones/*` son redundantes con `/payroll/periodos/*`.

**Corrección recomendada:** Marcar `LiquidacionController` como `@deprecated` y redirigir las páginas `Liquidaciones/Index.tsx` y `Liquidaciones/Show.tsx` hacia `Periodos/Index.jsx` y `Periodos/Show.jsx`. Mantener las rutas legacy solo por compatibilidad temporal.

### ALTO — LiquidarNominaJob referenciado pero no existe

**Problema:** `PeriodoController::liquidar()` y `LiquidacionController::store()` despachan `\App\Jobs\LiquidarNominaJob`, pero no se encontró este archivo en `app/Jobs/`. El job probablemente no está creado aún o fue eliminado.

**Corrección recomendada:** Crear `app/Jobs/LiquidarNominaJob.php` que invoque `NominaService::liquidarPeriodo()` dentro de `handle()`, o eliminar las referencias y usar la liquidación síncrona directamente.

### MEDIO — NovedadController::storeBulk redeclara `$tenantId`

**Problema:** En `NovedadController::storeBulk()`, la línea 136 redeclara `$tenantId = auth()->user()->tenant_id;` después de haberlo declarado en la línea 122. Es redundante.

**Corrección recomendada:** Eliminar la línea duplicada 136.

### MEDIO — Falta Provider de módulo

**Problema:** El módulo no tiene `Providers/PayrollServiceProvider.php` para registrar rutas de forma explícita. Depende completamente del escaneo automático (`modules:scan`).

**Corrección recomendada:** Crear `PayrollServiceProvider` que registre las rutas, similar a otros módulos.

### BAJO — FSP usa `$salarioMinimo` que podría ser 0

**Problema:** En `NominaService`, `$salariosMinimos = $salarioMinimo > 0 ? $ibcSeguridadSocial / $salarioMinimo : 0;` protege contra división por cero, pero `$salarioMinimo` viene de `ConfiguracionLegal` que podría no tener el campo configurado.

**Corrección recomendada:** Agregar validación en `PayrollProvisioner` para asegurar que `ConfiguracionLegal` siempre tenga `salario_minimo` > 0.

### BAJO — `Nominas/Index.jsx` usa route inexistente

**Problema:** El componente `Nominas/Index.jsx` tiene un Dialog de "Generar Nómina" que envía POST a `route('payroll.nominas.store')`, pero esta ruta no existe en `web.php`. Las nóminas se crean al liquidar un período, no individualmente.

**Corrección recomendada:** Eliminar el Dialog o redirigir al usuario a la página de Períodos.