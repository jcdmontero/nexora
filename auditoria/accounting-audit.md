# Auditoría: Accounting (Contabilidad)
> Actualizado: 2026-07-06 - Juan

---

## Module Manifest

**Ruta:** `app/Modules/Accounting/module.json`
```json
{
    "code": "accounting",
    "name": "Contabilidad",
    "version": "1.0.0",
    "description": "Partida doble, plan de cuentas, libro diario y estados financieros.",
    "icon": "Calculator",
    "core": false,
    "dependencies": [],
    "permissions": [
        "accounting:view",
        "accounting:create",
        "accounting:edit",
        "accounting:report",
        "accounting:admin"
    ],
    "menus": [
        {
            "section": "CONTABILIDAD",
            "icon": "Calculator",
            "items": [
                { "label": "Asientos", "route": "accounting.asientos.index", "permission": "accounting:view" },
                { "label": "Plan de Cuentas", "route": "accounting.cuentas.index", "permission": "accounting:view" },
                { "label": "Balance de Prueba", "route": "accounting.reportes.index", "permission": "accounting:report" },
                { "label": "Estado de Resultados", "route": "accounting.reportes.pyg", "permission": "accounting:report" },
                { "label": "Balance General", "route": "accounting.reportes.balance", "permission": "accounting:report" }
            ]
        }
    ]
}
```

---

## Service Provider

**Ruta:** `app/Modules/Accounting/Providers/AccountingServiceProvider.php`
```php
<?php

namespace App\Modules\Accounting\Providers;

use App\Modules\Accounting\Console\CambiarRegimen;
use App\Modules\Accounting\Console\SeedLibrosContables;
use Illuminate\Support\ServiceProvider;

class AccountingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(\App\Modules\Accounting\Services\ContabilidadService::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');

        if ($this->app->runningInConsole()) {
            $this->commands([
                SeedLibrosContables::class,
                CambiarRegimen::class,
            ]);
        }
    }
}
```

---

## Routes

**Ruta:** `app/Modules/Accounting/Routes/web.php`
```php
<?php

use App\Modules\Accounting\Controllers\AsientoController;
use App\Modules\Accounting\Controllers\CierreAnualController;
use App\Modules\Accounting\Controllers\CuentaController;
use App\Modules\Accounting\Controllers\LibroController;
use App\Modules\Accounting\Controllers\ReporteController;
use App\Modules\Accounting\Controllers\PeriodoContableController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'tenant', 'module:accounting'])
    ->prefix('contabilidad')
    ->name('accounting.')
    ->group(function () {
        
        // Plan de Cuentas
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('cuentas', [CuentaController::class, 'index'])->name('cuentas.index');
        });
        Route::middleware('permission:accounting:create')->group(function () {
            Route::post('cuentas', [CuentaController::class, 'store'])->name('cuentas.store');
        });

        // Libros Contables (Diario, Mayor, Caja, Ventas)
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('libros', [LibroController::class, 'index'])->name('libros.index');
            Route::get('libros/{libro}', [LibroController::class, 'show'])->name('libros.show');
        });

        // Asientos
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('asientos', [AsientoController::class, 'index'])->name('asientos.index');
        });
        Route::middleware('permission:accounting:create')->group(function () {
            Route::get('asientos/crear', [AsientoController::class, 'create'])->name('asientos.create');
            Route::post('asientos', [AsientoController::class, 'store'])->name('asientos.store');
        });

        Route::middleware('permission:accounting:report')->group(function () {
            Route::get('reportes', [ReporteController::class, 'index'])->name('reportes.index');
            Route::get('reportes/pyg', [ReporteController::class, 'pyg'])->name('reportes.pyg');
            Route::get('reportes/balance', [ReporteController::class, 'balance'])->name('reportes.balance');
            Route::get('reportes/auxiliar', [ReporteController::class, 'auxiliar'])->name('reportes.auxiliar');
            Route::get('reportes/terceros', [ReporteController::class, 'terceros'])->name('reportes.terceros');
            Route::get('reportes/libro-iva', [ReporteController::class, 'libroIva'])->name('reportes.libro-iva');
        });

        // Periodos Contables (Cierres)
        Route::middleware('permission:accounting:admin')->group(function () {
            Route::get('periodos', [PeriodoContableController::class, 'index'])->name('periodos.index');
            Route::post('periodos/{periodo}/close', [PeriodoContableController::class, 'close'])->name('periodos.close');
            Route::post('periodos/{periodo}/reopen', [PeriodoContableController::class, 'reopen'])->name('periodos.reopen');
        });

        // Cierre Anual
        Route::middleware('permission:accounting:admin')->group(function () {
            Route::get('cierre-anual', [CierreAnualController::class, 'index'])->name('cierre-anual.index');
            Route::post('cierre-anual/cerrar', [CierreAnualController::class, 'cerrar'])->name('cierre-anual.cerrar');
        });

    });
```

---

## Controllers

### CuentaController

**Ruta:** `app/Modules/Accounting/Controllers/CuentaController.php`
```php
<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CuentaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $cuentas = CuentaContable::query()
            ->when($search, function ($query, $search) {
                $query->where('codigo', 'like', "%{$search}%")
                      ->orWhere('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('codigo')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Modules/Accounting/Cuentas/Index', [
            'cuentas' => $cuentas,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:20|unique:cuentas_contables,codigo,NULL,id,tenant_id,' . auth()->user()->tenant_id,
            'nombre' => 'required|string|max:100',
            'tipo' => 'required|in:activo,pasivo,patrimonio,ingreso,gasto,costo',
            'naturaleza' => 'required|in:debito,credito',
            'nivel' => 'required|integer|min:1|max:6',
            'clase' => 'nullable|string|max:1',
            'acepta_movimientos' => 'boolean',
            'requiere_tercero' => 'boolean',
            'requiere_centro_costo' => 'boolean',
            'descripcion' => 'nullable|string',
        ]);

        CuentaContable::create($validated);

        return redirect()->route('accounting.cuentas.index')->with('success', 'Cuenta contable creada correctamente.');
    }
}
```

### AsientoController

**Ruta:** `app/Modules/Accounting/Controllers/AsientoController.php`
```php
<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\CentroCosto;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\ContabilidadService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AsientoController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $asientos = AsientoContable::query()
            ->with(['lineas.cuenta', 'periodo'])
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('concepto', 'ilike', "%{$search}%")
                        ->orWhere('numero', 'ilike', "%{$search}%")
                        ->orWhere('documento_numero', 'ilike', "%{$search}%")
                        ->orWhere('tercero_nombre', 'ilike', "%{$search}%")
                        ->orWhere('tercero_numero_documento', 'ilike', "%{$search}%")
                        ->orWhere('modulo_origen', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        $asientos->getCollection()->transform(function ($asiento) {
            $asiento->total_debito = $asiento->lineas->sum('debito');
            $asiento->total_credito = $asiento->lineas->sum('credito');

            return $asiento;
        });

        return Inertia::render('Modules/Accounting/Asientos/Index', [
            'asientos' => $asientos,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $cuentas = CuentaContable::where('acepta_movimientos', true)
            ->orderBy('codigo')
            ->get(['id', 'codigo', 'nombre', 'requiere_tercero', 'requiere_centro_costo']);

        $centrosCosto = CentroCosto::orderBy('codigo')->get(['id', 'codigo', 'nombre']);

        return Inertia::render('Modules/Accounting/Asientos/Create', [
            'cuentas' => $cuentas,
            'centrosCosto' => $centrosCosto,
        ]);
    }

    public function store(Request $request, ContabilidadService $service)
    {
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'fecha' => 'required|date',
            'concepto' => 'required|string|max:255',
            'documento_tipo' => 'nullable|string|max:50',
            'documento_prefijo' => 'nullable|string|max:10',
            'documento_numero' => 'nullable|string|max:50',
            'tercero_tipo_documento' => 'nullable|string|max:10',
            'tercero_numero_documento' => 'nullable|string|max:30',
            'tercero_nombre' => 'nullable|string|max:180',
            'referencia_id' => 'nullable|string',
            'referencia_type' => 'nullable|string',
            'lineas' => 'required|array|min:2',
            'lineas.*.cuenta_contable_id' => [
                'required',
                Rule::exists('cuentas_contables', 'id')->where('tenant_id', $tenantId),
            ],
            'lineas.*.centro_costo_id' => [
                'nullable',
                Rule::exists('centros_costo', 'id')->where('tenant_id', $tenantId),
            ],
            'lineas.*.tercero_tipo_documento' => 'nullable|string|max:10',
            'lineas.*.tercero_numero_documento' => 'nullable|string|max:30',
            'lineas.*.tercero_nombre' => 'nullable|string|max:180',
            'lineas.*.debito' => 'required|numeric|min:0',
            'lineas.*.credito' => 'required|numeric|min:0',
            'lineas.*.base_gravable' => 'nullable|numeric|min:0',
            'lineas.*.impuesto_tipo' => 'nullable|in:iva,retefuente,reteica,reteiva,ica,autorretencion',
            'lineas.*.impuesto_tarifa' => 'nullable|numeric|min:0',
            'lineas.*.descripcion' => 'nullable|string',
        ]);

        try {
            $service->registrarAsiento([
                'fecha' => $validated['fecha'],
                'concepto' => $validated['concepto'],
                'modulo_origen' => 'accounting_manual',
                'documento_tipo' => $validated['documento_tipo'] ?? null,
                'documento_prefijo' => $validated['documento_prefijo'] ?? null,
                'documento_numero' => $validated['documento_numero'] ?? null,
                'tercero_tipo_documento' => $validated['tercero_tipo_documento'] ?? null,
                'tercero_numero_documento' => $validated['tercero_numero_documento'] ?? null,
                'tercero_nombre' => $validated['tercero_nombre'] ?? null,
                'referencia_id' => $validated['referencia_id'] ?? null,
                'referencia_type' => $validated['referencia_type'] ?? null,
                'registrado_por' => auth()->id(),
            ], $validated['lineas']);

            return redirect()->route('accounting.asientos.index')->with('success', 'Asiento contable registrado correctamente.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
```

### LibroController

**Ruta:** `app/Modules/Accounting/Controllers/LibroController.php`
```php
<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\AsientoLinea;
use App\Modules\Accounting\Models\LibroContable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LibroController extends Controller
{
    public function index()
    {
        $libros = LibroContable::where('activo', true)->get()->map(fn ($l) => [
            'id' => $l->id,
            'codigo' => $l->codigo,
            'nombre' => $l->nombre,
            'tipo' => $l->tipo,
            'descripcion' => $l->descripcion,
            'is_sistema' => $l->is_sistema,
        ]);

        return Inertia::render('Modules/Accounting/Libros/Index', [
            'libros' => $libros,
        ]);
    }

    public function show(Request $request, LibroContable $libro)
    {
        $query = AsientoContable::with(['lineas.cuenta', 'registrador'])
            ->where('estado', 'contabilizado')
            ->orderBy('fecha', 'desc')
            ->orderBy('id', 'desc');

        if ($libro->filtro_cuentas) {
            $query->whereHas('lineas.cuenta', function ($q) use ($libro) {
                $q->where('codigo', 'like', $libro->filtro_cuentas);
            });
        }

        if ($libro->filtro_modulo) {
            $modulos = array_map('trim', explode(',', $libro->filtro_modulo));
            $query->whereIn('modulo_origen', $modulos);
        }

        if ($request->filled('fecha_desde')) {
            $query->whereDate('fecha', '>=', $request->fecha_desde);
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('fecha', '<=', $request->fecha_hasta);
        }
        if ($request->filled('cuenta_codigo')) {
            $query->whereHas('lineas.cuenta', function ($q) use ($request) {
                $q->where('codigo', 'like', $request->cuenta_codigo . '%');
            });
        }

        $asientos = $query->paginate(20)->through(fn ($a) => [
            'id' => $a->id,
            'numero' => $a->numero,
            'fecha' => $a->fecha->format('Y-m-d'),
            'concepto' => $a->concepto,
            'modulo_origen' => $a->modulo_origen,
            'documento' => ($a->documento_prefijo ?? '') . ($a->documento_numero ?? ''),
            'registrado_por' => $a->registrador?->name,
            'total_debito' => (float) $a->lineas->sum('debito'),
            'total_credito' => (float) $a->lineas->sum('credito'),
            'lineas' => $a->lineas->map(fn ($l) => [
                'cuenta_codigo' => $l->cuenta?->codigo,
                'cuenta_nombre' => $l->cuenta?->nombre,
                'debito' => (float) $l->debito,
                'credito' => (float) $l->credito,
                'descripcion' => $l->descripcion,
            ]),
        ]);

        return Inertia::render('Modules/Accounting/Libros/Show', [
            'libro' => [
                'id' => $libro->id,
                'codigo' => $libro->codigo,
                'nombre' => $libro->nombre,
                'tipo' => $libro->tipo,
                'descripcion' => $libro->descripcion,
                'filtro_cuentas' => $libro->filtro_cuentas,
                'filtro_modulo' => $libro->filtro_modulo,
            ],
            'asientos' => $asientos,
            'filters' => $request->only(['fecha_desde', 'fecha_hasta', 'cuenta_codigo']),
        ]);
    }
}
```

### PeriodoContableController

