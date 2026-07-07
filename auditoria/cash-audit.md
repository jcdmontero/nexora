# Auditoría: Cash (Caja)
> Actualizado: 2026-07-06 - juan

---

## module.json
**Ruta:** app/Modules/Cash/module.json
```json
{
    "code": "cash",
    "name": "Tesorería / Caja",
    "version": "2.0.0",
    "description": "Multicaja: apertura y cierre de turnos, arqueo con denominaciones, transferencias entre cajas, movimientos y reporte consolidado.",
    "icon": "Wallet",
    "core": false,
    "dependencies": ["sales", "accounting", "crm", "purchasing", "service-desk"],
    "permissions": [
        "cash:view",
        "cash:create",
        "cash:edit",
        "cash:close",
        "cash:manage",
        "cash:transfer",
        "cash:receipts"
    ],
    "menus": [
        {
            "section": "TESORERÍA",
            "icon": "Wallet",
            "items": [
                { "label": "Mi Turno", "route": "cash.caja.index", "permission": "cash:view" },
                { "label": "Cajas", "route": "cash.cajas.index", "permission": "cash:view" },
                { "label": "Movimientos", "route": "cash.movimientos.index", "permission": "cash:view" },
                { "label": "Recaudos", "route": "cash.recaudos.index", "permission": "accounting:view" },
                { "label": "Pago Proveedores", "route": "cash.pagos-proveedores.index", "permission": "accounting:view" },
                { "label": "Transferencias", "route": "cash.transferencias.index", "permission": "cash:transfer" },
                { "label": "Reporte Consolidado", "route": "cash.reporte.consolidado", "permission": "cash:view" }
            ]
        }
    ]
}
```

---

## CashServiceProvider
**Ruta:** app/Modules/Cash/Providers/CashServiceProvider.php
```php
<?php

namespace App\Modules\Cash\Providers;

use Illuminate\Support\ServiceProvider;

class CashServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');
    }
}
```

---

## Routes
**Ruta:** app/Modules/Cash/Routes/web.php
```php
<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Cash\Controllers\CajaController;
use App\Modules\Cash\Controllers\CajaAdminController;
use App\Modules\Cash\Controllers\MovimientoController;
use App\Modules\Cash\Controllers\ArqueoController;
use App\Modules\Cash\Controllers\TransferenciaController;
use App\Modules\Cash\Controllers\ReporteController;
use App\Modules\Cash\Controllers\ReciboController;
use App\Modules\Cash\Controllers\RecaudoController;
use App\Modules\Cash\Controllers\PagoProveedorController;

Route::middleware(['web', 'auth', 'tenant', 'module:cash'])->group(function () {
    Route::prefix('cash')->name('cash.')->group(function () {

        // ── Turnos de caja (apertura/cierre) — usados por POS y ServiceDesk ──
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('caja', [CajaController::class, 'index'])->name('caja.index');
            Route::get('caja/estado', [CajaController::class, 'estado'])->name('caja.estado');
        });
        Route::middleware('permission:cash:create')->group(function () {
            Route::post('caja/abrir', [CajaController::class, 'abrir'])->name('caja.abrir');
        });
        Route::middleware('permission:cash:close')->group(function () {
            Route::post('caja/{sesion}/cerrar', [CajaController::class, 'cerrar'])->name('caja.cerrar');
            Route::get('caja/{sesion}/arqueo', [ArqueoController::class, 'create'])->name('arqueo.create');
            Route::post('caja/{sesion}/arqueo', [ArqueoController::class, 'store'])->name('arqueo.store');
        });

        // ── Movimientos ──
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('movimientos', [MovimientoController::class, 'index'])->name('movimientos.index');
        });
        Route::middleware('permission:cash:create')->group(function () {
            Route::post('movimientos', [MovimientoController::class, 'store'])->name('movimientos.store');
        });

        // ── Administración de cajas (CRUD multicaja) ──
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('cajas', [CajaAdminController::class, 'index'])->name('cajas.index');
        });
        Route::middleware('permission:cash:manage')->group(function () {
            Route::post('cajas', [CajaAdminController::class, 'store'])->name('cajas.store');
            Route::put('cajas/{caja}', [CajaAdminController::class, 'update'])->name('cajas.update');
            Route::delete('cajas/{caja}', [CajaAdminController::class, 'destroy'])->name('cajas.destroy');
        });

        // ── Transferencias entre cajas ──
        Route::middleware('permission:cash:transfer')->group(function () {
            Route::get('transferencias', [TransferenciaController::class, 'index'])->name('transferencias.index');
            Route::post('transferencias', [TransferenciaController::class, 'store'])->name('transferencias.store');
        });

        // ── Reporte consolidado multicaja ──
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('reporte/consolidado', [ReporteController::class, 'consolidado'])->name('reporte.consolidado');
        });

        // ── Recibos de caja ──
        Route::middleware('permission:cash:receipts')->group(function () {
            Route::post('recibos', [ReciboController::class, 'store'])->name('recibos.store');
        });
        Route::middleware('permission:cash:view')->group(function () {
            Route::get('recibos/{recibo}', [ReciboController::class, 'show'])->name('recibos.show');
            Route::get('recibos/{recibo}/pdf', [ReciboController::class, 'pdf'])->name('recibos.pdf');
            Route::post('recibos/{recibo}/anular', [ReciboController::class, 'anular'])->name('recibos.anular')->middleware('permission:cash:receipts');
        });

        // ── Recaudos (Cartera / Cuentas por Cobrar) ──
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('recaudos', [RecaudoController::class, 'index'])->name('recaudos.index');
            Route::get('recaudos/cliente/{cliente}', [RecaudoController::class, 'pendientes'])->name('recaudos.pendientes');
        });
        Route::middleware('permission:cash:receipts')->group(function () {
            Route::post('recaudos/factura/{factura}/pagar', [RecaudoController::class, 'pagar'])->name('recaudos.pagar');
        });

        // ── Pagos a Proveedores (Cuentas por Pagar) ──
        Route::middleware('permission:accounting:view')->group(function () {
            Route::get('pagos-proveedores', [PagoProveedorController::class, 'index'])->name('pagos-proveedores.index');
            Route::get('pagos-proveedores/proveedor/{proveedor}', [PagoProveedorController::class, 'pendientes'])->name('pagos-proveedores.pendientes');
        });
        Route::middleware('permission:cash:receipts')->group(function () {
            Route::post('pagos-proveedores/cxp/{cxp}/pagar', [PagoProveedorController::class, 'pagar'])->name('pagos-proveedores.pagar');
        });

    });
});
```

---

## Controllers

### CajaController
**Ruta:** app/Modules/Cash/Controllers/CajaController.php
```php
<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Concerns\HasReciboLoader;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CajaController extends Controller
{
    use HasReciboLoader;
    public function __construct(private CajaService $cajaService)
    {
    }

    /**
     * Gestión de turnos: sesión activa del usuario, cajas disponibles e historial.
     */
    public function index(Request $request)
    {
        $sesionActiva = $this->cajaService->getSesionAbierta(auth()->id());

        $cajasDisponibles = [];
        if (!$sesionActiva) {
            $cajasDisponibles = $this->cajaService->cajasDisponibles()
                ->map(fn ($c) => ['id' => $c->id, 'nombre' => $c->nombre, 'sede' => $c->sede?->nombre])
                ->values();
        }

        $movimientos = [];
        if ($sesionActiva) {
            $movimientos = \App\Modules\Cash\Models\MovimientoCaja::where('sesion_id', $sesionActiva->id)
                ->orderByDesc('created_at')
                ->get();

            $reciboMap = $this->loadRecibosParaMovimientos($movimientos);

            $movimientos = $movimientos->map(fn ($m) => [
                    'id' => $m->id,
                    'tipo' => $m->tipo,
                    'monto' => (float) $m->monto,
                    'metodo_pago' => $m->metodo_pago,
                    'concepto' => $m->concepto,
                    'fecha' => $m->created_at->format('H:i'),
                    'referencia' => $m->referencia ? class_basename($m->referencia_type) : null,
                    'recibo_id' => $reciboMap[$m->referencia_type . '::' . $m->referencia_id . '::' . (float) $m->monto] ?? null,
                    'es_anulacion' => $m->es_anulacion,
                ]);

            // Forzar carga de totales para saldo_sistema
            $sesionActiva->load([]);
        }

        $historial = CajaSesion::with(['caja.sede', 'usuario'])
            ->orderBy('id', 'desc')
            ->paginate(10);

        return Inertia::render('Cash/Caja/Index', [
            'sesionActiva' => $sesionActiva,
            'cajasDisponibles' => $cajasDisponibles,
            'movimientos' => $movimientos,
            'historial' => $historial,
        ]);
    }

    public function abrir(Request $request)
    {
        $validated = $request->validate([
            'caja_id' => ['required', Rule::exists('cash_cajas', 'id')->where('tenant_id', app('current_tenant')->id)],
            'saldo_inicial' => 'required|numeric|min:0',
        ]);

        try {
            $this->cajaService->abrirCaja(
                auth()->id(),
                (int) $validated['caja_id'],
                (float) $validated['saldo_inicial'],
            );

            return back()->with('success', 'Turno de caja abierto correctamente.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function cerrar(Request $request, CajaSesion $sesion)
    {
        $validated = $request->validate([
            'saldo_final' => 'required|numeric|min:0',
            'notas' => 'nullable|string',
        ]);

        try {
            $sesion = $this->cajaService->cerrarSesion(
                $sesion,
                (float) $validated['saldo_final'],
                $validated['notas'] ?? null,
            );

            return back()->with(
                'success',
                'Turno de caja cerrado correctamente. Diferencia: $' . number_format((float) $sesion->diferencia, 2)
            );
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Estado de la caja para integraciones (POS, liquidación de órdenes, etc.).
     * Devuelve si hay sesión abierta y las cajas disponibles para abrir turno.
     */
    public function estado(Request $request)
    {
        if (!$request->user()->can('cash:view')) {
            abort(403);
        }

        $sesionActiva = $this->cajaService->getSesionAbierta(auth()->id());

        $cajasDisponibles = [];
        if (!$sesionActiva) {
            $cajasDisponibles = $this->cajaService->cajasDisponibles()
                ->map(fn ($c) => ['id' => $c->id, 'nombre' => $c->nombre])
                ->values();
        }

        return response()->json([
            'cajaAbierta' => $sesionActiva ? true : false,
            'cajasDisponibles' => $cajasDisponibles,
            'sesionActiva' => $sesionActiva,
        ]);
    }
}
```

### CajaAdminController
**Ruta:** app/Modules/Cash/Controllers/CajaAdminController.php
```php
<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\Caja;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CajaAdminController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $cajas = Caja::with(['sede', 'sesionActual.usuario'])
            ->when($search, function ($query, $search) {
                $query->where('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        $sedes = \App\Core\Models\Sede::orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('Cash/Cajas/Index', [
            'cajas' => $cajas,
            'sedes' => $sedes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'sede_id' => 'nullable|exists:core_sedes,id',
            'activa' => 'boolean',
        ]);

        // tenant_id lo autoasigna BelongsToTenant.
        Caja::create($validated);

        return back()->with('success', 'Caja creada correctamente.');
    }

    public function update(Request $request, Caja $caja)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'sede_id' => 'nullable|exists:core_sedes,id',
            'activa' => 'boolean',
        ]);

        $caja->update($validated);

        return back()->with('success', 'Caja actualizada correctamente.');
    }

    public function destroy(Caja $caja)
    {
        if ($caja->sesiones()->where('estado', 'abierta')->exists()) {
            return back()->with('error', 'No puedes eliminar una caja con un turno abierto.');
        }

        if ($caja->sesiones()->exists()) {
            // En lugar de borrar, se desactiva para preservar el histórico.
            $caja->update(['activa' => false]);
            return back()->with('success', 'La caja tiene historial y fue desactivada en lugar de eliminada.');
        }

        $caja->delete();

        return back()->with('success', 'Caja eliminada correctamente.');
    }
}
```

### MovimientoController
**Ruta:** app/Modules/Cash/Controllers/MovimientoController.php
```php
<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Concerns\HasReciboLoader;
use App\Modules\Cash\Models\MovimientoCaja;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MovimientoController extends Controller
{
    use HasReciboLoader;
    public function index(Request $request)
    {
        // BelongsToTenant aplica el scope automáticamente (no hace falta where tenant_id).
        $movimientos = MovimientoCaja::with(['sesion.caja', 'sesion.usuario'])
            ->orderBy('id', 'desc')
            ->paginate(20);

        $reciboMap = $this->loadRecibosParaMovimientos($movimientos->getCollection());

        $movimientos->through(fn ($m) => [
                'id' => $m->id,
                'tipo' => $m->tipo,
                'monto' => (float) $m->monto,
                'metodo_pago' => $m->metodo_pago,
                'concepto' => $m->concepto,
                'created_at' => $m->created_at,
                'sesion' => $m->sesion ? [
                    'caja' => ['nombre' => $m->sesion->caja?->nombre],
                    'usuario' => ['name' => $m->sesion->usuario?->name],
                ] : null,
                'recibo_id' => $reciboMap[$m->referencia_type . '::' . $m->referencia_id . '::' . (float) $m->monto] ?? null,
                'es_anulacion' => $m->es_anulacion,
            ]);

        return Inertia::render('Cash/Movimientos/Index', [
            'movimientos' => $movimientos,
        ]);
    }

    public function store(Request $request, CajaService $cajaService)
    {
        $validated = $request->validate([
            'tipo' => 'required|in:ingreso,egreso',
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|string|max:50',
            'concepto' => 'required|string|max:255',
        ]);

        $sesionActiva = $cajaService->getSesionAbierta(auth()->id());

        if (!$sesionActiva) {
            return back()->with('error', 'Debes abrir un turno de caja antes de registrar movimientos.');
        }

        $cajaService->registrarMovimiento(
            $sesionActiva,
            $validated['tipo'],
            (float) $validated['monto'],
            $validated['metodo_pago'],
            $validated['concepto'],
        );

        return back()->with('success', 'Movimiento registrado correctamente.');
    }
}
```

### ArqueoController
**Ruta:** app/Modules/Cash/Controllers/ArqueoController.php
```php
<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Models\Denominacion;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ArqueoController extends Controller
{
    public function __construct(private CajaService $cajaService)
    {
    }

    /**
     * Formulario de arqueo: muestra denominaciones y la sesión a arquear.
     */
    public function create(Request $request, CajaSesion $sesion)
    {
        $sesion->load(['caja', 'usuario']);
        $denominaciones = Denominacion::where('activo', true)
            ->orderBy('orden')
            ->get(['id', 'tipo', 'valor']);

        return Inertia::render('Cash/Arqueo', [
            'sesion' => $sesion,
            'denominaciones' => $denominaciones,
        ]);
    }

    /**
     * Persiste el arqueo (conteo por denominación) y marca la sesión como arqueada.
     */
    public function store(Request $request, CajaSesion $sesion, CajaService $cajaService)
    {
        $validated = $request->validate([
            'detalles' => 'required|array|min:1',
            'detalles.*.denominacion_id' => 'required|exists:cash_denominaciones,id',
            'detalles.*.cantidad' => 'required|integer|min:0',
            'observaciones' => 'nullable|string',
        ]);

        try {
            $arqueo = $cajaService->arquearSesion($sesion, $validated['detalles'], $validated['observaciones'] ?? null);

            return redirect()->route('cash.caja.index')
                ->with('success', 'Arqueo registrado. Diferencia: $' . number_format((float) $arqueo->diferencia, 2));
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
```

