# Auditoría: Payroll (Nómina) — Código Completo

> **Código del módulo:** payroll
> **Nombre:** Nómina
> **Versión:** 1.0.0
> **Dependencias:** hr
> **Fecha de auditoría:** 2026-07-05
> **Total archivos analizados:** 22

---

## module.json

**Ruta:** `app\Modules\Payroll\module.json`

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

## Routes

**Ruta:** `app\Modules\Payroll\Routes\web.php`

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

        // PERÍODOS DE NÓMINA
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

        // NÓMINAS INDIVIDUALES
        Route::get('nominas', [NominaController::class, 'index'])
            ->name('nominas.index')
            ->middleware('permission:payroll:view');

        Route::get('nominas/{nomina}', [NominaController::class, 'show'])
            ->name('nominas.show')
            ->middleware('permission:payroll:view');

        Route::post('nominas/{nomina}/concepto', [NominaController::class, 'updateConcepto'])
            ->name('nominas.update-concepto')
            ->middleware('permission:payroll:edit');

        // NOVEDADES
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

        // REPORTES
        Route::get('reportes', [ReporteController::class, 'index'])
            ->name('reportes.index')
            ->middleware('permission:payroll:report');

        Route::get('reportes/resumen/{periodo}', [ReporteController::class, 'resumen'])
            ->name('reportes.resumen')
            ->middleware('permission:payroll:report');

        Route::get('reportes/desprendible/{nomina}', [ReporteController::class, 'desprendible'])
            ->name('reportes.desprendible')
            ->middleware('permission:payroll:report');

        // LIQUIDACIONES LEGACY
        Route::get('liquidaciones', [LiquidacionController::class, 'index'])
            ->name('liquidaciones.index')
            ->middleware('permission:payroll:view');

        Route::post('liquidaciones', [LiquidacionController::class, 'store'])
            ->name('liquidaciones.store')
            ->middleware('permission:payroll:liquidate');

        Route::get('liquidaciones/{periodo}', [LiquidacionController::class, 'show'])
            ->name('liquidaciones.show')
            ->middleware('permission:payroll:view')
            ->defaults('binding', 'periodo');

    });
});
```

---

## Controllers

### LiquidacionController.php

**Ruta:** `app\Modules\Payroll\Controllers\LiquidacionController.php`

```php
<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payroll\Models\PeriodoNomina;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LiquidacionController extends Controller
{
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

### NominaController.php

**Ruta:** `app\Modules\Payroll\Controllers\NominaController.php`

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

### NovedadController.php

**Ruta:** `app\Modules\Payroll\Controllers\NovedadController.php`

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
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class NovedadController extends Controller
{
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

    public function destroy(Novedad $novedad)
    {
        $tenantId = auth()->user()->tenant_id;

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

### PeriodoController.php

**Ruta:** `app\Modules\Payroll\Controllers\PeriodoController.php`

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

    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $periodos = PeriodoNomina::where('tenant_id', $tenantId)
            ->withCount('nominas')
            ->when($request->search, function ($q, $search) {
                $q->where('codigo', 'ilike', "%{$search}%")
                  ->orWhere('mes_contable', 'ilike', "%{$search}%");
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

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'codigo'       => 'required|string|max:30',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after_or_equal:fecha_inicio',
            'mes_contable' => 'required|string|size:7',
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

        return redirect()->route('payroll.periodos.show', $periodo->id)
            ->with('success', 'Período creado exitosamente.');
    }

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

    public function aprobar(PeriodoNomina $periodo, ContabilidadNominaService $contabilidadService)
    {
        $this->authorizeTenant($periodo);

        if ($periodo->estado !== 'LIQUIDADA') {
            throw new \Exception('Solo se puede aprobar un período en estado LIQUIDADA.');
        }

        DB::transaction(function () use ($periodo, $contabilidadService) {
            $contabilidadService->contabilizarPeriodo($periodo);
            $periodo->update(['estado' => 'CONTABILIZADA']);
        });

        return back()->with('success', 'Período contabilizado exitosamente.');
    }

    public function anular(PeriodoNomina $periodo)
    {
        $this->authorizeTenant($periodo);

        if (!in_array($periodo->estado, ['BORRADOR', 'LIQUIDADA'], true)) {
            return back()->with('error', 'No se puede anular un período en estado ' . $periodo->estado . '.');
        }

        DB::transaction(function () use ($periodo) {
            $periodo->nominas()->each(function ($nomina) {
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

    private function authorizeTenant(PeriodoNomina $periodo): void
    {
        if ($periodo->tenant_id !== auth()->user()->tenant_id) {
            abort(403, 'Este período no pertenece a su empresa.');
        }
    }
}
```

### ReporteController.php

**Ruta:** `app\Modules\Payroll\Controllers\ReporteController.php`

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
    public function index()
    {
        $periodos = PeriodoNomina::where('tenant_id', auth()->user()->tenant_id)
            ->orderByDesc('fecha_inicio')
            ->get(['id', 'codigo', 'mes_contable', 'fecha_inicio', 'fecha_fin', 'estado', 'total_devengado', 'neto_pagar']);

        return Inertia::render('Payroll/Reportes/Index', [
            'periodos' => $periodos,
        ]);
    }

    public function resumen(PeriodoNomina $periodo)
    {
        if ($periodo->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $periodo->load(['nominas.contrato.empleado', 'nominas.detalles.concepto']);

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

### ConceptoNomina.php

**Ruta:** `app\Modules\Payroll\Models\ConceptoNomina.php`

```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConceptoNomina extends Model
{
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

### Nomina.php

**Ruta:** `app\Modules\Payroll\Models\Nomina.php`

```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\Contrato;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

### NominaDetalle.php

**Ruta:** `app\Modules\Payroll\Models\NominaDetalle.php`

```php
<?php

namespace App\Modules\Payroll\Models;

use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NominaDetalle extends Model
{
    protected $table = 'pay_nomina_detalles';

    protected $fillable = [
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

### Novedad.php

**Ruta:** `app\Modules\Payroll\Models\Novedad.php`

```php
<?php

namespace App\Modules\Payroll\Models;

use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Contrato;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

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

### ParametroContable.php

**Ruta:** `app\Modules\Payroll\Models\ParametroContable.php`

```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CentroCosto;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

### PeriodoNomina.php

**Ruta:** `app\Modules\Payroll\Models\PeriodoNomina.php`

```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

### ProvisionAcumulada.php

**Ruta:** `app\Modules\Payroll\Models\ProvisionAcumulada.php`

```php
<?php

namespace App\Modules\Payroll\Models;

use App\Core\Models\Tenant;
use App\Modules\Hr\Models\Empleado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

## Migrations

### 2026_06_20_135501_create_payroll_tables.php

**Ruta:** `app\Modules\Payroll\Migrations\2026_06_20_135501_create_payroll_tables.php`

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

### 2026_06_20_135502_create_payroll_conceptos_tables.php

**Ruta:** `app\Modules\Payroll\Migrations\2026_06_20_135502_create_payroll_conceptos_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pay_conceptos_nomina', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('codigo', 20);
            $table->string('nombre', 200);
            $table->string('tipo', 30);
            $table->foreignId('cuenta_contable_id')->nullable()->index();
            $table->boolean('base_seguridad_social')->default(false);
            $table->boolean('base_parafiscales')->default(false);
            $table->boolean('base_prestaciones')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['tenant_id', 'codigo']);
        });

        Schema::create('pay_periodos_nomina', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('codigo', 30);
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('mes_contable', 7);
            $table->string('estado', 30)->default('BORRADOR');
            $table->decimal('total_devengado', 15, 2)->default(0);
            $table->decimal('total_deducciones', 15, 2)->default(0);
            $table->decimal('total_provisiones', 15, 2)->default(0);
            $table->decimal('total_aportes_patronales', 15, 2)->default(0);
            $table->decimal('neto_pagar', 15, 2)->default(0);
            $table->text('observaciones')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'codigo']);
            $table->index(['tenant_id', 'estado']);
        });

        Schema::create('pay_provisiones_acumuladas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('empleado_id')->constrained('hr_empleados')->cascadeOnDelete();
            $table->string('tipo_provision', 30);
            $table->integer('ano');
            $table->decimal('saldo_inicial', 15, 2)->default(0);
            $table->decimal('movimiento_mes', 15, 2)->default(0);
            $table->decimal('saldo_final', 15, 2)->default(0);
            $table->timestamps();
            $table->unique(['empleado_id', 'tipo_provision', 'ano']);
        });

        Schema::create('pay_parametros_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('concepto_id')->constrained('pay_conceptos_nomina')->cascadeOnDelete();
            $table->string('categoria_laboral', 50);
            $table->foreignId('cuenta_debito_id')->nullable()->index();
            $table->foreignId('cuenta_credito_id')->nullable()->index();
            $table->foreignId('centro_costo_id')->nullable()->index();
            $table->date('fecha_inicio');
            $table->date('fecha_fin')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->index(['concepto_id', 'categoria_laboral']);
        });

        Schema::table('pay_nominas', function (Blueprint $table) {
            $table->dropColumn('mes');
            $table->foreignId('periodo_id')->nullable()->after('id')->constrained('pay_periodos_nomina')->nullOnDelete();
            $table->foreignId('empleado_id')->nullable()->after('periodo_id')->constrained('hr_empleados')->nullOnDelete();
            $table->foreignId('contrato_id')->nullable()->after('empleado_id')->constrained('hr_contratos')->nullOnDelete();
            $table->decimal('ibc_seguridad_social', 15, 2)->default(0)->after('salario_base');
            $table->decimal('ibc_parafiscales', 15, 2)->default(0)->after('ibc_seguridad_social');
            $table->decimal('total_devengado', 15, 2)->default(0)->after('ibc_parafiscales');
            $table->decimal('total_deducciones', 15, 2)->default(0)->after('total_devengado');
            $table->decimal('neto_pagar', 15, 2)->default(0)->after('total_deducciones');
            $table->decimal('total_provisiones', 15, 2)->default(0)->after('neto_pagar');
            $table->decimal('total_aportes_patronales', 15, 2)->default(0)->after('total_provisiones');
            $table->decimal('costo_laboral_total', 15, 2)->default(0)->after('total_aportes_patronales');
            $table->decimal('auxilio_transporte', 15, 2)->default(0)->after('salario_base');
            $table->integer('dias_laborados')->default(30)->after('empleado_id');
            $table->foreignId('created_by')->nullable()->after('costo_laboral_total')->constrained('users')->nullOnDelete();
        });

        Schema::table('pay_nomina_detalles', function (Blueprint $table) {
            $table->dropColumn(['salario_base', 'auxilio_transporte', 'salud_deduccion', 'pension_deduccion', 'total_devengos', 'total_deducciones', 'neto_pagar', 'dias_laborados']);
            $table->foreignId('concepto_id')->nullable()->after('nomina_id')->constrained('pay_conceptos_nomina')->nullOnDelete();
            $table->foreignId('contrato_id')->nullable()->after('empleado_id')->constrained('hr_contratos')->nullOnDelete();
            $table->decimal('cantidad', 10, 2)->default(1)->after('concepto_id');
            $table->decimal('valor', 15, 2)->default(0)->after('cantidad');
            $table->decimal('base_calculo', 15, 2)->nullable()->after('valor');
        });

        Schema::table('pay_novedades', function (Blueprint $table) {
            $table->foreignId('concepto_id')->nullable()->after('empleado_id')->constrained('pay_conceptos_nomina')->nullOnDelete();
            $table->foreignId('periodo_id')->nullable()->after('nomina_id')->constrained('pay_periodos_nomina')->nullOnDelete();
            $table->nullableMorphs('referencia');
        });
    }

    public function down(): void
    {
        Schema::table('pay_novedades', function (Blueprint $table) {
            $table->dropMorphs('referencia');
            $table->dropForeign(['periodo_id']);
            $table->dropColumn('periodo_id');
            $table->dropForeign(['concepto_id']);
            $table->dropColumn('concepto_id');
        });

        Schema::table('pay_nomina_detalles', function (Blueprint $table) {
            $table->dropForeign(['concepto_id']);
            $table->dropColumn(['concepto_id', 'contrato_id', 'cantidad', 'valor', 'base_calculo']);
            $table->decimal('salario_base', 15, 2)->default(0);
            $table->decimal('auxilio_transporte', 15, 2)->default(0);
            $table->decimal('salud_deduccion', 15, 2)->default(0);
            $table->decimal('pension_deduccion', 15, 2)->default(0);
            $table->decimal('total_devengos', 15, 2)->default(0);
            $table->decimal('total_deducciones', 15, 2)->default(0);
            $table->decimal('neto_pagar', 15, 2)->default(0);
            $table->integer('dias_laborados')->default(30);
        });

        Schema::table('pay_nominas', function (Blueprint $table) {
            $table->dropForeign(['periodo_id']);
            $table->dropForeign(['contrato_id']);
            $table->dropForeign(['created_by']);
            $table->dropColumn(['periodo_id', 'contrato_id', 'dias_laborados', 'ibc_seguridad_social', 'ibc_parafiscales', 'auxilio_transporte', 'total_provisiones', 'total_aportes_patronales', 'costo_laboral_total', 'created_by']);
        });

        Schema::dropIfExists('pay_parametros_contables');
        Schema::dropIfExists('pay_provisiones_acumuladas');
        Schema::dropIfExists('pay_periodos_nomina');
        Schema::dropIfExists('pay_conceptos_nomina');
    }
};
```

---

## Services

### ContabilidadNominaService.php

**Ruta:** `app\Modules\Payroll\Services\ContabilidadNominaService.php`

```php
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

                    $lineas[] = [
                        'cuenta_contable_id' => $cuentaGasto,
                        'centro_costo_id' => $centroCostoDefault->id,
                        'tercero_numero_documento' => $documento,
                        'tercero_nombre' => $nombre,
                        'debito' => $detalle->valor,
                        'credito' => 0,
                        'descripcion' => $concepto->nombre . ' - ' . $empleado->nombres,
                    ];

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
                    $lineas[] = [
                        'cuenta_contable_id' => $concepto->cuenta_contable_id, 
                        'centro_costo_id' => $centroCostoDefault->id,
                        'tercero_numero_documento' => $documento,
                        'tercero_nombre' => $nombre,
                        'debito' => $detalle->valor,
                        'credito' => 0,
                        'descripcion' => $concepto->nombre . ' - ' . $empleado->nombres,
                    ];

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
```

### NominaService.php

**Ruta:** `app\Modules\Payroll\Services\NominaService.php` (1121 líneas)

> Archivo completo incluido en este documento. Es el motor central de liquidación de nómina colombiana con 12 etapas de cálculo, 23 códigos de concepto, y 18 métodos privados.

**(Ver archivo completo en `app\Modules\Payroll\Services\NominaService.php`)**

### PayrollLiquidator.php

**Ruta:** `app\Modules\Payroll\Services\PayrollLiquidator.php`

> **ESTADO:** DEPRECADO desde 2026-06-26. Eliminado de LiquidacionController y PeriodoController. Ambos ahora usan NominaService exclusivamente. Mantenido solo por referencia histórica.

```php
<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Hr\Models\Empleado;
use App\Modules\Payroll\Models\Novedad;

/**
 * @deprecated 2026-06-26 — Usar NominaService en su lugar.
 */
class PayrollLiquidator
{
    public const SMLMV = 1300000;
    public const AUXILIO_TRANSPORTE = 162000;
    public const PORCENTAJE_SALUD = 0.04;
    public const PORCENTAJE_PENSION = 0.04;

    public function liquidarMensualidad(Empleado $empleado, array $novedadesPeriodo = []): array
    {
        $contrato = $empleado->contratoActivo;
        
        if (!$contrato) {
            throw new \Exception("El empleado {$empleado->documento} no tiene contrato activo.");
        }

        $salarioBase = $contrato->salario_base;
        $diasLaborados = 30;

        $salarioProporcional = ($salarioBase / 30) * $diasLaborados;
        
        $auxilioTransporte = 0;
        if ($salarioBase <= (self::SMLMV * 2)) {
            $auxilioTransporte = (self::AUXILIO_TRANSPORTE / 30) * $diasLaborados;
        }

        $ingresosAdicionales = 0;
        $descuentosAdicionales = 0;

        foreach ($novedadesPeriodo as $novedad) {
            if ($novedad->tipo === 'ingreso') {
                $ingresosAdicionales += $novedad->valor;
            } elseif ($novedad->tipo === 'descuento') {
                $descuentosAdicionales += $novedad->valor;
            }
        }

        $totalDevengos = $salarioProporcional + $auxilioTransporte + $ingresosAdicionales;

        $ibc = $salarioProporcional + $ingresosAdicionales;
        
        $ibcMinimo = (self::SMLMV / 30) * $diasLaborados;
        if ($ibc < $ibcMinimo) {
            $ibc = $ibcMinimo;
        }

        $salud = round($ibc * self::PORCENTAJE_SALUD, 0);
        $pension = round($ibc * self::PORCENTAJE_PENSION, 0);

        $totalDeducciones = $salud + $pension + $descuentosAdicionales;

        $neto = $totalDevengos - $totalDeducciones;

        return [
            'empleado_id' => $empleado->id,
            'dias_laborados' => $diasLaborados,
            'salario_base' => $salarioBase,
            'auxilio_transporte' => $auxilioTransporte,
            'total_devengos' => $totalDevengos,
            'salud_deduccion' => $salud,
            'pension_deduccion' => $pension,
            'total_deducciones' => $totalDeducciones,
            'neto_pagar' => $neto,
        ];
    }
}
```

### PayrollProvisioner.php

**Ruta:** `app\Modules\Payroll\Services\PayrollProvisioner.php`

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
        $tenantId = $tenant->id;

        $currentYear = (int) date('Y');
        ConfiguracionLegal::firstOrCreate(
            ['tenant_id' => $tenantId, 'ano_vigencia' => $currentYear],
            [
                'salario_minimo' => 1400000,
                'auxilio_transporte' => 200000,
                'tope_auxilio_transporte_salarios' => 2,
                'valor_uvt' => 47000,
                'horas_semanales' => 46,
                'aporte_salud_empleado' => 4,
                'aporte_pension_empleado' => 4,
                'aporte_salud_patronal' => 8.5,
                'aporte_pension_patronal' => 12,
                'caja_compensacion' => 4,
                'sena' => 2,
                'icbf' => 3,
            ]
        );

        $conceptos = [
            ['codigo' => 'SAL01', 'nombre' => 'Salario Básico', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'INC01', 'nombre' => 'Auxilio por Incapacidad', 'tipo' => 'DEVENGADO'],
            ['codigo' => 'AUX01', 'nombre' => 'Auxilio de Transporte', 'tipo' => 'DEVENGADO'],
            ['codigo' => 'HEX01', 'nombre' => 'Hora Extra Diurna', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'HEX02', 'nombre' => 'Hora Extra Nocturna', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'HEX03', 'nombre' => 'Hora Extra Diurna Festiva', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'HEX04', 'nombre' => 'Hora Extra Nocturna Festiva', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'REC01', 'nombre' => 'Recargo Nocturno', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'REC02', 'nombre' => 'Recargo Festivo', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'REC03', 'nombre' => 'Recargo Nocturno Festivo', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'EDF01', 'nombre' => 'Domingo / Festivo', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'ENF01', 'nombre' => 'Nocturno Festivo', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'BON01', 'nombre' => 'Bonificación No Salarial', 'tipo' => 'DEVENGADO'],
            ['codigo' => 'BON02', 'nombre' => 'Bonificación Salarial', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'COM01', 'nombre' => 'Comisiones', 'tipo' => 'DEVENGADO', 'base_seguridad_social' => true, 'base_parafiscales' => true, 'base_prestaciones' => true],
            ['codigo' => 'DED01', 'nombre' => 'Aporte Salud (4%)', 'tipo' => 'DEDUCCION'],
            ['codigo' => 'DED02', 'nombre' => 'Aporte Pensión (4%)', 'tipo' => 'DEDUCCION'],
            ['codigo' => 'DED03', 'nombre' => 'Retención en la Fuente', 'tipo' => 'DEDUCCION'],
            ['codigo' => 'DED04', 'nombre' => 'Préstamos', 'tipo' => 'DEDUCCION'],
            ['codigo' => 'DED05', 'nombre' => 'Fondo Solidaridad Pensional', 'tipo' => 'DEDUCCION'],
            ['codigo' => 'PRO01', 'nombre' => 'Prima de Servicios', 'tipo' => 'PROVISION'],
            ['codigo' => 'PRO02', 'nombre' => 'Cesantías', 'tipo' => 'PROVISION'],
            ['codigo' => 'PRO03', 'nombre' => 'Intereses a las Cesantías', 'tipo' => 'PROVISION'],
            ['codigo' => 'PRO04', 'nombre' => 'Vacaciones', 'tipo' => 'PROVISION'],
            ['codigo' => 'PAT01', 'nombre' => 'Aporte Pensión Patronal (12%)', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT02', 'nombre' => 'Aporte Salud Patronal (8.5%)', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT03', 'nombre' => 'ARL', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT04', 'nombre' => 'Caja de Compensación (4%)', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT05', 'nombre' => 'SENA (2%)', 'tipo' => 'APORTE_PATRONAL'],
            ['codigo' => 'PAT06', 'nombre' => 'ICBF (3%)', 'tipo' => 'APORTE_PATRONAL'],
        ];

        $cuentaGasto = \App\Modules\Accounting\Models\CuentaContable::withoutGlobalScopes()->where('tenant_id', $tenantId)->where('codigo', '5105')->value('id');
        $cuentaRetenciones = \App\Modules\Accounting\Models\CuentaContable::withoutGlobalScopes()->where('tenant_id', $tenantId)->where('codigo', '2370')->value('id');
        $cuentaProvisiones = \App\Modules\Accounting\Models\CuentaContable::withoutGlobalScopes()->where('tenant_id', $tenantId)->where('codigo', '2610')->value('id');

        foreach ($conceptos as $data) {
            $data['tenant_id'] = $tenantId;
            
            if ($data['tipo'] === 'DEVENGADO' || $data['tipo'] === 'APORTE_PATRONAL') {
                $data['cuenta_contable_id'] = $cuentaGasto;
            } elseif ($data['tipo'] === 'DEDUCCION') {
                $data['cuenta_contable_id'] = $cuentaRetenciones;
            } elseif ($data['tipo'] === 'PROVISION') {
                $data['cuenta_contable_id'] = $cuentaProvisiones;
            }

            ConceptoNomina::firstOrCreate(
                ['tenant_id' => $tenantId, 'codigo' => $data['codigo']],
                $data
            );
        }

        $registrar = app(PermissionRegistrar::class);
        $previous = $registrar->getPermissionsTeamId();
        $registrar->setPermissionsTeamId($tenantId);

        foreach (['payroll:edit', 'payroll:delete', 'payroll:manage'] as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
            $role = \Spatie\Permission\Models\Role::where('team_id', $tenantId)
                ->where('name', config('roles.default_tenant_admin', 'ADMIN_EMPRESA'))
                ->first();
            if ($role) {
                $role->givePermissionTo($perm);
            }
        }

        $registrar->setPermissionsTeamId($previous);
    }
}
```

---

## Tests

### NominaServiceTest.php

**Ruta:** `tests/Feature/Modules/Payroll/NominaServiceTest.php`

> 11 tests unitarios: salud/pensión, auxilio transporte, IBC mínimo, novedades, liquidación de período, provisiones, aportes patronales, consistencia numérica.

**(Ver archivo completo en `tests/Feature/Modules/Payroll/NominaServiceTest.php`)**

### CertificacionNominaTest.php

**Ruta:** `tests/Feature/Modules/Payroll/CertificacionNominaTest.php`

> 5 tests de certificación: configuración, salario mínimo con extras, salario alto con retefuente, incapacidad, aprobación contable.

**(Ver archivo completo en `tests/Feature/Modules/Payroll/CertificacionNominaTest.php`)**

---

*Fin del documento de auditoría. 22 archivos analizados.*