**Ruta:** `app/Modules/Accounting/Controllers/PeriodoContableController.php`
```php
<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\PeriodoContable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PeriodoContableController extends Controller
{
    public function index()
    {
        $periodos = PeriodoContable::query()
            ->orderByDesc('anio')
            ->orderByDesc('mes')
            ->get();

        return Inertia::render('Modules/Accounting/Periodos/Index', [
            'periodos' => $periodos,
        ]);
    }

    public function close(PeriodoContable $periodo)
    {
        if ($periodo->estado === 'cerrado') {
            return back()->with('error', 'El periodo ya se encuentra cerrado.');
        }

        $anterioresAbiertos = PeriodoContable::query()
            ->where('estado', 'abierto')
            ->where(function ($q) use ($periodo) {
                $q->where('anio', '<', $periodo->anio)
                  ->orWhere(function ($q2) use ($periodo) {
                      $q2->where('anio', $periodo->anio)
                         ->where('mes', '<', $periodo->mes);
                  });
            })
            ->exists();

        if ($anterioresAbiertos) {
            return back()->with('error', 'Existen periodos anteriores que aún están abiertos. Deben cerrarse en orden cronológico.');
        }

        $asientosDesbalanceados = AsientoContable::query()
            ->where('periodo_contable_id', $periodo->id)
            ->where('estado', '!=', 'reversado')
            ->whereRaw('(SELECT COALESCE(SUM(debito), 0) FROM asiento_lineas WHERE asiento_lineas.asiento_contable_id = asientos_contables.id) != '
                . '(SELECT COALESCE(SUM(credito), 0) FROM asiento_lineas WHERE asiento_lineas.asiento_contable_id = asientos_contables.id)')
            ->pluck('numero');

        if ($asientosDesbalanceados->isNotEmpty()) {
            $numeros = $asientosDesbalanceados->implode(', ');
            return back()->with('error', "No se puede cerrar el periodo. Los siguientes asientos tienen débito distinto del crédito: {$numeros}.");
        }

        $periodo->update([
            'estado' => 'cerrado',
            'cerrado_at' => now(),
            'cerrado_por' => auth()->id(),
        ]);

        return back()->with('success', "Periodo {$periodo->anio}-{$periodo->mes} cerrado exitosamente.");
    }

    public function reopen(PeriodoContable $periodo)
    {
        $postCerrados = PeriodoContable::query()
            ->where('estado', 'cerrado')
            ->where(function ($q) use ($periodo) {
                $q->where('anio', '>', $periodo->anio)
                  ->orWhere(function ($q2) use ($periodo) {
                      $q2->where('anio', $periodo->anio)
                         ->where('mes', '>', $periodo->mes);
                  });
            })
            ->exists();

        if ($postCerrados) {
            return back()->with('error', 'No se puede reabrir porque existen periodos posteriores cerrados.');
        }

        $periodo->update([
            'estado' => 'abierto',
            'cerrado_at' => null,
            'cerrado_por' => null,
        ]);

        return back()->with('success', "Periodo {$periodo->anio}-{$periodo->mes} reabierto exitosamente.");
    }
}
```

### CierreAnualController

**Ruta:** `app/Modules/Accounting/Controllers/CierreAnualController.php`
```php
<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Services\CierreAnualService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CierreAnualController extends Controller
{
    public function __construct(
        private CierreAnualService $cierreAnualService,
    ) {}

    public function index()
    {
        $aniosDisponibles = $this->cierreAnualService->aniosDisponiblesParaCierre();

        return Inertia::render('Modules/Accounting/CierreAnual/Index', [
            'aniosDisponibles' => $aniosDisponibles,
        ]);
    }

    public function cerrar(Request $request)
    {
        $validated = $request->validate([
            'anio' => ['required', 'integer', 'min:2000', 'max:' . (int) now()->year],
        ]);

        $anio = (int) $validated['anio'];
        $tenantId = auth()->user()->tenant_id;
        $userId = auth()->id();

        \App\Jobs\CerrarAnioContableJob::dispatch($anio, $tenantId, $userId)
            ->onQueue('accounting');

        return back()->with('success', "Cierre anual del año {$anio} enviado a cola de procesamiento. Se notificará al finalizar.");
    }
}
```

### ReporteController

**Ruta:** `app/Modules/Accounting/Controllers/ReporteController.php`
```php
<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\AsientoLinea;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    private const CODIGOS_INGRESOS = ['4'];
    private const CODIGOS_COSTOS = ['6'];
    private const CODIGOS_GASTOS = ['5'];
    private const CODIGOS_ACTIVOS = ['1'];
    private const CODIGOS_PASIVOS = ['2'];
    private const CODIGOS_PATRIMONIO = ['3'];

    public function index(Request $request)
    {
        $desde = $request->input('desde', now()->startOfMonth()->toDateString());
        $hasta = $request->input('hasta', now()->endOfMonth()->toDateString());

        $saldos = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('asientos_contables.estado', '!=', 'reversado')
            ->selectRaw('
                cuentas_contables.tipo,
                cuentas_contables.codigo,
                cuentas_contables.nombre,
                cuentas_contables.naturaleza,
                SUM(asiento_lineas.debito) as debito,
                SUM(asiento_lineas.credito) as credito
            ')
            ->groupBy('cuentas_contables.tipo', 'cuentas_contables.codigo', 'cuentas_contables.nombre', 'cuentas_contables.naturaleza')
            ->orderBy('cuentas_contables.codigo')
            ->get()
            ->map(function ($row) {
                $debito = (float) $row->debito;
                $credito = (float) $row->credito;
                $saldo = $row->naturaleza === 'credito'
                    ? $credito - $debito
                    : $debito - $credito;

                return [
                    'tipo' => $row->tipo,
                    'codigo' => $row->codigo,
                    'nombre' => $row->nombre,
                    'naturaleza' => $row->naturaleza,
                    'debito' => $debito,
                    'credito' => $credito,
                    'saldo' => $saldo,
                ];
            });

        $porTipo = $saldos
            ->groupBy('tipo')
            ->map(fn ($items) => [
                'debito' => round($items->sum('debito'), 2),
                'credito' => round($items->sum('credito'), 2),
                'saldo' => round($items->sum('saldo'), 2),
            ]);

        $ingresos = abs((float) data_get($porTipo, 'ingreso.saldo', 0));
        $gastos = abs((float) data_get($porTipo, 'gasto.saldo', 0)) + abs((float) data_get($porTipo, 'costo.saldo', 0));
        $utilidad = $ingresos - $gastos;

        return Inertia::render('Modules/Accounting/Reportes/Index', [
            'filters' => [
                'desde' => $desde,
                'hasta' => $hasta,
            ],
            'metricas' => [
                'ingresos' => $ingresos,
                'gastos' => $gastos,
                'utilidad' => $utilidad,
                'activos' => (float) data_get($porTipo, 'activo.saldo', 0),
                'pasivos' => (float) data_get($porTipo, 'pasivo.saldo', 0),
                'patrimonio' => (float) data_get($porTipo, 'patrimonio.saldo', 0),
            ],
            'saldos' => $saldos,
        ]);
    }

    public function auxiliar(Request $request)
    {
        $desde = $request->input('desde', now()->startOfMonth()->toDateString());
        $hasta = $request->input('hasta', now()->endOfMonth()->toDateString());
        $cuenta_id = $request->input('cuenta_id');
        $tercero_numero = $request->input('tercero_numero');

        $query = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('asientos_contables.estado', '!=', 'reversado');

        if ($cuenta_id) {
            $query->where('asiento_lineas.cuenta_contable_id', $cuenta_id);
        }
        
        if ($tercero_numero) {
            $query->where('asiento_lineas.tercero_numero_documento', $tercero_numero);
        }

        $lineas = $query->selectRaw('
                asientos_contables.fecha,
                asientos_contables.numero as comprobante,
                cuentas_contables.codigo as cuenta_codigo,
                cuentas_contables.nombre as cuenta_nombre,
                cuentas_contables.naturaleza,
                asiento_lineas.tercero_numero_documento as tercero_documento,
                asiento_lineas.tercero_nombre,
                asiento_lineas.descripcion as detalle,
                asiento_lineas.debito,
                asiento_lineas.credito
            ')
            ->orderBy('asientos_contables.fecha')
            ->orderBy('asientos_contables.id')
            ->get();

        $cuentas = CuentaContable::orderBy('codigo')->get(['id', 'codigo', 'nombre']);

        return Inertia::render('Modules/Accounting/Reportes/Auxiliar', [
            'filters' => [
                'desde' => $desde,
                'hasta' => $hasta,
                'cuenta_id' => $cuenta_id,
                'tercero_numero' => $tercero_numero,
            ],
            'cuentas' => $cuentas,
            'lineas' => $lineas,
        ]);
    }

    public function terceros(Request $request)
    {
        $desde = $request->input('desde', now()->startOfMonth()->toDateString());
        $hasta = $request->input('hasta', now()->endOfMonth()->toDateString());

        $saldos = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('asientos_contables.estado', '!=', 'reversado')
            ->whereNotNull('asiento_lineas.tercero_numero_documento')
            ->selectRaw('
                cuentas_contables.codigo as cuenta_codigo,
                cuentas_contables.nombre as cuenta_nombre,
                cuentas_contables.naturaleza,
                asiento_lineas.tercero_tipo_documento,
                asiento_lineas.tercero_numero_documento,
                asiento_lineas.tercero_nombre,
                SUM(asiento_lineas.debito) as debito,
                SUM(asiento_lineas.credito) as credito
            ')
            ->groupBy(
                'cuentas_contables.codigo',
                'cuentas_contables.nombre',
                'cuentas_contables.naturaleza',
                'asiento_lineas.tercero_tipo_documento',
                'asiento_lineas.tercero_numero_documento',
                'asiento_lineas.tercero_nombre'
            )
            ->orderBy('cuentas_contables.codigo')
            ->orderBy('asiento_lineas.tercero_nombre')
            ->get()
            ->map(function ($row) {
                $debito = (float) $row->debito;
                $credito = (float) $row->credito;
                $saldo = $row->naturaleza === 'credito'
                    ? $credito - $debito
                    : $debito - $credito;

                return [
                    'cuenta_codigo' => $row->cuenta_codigo,
                    'cuenta_nombre' => $row->cuenta_nombre,
                    'tercero_documento' => $row->tercero_numero_documento,
                    'tercero_nombre' => $row->tercero_nombre,
                    'debito' => $debito,
                    'credito' => $credito,
                    'saldo' => $saldo,
                ];
            });

        return Inertia::render('Modules/Accounting/Reportes/Terceros', [
            'filters' => [
                'desde' => $desde,
                'hasta' => $hasta,
            ],
            'saldos' => $saldos,
        ]);
    }

    public function pyg(Request $request)
    {
        $desde = $request->input('desde', now()->startOfMonth()->toDateString());
        $hasta = $request->input('hasta', now()->endOfMonth()->toDateString());

        $saldos = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('asientos_contables.estado', '!=', 'reversado')
            ->where(function ($q) {
                $q->where('cuentas_contables.codigo', 'like', '4%')
                  ->orWhere('cuentas_contables.codigo', 'like', '5%')
                  ->orWhere('cuentas_contables.codigo', 'like', '6%');
            })
            ->selectRaw('
                cuentas_contables.codigo,
                cuentas_contables.nombre,
                cuentas_contables.tipo,
                cuentas_contables.naturaleza,
                SUM(asiento_lineas.debito) as debito,
                SUM(asiento_lineas.credito) as credito
            ')
            ->groupBy('cuentas_contables.codigo', 'cuentas_contables.nombre', 'cuentas_contables.tipo', 'cuentas_contables.naturaleza')
            ->orderBy('cuentas_contables.codigo')
            ->get()
            ->map(function ($row) {
                $debito = (float) $row->debito;
                $credito = (float) $row->credito;
                $saldo = $row->naturaleza === 'credito'
                    ? $credito - $debito
                    : $debito - $credito;
                return [
                    'codigo' => $row->codigo,
                    'nombre' => $row->nombre,
                    'tipo' => $row->tipo,
                    'saldo' => abs($saldo),
                    'signo' => in_array($row->tipo, ['ingreso']) ? 1 : -1,
                ];
            });

        $ingresos = $saldos->where('tipo', 'ingreso')->sum('saldo');
        $costos = $saldos->where('tipo', 'costo')->sum('saldo');
        $gastos = $saldos->where('tipo', 'gasto')->sum('saldo');
        $utilidadBruta = $ingresos - $costos;
        $utilidadNeta = $utilidadBruta - $gastos;

        return Inertia::render('Modules/Accounting/Reportes/Pyg', [
            'filters' => ['desde' => $desde, 'hasta' => $hasta],
            'cuentas_ingreso' => $saldos->where('tipo', 'ingreso')->values(),
            'cuentas_costo' => $saldos->where('tipo', 'costo')->values(),
            'cuentas_gasto' => $saldos->where('tipo', 'gasto')->values(),
            'totales' => [
                'ingresos' => $ingresos,
                'costos' => $costos,
                'gastos' => $gastos,
                'utilidad_bruta' => $utilidadBruta,
                'utilidad_neta' => $utilidadNeta,
            ],
        ]);
    }

    public function balance(Request $request)
    {
        $desde = $request->input('desde', now()->startOfMonth()->toDateString());
        $hasta = $request->input('hasta', now()->endOfMonth()->toDateString());

        $saldos = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('asientos_contables.estado', '!=', 'reversado')
            ->where(function ($q) {
                $q->where('cuentas_contables.codigo', 'like', '1%')
                  ->orWhere('cuentas_contables.codigo', 'like', '2%')
                  ->orWhere('cuentas_contables.codigo', 'like', '3%');
            })
            ->selectRaw('
                cuentas_contables.codigo,
                cuentas_contables.nombre,
                cuentas_contables.tipo,
                cuentas_contables.naturaleza,
                SUM(asiento_lineas.debito) as debito,
                SUM(asiento_lineas.credito) as credito
            ')
            ->groupBy('cuentas_contables.codigo', 'cuentas_contables.nombre', 'cuentas_contables.tipo', 'cuentas_contables.naturaleza')
            ->orderBy('cuentas_contables.codigo')
            ->get()
            ->map(function ($row) {
                $debito = (float) $row->debito;
                $credito = (float) $row->credito;
                $saldo = $row->naturaleza === 'credito'
                    ? $credito - $debito
                    : $debito - $credito;
                return [
                    'codigo' => $row->codigo,
                    'nombre' => $row->nombre,
                    'tipo' => $row->tipo,
                    'saldo' => $saldo,
                ];
            });

        $activos = $saldos->where('tipo', 'activo')->sum('saldo');
        $pasivos = $saldos->where('tipo', 'pasivo')->sum('saldo');
        $patrimonio = $saldos->where('tipo', 'patrimonio')->sum('saldo');
        $ecuacion = $activos - $pasivos - $patrimonio;

        return Inertia::render('Modules/Accounting/Reportes/Balance', [
            'filters' => ['desde' => $desde, 'hasta' => $hasta],
            'cuentas_activo' => $saldos->where('tipo', 'activo')->values(),
            'cuentas_pasivo' => $saldos->where('tipo', 'pasivo')->values(),
            'cuentas_patrimonio' => $saldos->where('tipo', 'patrimonio')->values(),
            'totales' => [
                'activos' => $activos,
                'pasivos' => $pasivos,
                'patrimonio' => $patrimonio,
                'ecuacion' => $ecuacion,
            ],
        ]);
    }

    public function libroIva(Request $request)
    {
        $desde = $request->input('desde', now()->startOfYear()->toDateString());
        $hasta = $request->input('hasta', now()->endOfYear()->toDateString());

        $ivaGenerado = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('asientos_contables.estado', '!=', 'reversado')
            ->where('cuentas_contables.codigo', '240805')
            ->selectRaw('
                SUM(asiento_lineas.credito) as total_gravado,
                SUM(CASE WHEN asiento_lineas.impuesto_tipo = \'IVA\' THEN asiento_lineas.base_gravable ELSE 0 END) as base_gravable
            ')
            ->first();

        $ivaDescontable = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('asientos_contables.estado', '!=', 'reversado')
            ->where('cuentas_contables.codigo', '240810')
            ->selectRaw('
                SUM(asiento_lineas.debito) as total_gravado,
                SUM(CASE WHEN asiento_lineas.impuesto_tipo = \'IVA\' THEN asiento_lineas.base_gravable ELSE 0 END) as base_gravable
            ')
            ->first();

        $retenciones = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('asientos_contables.estado', '!=', 'reversado')
            ->whereIn('cuentas_contables.codigo', ['135515', '2365', '135518'])
            ->selectRaw('
                asientos_contables.numero as comprobante,
                asientos_contables.fecha,
                cuentas_contables.codigo as cuenta_codigo,
                cuentas_contables.nombre as cuenta_nombre,
                asiento_lineas.descripcion,
                asiento_lineas.base_gravable,
                asiento_lineas.impuesto_tipo,
                asiento_lineas.impuesto_tarifa,
                asiento_lineas.debito,
                asiento_lineas.credito
            ')
            ->orderBy('asientos_contables.fecha')
            ->get();

        $generado = (float) ($ivaGenerado->total_gravado ?? 0);
        $descontable = (float) ($ivaDescontable->total_gravado ?? 0);
        $saldoIva = $generado - $descontable;

        return Inertia::render('Modules/Accounting/Reportes/LibroIva', [
            'filters' => ['desde' => $desde, 'hasta' => $hasta],
            'iva_generado' => [
                'total' => $generado,
                'base_gravable' => (float) ($ivaGenerado->base_gravable ?? 0),
            ],
            'iva_descontable' => [
                'total' => $descontable,
                'base_gravable' => (float) ($ivaDescontable->base_gravable ?? 0),
            ],
            'saldo_pagar' => $saldoIva,
            'retenciones' => $retenciones,
        ]);
    }
}
```