### TransferenciaController
**Ruta:** app/Modules/Cash/Controllers/TransferenciaController.php
```php
<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\Transferencia;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TransferenciaController extends Controller
{
    public function __construct(private CajaService $cajaService)
    {
    }

    public function index(Request $request)
    {
        $cajas = Caja::orderBy('nombre')->get(['id', 'nombre', 'activa']);

        $transferencias = Transferencia::with(['cajaOrigen', 'cajaDestino', 'usuario'])
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Cash/Transferencias/Index', [
            'cajas' => $cajas,
            'transferencias' => $transferencias,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'caja_origen_id' => ['required', Rule::exists('cash_cajas', 'id')->where('tenant_id', app('current_tenant')->id), 'different:caja_destino_id'],
            'caja_destino_id' => ['required', Rule::exists('cash_cajas', 'id')->where('tenant_id', app('current_tenant')->id)],
            'monto' => 'required|numeric|min:0.01',
            'concepto' => 'nullable|string|max:255',
        ]);

        try {
            $this->cajaService->transferirEntreCajas(
                (int) $validated['caja_origen_id'],
                (int) $validated['caja_destino_id'],
                (float) $validated['monto'],
                $validated['concepto'] ?? null,
            );

            return back()->with('success', 'Transferencia registrada correctamente.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
```

### ReciboController
**Ruta:** app/Modules/Cash/Controllers/ReciboController.php
```php
<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\ReciboCaja;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReciboController extends Controller
{
    public function __construct(
        private \App\Modules\Cash\Services\ReciboService $reciboService,
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'orden_id' => ['required', Rule::exists('sd_ordenes', 'id')->where('tenant_id', app('current_tenant')->id)],
            'monto' => ['required', 'numeric', 'min:0.01'],
            'metodo_pago' => ['required', 'in:efectivo,tarjeta,transferencia'],
            'notas' => ['nullable', 'string', 'max:500'],
        ]);

        $orden = OrdenReparacion::findOrFail($validated['orden_id']);

        try {
            $recibo = $this->reciboService->registrarAbono(
                $orden,
                (float) $validated['monto'],
                $validated['metodo_pago'],
                $validated['notas'] ?? null,
            );

            return redirect()->back()->with([
                'success' => 'Abono registrado. Recibo RC-' . str_pad($recibo->numero, 6, '0', STR_PAD_LEFT),
                'nuevo_recibo_id' => $recibo->id,
            ]);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function show(ReciboCaja $recibo)
    {
        $recibo->load(['sesion.caja', 'usuario', 'cliente', 'referencia']);

        return inertia('Cash/Recibos/Show', [
            'recibo' => [
                'id' => $recibo->id,
                'numero' => $recibo->numero_formateado,
                'fecha' => $recibo->fecha->format('Y-m-d H:i'),
                'monto' => (float) $recibo->monto,
                'metodo_pago' => $recibo->metodo_pago,
                'concepto' => $recibo->concepto,
                'estado' => $recibo->estado,
                'notas' => $recibo->notas,
                'usuario' => $recibo->usuario?->name,
                'caja' => $recibo->sesion?->caja?->nombre,
                'cliente' => $recibo->cliente ? [
                    'nombre' => $recibo->cliente->nombre_completo,
                    'documento' => $recibo->cliente->documento,
                ] : null,
                'referencia' => $recibo->referencia ? [
                    'tipo' => class_basename($recibo->referencia_type),
                    'numero' => $recibo->referencia->numero_orden ?? $recibo->referencia->numero ?? null,
                ] : null,
            ],
        ]);
    }

    public function pdf(ReciboCaja $recibo)
    {
        $recibo->load(['sesion.caja', 'usuario', 'cliente', 'referencia']);

        $empresa = app('current_tenant');

        $pdf = Pdf::loadView('cash.recibo-pdf', compact('recibo', 'empresa'))
            ->setPaper([0, 0, 226.77, 400], 'portrait');

        return $pdf->stream("recibo-{$recibo->numero_formateado}.pdf");
    }

    /**
     * Anula un recibo de abono: reversa caja, contabilidad y actualiza la OT.
     */
    public function anular(ReciboCaja $recibo)
    {
        if ($recibo->estado === 'anulado') {
            return back()->with('error', 'El recibo ya está anulado.');
        }

        try {
            $this->reciboService->anularRecibo($recibo);

            return back()->with(
                'success',
                'Recibo RC-' . str_pad($recibo->numero, 6, '0', STR_PAD_LEFT) . ' anulado. Caja y contabilidad reversados.'
            );
        } catch (\Exception $e) {
            return back()->with('error', 'Error al anular recibo: ' . $e->getMessage());
        }
    }
}
```

### RecaudoController
**Ruta:** app/Modules/Cash/Controllers/RecaudoController.php
```php
<?php

namespace App\Modules\Cash\Controllers;

use App\Modules\Accounting\Models\CuentaPorCobrar;
use App\Modules\Cash\Services\RecaudoService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Sales\Models\Factura;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class RecaudoController extends Controller
{
    public function __construct(
        private RecaudoService $recaudoService,
    ) {}

    /**
     * Muestra la lista de clientes con saldos pendientes.
     */
    public function index(Request $request)
    {
        $busqueda = $request->get('busqueda');

        $clientesConDeuda = Cliente::whereHas('cuentasPorCobrar', function ($q) {
            $q->where('estado', 'pendiente');
        })
            ->when($busqueda, fn ($q) => $q->where(function ($q) use ($busqueda) {
                $q->where('nombre_completo', 'ilike', "%{$busqueda}%")
                  ->orWhere('numero_documento', 'ilike', "%{$busqueda}%");
            }))
            ->with(['cuentasPorCobrar' => fn ($q) => $q->where('estado', 'pendiente')])
            ->orderBy('nombre_completo')
            ->paginate(20)
            ->through(function ($cliente) {
                $saldo = $cliente->cuentasPorCobrar->sum(fn ($c) => (float) $c->monto_total - (float) $c->monto_pagado);
                return [
                    'id' => $cliente->id,
                    'nombre_completo' => $cliente->nombre_completo,
                    'numero_documento' => $cliente->numero_documento,
                    'tipo_documento' => $cliente->tipo_documento,
                    'saldo_pendiente' => $saldo,
                ];
            });

        return Inertia::render('Modules/Cash/Recaudos/Index', [
            'clientes' => $clientesConDeuda,
            'filtros' => ['busqueda' => $busqueda],
        ]);
    }

    /**
     * Muestra las facturas pendientes de un cliente para seleccionar cuál pagar.
     */
    public function pendientes(Cliente $cliente)
    {
        $facturas = Factura::where('cliente_id', $cliente->id)
            ->whereIn('estado', ['pendiente'])
            ->with('cuentaPorCobrar')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($f) {
                $cxc = $f->cuentaPorCobrar;
                return [
                    'id' => $f->id,
                    'numero' => $f->numero,
                    'fecha' => $f->created_at->format('Y-m-d'),
                    'total' => (float) $f->total,
                    'saldo_pendiente' => $cxc ? max(0, (float) $cxc->monto_total - (float) $cxc->monto_pagado) : (float) $f->total,
                    'metodo_pago' => $f->metodo_pago,
                    'estado' => $f->estado,
                ];
            });

        return Inertia::render('Modules/Cash/Recaudos/Pendientes', [
            'cliente' => $cliente,
            'facturas' => $facturas,
        ]);
    }

    /**
     * Procesa el pago de una factura.
     */
    public function pagar(Request $request, Factura $factura)
    {
        $validated = $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia',
        ]);

        // Validar que la factura es válida para recaudo
        if (!in_array($factura->estado, ['pendiente'])) {
            return back()->withErrors(['error' => 'La factura no está pendiente de pago.']);
        }

        // Validar monto contra saldo
        $cxc = CuentaPorCobrar::where('documento_origen_type', Factura::class)
            ->where('documento_origen_id', $factura->id)
            ->first();

        $saldoPendiente = $cxc
            ? max(0, (float) $cxc->monto_total - (float) $cxc->monto_pagado)
            : (float) $factura->total;

        if ($validated['monto'] > $saldoPendiente) {
            return back()->withErrors(['monto' => "El monto no puede superar el saldo pendiente (\$" . number_format($saldoPendiente, 2) . ")."]);
        }

        try {
            $this->recaudoService->procesarRecaudo($factura, $validated['monto'], $validated['metodo_pago']);

            return redirect()->route('cash.recaudos.pendientes', $factura->cliente_id)
                ->with('success', 'Recaudo registrado correctamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
```

### PagoProveedorController
**Ruta:** app/Modules/Cash/Controllers/PagoProveedorController.php
```php
<?php

namespace App\Modules\Cash\Controllers;

use App\Modules\Accounting\Models\CuentaPorPagar;
use App\Modules\Cash\Services\PagoProveedorService;
use App\Modules\Purchasing\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class PagoProveedorController extends Controller
{
    public function __construct(
        private PagoProveedorService $pagoProveedorService,
    ) {}

    /**
     * Muestra la lista de proveedores con saldos pendientes.
     */
    public function index(Request $request)
    {
        $busqueda = $request->get('busqueda');

        $proveedoresConDeuda = Proveedor::whereHas('cuentasPorPagar', function ($q) {
            $q->where('estado', 'pendiente');
        })
            ->when($busqueda, fn ($q) => $q->where(function ($q) use ($busqueda) {
                $q->where('razon_social', 'ilike', "%{$busqueda}%")
                  ->orWhere('numero_documento', 'ilike', "%{$busqueda}%");
            }))
            ->with(['cuentasPorPagar' => fn ($q) => $q->where('estado', 'pendiente')])
            ->orderBy('razon_social')
            ->paginate(20)
            ->through(function ($proveedor) {
                $saldo = $proveedor->cuentasPorPagar->sum(fn ($c) => (float) $c->monto_total - (float) $c->monto_pagado);
                return [
                    'id' => $proveedor->id,
                    'razon_social' => $proveedor->razon_social,
                    'numero_documento' => $proveedor->numero_documento,
                    'tipo_documento' => $proveedor->tipo_documento,
                    'saldo_pendiente' => $saldo,
                ];
            });

        return Inertia::render('Modules/Cash/PagoProveedores/Index', [
            'proveedores' => $proveedoresConDeuda,
            'filtros' => ['busqueda' => $busqueda],
        ]);
    }

    /**
     * Muestra las CxP pendientes de un proveedor.
     */
    public function pendientes(Proveedor $proveedor)
    {
        $cxps = CuentaPorPagar::where('acreedor_type', Proveedor::class)
            ->where('acreedor_id', $proveedor->id)
            ->where('estado', 'pendiente')
            ->with('documentoOrigen')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($cxp) {
                $recepcion = $cxp->documentoOrigen;
                return [
                    'id' => $cxp->id,
                    'numero_recepcion' => $recepcion?->numero ?? "CXP #{$cxp->id}",
                    'fecha' => $cxp->created_at->format('Y-m-d'),
                    'monto_total' => (float) $cxp->monto_total,
                    'saldo_pendiente' => max(0, (float) $cxp->monto_total - (float) $cxp->monto_pagado),
                    'estado' => $cxp->estado,
                    'notas' => $cxp->notas,
                ];
            });

        return Inertia::render('Modules/Cash/PagoProveedores/Pendientes', [
            'proveedor' => $proveedor,
            'cxps' => $cxps,
        ]);
    }

    /**
     * Procesa el pago de una CxP.
     */
    public function pagar(Request $request, CuentaPorPagar $cxp)
    {
        $validated = $request->validate([
            'monto' => 'required|numeric|min:0.01',
            'metodo_pago' => 'required|in:efectivo,tarjeta,transferencia',
        ]);

        // Validar que la CxP está pendiente
        if ($cxp->estado !== 'pendiente') {
            return back()->withErrors(['error' => 'La cuenta por pagar no está pendiente.']);
        }

        // Validar monto contra saldo
        $saldoPendiente = max(0, (float) $cxp->monto_total - (float) $cxp->monto_pagado);

        if ($validated['monto'] > $saldoPendiente) {
            return back()->withErrors(['monto' => "El monto no puede superar el saldo pendiente (\$" . number_format($saldoPendiente, 2) . ")."]);
        }

        try {
            $this->pagoProveedorService->procesarPago($cxp, $validated['monto'], $validated['metodo_pago']);

            return redirect()->route('cash.pagos-proveedores.pendientes', $cxp->acreedor_id)
                ->with('success', 'Pago a proveedor registrado correctamente.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
```

### ReporteController
**Ruta:** app/Modules/Cash/Controllers/ReporteController.php
```php
<?php

namespace App\Modules\Cash\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Services\CajaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReporteController extends Controller
{
    public function __construct(private CajaService $cajaService)
    {
    }

    public function consolidado(Request $request)
    {
        $desde = $request->filled('desde') ? new \DateTime($request->input('desde')) : null;
        $hasta = $request->filled('hasta') ? new \DateTime($request->input('hasta')) : null;
        $sedeId = $request->filled('sede_id') ? (int) $request->input('sede_id') : null;

        $reporte = $this->cajaService->reporteConsolidado($desde, $hasta, $sedeId);
        $sedes = \App\Core\Models\Sede::orderBy('nombre')->get(['id', 'nombre']);

        return Inertia::render('Cash/Reporte/Index', [
            'reporte' => $reporte,
            'sedes' => $sedes,
            'filters' => $request->only(['desde', 'hasta', 'sede_id']),
        ]);
    }
}
```

---

## Models

### Caja
**Ruta:** app/Modules/Cash/Models/Caja.php
```php
<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Caja extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_cajas';

    protected $fillable = [
        'tenant_id',
        'sede_id',
        'nombre',
        'activa',
    ];

    protected $casts = [
        'activa' => 'boolean',
    ];

    public function sede(): BelongsTo
    {
        return $this->belongsTo(\App\Core\Models\Sede::class, 'sede_id');
    }

    public function sesiones(): HasMany
    {
        return $this->hasMany(CajaSesion::class, 'caja_id');
    }

    /**
     * Sesión de caja abierta actualmente en esta caja (si la hay).
     */
    public function sesionActual()
    {
        return $this->hasOne(CajaSesion::class, 'caja_id')
            ->where('estado', 'abierta')
            ->latestOfMany('fecha_apertura');
    }

    /**
     * Saldo actual en caja: suma del último cierre + movimientos de la sesión abierta.
     */
    public function getSaldoActualAttribute(): float
    {
        $sesion = $this->sesionActual;

        if (!$sesion) {
            return 0;
        }

        return (float) $sesion->saldo_inicial
            + (float) $sesion->ingresos_totales
            - (float) $sesion->egresos_totales;
    }
}
```