---

## Models

### CuentaContable

**Ruta:** `app/Modules/Accounting/Models/CuentaContable.php`
```php
<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class CuentaContable extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cuentas_contables';

    protected $fillable = [
        'tenant_id',
        'codigo',
        'nombre',
        'tipo',
        'naturaleza',
        'nivel',
        'clase',
        'acepta_movimientos',
        'requiere_tercero',
        'requiere_centro_costo',
        'parent_id',
        'descripcion',
        'tipo_regimen',
    ];

    protected $casts = [
        'acepta_movimientos' => 'boolean',
        'requiere_tercero' => 'boolean',
        'requiere_centro_costo' => 'boolean',
        'nivel' => 'integer',
    ];

    public function parent()
    {
        return $this->belongsTo(CuentaContable::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(CuentaContable::class, 'parent_id');
    }
}
```

### AsientoContable

**Ruta:** `app/Modules/Accounting/Models/AsientoContable.php`
```php
<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AsientoContable extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'asientos_contables';

    protected $fillable = [
        'tenant_id',
        'periodo_contable_id',
        'fecha',
        'numero',
        'concepto',
        'estado',
        'modulo_origen',
        'documento_tipo',
        'documento_prefijo',
        'documento_numero',
        'tercero_tipo_documento',
        'tercero_numero_documento',
        'tercero_nombre',
        'referencia_id',
        'referencia_type',
        'reverso_de_id',
        'registrado_por',
        'contabilizado_at',
    ];

    protected $casts = [
        'fecha' => 'date',
        'contabilizado_at' => 'datetime',
    ];

    public function lineas()
    {
        return $this->hasMany(AsientoLinea::class);
    }

    public function registrador()
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    public function periodo()
    {
        return $this->belongsTo(PeriodoContable::class, 'periodo_contable_id');
    }

    public function asientoReversado()
    {
        return $this->belongsTo(self::class, 'reverso_de_id');
    }

    public function reversos()
    {
        return $this->hasMany(self::class, 'reverso_de_id');
    }

    public function referencia()
    {
        return $this->morphTo();
    }
}
```

### AsientoLinea

**Ruta:** `app/Modules/Accounting/Models/AsientoLinea.php`
```php
<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class AsientoLinea extends Model
{
    use BelongsToTenant, Auditable;

    protected $guarded = [];

    protected $table = 'asiento_lineas';

    protected $fillable = [
        'tenant_id',
        'asiento_contable_id',
        'cuenta_contable_id',
        'centro_costo_id',
        'tercero_tipo_documento',
        'tercero_numero_documento',
        'tercero_nombre',
        'debito',
        'credito',
        'base_gravable',
        'impuesto_tipo',
        'impuesto_tarifa',
        'descripcion',
    ];

    protected $casts = [
        'debito' => 'decimal:2',
        'credito' => 'decimal:2',
        'base_gravable' => 'decimal:2',
        'impuesto_tarifa' => 'decimal:4',
    ];

    public function asiento()
    {
        return $this->belongsTo(AsientoContable::class, 'asiento_contable_id');
    }

    public function cuenta()
    {
        return $this->belongsTo(CuentaContable::class, 'cuenta_contable_id');
    }

    public function centroCosto()
    {
        return $this->belongsTo(CentroCosto::class, 'centro_costo_id');
    }
}
```

### LibroContable

**Ruta:** `app/Modules/Accounting/Models/LibroContable.php`
```php
<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class LibroContable extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'libros_contables';

    protected $fillable = [
        'tenant_id',
        'codigo',
        'nombre',
        'tipo',
        'descripcion',
        'filtro_cuentas',
        'filtro_modulo',
        'is_sistema',
        'activo',
    ];

    protected $casts = [
        'is_sistema' => 'boolean',
        'activo' => 'boolean',
    ];

    const TIPOS = [
        'diario' => 'Diario General',
        'mayor' => 'Mayor y Balances',
        'caja' => 'Libro de Caja',
        'ventas' => 'Libro de Ventas',
    ];

    const DEFAULT_BOOKS = [
        [
            'codigo' => 'DG',
            'nombre' => 'Diario General',
            'tipo' => 'diario',
            'descripcion' => 'Registra todos los asientos contables en orden cronológico.',
            'filtro_cuentas' => null,
            'filtro_modulo' => null,
        ],
        [
            'codigo' => 'MB',
            'nombre' => 'Mayor y Balances',
            'tipo' => 'mayor',
            'descripcion' => 'Acumula movimientos por cuenta contable.',
            'filtro_cuentas' => null,
            'filtro_modulo' => null,
        ],
        [
            'codigo' => 'CJ',
            'nombre' => 'Libro de Caja',
            'tipo' => 'caja',
            'descripcion' => 'Entradas y salidas de efectivo (cuentas 1105).',
            'filtro_cuentas' => '1105%',
            'filtro_modulo' => null,
        ],
        [
            'codigo' => 'VI',
            'nombre' => 'Libro de Ventas e Ingresos',
            'tipo' => 'ventas',
            'descripcion' => 'Registro de facturas de venta e ingresos.',
            'filtro_cuentas' => null,
            'filtro_modulo' => 'ventas,service-desk',
        ],
    ];
}
```

### PeriodoContable

**Ruta:** `app/Modules/Accounting/Models/PeriodoContable.php`
```php
<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class PeriodoContable extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'periodos_contables';

    protected $fillable = [
        'tenant_id',
        'anio',
        'mes',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'cerrado_at',
        'cerrado_por',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'cerrado_at' => 'datetime',
    ];

    public function estaCerrado(): bool
    {
        return $this->estado === 'cerrado';
    }
}
```

### CuentaPorPagar

**Ruta:** `app/Modules/Accounting/Models/CuentaPorPagar.php`
```php
<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class CuentaPorPagar extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cuentas_por_pagar';

    protected $fillable = [
        'tenant_id',
        'acreedor_id',
        'acreedor_type',
        'documento_origen_id',
        'documento_origen_type',
        'monto_total',
        'monto_pagado',
        'estado',
        'fecha_vencimiento',
        'notas'
    ];

    protected $casts = [
        'monto_total' => 'decimal:2',
        'monto_pagado' => 'decimal:2',
        'fecha_vencimiento' => 'date',
    ];

    public function acreedor()
    {
        return $this->morphTo();
    }

    public function documentoOrigen()
    {
        return $this->morphTo();
    }
}
```

### CuentaPorCobrar

**Ruta:** `app/Modules/Accounting/Models/CuentaPorCobrar.php`
```php
<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class CuentaPorCobrar extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cuentas_por_cobrar';

    protected $fillable = [
        'tenant_id',
        'deudor_id',
        'deudor_type',
        'documento_origen_id',
        'documento_origen_type',
        'monto_total',
        'monto_pagado',
        'estado',
        'fecha_vencimiento',
        'notas'
    ];

    protected $casts = [
        'monto_total' => 'decimal:2',
        'monto_pagado' => 'decimal:2',
        'fecha_vencimiento' => 'date',
    ];

    public function deudor()
    {
        return $this->morphTo();
    }

    public function documentoOrigen()
    {
        return $this->morphTo();
    }
}
```

### CentroCosto

**Ruta:** `app/Modules/Accounting/Models/CentroCosto.php`
```php
<?php

namespace App\Modules\Accounting\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class CentroCosto extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'centros_costo';

    protected $fillable = [
        'tenant_id',
        'codigo',
        'nombre',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];
}
```

---

## Services

### ContabilidadService

**Ruta:** `app/Modules/Accounting/Services/ContabilidadService.php`
```php
<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\AsientoLinea;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Models\PeriodoContable;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ContabilidadService
{
    public function getCuenta(string $codigo): ?CuentaContable
    {
        $query = CuentaContable::where('codigo', $codigo);

        $tenantId = tenantId();
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        return $query->first();
    }

    public function registrarAsiento(array $cabecera, array $lineas): AsientoContable
    {
        if (count($lineas) < 2) {
            throw new \Exception('Un asiento contable debe tener minimo dos lineas.');
        }

        $fecha = Carbon::parse($cabecera['fecha'] ?? now()->toDateString());
        $periodo = $this->resolverPeriodoAbierto($fecha);

        $totalDebito = round(array_sum(array_map(fn ($linea) => (float) ($linea['debito'] ?? 0), $lineas)), 2);
        $totalCredito = round(array_sum(array_map(fn ($linea) => (float) ($linea['credito'] ?? 0), $lineas)), 2);

        if (round($totalDebito - $totalCredito, 2) !== 0.0) {
            throw new \Exception("Asiento descuadrado (Debitos: {$totalDebito} / Creditos: {$totalCredito}).");
        }

        $lineas = array_map(function (array $linea) use ($cabecera) {
            $linea['tercero_tipo_documento'] ??= $cabecera['tercero_tipo_documento'] ?? null;
            $linea['tercero_numero_documento'] ??= $cabecera['tercero_numero_documento'] ?? null;
            $linea['tercero_nombre'] ??= $cabecera['tercero_nombre'] ?? null;

            return $linea;
        }, $lineas);

        foreach ($lineas as $linea) {
            $this->validarLinea($linea);
        }

        return DB::transaction(function () use ($cabecera, $lineas, $fecha, $periodo) {
            $asiento = AsientoContable::create([
                'periodo_contable_id' => $periodo->id,
                'fecha' => $fecha->toDateString(),
                'numero' => $cabecera['numero'] ?? $this->siguienteNumero($fecha),
                'concepto' => $cabecera['concepto'] ?? '',
                'estado' => 'contabilizado',
                'modulo_origen' => $cabecera['modulo_origen'] ?? null,
                'documento_tipo' => $cabecera['documento_tipo'] ?? null,
                'documento_prefijo' => $cabecera['documento_prefijo'] ?? null,
                'documento_numero' => $cabecera['documento_numero'] ?? null,
                'tercero_tipo_documento' => $cabecera['tercero_tipo_documento'] ?? null,
                'tercero_numero_documento' => $cabecera['tercero_numero_documento'] ?? null,
                'tercero_nombre' => $cabecera['tercero_nombre'] ?? null,
                'referencia_id' => $cabecera['referencia_id'] ?? null,
                'referencia_type' => $cabecera['referencia_type'] ?? null,
                'reverso_de_id' => $cabecera['reverso_de_id'] ?? null,
                'registrado_por' => $cabecera['registrado_por'] ?? auth()->id(),
                'contabilizado_at' => now(),
            ]);

            foreach ($lineas as $linea) {
                AsientoLinea::create([
                    'asiento_contable_id' => $asiento->id,
                    'cuenta_contable_id' => $linea['cuenta_contable_id'],
                    'centro_costo_id' => $linea['centro_costo_id'] ?? null,
                    'tercero_tipo_documento' => $linea['tercero_tipo_documento'] ?? $asiento->tercero_tipo_documento,
                    'tercero_numero_documento' => $linea['tercero_numero_documento'] ?? $asiento->tercero_numero_documento,
                    'tercero_nombre' => $linea['tercero_nombre'] ?? $asiento->tercero_nombre,
                    'debito' => $linea['debito'] ?? 0,
                    'credito' => $linea['credito'] ?? 0,
                    'base_gravable' => $linea['base_gravable'] ?? null,
                    'impuesto_tipo' => $linea['impuesto_tipo'] ?? null,
                    'impuesto_tarifa' => $linea['impuesto_tarifa'] ?? null,
                    'descripcion' => $linea['descripcion'] ?? null,
                ]);
            }

            return $asiento;
        });
    }

    public function revertirAsiento(string $modulo, string $referenciaType, int $referenciaId, string $motivo): bool
    {
        $asientoOriginal = AsientoContable::with('lineas')
            ->where('modulo_origen', $modulo)
            ->where('referencia_type', $referenciaType)
            ->where('referencia_id', $referenciaId)
            ->where('estado', '!=', 'reversado')
            ->first();

        if (!$asientoOriginal) {
            return false;
        }

        if ($asientoOriginal->estado === 'reversado') {
            throw new \Exception('El asiento ya fue reversado.');
        }

        DB::transaction(function () use ($asientoOriginal, $motivo) {
            $lineas = $asientoOriginal->lineas->map(fn ($linea) => [
                'cuenta_contable_id' => $linea->cuenta_contable_id,
                'centro_costo_id' => $linea->centro_costo_id,
                'tercero_tipo_documento' => $linea->tercero_tipo_documento,
                'tercero_numero_documento' => $linea->tercero_numero_documento,
                'tercero_nombre' => $linea->tercero_nombre,
                'debito' => $linea->credito,
                'credito' => $linea->debito,
                'base_gravable' => $linea->base_gravable,
                'impuesto_tipo' => $linea->impuesto_tipo,
                'impuesto_tarifa' => $linea->impuesto_tarifa,
                'descripcion' => 'Reverso: ' . $linea->descripcion,
            ])->all();

            $this->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => 'REVERSO: ' . $asientoOriginal->concepto . ' (' . $motivo . ')',
                'modulo_origen' => $asientoOriginal->modulo_origen,
                'documento_tipo' => $asientoOriginal->documento_tipo,
                'documento_prefijo' => $asientoOriginal->documento_prefijo,
                'documento_numero' => $asientoOriginal->documento_numero,
                'tercero_tipo_documento' => $asientoOriginal->tercero_tipo_documento,
                'tercero_numero_documento' => $asientoOriginal->tercero_numero_documento,
                'tercero_nombre' => $asientoOriginal->tercero_nombre,
                'referencia_id' => $asientoOriginal->referencia_id,
                'referencia_type' => $asientoOriginal->referencia_type,
                'reverso_de_id' => $asientoOriginal->id,
                'registrado_por' => auth()->id(),
            ], $lineas);

            $asientoOriginal->update(['estado' => 'reversado']);
        });

        return true;
    }

    private function validarLinea(array $linea): void
    {
        if (empty($linea['cuenta_contable_id'])) {
            throw new \Exception('Cada linea del asiento debe tener una cuenta contable.');
        }

        $debito = (float) ($linea['debito'] ?? 0);
        $credito = (float) ($linea['credito'] ?? 0);

        if ($debito <= 0 && $credito <= 0) {
            throw new \Exception('Cada linea debe tener un valor en debito o credito.');
        }

        if ($debito > 0 && $credito > 0) {
            throw new \Exception('Una linea no puede tener debito y credito al mismo tiempo.');
        }

        $cuenta = CuentaContable::find($linea['cuenta_contable_id']);
        if (!$cuenta) {
            throw new \Exception('La cuenta contable seleccionada no existe para esta empresa.');
        }

        if (!$cuenta->acepta_movimientos) {
            throw new \Exception("La cuenta {$cuenta->codigo} es agrupadora y no acepta movimientos.");
        }

        if ($cuenta->requiere_tercero && empty($linea['tercero_numero_documento'])) {
            throw new \Exception("La cuenta {$cuenta->codigo} requiere tercero.");
        }

        if ($cuenta->requiere_centro_costo && empty($linea['centro_costo_id'])) {
            throw new \Exception("La cuenta {$cuenta->codigo} requiere centro de costo.");
        }
    }

    private function resolverPeriodoAbierto(Carbon $fecha): PeriodoContable
    {
        $tenantId = tenantId();

        $ultimoCerrado = PeriodoContable::query()
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('estado', 'cerrado')
            ->orderByDesc('anio')
            ->orderByDesc('mes')
            ->first();

        if ($ultimoCerrado) {
            $finUltimoCerrado = Carbon::create($ultimoCerrado->anio, $ultimoCerrado->mes, 1)->endOfMonth();
            if ($fecha->lessThanOrEqualTo($finUltimoCerrado)) {
                throw new \Exception('No se puede contabilizar en una fecha que corresponde a un periodo ya cerrado.');
            }
        }

        $criterioBusqueda = [
            'anio' => (int) $fecha->format('Y'),
            'mes' => (int) $fecha->format('m'),
        ];
        if ($tenantId) {
            $criterioBusqueda['tenant_id'] = $tenantId;
        }

        $periodo = PeriodoContable::firstOrCreate(
            $criterioBusqueda,
            [
                'fecha_inicio' => $fecha->copy()->startOfMonth()->toDateString(),
                'fecha_fin' => $fecha->copy()->endOfMonth()->toDateString(),
                'estado' => 'abierto',
            ]
        );

        if ($periodo->estaCerrado()) {
            throw new \Exception('No se puede contabilizar en el periodo actual porque se encuentra cerrado.');
        }

        return $periodo;
    }

    private function siguienteNumero(Carbon $fecha): string
    {
        $prefix = 'COM-' . $fecha->format('Ym') . '-';
        $ultimo = AsientoContable::where('numero', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('numero')
            ->value('numero');

        $secuencia = $ultimo ? ((int) substr($ultimo, -6)) + 1 : 1;

        return $prefix . str_pad((string) $secuencia, 6, '0', STR_PAD_LEFT);
    }
}
```

### CierreAnualService

**Ruta:** `app/Modules/Accounting/Services/CierreAnualService.php`
```php
<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Models\PeriodoContable;
use Illuminate\Support\Facades\DB;

readonly class CierreAnualService
{
    public function __construct(
        private ContabilidadService $contabilidadService,
    ) {}

    public function cerrarAnio(int $anio): array
    {
        $this->validarPeriodosCerrados($anio);

        $saldosIngresos = $this->calcularSaldosPorGrupo($anio, '4');
        $saldosGastos = $this->calcularSaldosPorGrupo($anio, '5');
        $saldosCostos = $this->calcularSaldosPorGrupo($anio, '6');

        $lineas = $this->construirLineasCierre(
            $saldosIngresos,
            $saldosGastos,
            $saldosCostos,
        );

        $totalDebito = round(collect($lineas)->sum('debito'), 2);
        $totalCredito = round(collect($lineas)->sum('credito'), 2);

        if (abs($totalDebito - $totalCredito) > 0.01) {
            throw new \RuntimeException(
                "El asiento de cierre anual no cuadra: débitos \${$totalDebito} vs créditos \${$totalCredito}."
            );
        }

        $asiento = DB::transaction(function () use ($anio, $lineas) {
            return $this->contabilidadService->registrarAsiento(
                [
                    'fecha' => "{$anio}-12-31",
                    'concepto' => "CIERRE ANUAL {$anio}",
                    'modulo_origen' => 'accounting',
                ],
                $lineas,
            );
        });

        $lineasIngreso = collect($lineas)->filter(fn ($l) => $l['credito'] == 0);
        $lineasGasto = collect($lineas)->filter(fn ($l) => $l['debito'] == 0 && $l['credito'] > 0);

        return [
            'asiento_numero' => $asiento->numero,
            'total_ingresos' => $totalDebito,
            'total_gastos' => $totalCredito - $lineasIngreso->sum('debito'),
            'utilidad_neta' => round($totalDebito - ($totalCredito - $lineasIngreso->sum('debito')), 2),
            'lineas_ingresos' => $saldosIngresos->toArray(),
            'lineas_gastos' => $saldosGastos->toArray(),
            'lineas_costos' => $saldosCostos->toArray(),
        ];
    }

    public function aniosDisponiblesParaCierre(): array
    {
        $aniosConPeriodosCerrados = PeriodoContable::query()
            ->where('estado', 'cerrado')
            ->select('anio')
            ->distinct()
            ->pluck('anio');

        $aniosConCierre = AsientoContable::query()
            ->where('concepto', 'like', 'CIERRE ANUAL %')
            ->where('estado', '!=', 'reversado')
            ->selectRaw("CAST(SUBSTRING(concepto FROM 'CIERRE ANUAL ([0-9]+)') AS INTEGER) as anio")
            ->distinct()
            ->pluck('anio');

        return $aniosConPeriodosCerrados
            ->diff($aniosConCierre)
            ->sort()
            ->values()
            ->toArray();
    }

    private function validarPeriodosCerrados(int $anio): void
    {
        $periodosAbiertos = PeriodoContable::query()
            ->where('anio', $anio)
            ->where('estado', '!=', 'cerrado')
            ->pluck('mes');

        if ($periodosAbiertos->isNotEmpty()) {
            $meses = $periodosAbiertos->implode(', ');
            throw new \RuntimeException(
                "No se puede cerrar el año {$anio}. Los siguientes meses no están cerrados: {$meses}."
            );
        }

        $totalPeriodos = PeriodoContable::query()
            ->where('anio', $anio)
            ->where('estado', 'cerrado')
            ->count();

        if ($totalPeriodos < 12) {
            throw new \RuntimeException(
                "No se puede cerrar el año {$anio}. Solo hay {$totalPeriodos} periodos cerrados de 12 requeridos."
            );
        }
    }

    private function calcularSaldosPorGrupo(int $anio, string $grupo): \Illuminate\Support\Collection
    {
        return AsientoContable::query()
            ->join('asiento_lineas', 'asientos_contables.id', '=', 'asiento_lineas.asiento_contable_id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->whereYear('asientos_contables.fecha', $anio)
            ->where('asientos_contables.estado', '!=', 'reversado')
            ->where('cuentas_contables.codigo', 'like', "{$grupo}%")
            ->where('cuentas_contables.acepta_movimientos', true)
            ->select(
                'cuentas_contables.id as cuenta_id',
                'cuentas_contables.codigo',
                'cuentas_contables.nombre',
                'cuentas_contables.naturaleza',
            )
            ->selectRaw('
                SUM(CASE
                    WHEN cuentas_contables.naturaleza = \'credito\'
                    THEN asiento_lineas.credito - asiento_lineas.debito
                    ELSE asiento_lineas.debito - asiento_lineas.credito
                END) as saldo
            ')
            ->groupBy(
                'cuentas_contables.id',
                'cuentas_contables.codigo',
                'cuentas_contables.nombre',
                'cuentas_contables.naturaleza',
            )
            ->havingRaw('ABS(SUM(CASE
                WHEN cuentas_contables.naturaleza = \'credito\'
                THEN asiento_lineas.credito - asiento_lineas.debito
                ELSE asiento_lineas.debito - asiento_lineas.credito
            END)) > 0.005')
            ->orderBy('cuentas_contables.codigo')
            ->get()
            ->map(fn ($row) => [
                'cuenta_id' => $row->cuenta_id,
                'codigo' => $row->codigo,
                'nombre' => $row->nombre,
                'naturaleza' => $row->naturaleza,
                'saldo' => (float) $row->saldo,
            ]);
    }

    private function construirLineasCierre(
        \Illuminate\Support\Collection $saldosIngresos,
        \Illuminate\Support\Collection $saldosGastos,
        \Illuminate\Support\Collection $saldosCostos,
    ): array {
        $lineas = [];

        foreach ($saldosIngresos as $ingreso) {
            $lineas[] = [
                'cuenta_contable_id' => $ingreso['cuenta_id'],
                'debito' => round(abs($ingreso['saldo']), 2),
                'credito' => 0,
                'descripcion' => "Cierre anual - ingreso {$ingreso['codigo']}",
            ];
        }

        foreach ($saldosGastos as $gasto) {
            $lineas[] = [
                'cuenta_contable_id' => $gasto['cuenta_id'],
                'debito' => 0,
                'credito' => round(abs($gasto['saldo']), 2),
                'descripcion' => "Cierre anual - gasto {$gasto['codigo']}",
            ];
        }

        foreach ($saldosCostos as $costo) {
            $lineas[] = [
                'cuenta_contable_id' => $costo['cuenta_id'],
                'debito' => 0,
                'credito' => round(abs($costo['saldo']), 2),
                'descripcion' => "Cierre anual - costo {$costo['codigo']}",
            ];
        }

        $totalDebitos = round(collect($lineas)->sum('debito'), 2);
        $totalCreditos = round(collect($lineas)->sum('credito'), 2);

        $cuentaUtilidades = $this->contabilidadService->getCuenta('3610');
        if (!$cuentaUtilidades) {
            throw new \RuntimeException(
                'La cuenta 3610 (Utilidades Retenidas) no existe en el plan de cuentas.'
            );
        }

        $diferencia = round($totalDebitos - $totalCreditos, 2);
        if (abs($diferencia) > 0.005) {
            if ($diferencia > 0) {
                $lineas[] = [
                    'cuenta_contable_id' => $cuentaUtilidades->id,
                    'debito' => 0,
                    'credito' => $diferencia,
                    'descripcion' => "Cierre anual - utilidad neta",
                ];
            } else {
                $lineas[] = [
                    'cuenta_contable_id' => $cuentaUtilidades->id,
                    'debito' => abs($diferencia),
                    'credito' => 0,
                    'descripcion' => "Cierre anual - pérdida neta",
                ];
            }
        }

        return $lineas;
    }
}
```