### CajaSesion
**Ruta:** app/Modules/Cash/Models/CajaSesion.php
```php
<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CajaSesion extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_caja_sesiones';

    protected $fillable = [
        'tenant_id',
        'caja_id',
        'user_id',
        'fecha_apertura',
        'saldo_inicial',
        'fecha_cierre',
        'saldo_final',
        'diferencia',
        'estado',
        'notas',
        'ingresos_totales',
        'egresos_totales',
        'observaciones_cierre',
        'arqueado',
    ];

    protected $casts = [
        'fecha_apertura' => 'datetime',
        'fecha_cierre' => 'datetime',
        'saldo_inicial' => 'decimal:2',
        'saldo_final' => 'decimal:2',
        'diferencia' => 'decimal:2',
        'ingresos_totales' => 'decimal:2',
        'egresos_totales' => 'decimal:2',
        'arqueado' => 'boolean',
    ];

    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoCaja::class, 'sesion_id');
    }

    public function arqueos(): HasMany
    {
        return $this->hasMany(Arqueo::class, 'sesion_id');
    }

    /**
     * Saldo esperado por el sistema: base inicial + ingresos - egresos.
     */
    public function getSaldoSistemaAttribute(): float
    {
        return (float) $this->saldo_inicial
            + (float) $this->ingresos_totales
            - (float) $this->egresos_totales;
    }
}
```

### MovimientoCaja
**Ruta:** app/Modules/Cash/Models/MovimientoCaja.php
```php
<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MovimientoCaja extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_movimientos';

    protected $fillable = [
        'tenant_id',
        'sesion_id',
        'tipo',
        'monto',
        'metodo_pago',
        'concepto',
        'referencia_type',
        'referencia_id',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_id');
    }

    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Si el movimiento es de reversión de anulación, lo identifica.
     */
    public function getEsAnulacionAttribute(): bool
    {
        return str_starts_with($this->concepto, 'Anulación recibo RC-');
    }

    /**
     * ID de recibo anulado en caso de movimiento de reversión.
     */
    public function getReciboAnuladoIdAttribute(): ?int
    {
        if (!$this->es_anulacion) return null;

        preg_match('/RC-(\d+)/', $this->concepto, $matches);
        if (empty($matches[1])) return null;

        return (int) $matches[1];
    }
}
```

### ReciboCaja
**Ruta:** app/Modules/Cash/Models/ReciboCaja.php
```php
<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ReciboCaja extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_recibos';

    protected $fillable = [
        'tenant_id',
        'numero',
        'fecha',
        'sesion_id',
        'user_id',
        'cliente_id',
        'referencia_type',
        'referencia_id',
        'concepto',
        'monto',
        'metodo_pago',
        'estado',
        'notas',
    ];

    protected $casts = [
        'fecha' => 'datetime',
        'monto' => 'decimal:2',
    ];

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function referencia(): MorphTo
    {
        return $this->morphTo();
    }

    public function getNumeroFormateadoAttribute(): string
    {
        return 'RC-' . str_pad($this->numero, 6, '0', STR_PAD_LEFT);
    }
}
```

### Arqueo
**Ruta:** app/Modules/Cash/Models/Arqueo.php
```php
<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Arqueo extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_arqueos';

    protected $fillable = [
        'tenant_id',
        'sesion_id',
        'user_id',
        'total_sistema',
        'total_contado',
        'diferencia',
        'observaciones',
    ];

    protected $casts = [
        'total_sistema' => 'decimal:2',
        'total_contado' => 'decimal:2',
        'diferencia' => 'decimal:2',
    ];

    public function sesion(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(ArqueoDetalle::class, 'arqueo_id');
    }
}
```

### ArqueoDetalle
**Ruta:** app/Modules/Cash/Models/ArqueoDetalle.php
```php
<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArqueoDetalle extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_arqueo_detalles';

    protected $fillable = [
        'tenant_id',
        'arqueo_id',
        'denominacion_id',
        'cantidad',
        'subtotal',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'subtotal' => 'decimal:2',
    ];

    public function arqueo(): BelongsTo
    {
        return $this->belongsTo(Arqueo::class, 'arqueo_id');
    }

    public function denominacion(): BelongsTo
    {
        return $this->belongsTo(Denominacion::class, 'denominacion_id');
    }
}
```

### Denominacion
**Ruta:** app/Modules/Cash/Models/Denominacion.php
```php
<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;

class Denominacion extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_denominaciones';

    protected $fillable = [
        'tenant_id',
        'tipo',
        'valor',
        'orden',
        'activo',
    ];

    protected $casts = [
        'valor' => 'decimal:2',
        'orden' => 'integer',
        'activo' => 'boolean',
    ];
}
```

### Transferencia
**Ruta:** app/Modules/Cash/Models/Transferencia.php
```php
<?php

namespace App\Modules\Cash\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transferencia extends Model
{
    use BelongsToTenant, Auditable;

    protected $table = 'cash_transferencias';

    protected $fillable = [
        'tenant_id',
        'caja_origen_id',
        'caja_destino_id',
        'sesion_origen_id',
        'sesion_destino_id',
        'user_id',
        'monto',
        'concepto',
        'estado',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    public function cajaOrigen(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_origen_id');
    }

    public function cajaDestino(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_destino_id');
    }

    public function sesionOrigen(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_origen_id');
    }

    public function sesionDestino(): BelongsTo
    {
        return $this->belongsTo(CajaSesion::class, 'sesion_destino_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
```

---

## Concerns

### HasReciboLoader
**Ruta:** app/Modules/Cash/Concerns/HasReciboLoader.php
```php
<?php

namespace App\Modules\Cash\Concerns;

use App\Modules\Cash\Models\ReciboCaja;

trait HasReciboLoader
{
    /**
     * Carga en una sola consulta los recibos asociados a una colección
     * de movimientos de caja, eliminando el N+1.
     *
     * @param  \Illuminate\Support\Collection<int, \App\Modules\Cash\Models\MovimientoCaja>  $movimientos
     * @return array<string, int>  mapa "type::id::monto" => recibo_id
     */
    private function loadRecibosParaMovimientos(\Illuminate\Support\Collection $movimientos): array
    {
        $pares = $movimientos->filter(fn ($m) => $m->referencia_type && $m->referencia_id)
            ->map(fn ($m) => [
                'type' => $m->referencia_type,
                'id' => $m->referencia_id,
                'monto' => (float) $m->monto,
            ])
            ->unique()
            ->values();

        if ($pares->isEmpty()) {
            return [];
        }

        $recibos = ReciboCaja::where('estado', 'activo')
            ->where('concepto', 'like', 'Abono OT%')
            ->where(function ($q) use ($pares) {
                foreach ($pares as $i => $par) {
                    $method = $i === 0 ? 'where' : 'orWhere';
                    $q->{$method}(function ($q) use ($par) {
                        $q->where('referencia_type', $par['type'])
                          ->where('referencia_id', $par['id'])
                          ->where('monto', $par['monto']);
                    });
                }
            })
            ->get();

        $map = [];
        foreach ($recibos as $r) {
            $map[$r->referencia_type . '::' . $r->referencia_id . '::' . (float) $r->monto] = $r->id;
        }

        return $map;
    }
}
```

---

## Services

### CajaService
**Ruta:** app/Modules/Cash/Services/CajaService.php
```php
<?php

namespace App\Modules\Cash\Services;

use App\Core\Concerns\BelongsToTenant;
use App\Modules\Cash\Models\Arqueo;
use App\Modules\Cash\Models\ArqueoDetalle;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Models\Denominacion;
use App\Modules\Cash\Models\MovimientoCaja;
use App\Modules\Cash\Models\Transferencia;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class CajaService
{
    /**
     * Lista las cajas activas disponibles para abrir turno.
     */
    public function cajasDisponibles(): \Illuminate\Database\Eloquent\Collection
    {
        return Caja::where('activa', true)->orderBy('nombre')->get();
    }

    /**
     * Sesión de caja abierta para el usuario (regla: 1 sesión por usuario).
     */
    public function getSesionAbierta($userId): ?CajaSesion
    {
        return CajaSesion::where('user_id', $userId)
            ->where('estado', 'abierta')
            ->with('caja')
            ->first();
    }

    /**
     * Abre una nueva sesión de caja en la caja indicada.
     *
     * @throws \Exception si el usuario ya tiene un turno abierto o la caja está ocupada.
     */
    public function abrirCaja(int $userId, int $cajaId, float $saldoInicial, ?string $notas = null): CajaSesion
    {
        return DB::transaction(function () use ($userId, $cajaId, $saldoInicial, $notas) {
            // Regla multicaja: un usuario solo puede tener UN turno abierto.
            if ($this->getSesionAbierta($userId)) {
                throw new \Exception('El usuario ya tiene una caja abierta.');
            }

            $caja = Caja::where('activa', true)->findOrFail($cajaId);

            // La caja no puede tener dos sesiones abiertas simultáneas.
            if (CajaSesion::where('caja_id', $cajaId)->where('estado', 'abierta')->exists()) {
                throw new \Exception('Esta caja ya tiene un turno abierto por otro usuario.');
            }

            return CajaSesion::create([
                'caja_id' => $cajaId,
                'user_id' => $userId,
                'fecha_apertura' => now(),
                'saldo_inicial' => $saldoInicial,
                'estado' => 'abierta',
                'notas' => $notas,
                'ingresos_totales' => 0,
                'egresos_totales' => 0,
            ]);
        });
    }

    /**
     * Registra un movimiento en la sesión y actualiza los totales de la sesión.
     *
     * @param CajaSesion  $sesion
     * @param string      $tipo        'ingreso' | 'egreso'
     * @param float       $monto
     * @param string      $metodoPago  efectivo | tarjeta | transferencia
     * @param string      $concepto
     * @param object|null $referencia  Modelo polimórfico (Factura, OrdenReparacion, ...)
     */
    public function registrarMovimiento(CajaSesion $sesion, string $tipo, float $monto, string $metodoPago, string $concepto, $referencia = null): MovimientoCaja
    {
        if ($sesion->estado !== 'abierta') {
            throw new \Exception('No se puede registrar movimientos en una caja cerrada.');
        }

        if ($monto <= 0) {
            throw new \Exception('El monto del movimiento debe ser mayor a cero.');
        }

        if (!in_array($tipo, ['ingreso', 'egreso'])) {
            throw new \Exception('El tipo de movimiento debe ser "ingreso" o "egreso".');
        }

        return DB::transaction(function () use ($sesion, $tipo, $monto, $metodoPago, $concepto, $referencia) {
            $movimiento = MovimientoCaja::create([
                'tenant_id' => $sesion->tenant_id,
                'sesion_id' => $sesion->id,
                'tipo' => $tipo,
                'monto' => $monto,
                'metodo_pago' => $metodoPago,
                'concepto' => $concepto,
                'referencia_type' => $referencia ? get_class($referencia) : null,
                'referencia_id' => $referencia ? $referencia->id : null,
            ]);

            // Mantener totales de la sesión sincronizados para el cuadre.
            if ($tipo === 'ingreso') {
                $sesion->increment('ingresos_totales', $monto);
            } else {
                $sesion->increment('egresos_totales', $monto);
            }

            return $movimiento;
        });
    }

    /**
     * Cierra una sesión de caja calculando la diferencia contra el saldo del sistema.
     */
    public function cerrarSesion(CajaSesion $sesion, float $saldoFinal, ?string $observaciones = null): CajaSesion
    {
        if ($sesion->estado === 'cerrada') {
            throw new \Exception('La caja ya está cerrada.');
        }

        $saldoSistema = $sesion->saldo_sistema;
        $diferencia = round($saldoFinal - $saldoSistema, 2);

        $sesion->update([
            'fecha_cierre' => now(),
            'saldo_final' => $saldoFinal,
            'diferencia' => $diferencia,
            'estado' => 'cerrada',
            'observaciones_cierre' => $observaciones,
        ]);

        return $sesion;
    }

    /**
     * Realiza el arqueo (conteo físico) de una sesión y persiste el detalle.
     *
     * @param array $detalles  [['denominacion_id' => int, 'cantidad' => int], ...]
     */
    public function arquearSesion(CajaSesion $sesion, array $detalles, ?string $observaciones = null): Arqueo
    {
        return DB::transaction(function () use ($sesion, $detalles, $observaciones) {
            $denominaciones = Denominacion::whereIn('id', collect($detalles)->pluck('denominacion_id'))
                ->get()
                ->keyBy('id');

            $totalContado = 0;
            $filas = [];

            foreach ($detalles as $d) {
                $denom = $denominaciones->get($d['denominacion_id']);
                if (!$denom) {
                    continue;
                }
                $cantidad = (int) ($d['cantidad'] ?? 0);
                $subtotal = round((float) $denom->valor * $cantidad, 2);
                $totalContado += $subtotal;
                $filas[] = [
                    'denominacion_id' => $denom->id,
                    'cantidad' => $cantidad,
                    'subtotal' => $subtotal,
                ];
            }

            $totalSistema = (float) $sesion->saldo_sistema;

            $arqueo = Arqueo::create([
                'sesion_id' => $sesion->id,
                'user_id' => auth()->id(),
                'total_sistema' => $totalSistema,
                'total_contado' => $totalContado,
                'diferencia' => round($totalContado - $totalSistema, 2),
                'observaciones' => $observaciones,
            ]);

            foreach ($filas as $fila) {
                $fila['arqueo_id'] = $arqueo->id;
                ArqueoDetalle::create($fila);
            }

            $sesion->update(['arqueado' => true]);

            return $arqueo;
        });
    }

    /**
     * Transfiere efectivo entre dos cajas. Requiere sesión abierta en el origen;
     * si el destino también tiene sesión abierta, se registra el ingreso.
     */
    public function transferirEntreCajas(int $cajaOrigenId, int $cajaDestinoId, float $monto, ?string $concepto = null): Transferencia
    {
        if ($cajaOrigenId === $cajaDestinoId) {
            throw new \Exception('La caja de origen y destino deben ser distintas.');
        }
        if ($monto <= 0) {
            throw new \Exception('El monto a transferir debe ser mayor a cero.');
        }

        return DB::transaction(function () use ($cajaOrigenId, $cajaDestinoId, $monto, $concepto) {
            $sesionOrigen = CajaSesion::where('caja_id', $cajaOrigenId)
                ->where('estado', 'abierta')
                ->first();

            if (!$sesionOrigen) {
                throw new \Exception('No hay un turno abierto en la caja de origen.');
            }

            $sesionDestino = CajaSesion::where('caja_id', $cajaDestinoId)
                ->where('estado', 'abierta')
                ->first();

            // Verificar que ambas cajas pertenezcan al mismo tenant
            if ($sesionDestino && $sesionOrigen->tenant_id !== $sesionDestino->tenant_id) {
                throw new \Exception('No se pueden transferir fondos entre cajas de diferentes empresas.');
            }

            if (!$sesionDestino) {
                throw new \Exception('La caja de destino no tiene un turno abierto. Abre un turno en la caja destino antes de transferir.');
            }

            // Egreso en la caja origen.
            $this->registrarMovimiento(
                $sesionOrigen,
                'egreso',
                $monto,
                'efectivo',
                'Transferencia a caja destino: ' . ($concepto ?? 'Traslado de efectivo'),
            );

            // Ingreso en la caja destino.
            $this->registrarMovimiento(
                $sesionDestino,
                'ingreso',
                $monto,
                'efectivo',
                'Transferencia recibida de otra caja: ' . ($concepto ?? 'Traslado de efectivo'),
            );

            return Transferencia::create([
                'caja_origen_id' => $cajaOrigenId,
                'caja_destino_id' => $cajaDestinoId,
                'sesion_origen_id' => $sesionOrigen->id,
                'sesion_destino_id' => $sesionDestino?->id,
                'user_id' => auth()->id(),
                'monto' => $monto,
                'concepto' => $concepto,
                'estado' => 'completada',
            ]);
        });
    }

    /**
     * Reporte consolidado de cajas: totales de ingresos/egresos/saldo por caja
     * en un rango de fechas.
     */
    public function reporteConsolidado(?\DateTimeInterface $desde = null, ?\DateTimeInterface $hasta = null, ?int $sedeId = null): array
    {
        $desde ??= now()->startOfMonth();
        $hasta ??= now()->endOfDay();

        $query = Caja::with(['sesionActual.usuario', 'sede'])
            ->withCount([
                'sesiones as sesiones_periodo' => fn (Builder $q) => $q
                    ->whereBetween('fecha_apertura', [$desde, $hasta]),
            ]);

        if ($sedeId) {
            $query->where('sede_id', $sedeId);
        }

        $cajas = $query->orderBy('nombre')->get()->map(function (Caja $caja) use ($desde, $hasta) {
            $sesiones = $caja->sesiones()
                ->whereBetween('fecha_apertura', [$desde, $hasta])
                ->get();

            return [
                'id' => $caja->id,
                'nombre' => $caja->nombre,
                'sede' => $caja->sede?->nombre,
                'activa' => $caja->activa,
                'sesiones_periodo' => $sesiones->count(),
                'ingresos' => (float) $sesiones->sum('ingresos_totales'),
                'egresos' => (float) $sesiones->sum('egresos_totales'),
                'saldo_actual' => $caja->saldo_actual,
                'cajero_actual' => $caja->sesionActual?->usuario?->name,
            ];
        });

        return [
            'desde' => $desde->format('Y-m-d'),
            'hasta' => $hasta->format('Y-m-d'),
            'cajas' => $cajas->values()->all(),
            'totales' => [
                'ingresos' => (float) $cajas->sum('ingresos'),
                'egresos' => (float) $cajas->sum('egresos'),
                'saldo_actual' => (float) $cajas->sum('saldo_actual'),
            ],
        ];
    }
}
```