### ContabilidadConfig

**Ruta:** `app/Modules/Accounting/Services/ContabilidadConfig.php`
```php
<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Configuracion;

class ContabilidadConfig
{
    public static function get(string $clave, ?string $default = null, ?int $tenantId = null): string
    {
        return Configuracion::get($clave, $default ?? self::fallback($clave), $tenantId);
    }

    public static function caja(?int $tenantId = null): string
    {
        return self::get('cta_caja', '110505', $tenantId);
    }

    public static function bancos(?int $tenantId = null): string
    {
        return self::get('cta_bancos', '111005', $tenantId);
    }

    public static function clientes(?int $tenantId = null): string
    {
        return self::get('cta_clientes', '1305', $tenantId);
    }

    public static function proveedores(?int $tenantId = null): string
    {
        return self::get('cta_proveedores', '2205', $tenantId);
    }

    public static function iva(?int $tenantId = null): string
    {
        return self::get('cta_iva', '2408', $tenantId);
    }

    public static function anticipos(?int $tenantId = null): string
    {
        return self::get('cta_anticipos', '2815', $tenantId);
    }

    public static function inventario(?int $tenantId = null): string
    {
        return self::get('cta_inventario', '1405', $tenantId);
    }

    public static function costoVentas(?int $tenantId = null): string
    {
        return self::get('cta_costo_ventas', '6135', $tenantId);
    }

    public static function gastoComisiones(?int $tenantId = null): string
    {
        return self::get('cta_gasto_comisiones', '5105', $tenantId);
    }

    public static function ivaGenerado(?int $tenantId = null): string
    {
        return self::get('cta_iva_generado', '240805', $tenantId);
    }

    public static function ivaDescontable(?int $tenantId = null): string
    {
        return self::get('cta_iva_descontable', '240810', $tenantId);
    }

    public static function retencionFuente(?int $tenantId = null): string
    {
        return self::get('cta_retencion_fuente', '135515', $tenantId);
    }

    public static function retencionIva(?int $tenantId = null): string
    {
        return self::get('cta_retencion_iva', '2365', $tenantId);
    }

    public static function retencionIca(?int $tenantId = null): string
    {
        return self::get('cta_retencion_ica', '135518', $tenantId);
    }

    public static function ingresoVentas(?int $tenantId = null): string
    {
        return self::get('cta_ingreso_ventas', '4135', $tenantId);
    }

    public static function cuentaPorMetodoPago(string $metodo, string $regimen, ?int $tenantId = null): string
    {
        return match ($metodo) {
            'tarjeta', 'transferencia' => $regimen === 'comun' ? self::bancos($tenantId) : self::caja($tenantId),
            'credito' => self::clientes($tenantId),
            default => self::caja($tenantId),
        };
    }

    private static function fallback(string $clave): ?string
    {
        return match ($clave) {
            'cta_caja' => '110505',
            'cta_bancos' => '111005',
            'cta_clientes' => '1305',
            'cta_proveedores' => '2205',
            'cta_iva' => '2408',
            'cta_anticipos' => '2815',
            'cta_inventario' => '1405',
            'cta_costo_ventas' => '6135',
            'cta_gasto_comisiones' => '5105',
            'cta_iva_generado' => '240805',
            'cta_iva_descontable' => '240810',
            'cta_retencion_fuente' => '135515',
            'cta_retencion_iva' => '2365',
            'cta_retencion_ica' => '135518',
            'cta_ingreso_ventas' => '4135',
            default => null,
        };
    }
}
```

### RegimeProvisioner

**Ruta:** `app/Modules/Accounting/Services/RegimeProvisioner.php`
```php
<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;

class RegimeProvisioner
{
    private const CUENTAS_COMUN = [
        ['240805', 'IVA generado', 'pasivo', 'credito', 3, true, false],
        ['240810', 'IVA descontable', 'activo', 'debito', 3, true, false],
        ['135515', 'Retención en la fuente', 'activo', 'debito', 3, true, true],
        ['2365', 'Retención en la fuente por pagar', 'pasivo', 'credito', 2, true, true],
        ['135518', 'Impuesto de industria y comercio retenido', 'activo', 'debito', 3, true, true],
        ['2367', 'Impuesto a las ventas retenido', 'pasivo', 'credito', 2, true, true],
        ['413505', 'Ingresos por ventas gravadas', 'ingreso', 'credito', 3, true, false],
    ];

    public function provisionarCuentasComun(Tenant $tenant): array
    {
        $creadas = [];

        foreach (self::CUENTAS_COMUN as [$codigo, $nombre, $tipo, $naturaleza, $nivel, $acepta, $tercero]) {
            $existe = CuentaContable::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('codigo', $codigo)
                ->exists();

            if (!$existe) {
                $cuenta = CuentaContable::withoutGlobalScopes()->create([
                    'tenant_id' => $tenant->id,
                    'codigo' => $codigo,
                    'nombre' => $nombre,
                    'tipo' => $tipo,
                    'naturaleza' => $naturaleza,
                    'nivel' => $nivel,
                    'clase' => substr($codigo, 0, 1),
                    'acepta_movimientos' => $acepta,
                    'requiere_tercero' => $tercero,
                    'requiere_centro_costo' => false,
                    'tipo_regimen' => 'COMUN',
                ]);
                $creadas[] = $cuenta;
            }
        }

        return $creadas;
    }

    public function cambiarRegimen(Tenant $tenant, string $nuevoRegimen, ?string $fechaCambio = null): array
    {
        $resultado = [
            'regimen_anterior' => Configuracion::get('regimen_fiscal', 'simplificado', $tenant->id),
            'regimen_nuevo' => $nuevoRegimen,
            'cuentas_creadas' => [],
        ];

        Configuracion::setMany([
            'regimen_fiscal' => $nuevoRegimen,
            'fecha_cambio_regimen' => $fechaCambio ?? now()->toDateString(),
        ], $tenant->id);

        if ($nuevoRegimen === 'comun') {
            $resultado['cuentas_creadas'] = $this->provisionarCuentasComun($tenant);
        }

        return $resultado;
    }
}
```

### PucColombiaProvisioner

**Ruta:** `app/Modules/Accounting/Services/PucColombiaProvisioner.php`
```php
<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;

class PucColombiaProvisioner
{
    public function provisionForTenant(Tenant $tenant): void
    {
        $cuentas = [
            ['1000', 'Activo', 'activo', 'debito', 1, false, false, false],
            ['1105', 'Caja', 'activo', 'debito', 2, false, false, false],
            ['110505', 'Caja general', 'activo', 'debito', 3, true, false, false],
            ['1110', 'Bancos', 'activo', 'debito', 2, false, false, false],
            ['111005', 'Bancos nacionales', 'activo', 'debito', 3, true, false, false],
            ['1305', 'Clientes nacionales', 'activo', 'debito', 2, true, true, false],
            ['130505', 'Clientes nacionales', 'activo', 'debito', 3, true, true, false],
            ['1355', 'Anticipo de impuestos y contribuciones', 'activo', 'debito', 2, true, true, false],
            ['135505', 'Anticipo de renta', 'activo', 'debito', 3, true, true, false],
            ['135515', 'Retencion en la fuente', 'activo', 'debito', 3, true, true, false],
            ['135518', 'Impuesto de industria y comercio retenido', 'activo', 'debito', 3, true, true, false],
            ['1405', 'Inventarios', 'activo', 'debito', 2, true, false, false],
            ['2000', 'Pasivo', 'pasivo', 'credito', 1, false, false, false],
            ['2205', 'Proveedores nacionales', 'pasivo', 'credito', 2, true, true, false],
            ['220505', 'Proveedores nacionales', 'pasivo', 'credito', 3, true, true, false],
            ['2365', 'Retencion en la fuente por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['236505', 'Retención en la fuente por pagar', 'pasivo', 'credito', 3, true, true, false],
            ['2367', 'Impuesto a las ventas retenido', 'pasivo', 'credito', 2, true, true, false],
            ['236705', 'IVA retenido por pagar', 'pasivo', 'credito', 3, true, true, false],
            ['2368', 'Impuesto de industria y comercio retenido', 'pasivo', 'credito', 2, true, true, false],
            ['236805', 'ICA retenido por pagar', 'pasivo', 'credito', 3, true, true, false],
            ['2370', 'Retenciones y aportes de nómina', 'pasivo', 'credito', 2, true, true, false],
            ['2408', 'Impuesto sobre las ventas por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['240805', 'IVA generado', 'pasivo', 'credito', 3, true, true, false],
            ['240810', 'IVA descontable', 'activo', 'debito', 3, true, true, false],
            ['2505', 'Salarios por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['2610', 'Provisiones para obligaciones laborales', 'pasivo', 'credito', 2, true, false, false],
            ['2805', 'Anticipos recibidos de clientes', 'pasivo', 'credito', 2, true, true, false],
            ['280505', 'Anticipos recibidos de clientes', 'pasivo', 'credito', 3, true, true, false],
            ['2815', 'Anticipos recibidos', 'pasivo', 'credito', 2, true, false, false],
            ['3000', 'Patrimonio', 'patrimonio', 'credito', 1, false, false, false],
            ['3115', 'Aportes sociales', 'patrimonio', 'credito', 2, true, false, false],
            ['311505', 'Aportes sociales pagados', 'patrimonio', 'credito', 3, true, false, false],
            ['3605', 'Utilidad del ejercicio', 'patrimonio', 'credito', 2, true, false, false],
            ['360505', 'Utilidad del ejercicio', 'patrimonio', 'credito', 3, true, false, false],
            ['4000', 'Ingresos', 'ingreso', 'credito', 1, false, false, false],
            ['4135', 'Comercio al por mayor y al por menor', 'ingreso', 'credito', 2, true, false, false],
            ['4175', 'Devoluciones en ventas', 'ingreso', 'debito', 2, true, false, false],
            ['417505', 'Devoluciones en ventas', 'ingreso', 'debito', 3, true, false, false],
            ['5000', 'Gastos', 'gasto', 'debito', 1, false, false, false],
            ['5105', 'Gastos de personal', 'gasto', 'debito', 2, true, false, true],
            ['5135', 'Servicios', 'gasto', 'debito', 2, true, true, true],
            ['5195', 'Diversos', 'gasto', 'debito', 2, true, false, true],
            ['6000', 'Costos de ventas', 'costo', 'debito', 1, false, false, false],
            ['6135', 'Comercio al por mayor y al por menor', 'costo', 'debito', 2, true, false, true],
        ];

        foreach ($cuentas as [$codigo, $nombre, $tipo, $naturaleza, $nivel, $acepta, $tercero, $centroCosto]) {
            CuentaContable::withoutGlobalScopes()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'codigo' => $codigo,
                ],
                [
                    'nombre' => $nombre,
                    'tipo' => $tipo,
                    'naturaleza' => $naturaleza,
                    'nivel' => $nivel,
                    'clase' => substr($codigo, 0, 1),
                    'acepta_movimientos' => $acepta,
                    'requiere_tercero' => $tercero,
                    'requiere_centro_costo' => $centroCosto,
                ]
            );
        }
    }
}
```

### PucSimplificadoProvisioner

**Ruta:** `app/Modules/Accounting/Services/PucSimplificadoProvisioner.php`
```php
<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;

class PucSimplificadoProvisioner
{
    public function provisionForTenant(Tenant $tenant): void
    {
        $cuentas = [
            ['1000', 'Activo', 'activo', 'debito', 1, false, false, false],
            ['1105', 'Caja', 'activo', 'debito', 2, false, false, false],
            ['110505', 'Caja general', 'activo', 'debito', 3, true, false, false],
            ['1110', 'Bancos', 'activo', 'debito', 2, false, false, false],
            ['111005', 'Bancos nacionales', 'activo', 'debito', 3, true, false, false],
            ['1305', 'Clientes', 'activo', 'debito', 2, true, true, false],
            ['1405', 'Inventarios', 'activo', 'debito', 2, true, false, false],
            ['2000', 'Pasivo', 'pasivo', 'credito', 1, false, false, false],
            ['2205', 'Proveedores nacionales', 'pasivo', 'credito', 2, true, true, false],
            ['2370', 'Retenciones y aportes de nómina', 'pasivo', 'credito', 2, true, true, false],
            ['2408', 'Impuesto sobre las ventas por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['2505', 'Salarios por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['2610', 'Provisiones para obligaciones laborales', 'pasivo', 'credito', 2, true, false, false],
            ['2805', 'Anticipos recibidos de clientes', 'pasivo', 'credito', 2, true, true, false],
            ['2815', 'Anticipos recibidos', 'pasivo', 'credito', 2, true, false, false],
            ['3000', 'Patrimonio', 'patrimonio', 'credito', 1, false, false, false],
            ['3115', 'Aportes sociales', 'patrimonio', 'credito', 2, true, false, false],
            ['3605', 'Utilidad del ejercicio', 'patrimonio', 'credito', 2, true, false, false],
            ['4000', 'INGRESOS', 'ingreso', 'credito', 1, false, false, false],
            ['4135', 'Comercio al por mayor y menor', 'ingreso', 'credito', 2, true, true, false],
            ['4175', 'Devoluciones en ventas', 'ingreso', 'debito', 2, true, true, false],
            ['5000', 'GASTOS', 'gasto', 'debito', 1, false, false, false],
            ['5105', 'Gastos de personal', 'gasto', 'debito', 2, true, false, true],
            ['6000', 'COSTOS', 'costo', 'debito', 1, false, false, false],
            ['6135', 'Costo de ventas', 'costo', 'debito', 2, true, false, false],
        ];

        foreach ($cuentas as [$codigo, $nombre, $tipo, $naturaleza, $nivel, $acepta, $tercero, $centroCosto]) {
            CuentaContable::withoutGlobalScopes()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'codigo' => $codigo,
                ],
                [
                    'nombre' => $nombre,
                    'tipo' => $tipo,
                    'naturaleza' => $naturaleza,
                    'nivel' => $nivel,
                    'clase' => substr($codigo, 0, 1),
                    'acepta_movimientos' => $acepta,
                    'requiere_tercero' => $tercero,
                    'requiere_centro_costo' => $centroCosto,
                ]
            );
        }
    }
}
```

### LibroContableProvisioner

**Ruta:** `app/Modules/Accounting/Services/LibroContableProvisioner.php`
```php
<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\LibroContable;

class LibroContableProvisioner
{
    public function provisionForTenant(Tenant $tenant): void
    {
        foreach (LibroContable::DEFAULT_BOOKS as $book) {
            LibroContable::withoutGlobalScopes()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'codigo' => $book['codigo'],
                ],
                [
                    'nombre' => $book['nombre'],
                    'tipo' => $book['tipo'],
                    'descripcion' => $book['descripcion'],
                    'filtro_cuentas' => $book['filtro_cuentas'],
                    'filtro_modulo' => $book['filtro_modulo'],
                    'is_sistema' => true,
                    'activo' => true,
                ]
            );
        }
    }
}
```

### TributaryRuleService

**Ruta:** `app/Modules/Accounting/Services/TributaryRuleService.php`
```php
<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Configuracion;
use App\Modules\Accounting\Services\ContabilidadConfig;
use Carbon\Carbon;

class TributaryRuleService
{
    private const UMBRAL_MINIMO_RETENCION = 107000;

    public function calculateTaxes(float $base, string $tipo, int $tenantId, $tercero = null, ?string $fecha = null): array
    {
        $regimen = $this->getRegimeAtDate($tenantId, $fecha);

        if ($regimen === 'simplificado') {
            return [
                'base' => $base,
                'iva' => 0,
                'retenciones' => [],
                'total_retenciones' => 0,
                'total' => $base,
                'regimen' => 'simplificado',
                'regimen_label' => 'Régimen Simplificado',
            ];
        }

        $tax = \App\Core\Models\Tax::where('tenant_id', $tenantId)
            ->where('codigo', 'IVA')
            ->where('activo', true)
            ->first();

        $porcentajeIva = $tax ? (float)$tax->porcentaje : 19.0;
        $iva = round($base * ($porcentajeIva / 100), 2);

        $retenciones = [];
        $totalRetenciones = 0;

        if ($tercero) {
            if (isset($tercero->porcentaje_retencion_fuente) && $tercero->porcentaje_retencion_fuente > 0) {
                $baseRetencion = $base;
                $reteFuente = round($baseRetencion * ($tercero->porcentaje_retencion_fuente / 100), 2);

                if ($reteFuente >= self::UMBRAL_MINIMO_RETENCION) {
                    $retenciones['rete_fuente'] = [
                        'tipo' => 'rete_fuente',
                        'base' => round($baseRetencion, 2),
                        'tarifa' => $tercero->porcentaje_retencion_fuente,
                        'valor' => $reteFuente,
                    ];
                    $totalRetenciones += $reteFuente;
                }
            }

            if ($tipo === 'venta' && isset($tercero->porcentaje_retencion_iva) && $tercero->porcentaje_retencion_iva > 0) {
                $reteIva = round($iva * ($tercero->porcentaje_retencion_iva / 100), 2);
                $retenciones['rete_iva'] = [
                    'tipo' => 'rete_iva',
                    'base' => $iva,
                    'tarifa' => $tercero->porcentaje_retencion_iva,
                    'valor' => $reteIva,
                ];
                $totalRetenciones += $reteIva;
            }

            if ($tipo === 'venta') {
                $tarifaIcaMunicipio = $this->getTarifaIcaMunicipio($tenantId);
                if ($tarifaIcaMunicipio > 0) {
                    $reteIca = round($base * ($tarifaIcaMunicipio / 100), 2);
                    $retenciones['rete_ica'] = [
                        'tipo' => 'rete_ica',
                        'base' => $base,
                        'tarifa' => $tarifaIcaMunicipio,
                        'valor' => $reteIca,
                    ];
                    $totalRetenciones += $reteIca;
                }
            }
        }

        return [
            'base' => $base,
            'iva' => $iva,
            'retenciones' => $retenciones,
            'total_retenciones' => $totalRetenciones,
            'total' => $base + $iva - $totalRetenciones,
            'regimen' => 'comun',
            'regimen_label' => 'Régimen Común',
        ];
    }

    public function getRegimeAtDate(int $tenantId, ?string $fecha = null): string
    {
        $fechaConsulta = $fecha ? Carbon::parse($fecha) : now();
        $fechaCambio = Configuracion::get('fecha_cambio_regimen', null, $tenantId);

        if (!$fechaCambio) {
            return Configuracion::get('regimen_fiscal', 'simplificado', $tenantId);
        }

        $fechaCambioCarbon = Carbon::parse($fechaCambio);

        return $fechaConsulta->greaterThanOrEqualTo($fechaCambioCarbon) 
            ? Configuracion::get('regimen_fiscal', 'simplificado', $tenantId)
            : 'simplificado';
    }

    private function getTarifaIcaMunicipio(int $tenantId): float
    {
        $ciudadCodigo = Configuracion::get('codigo_municipio', null, $tenantId);
        if (!$ciudadCodigo) {
            return 0;
        }

        $tarifa = Configuracion::get("ica_municipio_{$ciudadCodigo}", null, $tenantId);
        return $tarifa !== null ? (float) $tarifa : 0;
    }

    public function getRequiredAccounts(string $operacion, string $tipo, int $tenantId): array
    {
        $regimen = $this->getRegimeAtDate($tenantId);
        $cuentas = [];

        if ($operacion === 'venta') {
            $cuentas['ingreso'] = ContabilidadConfig::get('cta_ingresos', '4135', $tenantId);
            $cuentas['cobro'] = ContabilidadConfig::clientes($tenantId);

            if ($regimen === 'comun') {
                $cuentas['iva'] = ContabilidadConfig::ivaGenerado($tenantId);
                $cuentas['retencion'] = ContabilidadConfig::retencionFuente($tenantId);
            }
        }

        if ($operacion === 'compra') {
            $cuentas['gasto'] = ContabilidadConfig::get('cta_gasto', '5105', $tenantId);
            $cuentas['pago'] = ContabilidadConfig::proveedores($tenantId);

            if ($regimen === 'comun') {
                $cuentas['iva'] = ContabilidadConfig::ivaDescontable($tenantId);
            }
        }

        return $cuentas;
    }
}
```

---

## Console Commands

### SeedLibrosContables

**Ruta:** `app/Modules/Accounting/Console/SeedLibrosContables.php`
```php
<?php

namespace App\Modules\Accounting\Console;

use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;
use App\Modules\Accounting\Services\LibroContableProvisioner;
use App\Modules\Accounting\Services\PucColombiaProvisioner;
use App\Modules\Accounting\Services\PucSimplificadoProvisioner;
use Illuminate\Console\Command;

class SeedLibrosContables extends Command
{
    protected $signature = 'accounting:seed-libros';
    protected $description = 'Siembra los libros contables por defecto y completa el PUC para todos los tenants existentes';

    public function handle(): int
    {
        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            $this->warn('No hay tenants registrados.');
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar($tenants->count());
        $bar->start();

        foreach ($tenants as $tenant) {
            try {
                app(LibroContableProvisioner::class)->provisionForTenant($tenant);

                $regimen = Configuracion::get('regimen_fiscal', 'simplificado', $tenant->id);
                if ($regimen === 'simplificado') {
                    app(PucSimplificadoProvisioner::class)->provisionForTenant($tenant);
                } else {
                    app(PucColombiaProvisioner::class)->provisionForTenant($tenant);
                }
            } catch (\Exception $e) {
                $this->error("Error con tenant {$tenant->id}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Libros contables y PUC actualizados para todos los tenants.');

        return Command::SUCCESS;
    }
}
```

### CambiarRegimen

**Ruta:** `app/Modules/Accounting/Console/CambiarRegimen.php`
```php
<?php

namespace App\Modules\Accounting\Console;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Services\RegimeProvisioner;
use Illuminate\Console\Command;

class CambiarRegimen extends Command
{
    protected $signature = 'accounting:cambiar-regimen
                            {regimen : Nuevo régimen: simplificado o comun}
                            {--tenant= : ID del tenant (default: todos los activos)}';

    protected $description = 'Cambia el régimen tributario de uno o todos los tenants y provisiona cuentas faltantes';

    public function handle(RegimeProvisioner $provisioner): int
    {
        $regimen = $this->argument('regimen');
        $tenantId = $this->option('tenant');

        if (!in_array($regimen, ['simplificado', 'comun'])) {
            $this->error('El régimen debe ser "simplificado" o "comun".');
            return self::FAILURE;
        }

        $tenants = $tenantId
            ? Tenant::where('id', $tenantId)->get()
            : Tenant::where('is_active', true)->get();

        if ($tenants->isEmpty()) {
            $this->error('No se encontraron tenants.');
            return self::FAILURE;
        }

        foreach ($tenants as $tenant) {
            $resultado = $provisioner->cambiarRegimen($tenant, $regimen);
            $creadas = count($resultado['cuentas_creadas']);

            $this->info("Tenant \"{$tenant->name}\" (ID: {$tenant->id}):");
            $this->line("  Régimen: {$resultado['regimen_anterior']} → {$regimen}");
            $this->line("  Cuentas tributarias creadas: {$creadas}");

            if ($creadas > 0) {
                foreach ($resultado['cuentas_creadas'] as $cuenta) {
                    $this->line("    - {$cuenta->codigo} {$cuenta->nombre}");
                }
            }
        }

        $this->info('Proceso completado.');
        return self::SUCCESS;
    }
}
```

---

## Migrations

### 2026_06_20_000000_create_accounting_tables

**Ruta:** `app/Modules/Accounting/Migrations/2026_06_20_000000_create_accounting_tables.php`
```php
<?php

use App\Core\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('centros_costo', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->string('codigo', 20);
            $table->string('nombre', 100);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->unique(['tenant_id', 'codigo']);
        });

        Schema::create('cuentas_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->string('codigo', 20);
            $table->string('nombre', 150);
            $table->enum('tipo', ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'costo']);
            $table->boolean('acepta_movimientos')->default(true);
            $table->foreignId('parent_id')->nullable()->constrained('cuentas_contables')->cascadeOnDelete();
            $table->text('descripcion')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'codigo']);
        });

        Schema::create('asientos_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->date('fecha');
            $table->string('concepto');
            $table->string('modulo_origen', 50)->nullable();
            $table->nullableMorphs('referencia');
            $table->foreignId('registrado_por')->nullable()->constrained('users');
            $table->timestamps();
        });

        Schema::create('asiento_lineas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asiento_contable_id')->constrained('asientos_contables')->cascadeOnDelete();
            $table->foreignId('cuenta_contable_id')->constrained('cuentas_contables');
            $table->foreignId('centro_costo_id')->nullable()->constrained('centros_costo')->nullOnDelete();
            $table->decimal('debito', 15, 2)->default(0);
            $table->decimal('credito', 15, 2)->default(0);
            $table->text('descripcion')->nullable();
            $table->timestamps();
        });

        Schema::create('cuentas_por_cobrar', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->nullableMorphs('deudor');
            $table->nullableMorphs('documento_origen');
            $table->decimal('monto_total', 15, 2);
            $table->decimal('monto_pagado', 15, 2)->default(0);
            $table->enum('estado', ['pendiente', 'pagado', 'anulado'])->default('pendiente');
            $table->date('fecha_vencimiento')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });

        Schema::create('cuentas_por_pagar', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->nullableMorphs('acreedor');
            $table->nullableMorphs('documento_origen');
            $table->decimal('monto_total', 15, 2);
            $table->decimal('monto_pagado', 15, 2)->default(0);
            $table->enum('estado', ['pendiente', 'pagado', 'anulado'])->default('pendiente');
            $table->date('fecha_vencimiento')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuentas_por_pagar');
        Schema::dropIfExists('cuentas_por_cobrar');
        Schema::dropIfExists('asiento_lineas');
        Schema::dropIfExists('asientos_contables');
        Schema::dropIfExists('cuentas_contables');
        Schema::dropIfExists('centros_costo');
    }
};
```

### 2026_06_20_000001_add_tenant_id_to_asiento_lineas