### ReciboService
**Ruta:** app/Modules/Cash/Services/ReciboService.php
```php
<?php

namespace App\Modules\Cash\Services;

use App\Modules\Accounting\Services\ContabilidadConfig;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Cash\Models\ReciboCaja;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReciboService
{
    public function __construct(
        private CajaService $cajaService,
    ) {}

    /**
     * Registra un abono para una OT: crea movimiento de caja + recibo + actualiza OT + contabilidad.
     *
     * @throws \Exception si no hay caja abierta o el monto es inválido.
     */
    public function registrarAbono(
        OrdenReparacion $orden,
        float $monto,
        string $metodoPago = 'efectivo',
        ?string $notas = null,
    ): ReciboCaja {
        if ($monto <= 0) {
            throw new \Exception('El monto del abono debe ser mayor a cero.');
        }

        $sesion = $this->cajaService->getSesionAbierta(auth()->id());
        if (!$sesion) {
            throw new \Exception('No tienes una caja abierta. Abre una caja antes de registrar el abono.');
        }

        return DB::transaction(function () use ($orden, $monto, $metodoPago, $notas, $sesion) {
            // 1. Registrar movimiento de caja (ingreso)
            $this->cajaService->registrarMovimiento(
                $sesion,
                'ingreso',
                $monto,
                $metodoPago,
                "Abono OT {$orden->numero_orden} — {$orden->cliente?->nombre_completo}",
                $orden,
            );

            // 2. Generar número secuencial de recibo
            $numero = $this->siguienteNumero();

            // 3. Crear recibo de caja
            $recibo = ReciboCaja::create([
                'tenant_id' => $orden->tenant_id,
                'numero' => $numero,
                'fecha' => now(),
                'sesion_id' => $sesion->id,
                'user_id' => auth()->id(),
                'cliente_id' => $orden->cliente_id,
                'referencia_type' => get_class($orden),
                'referencia_id' => $orden->id,
                'concepto' => "Abono OT {$orden->numero_orden} — " . ($orden->modelo?->nombre ?? $orden->tipo_equipo_manual),
                'monto' => $monto,
                'metodo_pago' => $metodoPago,
                'estado' => 'activo',
                'notas' => $notas,
            ]);

            // 4. Actualizar abono_inicial en la OT
            $totalAbonos = ReciboCaja::where('referencia_type', get_class($orden))
                ->where('referencia_id', $orden->id)
                ->where('estado', 'activo')
                ->sum('monto');

            $orden->update(['abono_inicial' => $totalAbonos]);

            // 5. Registrar asiento contable: Caja (D) / Anticipos de clientes (C)
            $this->registrarContabilidadAbono($recibo, $orden, $metodoPago);

            return $recibo;
        });
    }

    /**
     * Anula un recibo de caja (no elimina, marca como anulado) + reverso contable.
     */
    public function anularRecibo(ReciboCaja $recibo): ReciboCaja
    {
        if ($recibo->estado === 'anulado') {
            throw new \Exception('El recibo ya está anulado.');
        }

        return DB::transaction(function () use ($recibo) {
            $recibo->update(['estado' => 'anulado']);

            // 1. Crear egreso en caja para reversar
            $this->cajaService->registrarMovimiento(
                $recibo->sesion,
                'egreso',
                (float) $recibo->monto,
                $recibo->metodo_pago,
                "Anulación recibo RC-" . str_pad($recibo->numero, 6, '0', STR_PAD_LEFT),
                $recibo->referencia,
            );

            // 2. Reversar asiento contable
            $this->revertirContabilidadAbono($recibo);

            // 3. Actualizar abono_inicial en la OT
            if ($recibo->referencia_type && $recibo->referencia_id) {
                $orden = $recibo->referencia;
                if ($orden) {
                    $totalAbonos = ReciboCaja::where('referencia_type', $recibo->referencia_type)
                        ->where('referencia_id', $recibo->referencia_id)
                        ->where('estado', 'activo')
                        ->sum('monto');
                    $orden->update(['abono_inicial' => $totalAbonos]);
                }
            }

            return $recibo;
        });
    }

    /**
     * Asiento contable del abono:
     * Débito:  Caja (110505) o Bancos (111005) — según método de pago
     * Crédito: Anticipos de clientes (2815)
     */
    private function registrarContabilidadAbono(ReciboCaja $recibo, OrdenReparacion $orden, string $metodoPago): void
    {
        if (!class_exists(ContabilidadService::class)) {
            return;
        }

        $contabilidadService = app(ContabilidadService::class);
        $tenantId = $orden->tenant_id;

        // Determinar cuenta de débito según método de pago
        $cuentaDebito = ContabilidadConfig::cuentaPorMetodoPago($metodoPago, 'simplificado', $tenantId);

        $cuentaDebitoModel = $contabilidadService->getCuenta($cuentaDebito);
        $cuentaCreditoModel = $contabilidadService->getCuenta(ContabilidadConfig::anticipos($tenantId)); // Anticipos de clientes

        if (!$cuentaDebitoModel || !$cuentaCreditoModel) {
            return;
        }

        $lineas = [
            [
                'cuenta_contable_id' => $cuentaDebitoModel->id,
                'descripcion' => "Abono OT {$orden->numero_orden}",
                'debito' => (float) $recibo->monto,
                'credito' => 0,
            ],
            [
                'cuenta_contable_id' => $cuentaCreditoModel->id,
                'descripcion' => "Abono OT {$orden->numero_orden}",
                'debito' => 0,
                'credito' => (float) $recibo->monto,
            ],
        ];

        try {
            $contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => "Abono OT {$orden->numero_orden} — RC-" . str_pad($recibo->numero, 6, '0', STR_PAD_LEFT),
                'modulo_origen' => 'service-desk',
                'documento_tipo' => 'RC',
                'documento_numero' => $recibo->numero,
                'referencia_type' => ReciboCaja::class,
                'referencia_id' => $recibo->id,
            ], $lineas);
        } catch (\Exception $e) {
            Log::error("No se pudo registrar asiento contable para abono RC-{$recibo->numero}: {$e->getMessage()}");
            throw $e;
        }
    }

    /**
     * Reverso del asiento contable del abono (al anular recibo).
     */
    private function revertirContabilidadAbono(ReciboCaja $recibo): void
    {
        if (!class_exists(ContabilidadService::class)) {
            return;
        }

        $contabilidadService = app(ContabilidadService::class);

        try {
            $contabilidadService->revertirAsiento(
                'service-desk',
                ReciboCaja::class,
                $recibo->id,
                "Anulación RC-" . str_pad($recibo->numero, 6, '0', STR_PAD_LEFT)
            );
        } catch (\Exception $e) {
            Log::warning("No se pudo reversar asiento contable para RC-{$recibo->numero}: {$e->getMessage()}");
        }
    }

    private function siguienteNumero(): string
    {
        $prefijo = now()->format('Ymd');
        $ultimo = ReciboCaja::where('numero', 'like', "{$prefijo}-%")
            ->orderByDesc('numero')
            ->value('numero');

        if ($ultimo) {
            $consecutivo = (int) substr($ultimo, -3) + 1;
        } else {
            $consecutivo = 1;
        }

        return $prefijo . '-' . str_pad($consecutivo, 3, '0', STR_PAD_LEFT);
    }
}
```

### RecaudoService
**Ruta:** app/Modules/Cash/Services/RecaudoService.php
```php
<?php

namespace App\Modules\Cash\Services;

use App\Modules\Accounting\Models\CuentaPorCobrar;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\ContabilidadConfig;
use App\Modules\Accounting\Services\ContabilidadService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Sales\Models\Factura;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecaudoService
{
    public function __construct(
        private CajaService $cajaService,
        private ContabilidadService $contabilidadService,
    ) {}

    /**
     * Procesa un recaudo de cartera.
     *
     * @param Factura $factura Factura a crédito que se está pagando
     * @param float $monto Monto a recaudar
     * @param string $metodoPago efectivo|tarjeta|transferencia
     */
    public function procesarRecaudo(Factura $factura, float $monto, string $metodoPago = 'efectivo'): void
    {
        if ($monto <= 0) {
            throw new \Exception('El monto del recaudo debe ser mayor a cero.');
        }

        $sesion = $this->cajaService->getSesionAbierta(auth()->id());
        if (!$sesion) {
            throw new \Exception('Debes tener un turno de caja abierto para registrar recaudos.');
        }

        $cliente = $factura->cliente;
        if (!$cliente) {
            throw new \Exception('La factura no tiene un cliente asociado.');
        }

        DB::transaction(function () use ($factura, $cliente, $monto, $metodoPago, $sesion) {
            // 1. Registrar ingreso en caja
            $this->cajaService->registrarMovimiento(
                $sesion,
                'ingreso',
                $monto,
                $metodoPago,
                "Recaudo Factura {$factura->numero} — {$cliente->nombre_completo}",
                $factura,
            );

            // 2. Actualizar Cuenta por Cobrar
            $this->actualizarCuentaPorCobrar($factura, $monto);

            // 3. Registrar asiento contable: Caja (D) / Clientes (C)
            $this->registrarAsientoRecaudo($factura, $cliente, $monto, $metodoPago);
        });
    }

    /**
     * Actualiza el monto pagado y estado de la CxC.
     */
    private function actualizarCuentaPorCobrar(Factura $factura, float $monto): void
    {
        $cxc = CuentaPorCobrar::where('documento_origen_type', Factura::class)
            ->where('documento_origen_id', $factura->id)
            ->where('estado', 'pendiente')
            ->first();

        if (!$cxc) {
            Log::warning("No se encontró CxC pendiente para factura {$factura->numero}");
            return;
        }

        $nuevoPagado = (float) $cxc->monto_pagado + $monto;
        $nuevoEstado = $nuevoPagado >= (float) $cxc->monto_total ? 'pagado' : 'pendiente';

        $cxc->update([
            'monto_pagado' => $nuevoPagado,
            'estado' => $nuevoEstado,
        ]);

        // Si se pagó totalmente, actualizar estado de la factura
        if ($nuevoEstado === 'pagado') {
            $factura->update(['estado' => 'pagada']);
        }
    }

    /**
     * Registra el asiento contable: Caja/Bancos (D) / Clientes (C)
     */
    private function registrarAsientoRecaudo(Factura $factura, Cliente $cliente, float $monto, string $metodoPago): void
    {
        if (!class_exists(ContabilidadService::class)) {
            return;
        }

        $regimen = $this->determinarRegimen($factura->tenant_id);

        // Cuenta de débito según método de pago
        $codigoDebito = ContabilidadConfig::cuentaPorMetodoPago($metodoPago, $regimen, $factura->tenant_id);

        $cuentaDebito = $this->contabilidadService->getCuenta($codigoDebito);
        $cuentaClientes = $this->contabilidadService->getCuenta(ContabilidadConfig::clientes($factura->tenant_id));

        if (!$cuentaDebito || !$cuentaClientes) {
            Log::warning("No se pudo registrar asiento de recaudo: cuentas {$codigoDebito} o clientes no existen.");
            return;
        }

        $lineas = [
            [
                'cuenta_contable_id' => $cuentaDebito->id,
                'descripcion' => "Recaudo {$factura->numero}",
                'debito' => $monto,
                'credito' => 0,
            ],
            [
                'cuenta_contable_id' => $cuentaClientes->id,
                'descripcion' => "Pago {$factura->numero}",
                'debito' => 0,
                'credito' => $monto,
                'tercero_tipo_documento' => $cliente->tipo_documento ?? null,
                'tercero_numero_documento' => $cliente->numero_documento ?? null,
                'tercero_nombre' => $cliente->nombre_completo ?? null,
            ],
        ];

        try {
            $this->contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => "Recaudo Factura {$factura->numero} — {$cliente->nombre_completo}",
                'modulo_origen' => 'cash',
                'documento_tipo' => 'REC',
                'documento_numero' => $factura->numero,
                'tercero_tipo_documento' => $cliente->tipo_documento ?? null,
                'tercero_numero_documento' => $cliente->numero_documento ?? null,
                'tercero_nombre' => $cliente->nombre_completo ?? null,
                'referencia_type' => Factura::class,
                'referencia_id' => $factura->id,
            ], $lineas);
        } catch (\Exception $e) {
            Log::error("No se pudo registrar asiento de recaudo {$factura->numero}: {$e->getMessage()}");
            throw $e;
        }
    }

    private function determinarRegimen(int $tenantId): string
    {
        return \App\Core\Models\Configuracion::get('regimen_fiscal', 'simplificado', $tenantId);
    }
}
```

### PagoProveedorService
**Ruta:** app/Modules/Cash/Services/PagoProveedorService.php
```php
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
            Log::error("No se pudo registrar asiento de pago proveedor: {$e->getMessage()}");
            throw $e;
        }
    }

    private function determinarRegimen(int $tenantId): string
    {
        return \App\Core\Models\Configuracion::get('regimen_fiscal', 'simplificado', $tenantId);
    }
}
```