**Ruta:** `app/Modules/Accounting/Migrations/2026_06_20_000001_add_tenant_id_to_asiento_lineas.php`
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('asiento_lineas', function (Blueprint $table) {
            if (!Schema::hasColumn('asiento_lineas', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        DB::statement('
            UPDATE asiento_lineas
            SET tenant_id = (
                SELECT tenant_id FROM asientos_contables
                WHERE asientos_contables.id = asiento_lineas.asiento_contable_id
            )
            WHERE tenant_id IS NULL
        ');
    }

    public function down(): void
    {
        Schema::table('asiento_lineas', function (Blueprint $table) {
            if (Schema::hasColumn('asiento_lineas', 'tenant_id')) {
                $table->dropForeign(['tenant_id']);
                $table->dropColumn('tenant_id');
            }
        });
    }
};
```

### 2026_06_20_010000_add_colombia_accounting_controls

**Ruta:** `app/Modules/Accounting/Migrations/2026_06_20_010000_add_colombia_accounting_controls.php`
```php
<?php

use App\Core\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('periodos_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('anio');
            $table->unsignedTinyInteger('mes');
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->enum('estado', ['abierto', 'cerrado'])->default('abierto');
            $table->timestamp('cerrado_at')->nullable();
            $table->foreignId('cerrado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['tenant_id', 'anio', 'mes']);
            $table->index(['tenant_id', 'estado']);
        });

        Schema::table('cuentas_contables', function (Blueprint $table) {
            $table->enum('naturaleza', ['debito', 'credito'])->default('debito')->after('tipo');
            $table->unsignedTinyInteger('nivel')->default(1)->after('naturaleza');
            $table->string('clase', 1)->nullable()->after('nivel');
            $table->boolean('requiere_tercero')->default(false)->after('acepta_movimientos');
            $table->boolean('requiere_centro_costo')->default(false)->after('requiere_tercero');
        });

        Schema::table('asientos_contables', function (Blueprint $table) {
            $table->foreignId('periodo_contable_id')->nullable()->after('tenant_id')->constrained('periodos_contables')->nullOnDelete();
            $table->string('numero', 30)->nullable()->after('fecha');
            $table->enum('estado', ['borrador', 'contabilizado', 'reversado'])->default('contabilizado')->after('concepto');
            $table->string('documento_tipo', 50)->nullable()->after('modulo_origen');
            $table->string('documento_prefijo', 10)->nullable()->after('documento_tipo');
            $table->string('documento_numero', 50)->nullable()->after('documento_prefijo');
            $table->string('tercero_tipo_documento', 10)->nullable()->after('documento_numero');
            $table->string('tercero_numero_documento', 30)->nullable()->after('tercero_tipo_documento');
            $table->string('tercero_nombre', 180)->nullable()->after('tercero_numero_documento');
            $table->foreignId('reverso_de_id')->nullable()->after('referencia_type')->constrained('asientos_contables')->nullOnDelete();
            $table->timestamp('contabilizado_at')->nullable()->after('registrado_por');
            $table->unique(['tenant_id', 'numero']);
            $table->index(['tenant_id', 'fecha']);
            $table->index(['tenant_id', 'estado']);
            $table->index(['tenant_id', 'documento_tipo', 'documento_prefijo', 'documento_numero'], 'asientos_documento_idx');
        });

        Schema::table('asiento_lineas', function (Blueprint $table) {
            $table->string('tercero_tipo_documento', 10)->nullable()->after('centro_costo_id');
            $table->string('tercero_numero_documento', 30)->nullable()->after('tercero_tipo_documento');
            $table->string('tercero_nombre', 180)->nullable()->after('tercero_numero_documento');
            $table->decimal('base_gravable', 15, 2)->nullable()->after('credito');
            $table->string('impuesto_tipo', 20)->nullable()->after('base_gravable');
            $table->decimal('impuesto_tarifa', 7, 4)->nullable()->after('impuesto_tipo');
            $table->index(['cuenta_contable_id']);
            $table->index(['centro_costo_id']);
            $table->index(['tercero_numero_documento']);
        });
    }

    public function down(): void
    {
        Schema::table('asiento_lineas', function (Blueprint $table) {
            $table->dropIndex(['cuenta_contable_id']);
            $table->dropIndex(['centro_costo_id']);
            $table->dropIndex(['tercero_numero_documento']);
            $table->dropColumn([
                'tercero_tipo_documento',
                'tercero_numero_documento',
                'tercero_nombre',
                'base_gravable',
                'impuesto_tipo',
                'impuesto_tarifa',
            ]);
        });

        Schema::table('asientos_contables', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'numero']);
            $table->dropIndex(['tenant_id', 'fecha']);
            $table->dropIndex(['tenant_id', 'estado']);
            $table->dropIndex('asientos_documento_idx');
            $table->dropConstrainedForeignId('periodo_contable_id');
            $table->dropConstrainedForeignId('reverso_de_id');
            $table->dropColumn([
                'numero',
                'estado',
                'documento_tipo',
                'documento_prefijo',
                'documento_numero',
                'tercero_tipo_documento',
                'tercero_numero_documento',
                'tercero_nombre',
                'contabilizado_at',
            ]);
        });

        Schema::table('cuentas_contables', function (Blueprint $table) {
            $table->dropColumn([
                'naturaleza',
                'nivel',
                'clase',
                'requiere_tercero',
                'requiere_centro_costo',
            ]);
        });

        Schema::dropIfExists('periodos_contables');
    }
};
```

### 2026_06_26_170000_create_libros_contables_table

**Ruta:** `app/Modules/Accounting/Migrations/2026_06_26_170000_create_libros_contables_table.php`
```php
<?php