### CashProvisioner
**Ruta:** app/Modules/Cash/Services/CashProvisioner.php
```php
<?php

namespace App\Modules\Cash\Services;

use App\Core\Models\Tenant;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\Denominacion;

/**
 * Siembra los datos iniciales del módulo Cash para un tenant:
 *  - Denominaciones estándar de la moneda colombiana (billetes y monedas).
 *  - Una caja principal por defecto para que el tenant pueda operar de inmediato.
 *
 * Idempotente: usa firstOrCreate para no duplicar al re-activar el módulo.
 */
class CashProvisioner
{
    /**
     * Denominaciones de la moneda colombiana (COP) en orden descendente.
     * 'tipo' = billete | moneda.
     */
    private const DENOMINACIONES_COP = [
        ['tipo' => 'billete', 'valor' => 100000],
        ['tipo' => 'billete', 'valor' => 50000],
        ['tipo' => 'billete', 'valor' => 20000],
        ['tipo' => 'billete', 'valor' => 10000],
        ['tipo' => 'billete', 'valor' => 5000],
        ['tipo' => 'moneda',  'valor' => 2000],
        ['tipo' => 'moneda',  'valor' => 1000],
        ['tipo' => 'moneda',  'valor' => 500],
        ['tipo' => 'moneda',  'valor' => 200],
        ['tipo' => 'moneda',  'valor' => 100],
    ];

    public function provisionForTenant(Tenant $tenant): void
    {
        $tenantId = $tenant->id;

        // ─── Denominaciones COP ───
        foreach (self::DENOMINACIONES_COP as $orden => $denom) {
            Denominacion::updateOrCreate(
                ['tenant_id' => $tenantId, 'valor' => $denom['valor']],
                [
                    'tipo' => $denom['tipo'],
                    'orden' => $orden,
                    'activo' => true,
                ]
            );
        }

        // ─── Caja principal por defecto ───
        // Garantiza que el tenant tenga al menos una caja activa para abrir turnos.
        Caja::firstOrCreate(
            ['tenant_id' => $tenantId, 'nombre' => 'Caja Principal'],
            ['activa' => true]
        );
    }
}
```

---

## Migrations

### 2026_06_20_140000_create_cash_tables
**Ruta:** app/Modules/Cash/Migrations/2026_06_20_140000_create_cash_tables.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_cajas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sede_id')->nullable()->constrained('core_sedes')->nullOnDelete();
            $table->string('nombre', 100);
            $table->boolean('activa')->default(true);
            $table->timestamps();
            
            $table->index(['tenant_id', 'sede_id']);
        });

        Schema::create('cash_caja_sesiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('caja_id')->constrained('cash_cajas')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // El cajero
            $table->timestamp('fecha_apertura')->useCurrent();
            $table->decimal('saldo_inicial', 15, 2)->default(0);
            $table->timestamp('fecha_cierre')->nullable();
            $table->decimal('saldo_final', 15, 2)->nullable();
            $table->decimal('diferencia', 15, 2)->nullable(); // Faltante o sobrante
            $table->string('estado', 20)->default('abierta'); // abierta, cerrada
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'caja_id', 'estado']);
        });

        Schema::create('cash_movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sesion_id')->constrained('cash_caja_sesiones')->cascadeOnDelete();
            $table->string('tipo', 20); // ingreso, egreso
            $table->decimal('monto', 15, 2);
            $table->string('metodo_pago', 50)->default('efectivo'); // efectivo, tarjeta, transferencia
            $table->string('concepto', 255);
            $table->nullableMorphs('referencia'); // Por si se asocia a una Factura (sales_facturas)
            $table->timestamps();

            $table->index(['tenant_id', 'sesion_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_movimientos');
        Schema::dropIfExists('cash_caja_sesiones');
        Schema::dropIfExists('cash_cajas');
    }
};
```

### 2026_06_24_100000_extend_cash_multicaja
**Ruta:** app/Modules/Cash/Migrations/2026_06_24_100000_extend_cash_multicaja.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Extiende el módulo Cash a multicaja completo:
     * - Totales de ingreso/egreso por sesión para cuadre automático.
     * - Catálogo de denominaciones (billetes/monedas) por tenant.
     * - Arqueo de caja con detalle por denominación.
     * - Transferencias entre cajas.
     */
    public function up(): void
    {
        // 1. Extender sesiones con totales para el cuadre y datos de cierre/arqueo.
        Schema::table('cash_caja_sesiones', function (Blueprint $table) {
            if (!Schema::hasColumn('cash_caja_sesiones', 'ingresos_totales')) {
                $table->decimal('ingresos_totales', 15, 2)->default(0)->after('saldo_inicial');
            }
            if (!Schema::hasColumn('cash_caja_sesiones', 'egresos_totales')) {
                $table->decimal('egresos_totales', 15, 2)->default(0)->after('ingresos_totales');
            }
            if (!Schema::hasColumn('cash_caja_sesiones', 'observaciones_cierre')) {
                $table->text('observaciones_cierre')->nullable()->after('notas');
            }
            if (!Schema::hasColumn('cash_caja_sesiones', 'arqueado')) {
                $table->boolean('arqueado')->default(false)->after('observaciones_cierre');
            }
            if (!Schema::hasColumn('cash_caja_sesiones', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // 2. Catálogo de denominaciones (billetes y monedas) por tenant.
        Schema::create('cash_denominaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('tipo', 10); // billete | moneda
            $table->decimal('valor', 15, 2);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'orden']);
            $table->unique(['tenant_id', 'valor']);
        });

        // 3. Arqueos de caja (conteo físico al cerrar turno).
        Schema::create('cash_arqueos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sesion_id')->constrained('cash_caja_sesiones')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // quien arquea
            $table->decimal('total_sistema', 15, 2)->default(0);  // saldo esperado
            $table->decimal('total_contado', 15, 2)->default(0);  // conteo físico
            $table->decimal('diferencia', 15, 2)->default(0);     // contado - sistema
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'sesion_id']);
        });

        // 4. Detalle del arqueo: cantidad contada por denominación.
        Schema::create('cash_arqueo_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('arqueo_id')->constrained('cash_arqueos')->cascadeOnDelete();
            $table->foreignId('denominacion_id')->constrained('cash_denominaciones')->cascadeOnDelete();
            $table->unsignedInteger('cantidad')->default(0);
            $table->decimal('subtotal', 15, 2)->default(0); // cantidad * valor
            $table->timestamps();

            $table->unique(['arqueo_id', 'denominacion_id']);
        });

        // 5. Transferencias entre cajas (traslado de efectivo).
        Schema::create('cash_transferencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('caja_origen_id')->constrained('cash_cajas')->cascadeOnDelete();
            $table->foreignId('caja_destino_id')->constrained('cash_cajas')->cascadeOnDelete();
            $table->foreignId('sesion_origen_id')->nullable()->constrained('cash_caja_sesiones')->nullOnDelete();
            $table->foreignId('sesion_destino_id')->nullable()->constrained('cash_caja_sesiones')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // quien transfiere
            $table->decimal('monto', 15, 2);
            $table->string('concepto', 255)->nullable();
            $table->string('estado', 20)->default('completada'); // completada | anulada
            $table->timestamps();

            $table->index(['tenant_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_transferencias');
        Schema::dropIfExists('cash_arqueo_detalles');
        Schema::dropIfExists('cash_arqueos');
        Schema::dropIfExists('cash_denominaciones');

        Schema::table('cash_caja_sesiones', function (Blueprint $table) {
            foreach (['arqueado', 'observaciones_cierre', 'egresos_totales', 'ingresos_totales'] as $col) {
                if (Schema::hasColumn('cash_caja_sesiones', $col)) {
                    $table->dropColumn($col);
                }
            }
            // No eliminamos tenant_id por seguridad (podría estar referenciado).
        });
    }
};
```

### 2026_06_24_200000_add_tenant_id_to_arqueo_detalles
**Ruta:** app/Modules/Cash/Migrations/2026_06_24_200000_add_tenant_id_to_arqueo_detalles.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cash_arqueo_detalles', function (Blueprint $table) {
            if (!Schema::hasColumn('cash_arqueo_detalles', 'tenant_id')) {
                $table->foreignId('tenant_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
        });

        // Poblar tenant_id desde el arqueo padre para filas existentes
        DB::statement('
            UPDATE cash_arqueo_detalles
            SET tenant_id = (
                SELECT tenant_id FROM cash_arqueos WHERE cash_arqueos.id = cash_arqueo_detalles.arqueo_id
            )
            WHERE tenant_id IS NULL
        ');
    }

    public function down(): void
    {
        Schema::table('cash_arqueo_detalles', function (Blueprint $table) {
            if (Schema::hasColumn('cash_arqueo_detalles', 'tenant_id')) {
                $table->dropForeign(['tenant_id']);
                $table->dropColumn('tenant_id');
            }
        });
    }
};
```

---

## Frontend (React/JSX)

### Caja/Index.jsx
**Ruta:** resources/js/Pages/Cash/Caja/Index.jsx
```jsx
import { useState } from 'react'
import { router, useForm, Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Pagination } from '@/Components/ui/pagination'
import { PageHeader } from '@/Components/ui/page-header'
import { Wallet, LockOpen, Lock, Calculator, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Printer } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