use App\Core\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('libros_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(Tenant::class)->constrained()->cascadeOnDelete();
            $table->string('codigo', 10);
            $table->string('nombre', 100);
            $table->string('tipo', 30);
            $table->string('descripcion', 255)->nullable();
            $table->string('filtro_cuentas', 100)->nullable();
            $table->string('filtro_modulo', 50)->nullable();
            $table->boolean('is_sistema')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->unique(['tenant_id', 'codigo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('libros_contables');
    }
};
```

---

## Frontend Pages

### Cuentas/Index.jsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Cuentas/Index.jsx`
```jsx
import { useState } from 'react'
import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Card } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { Calculator, Plus, Search } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'
import CuentaFormModal from './CuentaFormModal'

export default function CuentasIndex({ cuentas, filters }) {
  const { can } = usePermissions()
  const [search, setSearch] = useState(filters.search || '')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('accounting.cuentas.index'), { search }, { preserveState: true })
  }

  const columns = [
    { key: 'codigo', header: 'Código PUC', className: 'w-[120px] font-medium' },
    { key: 'nombre', header: 'Nombre de la Cuenta', className: 'font-medium' },
    { key: 'tipo', header: 'Naturaleza', className: 'w-[150px]',
      cell: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.tipo} / {row.naturaleza || 'debito'}
        </Badge>
      )
    },
    { key: 'nivel', header: 'Nivel', hideOnMobile: true,
      cell: (row) => <span className="font-mono text-sm">{row.nivel || 1}</span>
    },
    { key: 'acepta_movimientos', header: 'Movimientos', hideOnMobile: true,
      cell: (row) => (
        <Badge variant={row.acepta_movimientos ? "default" : "secondary"}>
          {row.acepta_movimientos ? 'Sí' : 'No (Agrupadora)'}
        </Badge>
      )
    }
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Plan de Cuentas" />
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Plan de Cuentas</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona la estructura contable y agrupadora de la empresa.
            </p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Buscar cuenta..." className="pl-9 h-9 w-full rounded-md bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
            {can('accounting:create') && (
              <Button size="sm" className="h-9 shrink-0" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Nueva Cuenta
              </Button>
            )}
          </div>
        </div>
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          {cuentas.data.length > 0 ? (
            <DataTable columns={columns} data={cuentas.data} rowKey={(row) => row.id} />
          ) : (
            <EmptyState icon={Calculator}
              title={search ? 'No se encontraron cuentas' : 'Plan de cuentas vacío'}
              description={search ? 'Intenta con otro código o nombre de cuenta.' : 'Aún no has configurado el plan único de cuentas (PUC) para esta empresa.'}
              action={can('accounting:create') && !search ? { label: 'Crear Primera Cuenta', onClick: () => setIsModalOpen(true) } : undefined}
              className="py-20"
            />
          )}
        </Card>
      </div>
      <CuentaFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </AuthenticatedLayout>
  )
}
```

### Cuentas/CuentaFormModal.jsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Cuentas/CuentaFormModal.jsx`
```jsx
import { useForm } from '@inertiajs/react'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Button } from '@/Components/ui/button'
import { Checkbox } from '@/Components/ui/checkbox'

export default function CuentaFormModal({ isOpen, onClose }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    codigo: '', nombre: '', tipo: 'activo', naturaleza: 'debito', nivel: 1, clase: '',
    acepta_movimientos: true, requiere_tercero: false, requiere_centro_costo: false, descripcion: '',
  })

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('accounting.cuentas.store'), { onSuccess: () => { reset(); onClose() } })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative z-50 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Nueva Cuenta Contable</h2>
          <p className="text-sm text-muted-foreground mt-1">Crea una cuenta para estructurar el plan único (PUC).</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código PUC</Label>
              <Input id="codigo" value={data.codigo} onChange={e => setData('codigo', e.target.value)} placeholder="Ej. 110505" className={errors.codigo ? 'border-destructive' : ''} />
              {errors.codigo && <p className="text-xs text-destructive">{errors.codigo}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Naturaleza / Tipo</Label>
              <select id="tipo" value={data.tipo} onChange={e => setData('tipo', e.target.value)} className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option value="activo">Activo</option>
                <option value="pasivo">Pasivo</option>
                <option value="patrimonio">Patrimonio</option>
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
                <option value="costo">Costo</option>
              </select>
              {errors.tipo && <p className="text-xs text-destructive">{errors.tipo}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="naturaleza">Naturaleza</Label>
              <select id="naturaleza" value={data.naturaleza} onChange={e => setData('naturaleza', e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nivel">Nivel</Label>
              <Input id="nivel" type="number" min="1" max="6" value={data.nivel} onChange={e => setData('nivel', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clase">Clase</Label>
              <Input id="clase" maxLength="1" value={data.clase} onChange={e => setData('clase', e.target.value)} placeholder="1" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Cuenta</Label>
            <Input id="nombre" value={data.nombre} onChange={e => setData('nombre', e.target.value)} placeholder="Caja General" className={errors.nombre ? 'border-destructive' : ''} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Input id="descripcion" value={data.descripcion} onChange={e => setData('descripcion', e.target.value)} placeholder="Breve detalle del uso de la cuenta" />
          </div>
          <div className="flex items-start space-x-3 rounded-md border border-border p-4">
            <Checkbox id="acepta_movimientos" checked={data.acepta_movimientos} onCheckedChange={checked => setData('acepta_movimientos', checked)} />
            <div className="space-y-1 leading-none">
              <Label htmlFor="acepta_movimientos" className="cursor-pointer">Acepta Movimientos</Label>
              <p className="text-xs text-muted-foreground">Si desmarcas esta opción, será una cuenta "agrupadora" o título (ej. 1105 Caja).</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start space-x-3 rounded-md border border-border p-4">
              <Checkbox id="requiere_tercero" checked={data.requiere_tercero} onCheckedChange={checked => setData('requiere_tercero', checked)} />
              <div className="space-y-1 leading-none">
                <Label htmlFor="requiere_tercero" className="cursor-pointer">Requiere tercero</Label>
                <p className="text-xs text-muted-foreground">Obliga NIT/CC en cada movimiento.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 rounded-md border border-border p-4">
              <Checkbox id="requiere_centro_costo" checked={data.requiere_centro_costo} onCheckedChange={checked => setData('requiere_centro_costo', checked)} />
              <div className="space-y-1 leading-none">
                <Label htmlFor="requiere_centro_costo" className="cursor-pointer">Requiere centro</Label>
                <p className="text-xs text-muted-foreground">Útil para gastos y costos operativos.</p>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={processing}>Cancelar</Button>
            <Button type="submit" disabled={processing}>Guardar Cuenta</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### Asientos/Index.tsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Asientos/Index.tsx`
```tsx
import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Card } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { BookOpen, Plus, Search, FileText } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

interface AsientoLinea { id: number; cuenta_contable_id: number; cuenta?: { codigo: string; nombre: string }; debito: number; credito: number }
interface Asiento { id: number; numero: string | null; fecha: string; concepto: string; modulo_origen: string | null; tercero_nombre: string | null; estado: string; total_debito: number; total_credito: number; lineas: AsientoLinea[] }
interface PaginationLink { url: string | null; label: string; active: boolean }
interface PaginatedResponse<T> { data: T[]; current_page: number; last_page: number; per_page: number; total: number; from: number | null; to: number | null; links: PaginationLink[] }
interface Filters { search?: string }
interface AsientosIndexProps { asientos: PaginatedResponse<Asiento>; filters: Filters }

function formatCurrency(val: number | null | undefined): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val ?? 0)
}

export default function AsientosIndex({ asientos, filters }: AsientosIndexProps) {
  const { can } = usePermissions()
  const [search, setSearch] = useState(filters.search ?? '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.get(route('accounting.asientos.index'), { search }, { preserveState: true })
  }

  const columns = [
    { key: 'numero', header: 'Comprobante', className: 'w-[170px] font-mono text-muted-foreground', cell: (row: Asiento) => row.numero ?? `#${row.id}`, hideOnMobile: false, alignEnd: false },
    { key: 'fecha', header: 'Fecha', className: 'w-[120px]', cell: (row: Asiento) => new Date(row.fecha).toLocaleDateString('es-CO'), hideOnMobile: false, alignEnd: false },
    { key: 'concepto', header: 'Concepto', className: 'font-medium', cell: (row: Asiento) => (
      <div className="flex flex-col">
        <span className="text-sm font-medium">{row.concepto}</span>
        {row.modulo_origen && <span className="text-xs text-muted-foreground uppercase mt-0.5">Origen: {row.modulo_origen}</span>}
        {row.tercero_nombre && <span className="text-xs text-muted-foreground mt-0.5">Tercero: {row.tercero_nombre}</span>}
      </div>
    ), hideOnMobile: false, alignEnd: false },
    { key: 'total_debito', header: 'Total Débito', className: 'text-right', cell: (row: Asiento) => <span className="font-mono text-sm">{formatCurrency(row.total_debito)}</span>, hideOnMobile: false, alignEnd: true },
    { key: 'total_credito', header: 'Total Crédito', className: 'text-right', cell: (row: Asiento) => <span className="font-mono text-sm">{formatCurrency(row.total_credito)}</span>, hideOnMobile: false, alignEnd: true },
    { key: 'estado', header: 'Estado', hideOnMobile: true, alignEnd: false, cell: (row: Asiento) => {
      const descuadrado = Math.abs((row.total_debito ?? 0) - (row.total_credito ?? 0)) > 0.01
      return <Badge variant={descuadrado ? 'destructive' : 'secondary'}>{descuadrado ? 'Descuadrado' : (row.estado === 'reversado' ? 'Reversado' : 'Contabilizado')}</Badge>
    }},
    { key: 'acciones', header: '', className: 'w-[80px]', alignEnd: true, hideOnMobile: false, cell: (_row: Asiento) => (
      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><FileText className="h-4 w-4" /></Button>
    )},
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Libro Diario (Asientos)" />
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Libro Diario</h2>
            <p className="text-sm text-muted-foreground mt-1">Registro cronológico de todos los asientos contables (partida doble).</p>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Buscar concepto o módulo..." className="pl-9 h-9 w-full rounded-md bg-background" value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
            {can('accounting:create') && (
              <Link href={route('accounting.asientos.create')}>
                <Button size="sm" className="h-9 shrink-0"><Plus className="h-4 w-4 mr-2" /> Nuevo Asiento</Button>
              </Link>
            )}
          </div>
        </div>
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          {asientos.data.length > 0 ? (
            <DataTable columns={columns} data={asientos.data} rowKey={(row: Asiento) => row.id} />
          ) : (
            <EmptyState icon={BookOpen}
              title={search ? 'No se encontraron asientos' : 'Libro Diario Vacío'}
              description={search ? 'No hay asientos contables que coincidan con tu búsqueda.' : 'Aún no hay movimientos contables registrados en esta empresa.'}
              action={can('accounting:create') && !search ? { label: 'Registrar Asiento Manual', href: route('accounting.asientos.create') } : undefined}
              className="py-20"
            />
          )}
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
```

### Asientos/Create.jsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Asientos/Create.jsx`
```jsx
import { useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Button } from '@/Components/ui/button'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AsientoCreate({ cuentas, centrosCosto }) {
  const { data, setData, post, processing, errors } = useForm({
    fecha: new Date().toISOString().split('T')[0], concepto: '', documento_tipo: '', documento_prefijo: '', documento_numero: '',
    tercero_tipo_documento: 'NIT', tercero_numero_documento: '', tercero_nombre: '', referencia_id: '', referencia_type: '',
    lineas: [
      { cuenta_contable_id: '', centro_costo_id: '', debito: 0, credito: 0, base_gravable: '', impuesto_tipo: '', impuesto_tarifa: '', descripcion: '' },
      { cuenta_contable_id: '', centro_costo_id: '', debito: 0, credito: 0, base_gravable: '', impuesto_tipo: '', impuesto_tarifa: '', descripcion: '' },
    ]
  })

  const [totales, setTotales] = useState({ debito: 0, credito: 0, diferencia: 0 })

  useEffect(() => {
    const debito = data.lineas.reduce((acc, curr) => acc + (parseFloat(curr.debito) || 0), 0)
    const credito = data.lineas.reduce((acc, curr) => acc + (parseFloat(curr.credito) || 0), 0)
    setTotales({ debito, credito, diferencia: Math.abs(debito - credito) })
  }, [data.lineas])

  const addLinea = () => { setData('lineas', [...data.lineas, { cuenta_contable_id: '', centro_costo_id: '', debito: 0, credito: 0, base_gravable: '', impuesto_tipo: '', impuesto_tarifa: '', descripcion: '' }]) }
  const removeLinea = (index) => { const n = [...data.lineas]; n.splice(index, 1); setData('lineas', n) }
  const updateLinea = (index, field, value) => { const n = [...data.lineas]; if (field === 'debito' && value > 0) n[index].credito = 0; if (field === 'credito' && value > 0) n[index].debito = 0; n[index][field] = value; setData('lineas', n) }

  const handleSubmit = (e) => { e.preventDefault(); post(route('accounting.asientos.store')) }
  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val)
  const isCuadrado = totales.diferencia < 0.01

  return (
    <AuthenticatedLayout>
      <Head title="Nuevo Asiento Contable" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('accounting.asientos.index')}><Button variant="outline" size="icon" type="button"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Registrar Asiento</h2>
              <p className="text-sm text-muted-foreground mt-1">Ingresa los datos para la nueva partida doble manual.</p>
            </div>
          </div>
          <Button type="submit" disabled={processing || !isCuadrado || data.lineas.length < 2}><Save className="h-4 w-4 mr-2" /> Contabilizar Asiento</Button>
        </div>
        {/* ... Full form content as shown in source file ... */}
      </form>
    </AuthenticatedLayout>
  )
}
```

### Libros/Index.tsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Libros/Index.tsx`
```tsx
import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { PageHeader } from '@/Components/ui/page-header'
import { EmptyState } from '@/Components/ui/empty-state'
import { BookOpen, BookText, Wallet, Receipt } from 'lucide-react'

const ICONOS: Record<string, typeof BookOpen> = { diario: BookOpen, mayor: BookText, caja: Wallet, ventas: Receipt }

export default function LibrosIndex({ libros }: { libros: Array<{ id: number; codigo: string; nombre: string; tipo: string; descripcion: string; is_sistema: boolean }> }) {
  return (
    <AuthenticatedLayout>
      <Head title="Libros Contables" />
      <PageHeader title="Libros Contables" description="Consulta los asientos registrados en cada libro del sistema." icon={BookOpen} />
      {libros.length === 0 ? (
        <div className="py-16"><EmptyState icon={BookOpen} title="Sin libros contables" description="Aún no se han creado libros contables. Se crearán automáticamente al activar el módulo de contabilidad." /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {libros.map((libro) => { const Icon = ICONOS[libro.tipo] || BookOpen; return (
            <a key={libro.id} href={route('accounting.libros.show', libro.id)} className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-2.5 text-indigo-600 dark:text-indigo-400"><Icon className="h-5 w-5" /></div>
                <Badge variant="outline" className="text-[10px] font-mono">{libro.codigo}</Badge>
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{libro.nombre}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{libro.descripcion}</p>
            </a>
          )})}
        </div>
      )}
    </AuthenticatedLayout>
  )
}
```

### Libros/Show.tsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Libros/Show.tsx`

*(230 lines — full content with DataTable, filters by fecha/cuenta, pagination, color-coded débito/crédito, module labels)*

### Periodos/Index.jsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Periodos/Index.jsx`

*(98 lines — cards grid, close/reopen with confirmation, estado badge, cerrado_at timestamp)*

### Reportes/Index.jsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Reportes/Index.jsx`

*(111 lines — balance de prueba, 7 metric cards, date filter, DataTable de saldos)*

### Reportes/Pyg.tsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Reportes/Pyg.tsx`

*(159 lines — Estado de Resultados, secciones Ingresos/Costos/Gastos, utilidad bruta y neta)*

### Reportes/Balance.tsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Reportes/Balance.tsx`

*(174 lines — Balance General, Activos/Pasivos/Patrimonio, ecuación contable warning)*

### Reportes/Auxiliar.tsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Reportes/Auxiliar.tsx`

*(158 lines — Libro Auxiliar, filtros por cuenta/tercero, saldo acumulado running)*

### Reportes/Terceros.tsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Reportes/Terceros.tsx`

*(109 lines — Balance por Terceros, saldos agrupados por cuenta + documento)*

### Reportes/LibroIva.tsx

**Ruta:** `resources/js/Pages/Modules/Accounting/Reportes/LibroIva.tsx`

*(167 lines — IVA generado vs descontable, saldo a pagar, detalle de retenciones)*

---

## Tests

### AsientoControllerTest

**Ruta:** `tests/Feature/Modules/Accounting/AsientoControllerTest.php`
```php
<?php

namespace Tests\Feature\Modules\Accounting;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\CuentaContable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AsientoControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::factory()->create();
        \DB::table('modules')->insertOrIgnore(['code' => 'accounting', 'name' => 'Contabilidad', 'class' => 'Accounting', 'version' => '1.0.0']);
        TenantModule::create(['tenant_id' => $this->tenant->id, 'module_code' => 'accounting', 'is_active' => true]);
        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id, 'is_superadmin' => true]);
        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    public function test_asiento_index_requires_auth(): void { /* ... */ }
    public function test_asiento_store_creates_balanced_entry(): void { /* ... */ }
    public function test_asiento_store_rejects_unbalanced(): void { /* ... */ }
    public function test_asiento_store_validates_account_exists(): void { /* ... */ }
}
```

### ContabilidadServiceTest

**Ruta:** `tests/Feature/Modules/Accounting/ContabilidadServiceTest.php`
```php
<?php

namespace Tests\Feature\Modules\Accounting;

use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\ContabilidadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContabilidadServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_no_permite_asiento_descuadrado(): void { /* ... */ }
    public function test_registra_asiento_cuadrado_correctamente(): void { /* ... */ }
}
```

### CierreAnualServiceTest

**Ruta:** `tests/Feature/Modules/Accounting/CierreAnualServiceTest.php`
```php
<?php

namespace Tests\Feature\Modules\Accounting;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\CierreAnualService;
use App\Modules\Accounting\Services\ContabilidadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CierreAnualServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_calcula_saldos_ingresos_gastos(): void { /* ... */ }
    public function test_construir_lineas_cierre_cuadra(): void { /* ... */ }
    public function test_construir_lineas_con_perdida(): void { /* ... */ }
    public function test_falla_sin_cuenta_3610(): void { /* ... */ }
    public function test_sin_movimientos_no_genera_saldos(): void { /* ... */ }
}
```

### CertificacionContabilidadTest

**Ruta:** `tests/Feature/Accounting/CertificacionContabilidadTest.php`
```php
<?php

namespace Tests\Feature\Accounting;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Core\Models\Tenant;
use App\Models\User;
use App\Core\Models\Configuracion;
use App\Modules\Accounting\Models\AsientoContable;
use App\Modules\Accounting\Services\RegimeProvisioner;
use App\Modules\Accounting\Services\PucSimplificadoProvisioner;

class CertificacionContabilidadTest extends TestCase
{
    use RefreshDatabase;

    public function test_regimen_simplificado_no_genera_iva_ni_retenciones(): void { /* ... */ }
    public function test_regimen_comun_genera_iva_y_retenciones(): void { /* ... */ }
    public function test_venta_a_credito_genera_cuenta_por_cobrar_y_asiento_clientes(): void { /* ... */ }
    public function test_facturar_orden_con_anticipo_reversa_cuenta_2815(): void { /* ... */ }
    public function test_anular_factura_reversa_todo(): void { /* ... */ }
}
```

---

## Correcciones pendientes

1. **CierreAnualController → Página faltante**: El controller renderiza `Modules/Accounting/CierreAnual/Index` pero no existe el archivo JSX/TSX. Crear `resources/js/Pages/Modules/Accounting/CierreAnual/Index.tsx`.

2. **CertificacionContabilidadTest usa propiedades inexistentes**: `$asiento->total_debitos` y `$asiento->total_creditos` no existen en el modelo `AsientoContable`. El modelo no tiene accessor `total_debitos`/`total_creditos`. Estas propiedades se calculan en el controller (via `$asiento->lineas->sum()`). El test debería calcular `$asiento->lineas->sum('debito')` y `$asiento->lineas->sum('credito')` directamente.

3. **AsientoLinea → `$guarded = []`**: `AsientoLinea` tiene `$guarded = []` (mass assignment ilimitado) y ademas `$fillable`. Esto es redundante y potencialmente inseguro — `$guarded = []` desactiva la protección de mass assignment, haciendo `$fillable` irrelevante. Debería quitarse `$guarded = []` y confiar solo en `$fillable`.

4. **ReporteController no filtra por `tenant_id`**: Los queries en `ReporteController::index()`, `auxiliar()`, `terceros()`, `pyg()`, `balance()`, `libroIva()` no aplican `where('tenant_id', ...)` explícito. Dependen del global scope `BelongsToTenant` en `AsientoLinea` y `CuentaContable`, pero el `join` cruza tablas sin garantizar que el tenant_id se propague correctamente en todos los paths. Verificar que el global scope de `AsientoLinea` se aplique tras los joins.

5. **`CuentaContable::create()` en CuentaController sin cast de `acepta_movimientos`**: El controller valida `acepta_movimientos` como `boolean` pero no hace cast explícito. Laravel lo maneja, pero es inconsistente con el modelo que sí cast-a `acepta_movimientos` a boolean.

6. **`RegimeProvisioner` no crea cuenta 3610**: El `CierreAnualService` requiere la cuenta `3610` (Utilidades Retenidas) para el cierre anual, pero ni `PucColombiaProvisioner` ni `PucSimplificadoProvisioner` la crean. El `CierreAnualServiceTest` la crea manualmente en setUp. Se necesita agregar `['3610', 'Utilidades Retenidas', 'patrimonio', 'credito', 2, true, false, false]` a ambos provisioners.

7. **`ContabilidadService::getCuenta()` usa función global `tenantId()`**: La función `tenantId()` debe estar disponible globalmente (via helper o Service Provider). Verificar que exista en `app/Core/` o que esté cargada vía composer autoload.

8. **Cierre anual dispatch `CerrarAnioContableJob` sin verificar existencia del Job**: `CierreAnualController::cerrar()` despacha `\App\Jobs\CerrarAnioContableJob` pero este archivo no se encontró en el módulo Accounting. Verificar que exista en `app/Jobs/`.

9. **Cuentas/Index.jsx usa import default de EmptyState en Periodos**: `Periodos/Index.jsx` importa `EmptyState` como default (`import EmptyState from ...`) mientras el resto de páginas usa named import (`import { EmptyState } from ...`). Verificar que el componente soporte ambos estilos o unificar a named export.

10. **Mix de JSX y TSX**: Algunas páginas son `.jsx` (Cuentas, Asientos/Create, Periodos, Reportes/Index) y otras `.tsx` (Asientos/Index, Libros, Reportes/Pyg+Balance+Auxiliar+Terceros+LibroIva). Migrar todo a `.tsx` con tipos estrictos según estándar del proyecto (TypeScript estricto obligatorio).