export default function CajaIndex({ sesionActiva, cajasDisponibles, movimientos = [], historial }) {
  const { can } = usePermissions()
  
  const { data: openData, setData: setOpenData, post: postOpen, processing: opening, errors: openErrors } = useForm({
    caja_id: cajasDisponibles.length > 0 ? cajasDisponibles[0].id.toString() : '',
    saldo_inicial: '0.00',
  })

  const { data: closeData, setData: setCloseData, post: postClose, processing: closing, errors: closeErrors } = useForm({
    saldo_final: '',
    notas: '',
  })

  const handleOpen = (e) => {
    e.preventDefault()
    postOpen(route('cash.caja.abrir'), { preserveScroll: true })
  }

  const handleClose = (e) => {
    e.preventDefault()
    if (confirm('¿Estás seguro de cerrar la caja? Este turno no podrá reabrirse.')) {
      postClose(route('cash.caja.cerrar', sesionActiva.id), { preserveScroll: true })
    }
  }

  const handlePageChange = (page) => {
    router.get(route('cash.caja.index'), { page }, { preserveState: true, preserveScroll: true })
  }

  const columns = [
    { 
      key: 'caja.nombre', 
      header: 'Caja', 
      cell: (s) => (
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{s.caja.nombre}</p>
          {s.caja.sede && <p className="text-xs text-muted-foreground">{s.caja.sede.nombre}</p>}
        </div>
      )
    },
    { key: 'usuario.name', header: 'Cajero', cell: (s) => s.usuario?.name ?? '—' },
    { 
      key: 'fecha_apertura', 
      header: 'Apertura', 
      cell: (s) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{new Date(s.fecha_apertura).toLocaleDateString()}</p>
          <p className="text-muted-foreground">{new Date(s.fecha_apertura).toLocaleTimeString()}</p>
        </div>
      ) 
    },
    { key: 'saldo_inicial', header: 'Apertura ($)', cell: (s) => `$${Number(s.saldo_inicial).toLocaleString()}` },
    { 
      key: 'fecha_cierre', 
      header: 'Cierre', 
      cell: (s) => s.fecha_cierre ? (
        <div className="text-xs">
          <p className="font-medium text-foreground">{new Date(s.fecha_cierre).toLocaleDateString()}</p>
          <p className="text-muted-foreground">{new Date(s.fecha_cierre).toLocaleTimeString()}</p>
        </div>
      ) : <span className="text-muted-foreground text-xs">—</span>
    },
    { key: 'saldo_final', header: 'Cierre ($)', cell: (s) => s.saldo_final ? `$${Number(s.saldo_final).toLocaleString()}` : <span className="text-muted-foreground">—</span> },
    { 
      key: 'estado', 
      header: 'Estado', 
      cell: (s) => (
        <Badge variant={s.estado === 'abierta' ? 'default' : 'outline'} className={s.estado === 'abierta' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
          {s.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
        </Badge>
      ) 
    },
    {
      key: 'arqueado',
      header: 'Arqueo',
      cell: (s) => s.arqueado ? (
        <Badge variant="secondary" className="gap-1 text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> Arqueada
        </Badge>
      ) : s.estado === 'cerrada' ? (
        <Badge variant="outline" className="text-amber-600 border-amber-200 dark:border-amber-900/50">
          Pendiente
        </Badge>
      ) : <span className="text-muted-foreground text-xs">—</span>
    },
    {
      key: 'acciones',
      header: 'Acciones',
      alignEnd: true,
      cell: (s) => {
        if (s.estado === 'cerrada' && !s.arqueado && can('cash:close')) {
          return (
            <Link
              href={route('cash.arqueo.create', s.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold shadow-sm transition-colors hover:bg-muted text-foreground"
            >
              <Calculator className="h-3.5 w-3.5" />
              Arquear
            </Link>
          )
        }
        return null
      }
    }
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Turno de Caja" />
      
      <PageHeader
        title="Turno de Caja"
        description="Gestiona tus turnos de caja, aperturas, cierres y arqueos de efectivo."
        icon={Wallet}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Activo / Apertura */}
        <div className="lg:col-span-1">
          {!sesionActiva ? (
            <Card className="shadow-sm border-border">
              <CardHeader className="bg-indigo-50/20 dark:bg-indigo-950/10 border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-base">
                  <LockOpen className="h-4.5 w-4.5" /> Abrir Turno
                </CardTitle>
                <CardDescription>Inicia tu turno de caja para registrar transacciones y movimientos.</CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                {cajasDisponibles.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-6">
                    No hay cajas disponibles en este momento.
                  </div>
                ) : (
                  <form onSubmit={handleOpen} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Caja Registradora</Label>
                      <Select value={openData.caja_id} onValueChange={(val) => setOpenData('caja_id', val)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cajasDisponibles.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.nombre} {c.sede ? `— ${c.sede}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {openErrors.caja_id && <p className="text-xs text-destructive">{openErrors.caja_id}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Saldo Inicial en Efectivo ($)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        value={openData.saldo_inicial}
                        onChange={e => setOpenData('saldo_inicial', e.target.value)}
                        placeholder="0.00"
                        className="font-medium"
                      />
                      {openErrors.saldo_inicial && <p className="text-xs text-destructive">{openErrors.saldo_inicial}</p>}
                    </div>

                    <Button type="submit" disabled={opening} className="w-full">
                      {opening ? 'Abriendo...' : 'Abrir Caja'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm border-border border-emerald-100 dark:border-emerald-950">
              <CardHeader className="bg-emerald-50/20 dark:bg-emerald-950/10 border-b pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-base">
                    <Lock className="h-4.5 w-4.5" /> Turno Activo
                  </CardTitle>
                  <Badge className="bg-emerald-500 hover:bg-emerald-600">{sesionActiva.caja.nombre}</Badge>
                </div>
                <CardDescription>
                  Iniciado el: {new Date(sesionActiva.fecha_apertura).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Saldo Inicial</span>
                  <span className="font-mono font-semibold text-foreground">
                    ${Number(sesionActiva.saldo_inicial).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Ingresos</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    + ${Number(sesionActiva.ingresos_totales || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm text-muted-foreground">Egresos</span>
                  <span className="font-mono font-semibold text-rose-600">
                    − ${Number(sesionActiva.egresos_totales || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b-2 border-border">
                  <span className="text-sm font-bold text-foreground">Saldo Total</span>
                  <span className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    ${(Number(sesionActiva.saldo_inicial || 0) + Number(sesionActiva.ingresos_totales || 0) - Number(sesionActiva.egresos_totales || 0)).toLocaleString()}
                  </span>
                </div>
                
                <form onSubmit={handleClose} className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      Efectivo en Caja (Cierre) <span className="text-destructive">*</span>
                    </Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={closeData.saldo_final}
                      onChange={e => setCloseData('saldo_final', e.target.value)}
                      placeholder="Ingresa el dinero físico contado..."
                      className="font-medium"
                    />
                    {closeErrors.saldo_final && <p className="text-xs text-destructive">{closeErrors.saldo_final}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Observaciones de Cierre</Label>
                    <textarea
                      value={closeData.notas}
                      onChange={e => setCloseData('notas', e.target.value)}
                      placeholder="Anota cualquier novedad, faltantes o sobrantes..."
                      className="w-full min-h-[60px] rounded-lg border border-input bg-background p-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <Button type="submit" variant="destructive" disabled={closing} className="w-full">
                    {closing ? 'Cerrando...' : 'Cerrar Turno de Caja'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Historial General */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-border h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Historial de Sesiones</CardTitle>
              <CardDescription>Registro de aperturas, cierres y arqueos de todas las cajas</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
              {historial.data.length > 0 ? (
                <>
                  <div className="border-t border-border/60">
                    <DataTable columns={columns} data={historial.data} />
                  </div>
                  <Pagination 
                    page={historial.current_page} 
                    totalPages={historial.last_page} 
                    onPage={handlePageChange} 
                  />
                </>
              ) : (
                <div className="py-12 border-t">
                  <EmptyState 
                    icon={Wallet}
                    title="Sin Historial"
                    description="No se han registrado aperturas de caja todavía."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Movimientos de la sesión activa */}
      {sesionActiva && movimientos.length > 0 && (
        <div className="mt-6">
          <Card className="shadow-sm border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Movimientos del Turno</CardTitle>
                  <CardDescription>
                    Ingresos y egresos registrados — {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600 font-semibold">
                    + ${movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0).toLocaleString()}
                  </span>
                  <span className="text-rose-600 font-semibold">
                    − ${movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + m.monto, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {movimientos.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <div className={`shrink-0 rounded-full p-1.5 ${m.tipo === 'ingreso' ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'bg-rose-100 dark:bg-rose-950/30'}`}>
                      {m.tipo === 'ingreso' ? (
                        <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowUpCircle className="h-4 w-4 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.concepto}</p>
                      <p className="text-xs text-muted-foreground">{m.fecha} · {m.metodo_pago}{m.referencia ? ` · ${m.referencia}` : ''}</p>
                    </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold tabular-nums ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {m.tipo === 'ingreso' ? '+' : '−'} ${m.monto.toLocaleString()}
                        </span>
                        {m.recibo_id && (
                          <a
                            href={route('cash.recibos.pdf', m.recibo_id)}
                            target="_blank"
                            title="Imprimir ticket de abono"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
```

### Cajas/Index.jsx
**Ruta:** resources/js/Pages/Cash/Cajas/Index.jsx
```jsx
import { useState } from 'react'
import { useForm, router, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/Components/ui/dialog'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { ListToolbar } from '@/Components/ui/list-toolbar'
import { Pagination } from '@/Components/ui/pagination'
import { Wallet, Plus, Pencil, Trash2 } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

export default function CajasIndex({ cajas, sedes, filters }) {
  const { can } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchVal, setSearchVal] = useState(filters.search || '')

  const { data, setData, post, put, processing, errors, reset } = useForm({
    nombre: '',
    sede_id: '',
    activa: true,
  })

  function openCreate() {
    reset()
    setEditingId(null)
    setIsModalOpen(true)
  }

  function openEdit(caja) {
    setEditingId(caja.id)
    setData({
      nombre: caja.nombre,
      sede_id: caja.sede_id ? caja.sede_id.toString() : '',
      activa: caja.activa,
    })
    setIsModalOpen(true)
  }

  function submit(e) {
    e.preventDefault()
    const payload = {
      nombre: data.nombre,
      sede_id: data.sede_id || null,
      activa: data.activa,
    }
    const onSuccess = () => {
      setIsModalOpen(false)
      reset()
    }
    if (editingId) {
      put(route('cash.cajas.update', editingId), { 
        data: payload, 
        onSuccess, 
        preserveScroll: true 
      })
    } else {
      post(route('cash.cajas.store'), { 
        data: payload, 
        onSuccess, 
        preserveScroll: true 
      })
    }
  }

  function eliminar(caja) {
    if (confirm(`¿Eliminar la caja "${caja.nombre}"? Si tiene historial se desactivará.`)) {
      router.delete(route('cash.cajas.destroy', caja.id), { preserveScroll: true })
    }
  }

  const handleSearch = (value) => {
    setSearchVal(value)
    router.get(route('cash.cajas.index'), { search: value }, { 
      preserveState: true, 
      preserveScroll: true,
      replace: true 
    })
  }

  const handlePageChange = (page) => {
    router.get(route('cash.cajas.index'), { page, search: searchVal }, { 
      preserveState: true, 
      preserveScroll: true 
    })
  }

  const columns = [
    { 
      key: 'nombre', 
      header: 'Caja', 
      cell: (c) => <span className="font-semibold text-foreground">{c.nombre}</span> 
    },
    { key: 'sede.nombre', header: 'Sede', cell: (c) => c.sede?.nombre ?? <span className="text-muted-foreground text-xs">—</span> },
    { 
      key: 'sesion_actual.usuario.name', 
      header: 'En uso por', 
      cell: (c) => c.sesion_actual?.usuario?.name ? (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50">
          {c.sesion_actual.usuario.name}
        </Badge>
      ) : <Badge variant="secondary">Libre</Badge>
    },
    { 
      key: 'activa', 
      header: 'Estado', 
      cell: (c) => (
        <Badge variant={c.activa ? 'default' : 'outline'}>
          {c.activa ? 'Activa' : 'Inactiva'}
        </Badge>
      ) 
    },
    { 
      key: 'acciones', 
      header: 'Acciones', 
      alignEnd: true, 
      cell: (c) => (
        <div className="flex justify-end gap-1">
          {can('cash:manage') && (
            <Button variant="ghost" size="icon" onClick={() => openEdit(c)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {can('cash:manage') && (
            <Button variant="ghost" size="icon" onClick={() => eliminar(c)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) 
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Administración de Cajas" />
      
      <PageHeader
        title="Administración de Cajas"
        description="Gestiona las cajas de tu negocio, asigna sedes y controla su disponibilidad."
        icon={Wallet}
        actions={
          can('cash:manage') && (
            <Button onClick={openCreate} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="h-4 w-4" /> Nueva Caja
            </Button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        <div className="p-4">
          <ListToolbar
            search={searchVal}
            onSearch={handleSearch}
            placeholder="Buscar caja por nombre..."
            total={cajas.total}
          />
        </div>

        {cajas.data.length > 0 ? (
          <>
            <div className="border-t border-border/60">
              <DataTable columns={columns} data={cajas.data} rowKey={(c) => c.id} />
            </div>
            <Pagination 
              page={cajas.current_page} 
              totalPages={cajas.last_page} 
              onPage={handlePageChange} 
            />
          </>
        ) : (
          <div className="py-12 border-t">
            <EmptyState
              icon={Wallet}
              title="Sin cajas registradas"
              description="Crea tu primera caja registradora para empezar a registrar turnos y movimientos."
              action={can('cash:manage') ? { label: 'Crear primera caja', onClick: openCreate } : undefined}
            />
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Caja' : 'Nueva Caja'}</DialogTitle>
              <DialogDescription>
                Define los detalles de la caja registradora.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Nombre de la Caja <span className="text-destructive">*</span></Label>
                <Input
                  value={data.nombre}
                  onChange={(e) => setData('nombre', e.target.value)}
                  placeholder="Ej. Caja Principal, Caja Taller..."
                />
                {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Sede / Sucursal</Label>
                <Select value={data.sede_id || '__none__'} onValueChange={(v) => setData('sede_id', v === '__none__' ? '' : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin sede específica (Global)</SelectItem>
                    {sedes.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sede_id && <p className="text-xs text-destructive">{errors.sede_id}</p>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="activa"
                  type="checkbox"
                  checked={data.activa}
                  onChange={(e) => setData('activa', e.target.checked)}
                  className="rounded border-input text-primary h-4 w-4"
                />
                <Label htmlFor="activa" className="cursor-pointer text-xs font-semibold">
                  Caja activa (disponible para iniciar turnos)
                </Label>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={processing}>{editingId ? 'Guardar' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
```

### Movimientos/Index.jsx
**Ruta:** resources/js/Pages/Cash/Movimientos/Index.jsx
```jsx
import { useState } from 'react'
import { router, useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/Components/ui/dialog'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { Pagination } from '@/Components/ui/pagination'
import { ArrowLeftRight, Plus, ArrowDownRight, ArrowUpRight, Coins, Wallet, CreditCard, Printer } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

export default function MovimientosIndex({ movimientos }) {
  const { can } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data, setData, post, processing, errors, reset } = useForm({
    tipo: 'egreso',
    monto: '',
    metodo_pago: 'efectivo',
    concepto: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('cash.movimientos.store'), {
      onSuccess: () => {
        setIsModalOpen(false)
        reset()
      },
      preserveScroll: true
    })
  }

  const handlePageChange = (page) => {
    router.get(route('cash.movimientos.index'), { page }, { preserveState: true, preserveScroll: true })
  }

  const columns = [
    { 
      key: 'created_at', 
      header: 'Fecha', 
      cell: (m) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
          <p className="text-muted-foreground">{new Date(m.created_at).toLocaleTimeString()}</p>
        </div>
      ) 
    },
    { 
      key: 'tipo', 
      header: 'Tipo', 
      cell: (m) => m.tipo === 'ingreso' ? (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50 gap-1">
          <ArrowUpRight className="h-3 w-3" /> Ingreso
        </Badge>
      ) : (
        <Badge variant="outline" className="text-rose-600 border-rose-200 dark:border-rose-900/50 dark:text-rose-400 gap-1 bg-rose-50/20">
          <ArrowDownRight className="h-3 w-3" /> Egreso
        </Badge>
      )
    },
    { 
      key: 'concepto', 
      header: 'Concepto', 
      cell: (m) => <span className="font-medium text-foreground">{m.concepto}</span>
    },
    { 
      key: 'metodo_pago', 
      header: 'Medio de Pago', 
      cell: (m) => (
        <div className="flex items-center gap-1.5 capitalize text-xs">
          {m.metodo_pago === 'efectivo' ? (
            <Coins className="h-3.5 w-3.5 text-amber-600" />
          ) : m.metodo_pago === 'tarjeta' ? (
            <CreditCard className="h-3.5 w-3.5 text-blue-600" />
          ) : (
            <Wallet className="h-3.5 w-3.5 text-purple-600" />
          )}
          <span>{m.metodo_pago}</span>
        </div>
      )
    },
    { 
      key: 'monto', 
      header: 'Monto ($)', 
      cell: (m) => (
        <span className={`font-mono font-semibold ${m.tipo === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {m.tipo === 'ingreso' ? '+' : '-'}${Number(m.monto).toLocaleString()}
        </span>
      ) 
    },
    { 
      key: 'sesion.usuario.name', 
      header: 'Caja / Cajero', 
      cell: (m) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{m.sesion?.caja?.nombre || '—'}</p>
          <p className="text-muted-foreground">{m.sesion?.usuario?.name || '—'}</p>
        </div>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      alignEnd: true,
      cell: (m) => {
        if (m.recibo_id) {
          return (
            <a
              href={route('cash.recibos.pdf', m.recibo_id)}
              target="_blank"
              title="Imprimir ticket de abono"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <Printer className="h-3.5 w-3.5" />
              Ticket
            </a>
          )
        }
        return null
      }
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Movimientos de Caja" />
      
      <PageHeader
        title="Movimientos de Caja"
        description="Historial detallado de todas las entradas y salidas de dinero en efectivo u otros medios de pago."
        icon={ArrowLeftRight}
        actions={
          can('cash:create') && (
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="h-4 w-4" /> Registrar Movimiento
            </Button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        {movimientos.data.length > 0 ? (
          <>
            <div className="border-t border-border/60 first:border-t-0">
              <DataTable columns={columns} data={movimientos.data} />
            </div>
            <Pagination 
              page={movimientos.current_page} 
              totalPages={movimientos.last_page} 
              onPage={handlePageChange} 
            />
          </>
        ) : (
          <div className="py-12">
            <EmptyState 
              icon={ArrowLeftRight}
              title="Sin movimientos"
              description="No se han registrado transacciones o movimientos manuales aún."
              action={can('cash:create') ? { label: 'Registrar movimiento', onClick: () => setIsModalOpen(true) } : undefined}
            />
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Registrar Movimiento en Caja</DialogTitle>
              <DialogDescription>
                Agrega un ingreso o egreso manual a tu turno de caja activo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Tipo de Movimiento</Label>
                  <Select value={data.tipo} onValueChange={v => setData('tipo', v)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">Ingreso (+)</SelectItem>
                      <SelectItem value="egreso">Egreso (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Monto ($) <span className="text-destructive">*</span></Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    value={data.monto} 
                    onChange={e => setData('monto', e.target.value)} 
                    placeholder="0.00"
                    className="font-medium"
                  />
                  {errors.monto && <p className="text-xs text-destructive">{errors.monto}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Método de Pago</Label>
                <Select value={data.metodo_pago} onValueChange={v => setData('metodo_pago', v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Concepto / Detalle <span className="text-destructive">*</span></Label>
                <Input 
                  value={data.concepto} 
                  onChange={e => setData('concepto', e.target.value)} 
                  placeholder="Ej. Pago a proveedor de agua, recaudo..." 
                />
                {errors.concepto && <p className="text-xs text-destructive">{errors.concepto}</p>}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={processing}>Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
```

### Arqueo.jsx
**Ruta:** resources/js/Pages/Cash/Arqueo.jsx
```jsx
import { useMemo } from 'react'
import { useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { PageHeader } from '@/Components/ui/page-header'
import { Calculator, ArrowLeft, Coins, Landmark } from 'lucide-react'

function formatoCOP(v) {
  return '$ ' + new Intl.NumberFormat('es-CO').format(Math.round(v || 0))
}

export default function Arqueo({ sesion, denominaciones }) {
  const { data, setData, post, processing, errors } = useForm({
    detalles: denominaciones.map((d) => ({ denominacion_id: d.id, cantidad: 0 })),
    observaciones: '',
  })

  const saldoSistema = useMemo(() => {
    return Number(sesion.saldo_inicial) + Number(sesion.ingresos_totales) - Number(sesion.egresos_totales)
  }, [sesion])

  const totalContado = useMemo(() => {
    return data.detalles.reduce((acc, d) => {
      const denom = denominaciones.find((x) => x.id === d.denominacion_id)
      return acc + (denom ? denom.valor * d.cantidad : 0)
    }, 0)
  }, [data.detalles, denominaciones])

  const diferencia = useMemo(() => totalContado - saldoSistema, [totalContado, saldoSistema])

  function actualizarCantidad(index, cantidad) {
    const detalles = [...data.detalles]
    detalles[index] = { ...detalles[index], cantidad: Math.max(0, cantidad) }
    setData('detalles', detalles)
  }

  function submit(e) {
    e.preventDefault()
    post(route('cash.arqueo.store', sesion.id), { preserveScroll: true })
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Arqueo de Caja - ${sesion.caja.nombre}`} />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Arqueo de Caja"
          description={`${sesion.caja.nombre} — Cajero: ${sesion.usuario.name}`}
          icon={Calculator}
          back={{ href: route('cash.caja.index'), label: 'Volver a Turno' }}
        />

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conteo de Efectivo */}
          <Card className="md:col-span-2 shadow-sm border-border">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold">Conteo de Efectivo</CardTitle>
              <CardDescription>Registra la cantidad física de billetes y monedas en caja</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 divide-y divide-border/60">
              {data.detalles.map((d, i) => {
                const denom = denominaciones.find((x) => x.id === d.denominacion_id)
                const subtotal = denom ? denom.valor * d.cantidad : 0
                return (
                  <div key={d.denominacion_id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground">
                        {denom.tipo === 'billete' ? <Landmark className="h-4.5 w-4.5" /> : <Coins className="h-4.5 w-4.5" />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {formatoCOP(denom.valor)}
                        </div>
                        <div className="text-xxs text-muted-foreground uppercase tracking-wider">
                          {denom.tipo}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">×</span>
                        <Input
                          type="number"
                          min={0}
                          value={d.cantidad || ''}
                          onChange={(e) => actualizarCantidad(i, parseInt(e.target.value) || 0)}
                          className="h-9 w-20 text-center font-medium"
                          placeholder="0"
                        />
                      </div>
                      <div className="text-sm font-mono font-semibold w-32 text-right text-foreground">
                        {formatoCOP(subtotal)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Cuadre y Observaciones */}
          <div className="space-y-6">
            <Card className="shadow-sm border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold">Resumen de Cuadre</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Saldo Sistema</span>
                  <span className="font-mono font-medium text-foreground">{formatoCOP(saldoSistema)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Total Contado</span>
                  <span className="font-mono font-medium text-foreground">{formatoCOP(totalContado)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">Diferencia</span>
                  <span className={`font-mono font-bold text-base ${
                    diferencia === 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : diferencia > 0 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {diferencia > 0 ? '+' : ''}{formatoCOP(diferencia)}
                  </span>
                </div>
                
                {diferencia !== 0 && (
                  <div className={`text-xs p-3 rounded-lg border ${
                    diferencia > 0 
                      ? 'bg-amber-50/50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50' 
                      : 'bg-rose-50/50 text-rose-800 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-900/50'
                  }`}>
                    {diferencia > 0 
                      ? 'Hay un sobrante de efectivo en caja con respecto al saldo esperado.' 
                      : 'Hay un faltante de efectivo en caja con respecto al saldo esperado.'}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border">
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Observaciones</Label>
                  <textarea
                    value={data.observaciones}
                    onChange={(e) => setData('observaciones', e.target.value)}
                    placeholder="Escribe aquí notas sobre sobrantes, faltantes o detalles del arqueo..."
                    className="w-full min-h-[80px] rounded-lg border border-input bg-background p-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  {errors.observaciones && <p className="text-xs text-destructive">{errors.observaciones}</p>}
                </div>

                {errors.detalles && <p className="text-xs text-destructive">{errors.detalles}</p>}

                <div className="flex gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => window.history.back()} 
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={processing} 
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {processing ? 'Registrando...' : 'Registrar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  )
}
```

### Transferencias/Index.jsx
**Ruta:** resources/js/Pages/Cash/Transferencias/Index.jsx
```jsx
import { useState } from 'react'
import { useForm, router, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { Pagination } from '@/Components/ui/pagination'
import { ArrowLeftRight, Plus, ArrowRight } from 'lucide-react'

export default function TransferenciasIndex({ cajas, transferencias }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    caja_origen_id: '',
    caja_destino_id: '',
    monto: '',
    concepto: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('cash.transferencias.store'), {
      onSuccess: () => reset('monto', 'concepto'),
      preserveScroll: true,
    })
  }

  const handlePageChange = (page) => {
    router.get(route('cash.transferencias.index'), { page }, { preserveState: true, preserveScroll: true })
  }

  const columns = [
    { 
      key: 'created_at', 
      header: 'Fecha', 
      cell: (t) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
          <p className="text-muted-foreground">{new Date(t.created_at).toLocaleTimeString()}</p>
        </div>
      ) 
    },
    { 
      key: 'origen_destino', 
      header: 'Origen → Destino', 
      cell: (t) => (
        <span className="flex items-center gap-1.5 text-sm">
          <span className="font-medium text-muted-foreground">{t.caja_origen.nombre}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground">{t.caja_destino.nombre}</span>
        </span>
      ) 
    },
    { 
      key: 'monto', 
      header: 'Monto ($)', 
      cell: (t) => (
        <span className="font-mono font-semibold text-foreground">${Number(t.monto).toLocaleString()}</span>
      ) 
    },
    { key: 'concepto', header: 'Concepto', cell: (t) => t.concepto ?? <span className="text-muted-foreground text-xs">—</span> },
    { key: 'usuario.name', header: 'Registrado por', cell: (t) => t.usuario?.name ?? '—' },
    { 
      key: 'estado', 
      header: 'Estado', 
      cell: (t) => (
        <Badge variant={t.estado === 'completada' ? 'default' : 'outline'} className={t.estado === 'completada' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
          {t.estado === 'completada' ? 'Completada' : 'Anulada'}
        </Badge>
      ) 
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Transferencias de Efectivo" />
      
      <PageHeader
        title="Transferencias de Efectivo"
        description="Transfiere dinero de forma segura entre diferentes cajas registradoras activas."
        icon={ArrowLeftRight}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <Card className="lg:col-span-1 h-fit shadow-sm border-border">
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Plus className="h-4.5 w-4.5" /> Nueva Transferencia
            </CardTitle>
            <CardDescription>
              La caja de origen debe tener un turno abierto para egresar el dinero.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Caja de Origen <span className="text-destructive">*</span></Label>
                <Select value={data.caja_origen_id} onValueChange={(v) => setData('caja_origen_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona origen..." /></SelectTrigger>
                  <SelectContent>
                    {cajas.filter((c) => c.activa).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.caja_origen_id && <p className="text-xs text-destructive">{errors.caja_origen_id}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Caja de Destino <span className="text-destructive">*</span></Label>
                <Select value={data.caja_destino_id} onValueChange={(v) => setData('caja_destino_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona destino..." /></SelectTrigger>
                  <SelectContent>
                    {cajas.filter((c) => c.activa).map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.caja_destino_id && <p className="text-xs text-destructive">{errors.caja_destino_id}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Monto a Transferir ($) <span className="text-destructive">*</span></Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  value={data.monto}
                  onChange={(e) => setData('monto', e.target.value)} 
                  placeholder="0.00" 
                  className="font-medium"
                />
                {errors.monto && <p className="text-xs text-destructive">{errors.monto}</p>}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Concepto</Label>
                <Input 
                  value={data.concepto} 
                  onChange={(e) => setData('concepto', e.target.value)}
                  placeholder="Ej. Traslado de efectivo para sencillo..." 
                />
              </div>

              <Button type="submit" disabled={processing} className="w-full gap-2 pt-2">
                <ArrowRight className="h-4 w-4" /> Transferir Efectivo
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Historial */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-border h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Historial de Transferencias</CardTitle>
              <CardDescription>Registro histórico de traslados de efectivo realizados</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
              {transferencias.data.length > 0 ? (
                <>
                  <div className="border-t border-border/60">
                    <DataTable columns={columns} data={transferencias.data} />
                  </div>
                  <Pagination 
                    page={transferencias.current_page} 
                    totalPages={transferencias.last_page} 
                    onPage={handlePageChange} 
                  />
                </>
              ) : (
                <div className="py-12 border-t">
                  <EmptyState 
                    icon={ArrowLeftRight} 
                    title="Sin transferencias"
                    description="No se han registrado traslados entre cajas todavía." 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
```

### Reporte/Index.jsx
**Ruta:** resources/js/Pages/Cash/Reporte/Index.jsx
```jsx
import { useState } from 'react'
import { useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { DataTable } from '@/Components/ui/data-table'
import { PageHeader } from '@/Components/ui/page-header'
import { BarChart3, TrendingUp, TrendingDown, Wallet, Calendar, Building } from 'lucide-react'

function formatoCOP(v) {
  return '$ ' + new Intl.NumberFormat('es-CO').format(Math.round(v || 0))
}

export default function ReporteConsolidado({ reporte, sedes, filters }) {
  const { data, setData, get, processing } = useForm({
    desde: filters.desde || '',
    hasta: filters.hasta || '',
    sede_id: filters.sede_id || '__none__',
  })

  const filtrar = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (data.desde) params.set('desde', data.desde)
    if (data.hasta) params.set('hasta', data.hasta)
    if (data.sede_id && data.sede_id !== '__none__') params.set('sede_id', data.sede_id)
    get(route('cash.reporte.consolidado') + '?' + params.toString(), { preserveScroll: true })
  }

  const columns = [
    { 
      key: 'nombre', 
      header: 'Caja', 
      cell: (f) => <span className="font-semibold text-foreground">{f.nombre}</span> 
    },
    { 
      key: 'sede', 
      header: 'Sede / Sucursal', 
      cell: (f) => f.sede ?? <span className="text-muted-foreground text-xs">—</span> 
    },
    { 
      key: 'cajero_actual', 
      header: 'Cajero en Turno', 
      cell: (f) => f.cajero_actual ?? <span className="text-muted-foreground text-xs">Sin turno activo</span> 
    },
    { 
      key: 'sesiones_periodo', 
      header: 'Turnos (Rango)', 
      cell: (f) => (
        <span className="font-medium text-foreground">{f.sesiones_periodo} turnos</span>
      ) 
    },
    { 
      key: 'ingresos', 
      header: 'Ingresos (+)', 
      alignEnd: true, 
      cell: (f) => (
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">+{formatoCOP(f.ingresos)}</span>
      ) 
    },
    { 
      key: 'egresos', 
      header: 'Egresos (-)', 
      alignEnd: true, 
      cell: (f) => (
        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">-{formatoCOP(f.egresos)}</span>
      ) 
    },
    { 
      key: 'saldo_actual', 
      header: 'Saldo Actual', 
      alignEnd: true, 
      cell: (f) => (
        <span className="font-mono font-bold text-foreground">{formatoCOP(f.saldo_actual)}</span>
      ) 
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Reporte Consolidado de Cajas" />
      
      <PageHeader
        title="Reporte Consolidado de Cajas"
        description={`Resumen acumulado del flujo de efectivo para el periodo del ${reporte.desde} al ${reporte.hasta}.`}
        icon={BarChart3}
      />

      {/* KPIs consolidados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <TrendingUp className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Ingresos Acumulados</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">{formatoCOP(reporte.totales.ingresos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <TrendingDown className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Egresos Acumulados</p>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">{formatoCOP(reporte.totales.egresos)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Wallet className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Efectivo en Cajas</p>
                <p className="text-2xl font-bold text-foreground font-mono mt-0.5">{formatoCOP(reporte.totales.saldo_actual)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6 shadow-sm border-border">
        <CardContent className="pt-6">
          <form onSubmit={filtrar} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Fecha Desde</Label>
              <Input type="date" value={data.desde} onChange={(e) => setData('desde', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Fecha Hasta</Label>
              <Input type="date" value={data.hasta} onChange={(e) => setData('hasta', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold flex items-center gap-1.5"><Building className="h-3.5 w-3.5 text-muted-foreground" /> Filtrar por Sede</Label>
              <Select value={data.sede_id} onValueChange={(v) => setData('sede_id', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Todas las sedes</SelectItem>
                  {sedes.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={processing} className="w-full">
              {processing ? 'Consultando...' : 'Filtrar Reporte'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Detalle */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Desglose por Caja</CardTitle>
          <CardDescription>Resumen de transacciones individuales por caja registradora</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t border-border/60">
            <DataTable columns={columns} data={reporte.cajas} rowKey={(f) => f.id} />
          </div>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
```

---

## Tests

### MulticajaTest
**Ruta:** tests/Feature/Modules/Cash/MulticajaTest.php
```php
<?php

namespace Tests\Feature\Modules\Cash;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Models\Denominacion;
use App\Modules\Cash\Models\MovimientoCaja;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Cash\Services\CashProvisioner;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MulticajaTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class]);

        $this->tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'cash',
            'name' => 'Tesorería',
            'class' => 'Cash',
            'version' => '2.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'cash',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    public function test_crear_y_editar_caja(): void
    {
        // Crear
        $response = $this->post(route('cash.cajas.store'), [
            'nombre' => 'Caja Sucursal Norte',
            'activa' => true,
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $this->assertDatabaseHas('cash_cajas', [
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Sucursal Norte',
            'activa' => true,
        ]);

        $caja = Caja::where('nombre', 'Caja Sucursal Norte')->first();

        // Editar
        $this->put(route('cash.cajas.update', $caja), [
            'nombre' => 'Caja Norte Renombrada',
            'activa' => false,
        ], ['X-Inertia' => 'true']);

        $this->assertDatabaseHas('cash_cajas', [
            'id' => $caja->id,
            'nombre' => 'Caja Norte Renombrada',
            'activa' => false,
        ]);
    }

    public function test_no_se_puede_eliminar_caja_con_turno_abierto(): void
    {
        $caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja con Turno',
            'activa' => true,
        ]);

        CajaSesion::create([
            'tenant_id' => $this->tenant->id,
            'caja_id' => $caja->id,
            'user_id' => $this->user->id,
            'saldo_inicial' => 0,
            'estado' => 'abierta',
        ]);

        $response = $this->delete(route('cash.cajas.destroy', $caja), [], ['X-Inertia' => 'true']);

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('cash_cajas', ['id' => $caja->id]);
    }

    public function test_abrir_y_cerrar_turno_calcula_diferencia(): void
    {
        $caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Test',
            'activa' => true,
        ]);

        $service = app(CajaService::class);
        $sesion = $service->abrirCaja($this->user->id, $caja->id, 100000);

        // Registrar un ingreso de 50.000
        $service->registrarMovimiento($sesion, 'ingreso', 50000, 'efectivo', 'Venta de prueba');

        $sesion->refresh();
        $this->assertEquals(50000, (float) $sesion->ingresos_totales);
        $this->assertEquals(150000, $sesion->saldo_sistema); // 100k base + 50k ingreso

        // Cerrar contando exactamente el saldo del sistema
        $service->cerrarSesion($sesion, 150000);
        $sesion->refresh();
        $this->assertEquals('cerrada', $sesion->estado);
        $this->assertEquals(0, (float) $sesion->diferencia);
    }

    public function test_un_usuario_no_puede_abrir_dos_turnos(): void
    {
        $caja1 = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja 1', 'activa' => true]);
        $caja2 = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja 2', 'activa' => true]);

        $service = app(CajaService::class);
        $service->abrirCaja($this->user->id, $caja1->id, 0);

        $this->expectException(\Exception::class);
        $service->abrirCaja($this->user->id, $caja2->id, 0);
    }

    public function test_arqueo_calcula_diferencia_correctamente(): void
    {
        $caja = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja Arqueo', 'activa' => true]);

        // Sembrar denominaciones
        app(CashProvisioner::class)->provisionForTenant($this->tenant);
        $denom50k = Denominacion::where('valor', 50000)->first();
        $denom20k = Denominacion::where('valor', 20000)->first();
        $this->assertNotNull($denom50k);

        $service = app(CajaService::class);
        $sesion = $service->abrirCaja($this->user->id, $caja->id, 0);
        // Saldo sistema = 0

        // Contar 2x50.000 + 1x20.000 = 120.000
        $arqueo = $service->arquearSesion($sesion, [
            ['denominacion_id' => $denom50k->id, 'cantidad' => 2],
            ['denominacion_id' => $denom20k->id, 'cantidad' => 1],
        ]);

        $this->assertEquals(120000, (float) $arqueo->total_contado);
        $this->assertEquals(120000, (float) $arqueo->diferencia); // sobra 120k vs sistema 0

        $sesion->refresh();
        $this->assertTrue($sesion->arqueado);
    }

    public function test_transferencia_entre_cajas(): void
    {
        $cajaOrigen = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Origen', 'activa' => true]);
        $cajaDestino = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Destino', 'activa' => true]);

        $service = app(CajaService::class);

        // Abrir turnos en ambas cajas con dos usuarios distintos
        $user2 = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $sesionOrigen = $service->abrirCaja($this->user->id, $cajaOrigen->id, 100000);

        // Para abrir el destino necesitamos otro usuario (1 sesión por usuario)
        $this->actingAs($user2);
        $sesionDestino = $service->abrirCaja($user2->id, $cajaDestino->id, 0);

        $transferencia = $service->transferirEntreCajas($cajaOrigen->id, $cajaDestino->id, 30000);

        $this->assertEquals('completada', $transferencia->estado);

        $sesionOrigen->refresh();
        $sesionDestino->refresh();
        $this->assertEquals(30000, (float) $sesionOrigen->egresos_totales);
        $this->assertEquals(30000, (float) $sesionDestino->ingresos_totales);
    }

    public function test_no_se_puede_transferir_a_la_misma_caja(): void
    {
        $caja = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Unica', 'activa' => true]);
        $service = app(CajaService::class);
        $service->abrirCaja($this->user->id, $caja->id, 50000);

        $this->expectException(\Exception::class);
        $service->transferirEntreCajas($caja->id, $caja->id, 10000);
    }

    public function test_registro_movimiento_actualiza_totales_sesion(): void
    {
        $caja = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja Totales', 'activa' => true]);
        $service = app(CajaService::class);
        $sesion = $service->abrirCaja($this->user->id, $caja->id, 0);

        $service->registrarMovimiento($sesion, 'ingreso', 30000, 'efectivo', 'Ingreso 1');
        $service->registrarMovimiento($sesion, 'ingreso', 20000, 'tarjeta', 'Ingreso 2');
        $service->registrarMovimiento($sesion, 'egreso', 10000, 'efectivo', 'Gasto');

        $sesion->refresh();
        $this->assertEquals(50000, (float) $sesion->ingresos_totales);
        $this->assertEquals(10000, (float) $sesion->egresos_totales);
        $this->assertEquals(40000, $sesion->saldo_sistema);
    }

    public function test_movimientos_se_registran_con_metodo_pago_correcto(): void
    {
        $caja = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja Métodos', 'activa' => true]);
        $service = app(CajaService::class);
        $sesion = $service->abrirCaja($this->user->id, $caja->id, 0);

        $service->registrarMovimiento($sesion, 'ingreso', 100000, 'tarjeta', 'Pago con tarjeta');
        $service->registrarMovimiento($sesion, 'ingreso', 50000, 'transferencia', 'Transferencia');

        $movimientos = MovimientoCaja::where('sesion_id', $sesion->id)->orderBy('id')->get();
        $this->assertEquals('tarjeta', $movimientos->first()->metodo_pago);
        $this->assertEquals('transferencia', $movimientos->last()->metodo_pago);
    }

    public function test_provisioner_siembra_denominaciones_y_caja_principal(): void
    {
        app(CashProvisioner::class)->provisionForTenant($this->tenant);

        $this->assertDatabaseHas('cash_cajas', [
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Principal',
        ]);

        // 10 denominaciones COP
        $this->assertEquals(10, Denominacion::where('tenant_id', $this->tenant->id)->count());
        $this->assertDatabaseHas('cash_denominaciones', [
            'tenant_id' => $this->tenant->id,
            'valor' => 100000,
            'tipo' => 'billete',
        ]);
    }

    public function test_aislamiento_multi_tenant(): void
    {
        // Caja del tenant A
        Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Tenant A',
            'activa' => true,
        ]);

        // Otro tenant
        $tenantB = Tenant::factory()->create();
        app()->instance('current_tenant', $tenantB);
        Caja::create([
            'tenant_id' => $tenantB->id,
            'nombre' => 'Caja Tenant B',
            'activa' => true,
        ]);

        // El scope solo debe devolver las del tenant B
        $cajas = Caja::all();
        $this->assertCount(1, $cajas);
        $this->assertEquals('Caja Tenant B', $cajas->first()->nombre);
    }

    public function test_reporte_consolidado_agrupa_por_caja(): void
    {
        $caja1 = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja 1', 'activa' => true]);
        $caja2 = Caja::create(['tenant_id' => $this->tenant->id, 'nombre' => 'Caja 2', 'activa' => true]);

        $service = app(CajaService::class);

        $user2 = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $s1 = $service->abrirCaja($this->user->id, $caja1->id, 0);
        $service->registrarMovimiento($s1, 'ingreso', 80000, 'efectivo', 'Venta');

        $this->actingAs($user2);
        $s2 = $service->abrirCaja($user2->id, $caja2->id, 0);
        $service->registrarMovimiento($s2, 'ingreso', 60000, 'tarjeta', 'Venta');

        $reporte = $service->reporteConsolidado();

        $this->assertCount(2, $reporte['cajas']);
        $this->assertEquals(140000, $reporte['totales']['ingresos']);
    }
}
```

### ReciboTest
**Ruta:** tests/Feature/Modules/Cash/ReciboTest.php
```php
<?php

namespace Tests\Feature\Modules\Cash;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Modules\Cash\Models\Caja;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Cash\Models\ReciboCaja;
use App\Modules\Cash\Services\ReciboService;
use App\Modules\Crm\Models\Cliente;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReciboTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Caja $caja;
    private CajaSesion $sesion;
    private Cliente $cliente;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class]);

        $this->tenant = Tenant::factory()->create();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'cash',
            'name' => 'Tesorería',
            'class' => 'Cash',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'cash',
            'is_active' => true,
        ]);

        // Also need service-desk module for cancelar_orden test
        \DB::table('modules')->insertOrIgnore([
            'code' => 'service-desk',
            'name' => 'Servicio Técnico',
            'class' => 'ServiceDesk',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'service-desk',
            'is_active' => true,
        ]);

        // Also need crm module for Cliente factory
        \DB::table('modules')->insertOrIgnore([
            'code' => 'crm',
            'name' => 'CRM',
            'class' => 'Crm',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'crm',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        $this->caja = Caja::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Caja Test',
            'activa' => true,
        ]);

        $this->sesion = CajaSesion::create([
            'tenant_id' => $this->tenant->id,
            'caja_id' => $this->caja->id,
            'user_id' => $this->user->id,
            'saldo_inicial' => 100000,
            'estado' => 'abierta',
            'ingresos_totales' => 0,
            'egresos_totales' => 0,
        ]);

        $this->cliente = Cliente::create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'tipo_documento' => 'CC',
            'numero_documento' => '1234567890',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
            'activo' => true,
        ]);
    }

    private function crearOrden(array $overrides = []): OrdenReparacion
    {
        return OrdenReparacion::create(array_merge([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OR-' . now()->format('YmdHis') . '-' . rand(100, 999),
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Diagnostico->value,
            'abono_inicial' => 0,
            'created_by' => $this->user->id,
        ], $overrides));
    }

    public function test_registrar_abono_crea_recibo(): void
    {
        $orden = $this->crearOrden();

        $response = $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 50000,
            'metodo_pago' => 'efectivo',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('cash_recibos', [
            'tenant_id' => $this->tenant->id,
            'referencia_id' => $orden->id,
            'monto' => 50000,
            'estado' => 'activo',
        ]);
    }

    public function test_abono_actualiza_orden(): void
    {
        $orden = $this->crearOrden(['abono_inicial' => 0]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 75000,
            'metodo_pago' => 'efectivo',
        ]);

        $orden->refresh();
        $this->assertEquals(75000, (float) $orden->abono_inicial);
    }

    public function test_registrar_abono_sin_caja_abierta_falla(): void
    {
        $this->sesion->update(['estado' => 'cerrada']);
        $orden = $this->crearOrden();

        $response = $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 50000,
            'metodo_pago' => 'efectivo',
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseMissing('cash_recibos', ['referencia_id' => $orden->id]);
    }

    public function test_abono_crea_movimiento_de_caja(): void
    {
        $orden = $this->crearOrden();

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 100000,
            'metodo_pago' => 'transferencia',
        ]);

        $this->assertDatabaseHas('cash_movimientos', [
            'sesion_id' => $this->sesion->id,
            'tipo' => 'ingreso',
            'monto' => 100000,
            'metodo_pago' => 'transferencia',
        ]);
    }

    public function test_abono_con_monto_cero_falla(): void
    {
        $orden = $this->crearOrden();

        $response = $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 0,
            'metodo_pago' => 'efectivo',
        ]);

        $response->assertSessionHasErrors('monto');
    }

    public function test_multiples_abonos_acumulan_en_orden(): void
    {
        $orden = $this->crearOrden(['abono_inicial' => 0]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 50000,
            'metodo_pago' => 'efectivo',
        ]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 30000,
            'metodo_pago' => 'tarjeta',
        ]);

        $orden->refresh();
        $this->assertEquals(80000, (float) $orden->abono_inicial);

        $count = ReciboCaja::where('referencia_id', $orden->id)
            ->where('estado', 'activo')
            ->count();
        $this->assertEquals(2, $count);
    }

    public function test_anular_recibo_reversa_monto_orden(): void
    {
        $orden = $this->crearOrden(['abono_inicial' => 0]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 100000,
            'metodo_pago' => 'efectivo',
        ]);

        $recibo = ReciboCaja::where('referencia_id', $orden->id)->first();
        $reciboService = app(ReciboService::class);
        $reciboService->anularRecibo($recibo);

        $orden->refresh();
        $this->assertEquals(0, (float) $orden->abono_inicial);
        $this->assertEquals('anulado', $recibo->fresh()->estado);
    }

    public function test_numero_recibo_secuencial(): void
    {
        $orden = $this->crearOrden();

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 10000,
            'metodo_pago' => 'efectivo',
        ]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 20000,
            'metodo_pago' => 'efectivo',
        ]);

        $recibos = ReciboCaja::where('tenant_id', $this->tenant->id)->orderBy('numero')->get();
        $this->assertCount(2, $recibos);
        $this->assertNotEquals($recibos[0]->numero, $recibos[1]->numero);
    }

    public function test_cancelar_orden_revierte_abonos(): void
    {
        $orden = $this->crearOrden(['abono_inicial' => 0]);

        $this->post(route('cash.recibos.store'), [
            'orden_id' => $orden->id,
            'monto' => 100000,
            'metodo_pago' => 'efectivo',
        ]);

        $orden->refresh();
        $this->assertEquals(100000, (float) $orden->abono_inicial);

        // Cancelar la orden
        $this->put(route('service-desk.ordenes.estado', $orden->id), [
            'estado' => 'cancelado',
        ]);

        $orden->refresh();
        $this->assertEquals(0, (float) $orden->abono_inicial);

        $recibosAnulados = ReciboCaja::where('referencia_id', $orden->id)
            ->where('estado', 'anulado')
            ->count();
        $this->assertGreaterThanOrEqual(1, $recibosAnulados);

        // Verificar que se registró un egreso en caja
        $this->assertDatabaseHas('cash_movimientos', [
            'sesion_id' => $this->sesion->id,
            'tipo' => 'egreso',
        ]);
    }
}
```

---

## Correcciones

1. **`PagoProveedorController` y `RecaudoController` extienden `Illuminate\Routing\Controller`** en lugar de `App\Http\Controllers\Controller`. Deberían usar el controller base del proyecto para consistencia con el resto de controladores del módulo.

2. **`ReciboController::show` usa `inertia()` helper** en lugar de `Inertia::render()`. Aunque funciona, es inconsistente con el patrón usado en todos los demás controllers del módulo.

3. **Páginas de Recaudos y PagoProveedores** renderizan `Modules/Cash/Recaudos/Index` y `Modules/Cash/PagoProveedores/Index` (ruta inexistente en `resources/js/Pages/`). Deberían ser `Cash/Recaudos/Index` y `Cash/PagoProveedores/Index`, o crearse esos archivos bajo la ruta correcta.

4. **`ReciboCaja::getNumeroFormateadoAttribute`** usa `str_pad` con 6 dígitos, pero el número secuencial (`siguienteNumero()`) ya incluye prefijo de fecha (`YYYYMMDD-NNN`). El resultado final es `RC-20260706-001` (13+ caracteres), lo que contradice el uso de `str_pad($recibo->numero, 6, ...)` en controllers — `numero` ya es un string largo, no un entero de 6 dígitos. El `str_pad` no produce el formato esperado.

5. **Falta la migración de `cash_recibos`**. La tabla se usa extensivamente en `ReciboCaja` y `ReciboService`, pero no hay migración dedicada en el módulo Cash. Debería existir o documentarse que se crea desde otro módulo (probablemente ServiceDesk).

6. **`CajaSesion` no tiene cast de `tenant_id` a integer**. Aunque BelongsToTenant se encarga del scope, el nullable en la migración multicaja puede causar inconsistencias si se crea una sesión sin `tenant_id` explícito.

7. **Tests requieren `composer fresh` después de ejecutarse** ya que PHPUnit con SQLite :memory: no afecta la BD de dev. Sin embargo, `ReciboTest` configura módulos `cash`, `service-desk` y `crm` directamente via DB::table, lo cual es frágil si cambia el schema de la tabla `modules`.

8. **No existen las páginas JSX** para `Cash/Recibos/Show`, `Cash/Recibos/Index`, `Cash/Recaudos/Index`, `Cash/Recaudos/Pendientes`, `Cash/PagoProveedores/Index`, `Cash/PagoProveedores/Pendientes`. Estas rutas Inertia apuntan a archivos que no están en `resources/js/Pages/Cash/`.
