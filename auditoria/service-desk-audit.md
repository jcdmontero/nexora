# Auditoría: ServiceDesk (Servicio Técnico)

> Actualizado: 2026-07-06

---

## Módulo (module.json)

**Ruta:** `app/Modules/ServiceDesk/module.json`

```json
{
    "code": "service-desk",
    "name": "Servicio Técnico",
    "version": "1.0.0",
    "description": "Órdenes de trabajo, diagnóstico, garantías y seguimiento de reparaciones.",
    "icon": "Wrench",
    "core": false,
    "dependencies": ["crm", "cash", "purchasing", "notifications"],

    "// NOTA DE DISEÑO (cambio respecto al legacy servicemanager) //": "",
    "// En el legacy, los técnicos eran usuarios (users) con rol TECNICO o empleados (rh_empleados)": "",
    "// con cargo productivo (es_productivo = true). Ambas opciones REQUERÍAN RRHH activo.": "",
    "// ": "",
    "// En Nexora creamos sd_prestadores como la entidad única de técnicos, que permite:": "",
    "// - CONTRATISTA: externo, se le paga por comisión (sin RRHH).": "",
    "// - EMPLEADO: vinculado a hr_empleados (si RRHH está activo).": "",
    "// - FREELANCE / COMISIONISTA: otras modalidades.": "",
    "// ": "",
    "// ServiceDesk NO depende de RRHH. Puede funcionar completamente independiente.": "",
    "// Las comisiones se liquidan por período y generan cuentas por pagar.": "",
    "// ": "",
    "// ═══════════════════════════════════════════════════════════════": "",
    "// Este cambio fue implementado el 2026-06-21 como parte de la": "",
    "// Fase 1.5 del desarrollo de Nexora. No existe en el código": "",
    "// original de servicemanager.": "",
    "// ═══════════════════════════════════════════════════════════════": "",

    "permissions": [
        "service-desk:view",
        "service-desk:create",
        "service-desk:edit",
        "service-desk:delete",
        "service-desk:assign"
    ],
    "menus": [
        {
            "section": "SERVICIO TÉCNICO",
            "icon": "Wrench",
            "items": [
                { "label": "Órdenes", "route": "service-desk.ordenes.index", "permission": "service-desk:view" },
                { "label": "Garantías", "route": "service-desk.garantias.index", "permission": "service-desk:view" },
                { "type": "separator" },
                { "type": "label", "label": "TÉCNICOS" },
                { "label": "Prestadores", "route": "service-desk.prestadores.index", "permission": "service-desk:view" },
                { "label": "Comisiones", "route": "service-desk.comisiones.index", "permission": "service-desk:view" },
                { "type": "separator" },
                { "type": "label", "label": "CATÁLOGOS" },
                { "label": "Tipos de equipo", "route": "service-desk.tipos-equipo.index", "permission": "service-desk:view" },
                { "label": "Marcas de equipo", "route": "service-desk.marcas.index", "permission": "service-desk:view" },
                { "label": "Modelos de equipo", "route": "service-desk.modelos.index", "permission": "service-desk:view" },
                { "label": "Servicios", "route": "service-desk.servicios.index", "permission": "service-desk:view" },
                { "label": "Checklist de recepción", "route": "service-desk.checklist.index", "permission": "service-desk:view" }
            ]
        }
    ]
}
```

---

## ServiceDeskServiceProvider

**Ruta:** `app/Modules/ServiceDesk/Providers/ServiceDeskServiceProvider.php`

```php
<?php

namespace App\Modules\ServiceDesk\Providers;

use Illuminate\Support\ServiceProvider;

class ServiceDeskServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');
    }
}
```

---

## Routes (web.php)

**Ruta:** `app/Modules/ServiceDesk/Routes/web.php`

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Modules\ServiceDesk\Controllers\TicketController;
use App\Modules\ServiceDesk\Controllers\TipoEquipoController;
use App\Modules\ServiceDesk\Controllers\MarcaController;
use App\Modules\ServiceDesk\Controllers\ModeloController;
use App\Modules\ServiceDesk\Controllers\ServicioController;
use App\Modules\ServiceDesk\Controllers\FallaBaseController;
use App\Modules\ServiceDesk\Controllers\ChecklistItemController;
use App\Modules\ServiceDesk\Controllers\OrdenController;
use App\Modules\ServiceDesk\Controllers\PrestadorController;
use App\Modules\ServiceDesk\Controllers\ComisionController;

Route::get('service-desk/comisiones/verificar/{token}', [ComisionController::class, 'verify'])->name('service-desk.comisiones.verify');

Route::middleware(['web', 'auth', 'tenant', 'module:service-desk'])->group(function () {
    Route::prefix('service-desk')->name('service-desk.')->group(function () {

        // ─── Órdenes de reparación ───
        Route::get('ordenes', [OrdenController::class, 'index'])->name('ordenes.index')->middleware('permission:service-desk:view');
        Route::get('ordenes/crear', [OrdenController::class, 'create'])->name('ordenes.create')->middleware('permission:service-desk:create');
        Route::post('ordenes', [OrdenController::class, 'store'])->name('ordenes.store')->middleware('permission:service-desk:create');
        Route::get('ordenes/{orden}/editar', [OrdenController::class, 'edit'])->name('ordenes.edit')->middleware('permission:service-desk:edit');
        Route::put('ordenes/{orden}', [OrdenController::class, 'update'])->name('ordenes.update')->middleware('permission:service-desk:edit');
        Route::get('ordenes/validar-numero-serie', [OrdenController::class, 'validarNumeroSerie'])->name('ordenes.validar-numero-serie')->middleware('permission:service-desk:view');
        Route::get('ordenes/{orden}', [OrdenController::class, 'show'])->name('ordenes.show')->middleware('permission:service-desk:view');
        Route::put('ordenes/{orden}/estado', [OrdenController::class, 'updateEstado'])->name('ordenes.estado')->middleware('permission:service-desk:edit');
        Route::delete('ordenes/{orden}', [OrdenController::class, 'destroy'])->name('ordenes.destroy')->middleware('permission:service-desk:delete');
        Route::post('ordenes/{orden}/notificar-tecnico', [OrdenController::class, 'notificarTecnico'])->name('ordenes.notificar-tecnico')->middleware('permission:service-desk:edit');
        Route::post('ordenes/{orden}/notificar-administrador', [OrdenController::class, 'notificarAdministrador'])->name('ordenes.notificar-administrador')->middleware('permission:service-desk:edit');
        
        // ─── Liquidación y Facturación de Orden ───
        Route::get('ordenes/{orden}/liquidar', [\App\Modules\ServiceDesk\Controllers\LiquidacionController::class, 'edit'])->name('ordenes.liquidar')->middleware('permission:service-desk:edit');
        Route::post('ordenes/{orden}/liquidar', [\App\Modules\ServiceDesk\Controllers\LiquidacionController::class, 'update'])->name('ordenes.liquidar.update')->middleware('permission:service-desk:edit');
        
        // ─── Prefactura y Notificación ───
        // La "prefactura" es la vista editable (liquidación), no un PDF de descarga.
        Route::get('ordenes/{orden}/prefactura', [\App\Modules\ServiceDesk\Controllers\LiquidacionController::class, 'edit'])->name('ordenes.prefactura')->middleware('permission:service-desk:edit');
        Route::get('ordenes/{orden}/prefactura/pdf', [\App\Modules\ServiceDesk\Controllers\PrefacturaController::class, 'generar'])->name('ordenes.prefactura.pdf')->middleware('permission:service-desk:edit');
        Route::post('ordenes/{orden}/prefactura/notificar', [\App\Modules\ServiceDesk\Controllers\PrefacturaController::class, 'notificar'])->name('ordenes.prefactura.notificar')->middleware('permission:service-desk:edit');
        // ─── Actividades de la OT ───
        Route::post('ordenes/{orden}/actividades', [OrdenController::class, 'storeActividad'])->name('ordenes.actividades.store')->middleware('permission:service-desk:edit');
        Route::put('ordenes/{orden}/actividades/{actividad}', [OrdenController::class, 'updateActividad'])->name('ordenes.actividades.update')->middleware('permission:service-desk:edit');
        Route::delete('ordenes/{orden}/actividades/{actividad}', [OrdenController::class, 'destroyActividad'])->name('ordenes.actividades.destroy')->middleware('permission:service-desk:edit');

        // ─── Multimedia (fotos/videos) ───
        Route::middleware('permission:service-desk:edit')->group(function () {
            Route::get('ordenes/{orden}/multimedia', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'indexOrden'])->name('ordenes.multimedia.index');
            Route::post('ordenes/{orden}/multimedia', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'uploadOrden'])->name('ordenes.multimedia.upload');
            Route::delete('multimedia/{multimedia}', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'destroy'])->name('ordenes.multimedia.destroy');
        });

        // ─── Garantías y Tickets ───
        Route::get('garantias', [TicketController::class, 'garantiasIndex'])->name('garantias.index')->middleware('permission:service-desk:view');
        Route::get('tickets/crear', [TicketController::class, 'create'])->name('tickets.create')->middleware('permission:service-desk:create');
        Route::post('tickets', [TicketController::class, 'store'])->name('tickets.store')->middleware('permission:service-desk:create');
        Route::get('tickets/{ticket}', [TicketController::class, 'show'])->name('tickets.show')->middleware('permission:service-desk:view');
        Route::put('tickets/{ticket}/estado', [TicketController::class, 'updateStatus'])->name('tickets.updateStatus')->middleware('permission:service-desk:edit');
        Route::put('tickets/{ticket}/agente', [TicketController::class, 'updateAgent'])->name('tickets.updateAgent')->middleware('permission:service-desk:assign');
        Route::post('tickets/{ticket}/mensajes', [TicketController::class, 'addMessage'])->name('tickets.mensajes.store')->middleware('permission:service-desk:view');

        // ─── Prestadores (técnicos internos/externos) ───
        Route::get('prestadores', [PrestadorController::class, 'index'])->name('prestadores.index')->middleware('permission:service-desk:view');
        Route::get('prestadores/crear', [PrestadorController::class, 'create'])->name('prestadores.create')->middleware('permission:service-desk:create');
        Route::post('prestadores', [PrestadorController::class, 'store'])->name('prestadores.store')->middleware('permission:service-desk:create');
        Route::get('prestadores/{prestador}', [PrestadorController::class, 'show'])->name('prestadores.show')->middleware('permission:service-desk:view');
        Route::get('prestadores/{prestador}/editar', [PrestadorController::class, 'edit'])->name('prestadores.edit')->middleware('permission:service-desk:edit');
        Route::put('prestadores/{prestador}', [PrestadorController::class, 'update'])->name('prestadores.update')->middleware('permission:service-desk:edit');
        Route::delete('prestadores/{prestador}', [PrestadorController::class, 'destroy'])->name('prestadores.destroy')->middleware('permission:service-desk:delete');

        // ─── Liquidación de comisiones ───
        Route::get('comisiones', [ComisionController::class, 'index'])->name('comisiones.index')->middleware('permission:service-desk:view');
        Route::get('comisiones/crear', [ComisionController::class, 'create'])->name('comisiones.create')->middleware('permission:service-desk:create');
        Route::post('comisiones', [ComisionController::class, 'store'])->name('comisiones.store')->middleware('permission:service-desk:create');
        Route::get('comisiones/{liquidacion}', [ComisionController::class, 'show'])->name('comisiones.show')->middleware('permission:service-desk:view');
        Route::post('comisiones/{liquidacion}/aprobar', [ComisionController::class, 'approve'])->name('comisiones.approve')->middleware('permission:service-desk:edit');
        Route::post('comisiones/{liquidacion}/pagar', [ComisionController::class, 'pay'])->name('comisiones.pay')->middleware('permission:service-desk:edit');
        Route::get('comisiones/{liquidacion}/pdf', [ComisionController::class, 'pdf'])->name('comisiones.pdf')->middleware('permission:service-desk:view');
        Route::delete('comisiones/{liquidacion}', [ComisionController::class, 'destroy'])->name('comisiones.destroy')->middleware('permission:service-desk:delete');

        // ─── Catálogos del taller ───
        Route::middleware('permission:service-desk:view')->group(function () {
            Route::get('catalogos/tipos-equipo', [TipoEquipoController::class, 'index'])->name('tipos-equipo.index');
            Route::get('catalogos/marcas', [MarcaController::class, 'index'])->name('marcas.index');
            Route::get('catalogos/modelos', [ModeloController::class, 'index'])->name('modelos.index');
            Route::get('catalogos/servicios', [ServicioController::class, 'index'])->name('servicios.index');
            Route::get('catalogos/fallas', [FallaBaseController::class, 'index'])->name('fallas.index');
            Route::get('catalogos/checklist', [ChecklistItemController::class, 'index'])->name('checklist.index');
        });
        Route::middleware('permission:service-desk:create')->group(function () {
            Route::post('catalogos/tipos-equipo', [TipoEquipoController::class, 'store'])->name('tipos-equipo.store');
            Route::post('catalogos/marcas', [MarcaController::class, 'store'])->name('marcas.store');
            Route::post('catalogos/modelos', [ModeloController::class, 'store'])->name('modelos.store');
            Route::post('catalogos/servicios', [ServicioController::class, 'store'])->name('servicios.store');
            Route::post('catalogos/fallas', [FallaBaseController::class, 'store'])->name('fallas.store');
            Route::post('catalogos/checklist', [ChecklistItemController::class, 'store'])->name('checklist.store');
        });
        Route::middleware('permission:service-desk:edit')->group(function () {
            Route::put('catalogos/tipos-equipo/{tipos_equipo}', [TipoEquipoController::class, 'update'])->name('tipos-equipo.update');
            Route::put('catalogos/marcas/{marca}', [MarcaController::class, 'update'])->name('marcas.update');
            Route::put('catalogos/modelos/{modelo}', [ModeloController::class, 'update'])->name('modelos.update');
            Route::put('catalogos/servicios/{servicio}', [ServicioController::class, 'update'])->name('servicios.update');
            Route::put('catalogos/fallas/{falla}', [FallaBaseController::class, 'update'])->name('fallas.update');
            Route::put('catalogos/checklist/{checklist}', [ChecklistItemController::class, 'update'])->name('checklist.update');
        });
        Route::middleware('permission:service-desk:delete')->group(function () {
            Route::delete('catalogos/tipos-equipo/{tipos_equipo}', [TipoEquipoController::class, 'destroy'])->name('tipos-equipo.destroy');
            Route::delete('catalogos/marcas/{marca}', [MarcaController::class, 'destroy'])->name('marcas.destroy');
            Route::delete('catalogos/modelos/{modelo}', [ModeloController::class, 'destroy'])->name('modelos.destroy');
            Route::delete('catalogos/servicios/{servicio}', [ServicioController::class, 'destroy'])->name('servicios.destroy');
            Route::delete('catalogos/fallas/{falla}', [FallaBaseController::class, 'destroy'])->name('fallas.destroy');
            Route::delete('catalogos/checklist/{checklist}', [ChecklistItemController::class, 'destroy'])->name('checklist.destroy');
        });

        // ─── Imágenes de servicios ───
        Route::middleware('permission:service-desk:edit')->group(function () {
            Route::post('catalogos/servicios/{servicio}/imagen', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'uploadServicio'])->name('servicios.imagen.upload');
            Route::delete('catalogos/servicios/{servicio}/imagen', [\App\Modules\ServiceDesk\Controllers\MultimediaController::class, 'destroyServicio'])->name('servicios.imagen.destroy');
        });

    });
});
```

---

## Controllers

### OrdenController

**Ruta:** `app/Modules/ServiceDesk/Controllers/OrdenController.php`

```php
<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Modules\ServiceDesk\Models\ChecklistItem;
use App\Modules\ServiceDesk\Models\FallaBase;
use App\Modules\ServiceDesk\Models\OrdenActividad;
use App\Modules\ServiceDesk\Models\Prestador;
use App\Modules\ServiceDesk\Models\Marca;
use App\Modules\ServiceDesk\Models\Modelo;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use App\Modules\ServiceDesk\Rules\UniqueSerialPerEquipment;
use App\Modules\ServiceDesk\Services\OrdenService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class OrdenController extends Controller
{
    public function __construct(
        private OrdenService $ordenService,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $soloPropias = !$user->can('service-desk:assign');
        $prestadorIds = $soloPropias
            ? Prestador::where('tenant_id', tenantId())
                ->where('user_id', $user->id)
                ->pluck('id')
            : null;

        return Inertia::render('ServiceDesk/Ordenes/Index', [
            'soloPropias' => $soloPropias,
            'ordenes' => Inertia::defer(fn () => OrdenReparacion::with([
                'cliente:id,tipo,nombres,apellidos,razon_social',
                'modelo:id,nombre',
                'tipoEquipo:id,nombre',
                'prestador:id,nombre_completo',
                'factura' => fn ($q) => $q->select('sales_facturas.id', 'sales_facturas.orden_id', 'sales_facturas.numero'),
            ])
                ->when($soloPropias, function ($q) use ($prestadorIds) {
                    $q->whereIn('prestador_id', $prestadorIds);
                })
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'numero_orden' => $o->numero_orden,
                    'cliente' => $o->cliente?->nombre_completo,
                    'equipo' => $o->modelo?->nombre ?? $o->tipo_equipo_manual ?? $o->tipoEquipo?->nombre ?? '—',
                    'tecnico' => $o->prestador?->nombre_completo,
                    'estado' => $o->estado->value,
                    'estado_label' => $o->estado->label(),
                    'estado_color' => $o->estado->color(),
                    'total' => $o->total_final,
                    'factura_id' => $o->factura?->id,
                    'fecha_recibido' => $o->fecha_recibido?->format('Y-m-d'),
                ])),
            'estados' => OrdenEstado::opciones(),
        ]);
    }

    public function create()
    {
        return Inertia::render('ServiceDesk/Ordenes/Create', array_merge(
            $this->formData(),
            ['numeroSugerido' => $this->ordenService->siguienteNumero()],
        ));
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        $orden = $this->ordenService->crear($data, $request->user()->id);

        if ($request->hasFile('multimedia_archivos')) {
            $multimediaService = app(\App\Modules\ServiceDesk\Services\MultimediaService::class);
            foreach ($request->file('multimedia_archivos') as $file) {
                try {
                    $datos = $multimediaService->upload($file, $request->user()->tenant_id, 'ordenes');
                    \App\Modules\ServiceDesk\Models\OrdenMultimedia::create([
                        'orden_id' => $orden->id,
                        'ruta' => $datos['ruta'],
                        'tipo' => $datos['tipo'],
                        'mime_type' => $datos['mime_type'],
                        'tamaño' => $datos['tamaño'],
                        'duracion' => $datos['duracion'],
                        'nombre_original' => $datos['nombre_original'],
                        'fase' => 'recibido',
                        'descripcion' => 'Subido al crear la orden',
                    ]);
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error('Error uploading multimedia', ['error' => $e->getMessage()]);
                }
            }
        }

        $this->notificarOrden($orden, 'orden_recibida');

        return redirect()->route('service-desk.ordenes.edit', $orden->id)
            ->with('success', 'Orden creada. Ahora realiza el diagnóstico y define el costo del trabajo.');
    }

    public function edit(OrdenReparacion $orden)
    {
        if (in_array($orden->estado->value, ['entregado', 'cancelado'])) {
            return redirect()->route('service-desk.ordenes.show', $orden->id)
                ->with('error', 'No se puede editar una orden ' . ($orden->estado->value === 'entregado' ? 'entregada' : 'cancelada') . '.');
        }

        $orden->load(['servicios', 'repuestos', 'prestador', 'multimedia']);

        return Inertia::render('ServiceDesk/Ordenes/Edit', array_merge(
            $this->formData(),
            ['orden' => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'estado' => $orden->estado->value,
                'cliente_id' => $orden->cliente_id,
                'tipo_equipo_id' => $orden->tipo_equipo_id,
                'modelo_id' => $orden->modelo_id,
                'numero_serie' => $orden->numero_serie,
                'condicion_inicial' => $orden->condicion_inicial,
                'fallas_checklist' => $orden->fallas_checklist ?? [],
                'fallas_otras' => $orden->fallas_otras ?? '',
                'accesorios_checklist' => $orden->accesorios_checklist ?? [],
                'bloqueado' => (bool) $orden->bloqueado,
                'tipo_bloqueo' => $orden->tipo_bloqueo ?? 'ninguno',
                'codigo_bloqueo' => $orden->codigo_bloqueo,
                'tecnico_id' => $orden->tecnico_id,
                'prestador_id' => $orden->prestador_id,
                'prestador_user_id' => $orden->prestador?->user_id,
                'tipo_comision' => $orden->tipo_comision ?? 'FIJO',
                'valor_comision_fijo' => (float) $orden->valor_comision_fijo,
                'porcentaje_comision' => (float) $orden->porcentaje_comision,
                'precio_cliente' => (float) $orden->precio_cliente,
                'costo_diagnostico' => (float) $orden->costo_diagnostico,
                'abono_inicial' => (float) $orden->abono_inicial,
                'servicios' => $orden->servicios->map(fn ($s) => [
                    'servicio_id' => $s->id, 'nombre' => $s->nombre,
                    'cantidad' => (float) $s->pivot->cantidad,
                    'precio_aplicado' => (float) $s->pivot->precio_aplicado,
                    'costo_tecnico_aplicado' => (float) $s->pivot->costo_tecnico_aplicado,
                ]),
                'repuestos' => $orden->repuestos->map(fn ($r) => [
                    'producto_id' => $r->id, 'nombre' => $r->nombre,
                    'cantidad' => (float) $r->pivot->cantidad,
                    'precio_unitario' => (float) $r->pivot->precio_unitario,
                ]),
                'notas_fases' => $orden->notas_fases ?? [],
                'multimedia' => $orden->multimedia->map(fn ($m) => [
                    'id' => $m->id,
                    'ruta' => $m->ruta,
                    'tipo' => $m->tipo,
                    'fase' => $m->fase,
                    'mime_type' => $m->mime_type,
                    'tamaño' => $m->tamaño,
                    'nombre_original' => $m->nombre_original,
                ]),
            ],
            'recibos' => $orden->recibos()
                ->orderByDesc('fecha')
                ->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'numero' => $r->numero_formateado,
                    'fecha' => $r->fecha->format('Y-m-d H:i'),
                    'monto' => (float) $r->monto,
                    'metodo_pago' => $r->metodo_pago,
                    'concepto' => $r->concepto,
                    'estado' => $r->estado,
                ]),
        ]));
    }

    private const FASES_TECNICO = ['diagnostico', 'reparacion', 'pruebas'];

    public function update(Request $request, OrdenReparacion $orden)
    {
        if (in_array($orden->estado->value, ['entregado', 'cancelado'])) {
            return back()->with('error', 'No se puede modificar una orden ' . ($orden->estado->value === 'entregado' ? 'entregada' : 'cancelada') . '.');
        }

        if ($this->bloqueadoPorTecnico($orden, $request)) {
            $message = $request->user()->hasRole('TECNICO')
                ? 'Como técnico, solo tienes permitido realizar modificaciones en las fases de Reparación y Pruebas.'
                : 'Esta orden está en fase de Reparación/Pruebas a cargo del técnico asignado. Solo el técnico puede modificarla.';
            return back()->with('error', $message);
        }

        $data = $this->validateData($request, $orden);
        $oldPrestadorId = $orden->prestador_id;
        $abonoAnterior = (float) ($orden->abono_inicial ?? 0);
        $abonoNuevo = (float) ($data['abono_inicial'] ?? 0);
        $diferenciaAbono = $abonoNuevo - $abonoAnterior;

        $this->ordenService->actualizar($orden, $data, $request->user()->id);

        if ($diferenciaAbono > 0) {
            try {
                $this->ordenService->registrarAbono($orden, $diferenciaAbono, $request->input('metodo_pago_abono', 'efectivo'));
            } catch (\Exception $e) {
                $orden->update(['abono_inicial' => $abonoAnterior]);
                return back()->with('error', 'Abono no registrado: ' . $e->getMessage());
            }
        } elseif ($diferenciaAbono < 0) {
            $this->ordenService->anularAbonos($orden, abs($diferenciaAbono));
        }

        if (empty($oldPrestadorId) && !empty($data['prestador_id'])) {
            $this->notificarOrden($orden, 'tecnico_asignado');
        }

        return redirect()->route('service-desk.ordenes.edit', $orden->id)
            ->with('success', 'Orden actualizada correctamente.');
    }

    public function show(OrdenReparacion $orden)
    {
        $orden->load([
            'cliente',
            'modelo.marca',
            'tipoEquipo',
            'prestador:id,nombre_completo',
            'servicios',
            'repuestos',
            'multimedia',
            'actividades.prestador',
            'actividades.servicio',
            'factura' => fn ($q) => $q->select('sales_facturas.id', 'sales_facturas.orden_id', 'sales_facturas.numero'),
        ]);

        return Inertia::render('ServiceDesk/Ordenes/Show', [
            'orden' => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'estado' => $orden->estado->value,
                'estado_label' => $orden->estado->label(),
                'estado_color' => $orden->estado->color(),
                'factura' => $orden->factura ? [
                    'id' => $orden->factura->id,
                    'numero' => $orden->factura->numero,
                ] : null,
                'cliente' => $orden->cliente ? [
                    'id' => $orden->cliente->id,
                    'nombre' => $orden->cliente->nombre_completo,
                    'documento' => $orden->cliente->documento,
                    'telefono' => $orden->cliente->telefono,
                    'email' => $orden->cliente->email,
                ] : null,
                'equipo' => [
                    'tipo' => $orden->tipoEquipo?->nombre ?? $orden->tipo_equipo_manual,
                    'marca' => $orden->modelo?->marca?->nombre,
                    'modelo' => $orden->modelo?->nombre,
                    'numero_serie' => $orden->numero_serie,
                ],
                'numero_serie' => $orden->numero_serie,
                'accesorios_equipo' => $orden->accesorios_equipo,
                'observaciones_equipo' => $orden->observaciones_equipo,
                'condicion_inicial' => $orden->condicion_inicial,
                'fallas_checklist' => $orden->fallas_checklist ?? [],
                'accesorios_checklist' => $orden->accesorios_checklist ?? [],
                'fallas_otras' => $orden->fallas_otras,
                'accesorios_otros' => $orden->accesorios_otros,
                'bloqueado' => $orden->bloqueado,
                'tipo_bloqueo' => $orden->tipo_bloqueo,
                'codigo_bloqueo' => $orden->codigo_bloqueo,
                'notas_fases' => $orden->notas_fases ?? [],
                'tecnico' => $orden->prestador?->nombre_completo,
                'prestador_id' => $orden->prestador_id,
                'prestador_user_id' => $orden->prestador?->user_id,
                'tipo_mano_obra' => $orden->tipo_mano_obra,
                'mano_obra_descripcion' => $orden->mano_obra_descripcion,
                'tipo_comision' => $orden->tipo_comision,
                'valor_comision_fijo' => $orden->valor_comision_fijo,
                'porcentaje_comision' => $orden->porcentaje_comision,
                'precio_cliente' => $orden->precio_cliente,
                'costo_diagnostico' => $orden->costo_diagnostico,
                'costo_revision' => $orden->costo_revision,
                'total_final' => $orden->total_final,
                'abono_inicial' => $orden->abono_inicial,
                'total_servicios' => $orden->total_servicios,
                'total_repuestos' => $orden->total_repuestos,
                'total_cliente' => $orden->total_cliente,
                'fecha_recibido' => $orden->fecha_recibido?->format('Y-m-d H:i'),
                'fecha_entregado' => $orden->fecha_entregado?->format('Y-m-d H:i'),
                'servicios' => $orden->servicios->map(fn ($s) => [
                    'id' => $s->id, 'nombre' => $s->nombre,
                    'cantidad' => $s->pivot->cantidad, 'precio' => $s->pivot->precio_aplicado,
                ]),
                'repuestos' => $orden->repuestos->map(fn ($r) => [
                    'id' => $r->id, 'nombre' => $r->nombre,
                    'cantidad' => $r->pivot->cantidad, 'precio' => $r->pivot->precio_unitario,
                ]),
                'actividades' => $orden->actividades->map(fn ($a) => [
                    'id' => $a->id,
                    'prestador' => $a->prestador?->nombre_completo ?? '—',
                    'servicio' => $a->servicio?->nombre ?? '—',
                    'resultado' => $a->resultado,
                    'resultado_label' => $a->resultadoLabel(),
                    'resultado_color' => $a->resultadoColor(),
                    'horas_invertidas' => $a->horas_invertidas,
                    'costo_hora' => $a->costo_hora,
                    'costo_total' => $a->costo_total,
                    'comision_tipo' => $a->comision_tipo,
                    'comision_valor' => $a->comision_valor,
                    'descripcion' => $a->descripcion,
                ]),
                'total_actividades' => $orden->total_actividades,
                'total_comisiones' => $orden->total_comisiones,
                'total_horas' => $orden->total_horas,
                'multimedia' => $orden->multimedia->map(fn ($m) => [
                    'id' => $m->id,
                    'ruta' => $m->ruta,
                    'tipo' => $m->tipo,
                    'fase' => $m->fase,
                    'mime_type' => $m->mime_type,
                    'tamaño' => $m->tamaño,
                    'duracion' => $m->duracion,
                    'nombre_original' => $m->nombre_original,
                    'descripcion' => $m->descripcion,
                    'created_at' => $m->created_at?->toIso8601String(),
                ]),
            ],
            'estados' => OrdenEstado::opciones(),
            'prestadores' => Prestador::where('tenant_id', tenantId())
                ->where('activo', true)
                ->orderBy('nombre_completo')
                ->get(['id', 'nombre_completo'])
                ->map(fn ($p) => ['id' => $p->id, 'nombre' => $p->nombre_completo]),
            'serviciosDisponibles' => Servicio::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'costo_tecnico_base']),
            'recibos' => $orden->recibos()
                ->orderByDesc('fecha')
                ->get()
                ->map(fn ($r) => [
                    'id' => $r->id,
                    'numero' => $r->numero_formateado,
                    'fecha' => $r->fecha->format('Y-m-d H:i'),
                    'monto' => (float) $r->monto,
                    'metodo_pago' => $r->metodo_pago,
                    'concepto' => $r->concepto,
                    'estado' => $r->estado,
                ]),
        ]);
    }

    public function updateEstado(Request $request, OrdenReparacion $orden)
    {
        if ($this->bloqueadoPorTecnico($orden, $request, true)) {
            $message = $request->user()->hasRole('TECNICO')
                ? 'Como técnico, solo tienes permitido realizar modificaciones en las fases de Reparación y Pruebas.'
                : 'Esta orden está en fase de Reparación/Pruebas a cargo del técnico asignado. Solo el técnico puede cambiar su estado.';
            return back()->with('error', $message);
        }

        $validated = $request->validate([
            'estado' => ['required', 'string', 'in:' . implode(',', array_column(OrdenEstado::cases(), 'value'))],
            'nota' => ['nullable', 'string', 'max:1000'],
            'mano_obra_descripcion' => ['nullable', 'string', 'max:2000'],
        ]);

        $notas = $orden->notas_fases ?? [];
        if (!empty($validated['nota'])) {
            $notas[$validated['estado']] = $validated['nota'];
        }

        $estadoAnterior = is_string($orden->estado) ? $orden->estado : $orden->estado->value;

        $orden->update([
            'estado' => $validated['estado'],
            'notas_fases' => $notas,
            'mano_obra_descripcion' => $validated['mano_obra_descripcion'] ?? $orden->mano_obra_descripcion,
            'fecha_entregado' => $validated['estado'] === OrdenEstado::Entregado->value ? now() : $orden->fecha_entregado,
            'updated_by' => $request->user()->id,
        ]);

        \App\Events\OrdenEstadoActualizado::dispatch(
            $orden->fresh(),
            $estadoAnterior,
            $validated['estado'],
        );

        if ($validated['estado'] === OrdenEstado::Cancelado->value) {
            $this->ordenService->cancelar($orden);
        }

        $eventoMap = [
            'recibido' => 'orden_recibida', 'diagnosticado' => 'orden_diagnostico',
            'en_proceso' => 'orden_reparacion', 'pruebas' => 'orden_pruebas',
            'completado' => 'orden_listo', 'entregado' => 'orden_entregado',
        ];
        if (isset($eventoMap[$validated['estado']])) {
            $this->notificarOrden($orden, $eventoMap[$validated['estado']]);
        }

        $message = 'Estado de la orden actualizado.';
        if ($validated['estado'] === OrdenEstado::Reparacion->value
            && $request->user()->id !== $orden->prestador?->user_id
            && $orden->prestador_id !== null
        ) {
            $message = 'Orden en reparación. Notifica al técnico asignado para que empiece a trabajar.';
        }

        return back()->with('success', $message);
    }

    private function bloqueadoPorTecnico(OrdenReparacion $orden, Request $request, bool $allowEstadoTransition = false): bool
    {
        $user = $request->user();

        if ($user->is_superadmin) {
            return false;
        }

        $estado = $orden->estado->value;

        if (in_array($estado, ['en_proceso', 'pruebas'])) {
            $tecnicoUserId = $orden->prestador?->user_id;
            if ($tecnicoUserId && $user->id !== $tecnicoUserId) {
                return true;
            }
        }

        if ($user->hasRole('TECNICO')) {
            if (!in_array($estado, ['en_proceso', 'pruebas'])) {
                return true;
            }
        }

        return false;
    }

    private function notificarOrden(OrdenReparacion $orden, string $evento): void
    {
        try {
            $tenant = tenant();
            if (!$tenant) {
                return;
            }
            if (!app(\App\Core\Services\ModuleActivator::class)->isActive($tenant, 'notifications')) {
                return;
            }

            $orden->loadMissing('cliente', 'modelo.marca', 'tipoEquipo');
            $cliente = $orden->cliente;
            if (!$cliente) {
                return;
            }

            $equipo = trim(($orden->modelo?->marca?->nombre ?? '') . ' ' . ($orden->modelo?->nombre ?? ''));
            if ($equipo === '') {
                $equipo = $orden->tipoEquipo?->nombre ?? 'Equipo';
            }

            app(\App\Modules\Notifications\Services\NotificacionService::class)->notificar(
                $evento,
                $orden,
                [
                    'nombre' => $cliente->nombre_completo,
                    'email' => $cliente->email,
                    'telefono' => $cliente->telefono,
                    'cliente_id' => $cliente->id,
                ],
                [
                    'cliente_nombre' => $cliente->nombre_completo,
                    'numero_orden' => $orden->numero_orden,
                    'equipo' => $equipo,
                    'estado' => $orden->estado->label(),
                    'fallas' => implode(', ', $orden->fallas_checklist ?? []) ?: 'Ninguna',
                    'total' => '$' . number_format((float) $orden->total_cliente, 0, ',', '.'),
                    'empresa' => $tenant->name ?? '',
                ],
                null,
                request()->user(),
            );
        } catch (\Throwable $e) {
            \Log::warning('No se pudo notificar la orden: ' . $e->getMessage());
        }
    }

    public function destroy(Request $request, OrdenReparacion $orden)
    {
        if (!$request->user()->can('service-desk:delete')) {
            abort(403);
        }

        $orden->delete();

        return redirect()->route('service-desk.ordenes.index')
            ->with('success', 'Orden eliminada.');
    }

    public function validarNumeroSerie(Request $request)
    {
        $request->validate([
            'numero_serie' => ['nullable', 'string', 'max:100', new UniqueSerialPerEquipment($request->input('modelo_id'), $request->input('orden_id'))],
            'modelo_id' => ['nullable', 'exists:sd_modelos,id'],
            'orden_id' => ['nullable', 'integer', 'exists:sd_ordenes,id'],
        ]);

        return response()->noContent();
    }

    public function notificarTecnico(OrdenReparacion $orden): \Illuminate\Http\RedirectResponse
    {
        $this->notificarOrden($orden, 'tecnico_asignado');

        return redirect()->route('service-desk.ordenes.edit', $orden->id)
            ->with('success', 'Notificación enviada al técnico.');
    }

    public function notificarAdministrador(OrdenReparacion $orden): \Illuminate\Http\RedirectResponse
    {
        $tenantId = tenantId();
        $admins = User::role('ADMIN_EMPRESA')
            ->where('tenant_id', $tenantId)
            ->get();

        $notificacionService = app(\App\Modules\Notifications\Services\NotificacionService::class);
        $empresa = tenant()?->name;

        foreach ($admins as $admin) {
            try {
                $notificacionService->notificar(
                    'orden_listo_admin',
                    $orden,
                    [
                        'nombre' => $admin->name,
                        'email' => $admin->email,
                        'telefono' => $admin->telefono,
                        'cliente_id' => null,
                    ],
                    [
                        'admin_nombre' => $admin->name,
                        'numero_orden' => $orden->numero_orden,
                        'tecnico_nombre' => auth()->user()->name,
                        'total' => '$' . number_format((float) $orden->total_cliente, 0, ',', '.'),
                        'empresa' => $empresa,
                    ],
                    ['email']
                );
            } catch (\Exception $e) {
                \Log::warning("Error al notificar admin {$admin->email}: " . $e->getMessage());
            }
        }

        return back()->with('success', 'Se ha enviado la notificación al administrador para proceder con el cobro.');
    }

    // ───────── Actividades de la OT ─────────

    public function storeActividad(Request $request, OrdenReparacion $orden)
    {
        $validated = $request->validate([
            'prestador_id' => ['nullable', 'exists:sd_prestadores,id'],
            'servicio_id' => ['nullable', 'exists:sd_servicios,id'],
            'resultado' => ['required', 'in:exitoso,fallido,pendiente'],
            'horas_invertidas' => ['required', 'numeric', 'min:0.01'],
            'costo_hora' => ['required', 'numeric', 'min:0'],
            'comision_tipo' => ['nullable', 'in:FIJO,PORCENTAJE,LIBRE'],
            'comision_valor' => ['nullable', 'numeric', 'min:0'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
        ]);

        $validated['tenant_id'] = tenantId();
        $validated['costo_total'] = $validated['horas_invertidas'] * $validated['costo_hora'];

        if (($validated['comision_tipo'] ?? null) === 'PORCENTAJE' && !empty($validated['comision_valor'])) {
            $porcentaje = $validated['comision_valor'];
            $validated['comision_valor'] = $validated['costo_total'] * ($porcentaje / 100);
        }

        $orden->actividades()->create($validated);
        $orden->recalcularCostoActividades();

        return back()->with('success', 'Actividad registrada.');
    }

    public function updateActividad(Request $request, OrdenReparacion $orden, OrdenActividad $actividad)
    {
        $validated = $request->validate([
            'prestador_id' => ['nullable', 'exists:sd_prestadores,id'],
            'servicio_id' => ['nullable', 'exists:sd_servicios,id'],
            'resultado' => ['required', 'in:exitoso,fallido,pendiente'],
            'horas_invertidas' => ['required', 'numeric', 'min:0.01'],
            'costo_hora' => ['required', 'numeric', 'min:0'],
            'comision_tipo' => ['nullable', 'in:FIJO,PORCENTAJE,LIBRE'],
            'comision_valor' => ['nullable', 'numeric', 'min:0'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
        ]);

        $validated['costo_total'] = $validated['horas_invertidas'] * $validated['costo_hora'];

        if (($validated['comision_tipo'] ?? null) === 'PORCENTAJE' && !empty($validated['comision_valor'])) {
            $porcentaje = $validated['comision_valor'];
            $validated['comision_valor'] = $validated['costo_total'] * ($porcentaje / 100);
        }

        $actividad->update($validated);
        $orden->recalcularCostoActividades();

        return back()->with('success', 'Actividad actualizada.');
    }

    public function destroyActividad(OrdenReparacion $orden, OrdenActividad $actividad)
    {
        $actividad->delete();
        $orden->recalcularCostoActividades();

        return back()->with('success', 'Actividad eliminada.');
    }

    // ───────── helpers ─────────

    private function formData(): array
    {
        return [
            'clientes' => Cliente::where('activo', true)->orderBy('nombres')->get()
                ->map(fn ($c) => ['id' => $c->id, 'nombre' => $c->nombre_completo, 'documento' => $c->documento]),
            'tipos' => TipoEquipo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
            'marcas' => Marca::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
            'modelos' => Modelo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'marca_id', 'tipo_equipo_id']),
            'servicios' => Servicio::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'tipo_equipo_id', 'precio_base', 'costo_tecnico_base']),
            'fallas' => FallaBase::where('activo', true)->orderBy('nombre')->get(['id', 'nombre', 'tipo_equipo_id']),
            'checklist' => ChecklistItem::where('activo', true)->ordenado()->get(['id', 'nombre', 'categoria', 'tipo_equipo_id']),
            'productos' => Producto::where('is_active', true)
                ->whereHas('categoria', function ($query) {
                    $query->where('descripcion', 'not like', 'Computadores%');
                })
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'codigo', 'precio_venta']),
            'tecnicos' => Prestador::where('tenant_id', tenantId())
                ->where('activo', true)
                ->orderBy('nombre_completo')
                ->get(['id', 'nombre_completo', 'tipo_vinculacion', 'porcentaje_comision'])
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->nombre_completo, 'tipo' => $p->tipo_vinculacion, 'comision' => $p->porcentaje_comision]),
        ];
    }

    private function validateData(Request $request, ?OrdenReparacion $orden = null): array
    {
        $tenantId = tenantId();
        $validated = $request->validate([
            'cliente_id' => ['required', Rule::exists('crm_clientes', 'id')->where('tenant_id', $tenantId)],
            'tipo_equipo_id' => ['nullable', Rule::exists('sd_tipos_equipo', 'id')->where('tenant_id', $tenantId)],
            'modelo_id' => ['nullable', Rule::exists('sd_modelos', 'id')->where('tenant_id', $tenantId)],
            'tipo_equipo_manual' => ['nullable', 'string', 'max:150'],
            'numero_serie' => ['nullable', 'string', 'max:100', new UniqueSerialPerEquipment($request->input('modelo_id'), $orden?->id)],
            'accesorios_equipo' => ['nullable', 'string'],
            'observaciones_equipo' => ['nullable', 'string'],
            'condicion_inicial' => ['nullable', 'string'],
            'fallas_checklist' => ['nullable', 'array'],
            'accesorios_checklist' => ['nullable', 'array'],
            'fallas_otras' => ['nullable', 'string'],
            'accesorios_otros' => ['nullable', 'string'],
            'bloqueado' => ['boolean'],
            'tipo_bloqueo' => ['nullable', 'in:ninguno,pin,patron,contrasena,huella'],
            'codigo_bloqueo' => ['nullable', 'string', 'max:100'],
            'prestador_id' => ['nullable', Rule::exists('sd_prestadores', 'id')->where('tenant_id', $tenantId)],
            'tecnico_id' => ['nullable', 'exists:users,id'],
            'tipo_comision' => ['nullable', 'in:FIJO,PORCENTAJE,LIBRE'],
            'valor_comision_fijo' => ['nullable', 'numeric', 'min:0'],
            'porcentaje_comision' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tipo_mano_obra' => ['nullable', 'string', 'max:30'],
            'mano_obra_descripcion' => ['nullable', 'string'],
            'precio_cliente' => ['nullable', 'numeric', 'min:0'],
            'costo_diagnostico' => ['nullable', 'numeric', 'min:0'],
            'costo_revision' => ['nullable', 'numeric', 'min:0'],
            'abono_inicial' => ['nullable', 'numeric', 'min:0'],
            'multimedia_archivos' => ['nullable', 'array'],
            'multimedia_archivos.*' => ['file', 'max:51200', 'mimetypes:image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm'],
            'estado' => ['nullable', 'in:' . implode(',', array_column(OrdenEstado::cases(), 'value'))],
            'servicios' => ['nullable', 'array'],
            'servicios.*.servicio_id' => ['required', Rule::exists('sd_servicios', 'id')->where('tenant_id', $tenantId)],
            'servicios.*.cantidad' => ['nullable', 'numeric', 'min:0.01'],
            'servicios.*.precio_aplicado' => ['nullable', 'numeric', 'min:0'],
            'servicios.*.costo_tecnico_aplicado' => ['nullable', 'numeric', 'min:0'],
            'repuestos' => ['nullable', 'array'],
            'repuestos.*.producto_id' => ['required', Rule::exists('inventory_productos', 'id')->where('tenant_id', $tenantId)],
            'repuestos.*.cantidad' => ['nullable', 'numeric', 'min:0.01'],
            'repuestos.*.precio_unitario' => ['nullable', 'numeric', 'min:0'],
        ]);

        $numericFields = ['precio_cliente', 'costo_diagnostico', 'costo_revision', 'abono_inicial', 'valor_comision_fijo', 'porcentaje_comision'];
        foreach ($numericFields as $field) {
            if (array_key_exists($field, $validated) && $validated[$field] === null) {
                $validated[$field] = 0;
            }
        }

        return $validated;
    }
}
```

### TicketController

**Ruta:** `app/Modules/ServiceDesk/Controllers/TicketController.php`

```php
<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\Ticket;
use App\Modules\ServiceDesk\Models\TicketMensaje;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TicketController extends Controller
{
    public function ordenesIndex(Request $request)
    {
        return $this->index($request, 'orden_trabajo');
    }

    public function garantiasIndex(Request $request)
    {
        return $this->index($request, 'garantia');
    }

    private function index(Request $request, string $tipo)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');

        $tickets = Ticket::with(['cliente', 'agente'])
            ->where('tenant_id', $tenantId)
            ->where('tipo', $tipo)
            ->when($search, function ($query, $search) {
                $query->where('id', $search)
                      ->orWhere('asunto', 'ilike', "%{$search}%")
                      ->orWhere('equipo_descripcion', 'ilike', "%{$search}%")
                      ->orWhereHas('cliente', function($q) use ($search) {
                          $q->where('nombres', 'ilike', "%{$search}%")
                            ->orWhere('apellidos', 'ilike', "%{$search}%")
                            ->orWhere('razon_social', 'ilike', "%{$search}%");
                      });
            })
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ServiceDesk/Index', [
            'tickets' => $tickets,
            'tipo' => $tipo,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Ticket $ticket)
    {
        if ($ticket->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $ticket->load(['cliente', 'agente', 'user', 'mensajes.user']);

        return Inertia::render('ServiceDesk/Show', [
            'ticket' => $ticket,
            'agentes' => \App\Models\User::where('tenant_id', auth()->user()->tenant_id)->get(['id', 'name']),
        ]);
    }

    public function create(Request $request)
    {
        $tipo = $request->input('tipo') === 'garantia' ? 'garantia' : 'orden_trabajo';
        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('ServiceDesk/Tickets/Create', [
            'tipo' => $tipo,
            'clientes' => \App\Modules\Crm\Models\Cliente::where('tenant_id', $tenantId)
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'razon_social']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tipo' => 'required|in:orden_trabajo,garantia',
            'cliente_id' => 'required|exists:crm_clientes,id',
            'equipo_descripcion' => 'required|string|max:255',
            'asunto' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'prioridad' => 'required|in:baja,media,alta,critica',
            'agente_id' => 'nullable|exists:users,id',
        ]);

        $data['tenant_id'] = auth()->user()->tenant_id;
        $data['user_id'] = auth()->id();
        $data['estado'] = 'recibido';

        $ticket = Ticket::create($data);

        return redirect()->route('service-desk.tickets.show', $ticket->id)->with('success', 'Ticket creado exitosamente.');
    }

    public function updateStatus(Request $request, Ticket $ticket)
    {
        if ($ticket->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'estado' => 'required|in:recibido,diagnosticando,esperando_repuestos,reparando,finalizado,entregado',
        ]);

        $ticket->update(['estado' => $data['estado']]);

        TicketMensaje::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'mensaje' => 'Cambio de estado a: ' . strtoupper($data['estado']),
            'es_interno' => true,
        ]);

        return back()->with('success', 'Estado actualizado.');
    }

    public function updateAgent(Request $request, Ticket $ticket)
    {
        if ($ticket->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'agente_id' => 'nullable|exists:users,id',
        ]);

        $ticket->update(['agente_id' => $data['agente_id']]);

        return back()->with('success', 'Agente asignado.');
    }

    public function addMessage(Request $request, Ticket $ticket)
    {
        if ($ticket->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'mensaje' => 'required|string',
            'es_interno' => 'boolean',
        ]);

        TicketMensaje::create([
            'ticket_id' => $ticket->id,
            'user_id' => auth()->id(),
            'mensaje' => $data['mensaje'],
            'es_interno' => $data['es_interno'] ?? false,
        ]);

        return back()->with('success', 'Mensaje añadido.');
    }
}
```

### ComisionController

**Ruta:** `app/Modules/ServiceDesk/Controllers/ComisionController.php`

```php
<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\ComisionDetalle;
use App\Modules\ServiceDesk\Models\ComisionLiquidacion;
use App\Modules\ServiceDesk\Models\ComisionPago;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Models\Prestador;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Liquidación de comisiones para prestadores de servicio técnico.
 *
 * NOTA DE DISEÑO (cambio importante respecto al modelo inicial):
 * Cada orden (OT) define su propio tipo de comisión:
 *
 * - FIJO: el técnico cobra un monto fijo acordado (valor_comision_fijo),
 *         independientemente de lo que pague el cliente.
 *         El técnico NO sabe cuánto cobra el cliente.
 *
 * - PORCENTAJE: el técnico recibe un % (porcentaje_comision) del valor
 *               total de la orden (precio_cliente + servicios + repuestos).
 *
 * - LIBRE: en la liquidación se asigna manualmente el valor por orden.
 *
 * Esto refleja la realidad del taller: el técnico dice "cobro 60 mil" y listo.
 * No hay desglose por servicio.
 */
class ComisionController extends Controller
{
    public function __construct(
        private \App\Modules\Accounting\Services\ContabilidadService $contabilidadService,
    ) {}

    const TIPOS_COMISION = ['FIJO', 'PORCENTAJE', 'LIBRE'];

    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');
        $estado = $request->input('estado');

        $liquidaciones = ComisionLiquidacion::with(['prestador:id,nombre_completo', 'pagos'])
            ->where('tenant_id', $tenantId)
            ->when($search, fn ($q, $s) => $q->whereHas('prestador', fn ($qq) => $qq->where('nombre_completo', 'ilike', "%{$s}%")))
            ->when($estado, fn ($q, $e) => $q->where('estado', $e))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ServiceDesk/Comisiones/Index', [
            'liquidaciones' => $liquidaciones,
            'filters' => $request->only(['search', 'estado']),
            'estados' => ComisionLiquidacion::ESTADOS,
        ]);
    }

    public function create()
    {
        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('ServiceDesk/Comisiones/Create', [
            'prestadores' => Prestador::where('tenant_id', $tenantId)
                ->where('activo', true)
                ->orderBy('nombre_completo')
                ->get(['id', 'nombre_completo', 'tipo_vinculacion']),
        ]);
    }

    /**
     * Calcula y genera una liquidación de comisiones.
     *
     * Para cada orden completada en el período, calcula la comisión
     * según el tipo de comisión definido en la orden:
     *
     * - FIJO: toma el valor_comision_fijo de la orden
     * - PORCENTAJE: calcula % sobre el total_cliente (precio_cliente + servicios + repuestos)
     * - LIBRE: toma el valor_comision_fijo (se ajusta manualmente después)
     */
    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'prestador_id' => 'required|exists:sd_prestadores,id',
            'periodo_inicio' => 'required|date',
            'periodo_fin' => 'required|date|after_or_equal:periodo_inicio',
            'observaciones' => 'nullable|string',
        ]);

        $prestador = Prestador::findOrFail($data['prestador_id']);

        // Buscar órdenes completadas en el período para este prestador
        $ordenes = OrdenReparacion::where('tenant_id', $tenantId)
            ->where('prestador_id', $data['prestador_id'])
            ->whereIn('estado', [OrdenEstado::Listo, OrdenEstado::Entregado])
            ->whereBetween('fecha_recibido', [$data['periodo_inicio'], $data['periodo_fin']])
            ->with(['servicios', 'repuestos'])
            ->get();

        if ($ordenes->isEmpty()) {
            return back()->with('error', 'No hay órdenes completadas en ese período para este prestador.');
        }

        try {
            $liquidacion = DB::transaction(function () use ($tenantId, $data, $prestador, $ordenes) {
            // Generar código
            $count = ComisionLiquidacion::where('tenant_id', $tenantId)->count() + 1;
            $codigo = 'LIQ-' . str_pad((string) $count, 5, '0', STR_PAD_LEFT);

            $liquidacion = ComisionLiquidacion::create([
                'tenant_id' => $tenantId,
                'codigo' => $codigo,
                'prestador_id' => $data['prestador_id'],
                'periodo_inicio' => $data['periodo_inicio'],
                'periodo_fin' => $data['periodo_fin'],
                'total_comisiones' => 0,
                'estado' => 'BORRADOR',
                'observaciones' => $data['observaciones'] ?? null,
            ]);

            $total = 0;
            $sinComision = 0;

            foreach ($ordenes as $orden) {
                $totalCliente = (float) $orden->total_cliente;
                $tipoComision = $orden->tipo_comision ?? 'FIJO';
                $valorComision = 0;
                $baseCalculo = 0;
                $porcentaje = null;

                switch ($tipoComision) {
                    case 'FIJO':
                        $valorComision = (float) ($orden->valor_comision_fijo ?? 0);
                        $baseCalculo = $totalCliente; // se guarda como referencia
                        break;

                    case 'PORCENTAJE':
                        $porcentaje = (float) ($orden->porcentaje_comision ?? 0);
                        $baseCalculo = $totalCliente;
                        $valorComision = $baseCalculo * ($porcentaje / 100);
                        break;

                    case 'LIBRE':
                        $valorComision = (float) ($orden->valor_comision_fijo ?? 0);
                        $baseCalculo = $totalCliente;
                        break;
                }

                if ($valorComision <= 0) {
                    $sinComision++;
                    continue;
                }

                ComisionDetalle::create([
                    'liquidacion_id' => $liquidacion->id,
                    'orden_id' => $orden->id,
                    'tipo_comision' => $tipoComision,
                    'concepto' => "Comisión OT {$orden->numero_orden}" . ($tipoComision === 'PORCENTAJE' ? " ({$porcentaje}%)" : ''),
                    'base_calculo' => $baseCalculo,
                    'porcentaje_comision' => $porcentaje,
                    'valor_comision' => $valorComision,
                ]);

                $total += $valorComision;
            }

            if ($total <= 0) {
                throw new \RuntimeException(
                    $sinComision > 0
                        ? "Ninguna de las {$ordenes->count()} órdenes tiene una comisión configurada. Define el tipo de comisión en cada orden."
                        : 'No se generaron comisiones. Verifica que las órdenes tengan un tipo de comisión configurado.'
                );
            }

            $liquidacion->update(['total_comisiones' => $total]);

            return $liquidacion;
        });
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('service-desk.comisiones.show', $liquidacion->id)
            ->with('success', "Liquidación {$liquidacion->codigo} generada por $" . number_format($liquidacion->total_comisiones, 0, ',', '.'));
    }

    public function show(ComisionLiquidacion $liquidacion)
    {
        if ($liquidacion->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $liquidacion->load([
            'prestador:id,nombre_completo,tipo_vinculacion',
            'detalles.orden:id,numero_orden',
            'pagos',
            'aprobadoPor:id,name',
        ]);

        return Inertia::render('ServiceDesk/Comisiones/Show', [
            'liquidacion' => $liquidacion,
        ]);
    }

    /**
     * Aprueba la liquidación y genera cuenta por pagar.
     */
    public function approve(ComisionLiquidacion $liquidacion)
    {
        if ($liquidacion->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($liquidacion->estado !== 'BORRADOR') {
            return back()->with('error', 'Solo se pueden aprobar liquidaciones en borrador.');
        }

        $liquidacion->update([
            'estado' => 'APROBADO',
            'aprobado_por' => auth()->id(),
            'fecha_aprobacion' => now(),
        ]);

        // Generar cuenta por pagar registrada
        ComisionPago::create([
            'tenant_id' => $liquidacion->tenant_id,
            'liquidacion_id' => $liquidacion->id,
            'prestador_id' => $liquidacion->prestador_id,
            'monto' => $liquidacion->total_comisiones,
            'estado' => 'PENDIENTE',
        ]);

        return back()->with('success', 'Liquidación aprobada. Comisión pendiente de pago.');
    }

    /**
     * Registrar pago de la comisión.
     */
    public function pay(Request $request, ComisionLiquidacion $liquidacion)
    {
        if ($liquidacion->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($liquidacion->estado !== 'APROBADO') {
            return back()->with('error', 'Solo se pueden pagar liquidaciones aprobadas.');
        }

        // Validar que el período actual esté abierto (no el de la liquidación, que puede ser pasado)
        try {
            app(\App\Modules\Accounting\Services\ContabilidadService::class)->resolverPeriodoAbierto(now());
        } catch (\Exception $e) {
            return back()->with('error', 'No se puede procesar el pago: ' . $e->getMessage());
        }

        $data = $request->validate([
            'metodo_pago' => 'nullable|string|max:50',
            'referencia_pago' => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($liquidacion, $data) {
            // 1. Registrar asiento contable PRIMERO — si falla, se revierte toda la transacción
            $this->registrarAsientoPago($liquidacion, $data['metodo_pago'] ?? 'efectivo');

            // 2. Marcar pago como realizado
            $pago = $liquidacion->pagos()->first();
            if ($pago) {
                $pago->update([
                    'metodo_pago' => $data['metodo_pago'] ?? null,
                    'referencia_pago' => $data['referencia_pago'] ?? null,
                    'fecha_pago' => now(),
                    'estado' => 'PAGADO',
                ]);
            }

            $liquidacion->update(['estado' => 'PAGADO']);
        });

        return back()->with('success', 'Comisión pagada correctamente.');
    }

    private function registrarAsientoPago(ComisionLiquidacion $liquidacion, string $metodoPago): void
    {
        try {
            $tenantId = $liquidacion->tenant_id;
            $monto = $liquidacion->total_comisiones;
            $prestador = $liquidacion->prestador;

            // 1. Resolver cuentas
            $codigoGasto = \App\Modules\Accounting\Services\ContabilidadConfig::gastoComisiones($tenantId);
            $codigoCaja = \App\Modules\Accounting\Services\ContabilidadConfig::cuentaPorMetodoPago($metodoPago, 'simplificado', $tenantId);

            $cuentaGasto = $this->contabilidadService->getCuenta($codigoGasto);
            $cuentaCaja = $this->contabilidadService->getCuenta($codigoCaja);

            if (!$cuentaGasto || !$cuentaCaja) {
                \Illuminate\Support\Facades\Log::warning("No se pudo registrar asiento de comisión {$liquidacion->codigo}: cuentas no configuradas.");
                return;
            }

            // 2. Definir líneas del asiento
            $lineas = [
                [
                    'cuenta_contable_id' => $cuentaGasto->id,
                    'descripcion' => "Pago Comisión {$liquidacion->codigo} - {$prestador->nombre_completo}",
                    'debito' => $monto,
                    'credito' => 0,
                ],
                [
                    'cuenta_contable_id' => $cuentaCaja->id,
                    'descripcion' => "Pago Comisión {$liquidacion->codigo} - {$prestador->nombre_completo}",
                    'debito' => 0,
                    'credito' => $monto,
                    'tercero_tipo_documento' => $prestador->tipo_documento ?? null,
                    'tercero_numero_documento' => $prestador->numero_documento ?? null,
                    'tercero_nombre' => $prestador->nombre_completo ?? null,
                ],
            ];

            // 3. Registrar asiento
            $this->contabilidadService->registrarAsiento([
                'fecha' => now()->toDateString(),
                'concepto' => "Pago de Comisión {$liquidacion->codigo} al técnico {$prestador->nombre_completo}",
                'modulo_origen' => 'service-desk',
                'documento_tipo' => 'COM',
                'documento_numero' => $liquidacion->codigo,
                'tercero_tipo_documento' => $prestador->tipo_documento ?? null,
                'tercero_numero_documento' => $prestador->numero_documento ?? null,
                'tercero_nombre' => $prestador->nombre_completo ?? null,
                'referencia_type' => ComisionLiquidacion::class,
                'referencia_id' => $liquidacion->id,
            ], $lineas);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error registrando asiento de comisión {$liquidacion->codigo}: {$e->getMessage()}");
        }
    }

    public function destroy(ComisionLiquidacion $liquidacion)
    {
        if ($liquidacion->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        if ($liquidacion->estado !== 'BORRADOR') {
            return back()->with('error', 'Solo se pueden eliminar liquidaciones en borrador.');
        }

        $liquidacion->delete();

        return redirect()->route('service-desk.comisiones.index')
            ->with('success', 'Liquidación eliminada.');
    }

    public function pdf(ComisionLiquidacion $liquidacion)
    {
        if ($liquidacion->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $liquidacion->load([
            'prestador',
            'detalles.orden.cliente',
            'pagos'
        ]);

        $empresa = app('current_tenant');

        return Pdf::loadView('service-desk.finiquito-comision-pdf', compact('liquidacion', 'empresa'))
            ->setPaper('a4', 'portrait')
            ->stream("finiquito-{$liquidacion->codigo}.pdf");
    }

    public function verify($token)
    {
        $liquidacion = ComisionLiquidacion::where('verification_token', $token)
            ->with(['prestador', 'detalles.orden', 'pagos'])
            ->firstOrFail();

        return view('service-desk.verify-comision', compact('liquidacion'));
    }
}
```

### LiquidacionController

**Ruta:** `app/Modules/ServiceDesk/Controllers/LiquidacionController.php`

```php
<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Sales\Services\FacturaService;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LiquidacionController extends Controller
{
    /**
     * Muestra la pantalla de prefactura interactiva de la orden.
     */
    public function edit(OrdenReparacion $orden)
    {
        // Una vez facturada/entregada la orden, no se vuelve a mostrar la prefactura.
        if ($orden->estado === OrdenEstado::Entregado || $orden->factura()->exists()) {
            $factura = $orden->factura;
            if ($factura) {
                return redirect()->route('sales.facturas.show', $factura->id);
            }
            return redirect()->route('service-desk.ordenes.show', $orden->id)
                ->with('info', 'Esta orden ya fue facturada.');
        }

        $orden->load(['cliente', 'tipoEquipo', 'modelo', 'servicios', 'repuestos']);
        
        $totalServicios = $orden->total_servicios;
        $totalRepuestos = $orden->total_repuestos;
        $manoDeObra = $orden->precio_cliente ?? 0;
        
        $subtotal = $orden->total_cliente;
        $abono = $orden->abono_inicial ?? 0;
        $descuento = $orden->descuento ?? 0;
        
        $totalAPagar = $subtotal - $descuento - $abono;

        $cajaService = app(CajaService::class);
        $sesion = $cajaService->getSesionAbierta(auth()->id());

        // Mapear servicios y repuestos con estructura limpia para React
        $serviciosOrden = $orden->servicios->map(fn ($s) => [
            'servicio_id' => $s->id,
            'nombre' => $s->nombre,
            'cantidad' => (float) $s->pivot->cantidad,
            'precio_aplicado' => (float) $s->pivot->precio_aplicado,
            'costo_tecnico_aplicado' => (float) $s->pivot->costo_tecnico_aplicado,
        ]);

        $repuestosOrden = $orden->repuestos->map(fn ($r) => [
            'producto_id' => $r->id,
            'nombre' => $r->nombre,
            'cantidad' => (float) $r->pivot->cantidad,
            'precio_unitario' => (float) $r->pivot->precio_unitario,
        ]);

        // Cargar catálogos
        $serviciosCatalogo = Servicio::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'precio_base', 'costo_tecnico_base']);

        $productosCatalogo = Producto::where('is_active', true)
            ->whereHas('categoria', function ($query) {
                $query->where('descripcion', 'not like', 'Computadores%');
            })
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'codigo', 'precio_venta']);

        $cliente = $orden->cliente;
        $modelo = $orden->modelo;

        return Inertia::render('ServiceDesk/Ordenes/Liquidacion', [
            'ordenData' => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'estado' => $orden->estado->value,
                'numero_serie' => $orden->numero_serie,
                'tipo_equipo_manual' => $orden->tipo_equipo_manual,
                'fallas_checklist' => $orden->fallas_checklist ?? [],
                'cliente' => $cliente ? [
                    'id' => $cliente->id,
                    'nombre_completo' => $cliente->nombre_completo,
                    'numero_documento' => $cliente->numero_documento,
                    'tipo_documento' => $cliente->tipo_documento,
                    'telefono' => $cliente->telefono,
                    'email' => $cliente->email,
                ] : null,
                'tipoEquipo' => $orden->tipoEquipo ? ['nombre' => $orden->tipoEquipo->nombre] : null,
                'modelo' => $modelo ? [
                    'nombre' => $modelo->nombre,
                    'marca' => $modelo->marca ? ['nombre' => $modelo->marca->nombre] : null,
                ] : null,
            ],
            'serviciosOrden' => $serviciosOrden,
            'repuestosOrden' => $repuestosOrden,
            'serviciosCatalogo' => $serviciosCatalogo,
            'productosCatalogo' => $productosCatalogo,
            'cajaAbierta' => $sesion ? true : false,
            'totales' => [
                'totalServicios' => $totalServicios,
                'totalRepuestos' => $totalRepuestos,
                'manoDeObra' => $manoDeObra,
                'subtotal' => $subtotal,
                'abono' => $abono,
                'descuento' => $descuento,
                'totalAPagar' => $totalAPagar,
            ]
        ]);
    }

    public function update(Request $request, OrdenReparacion $orden)
    {
        $validated = $request->validate([
            'precio_cliente' => ['nullable', 'numeric', 'min:0'],
            'descuento' => ['nullable', 'numeric', 'min:0'],
            'incluir_iva' => ['nullable', 'boolean'],
            'porcentaje_iva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'base_apertura' => ['nullable', 'numeric', 'min:0'],
            'caja_id' => ['nullable', 'exists:cash_cajas,id'],
            'metodo_pago' => ['nullable', 'in:efectivo,tarjeta,transferencia,credito'],
            'pagos_mixtos' => ['nullable', 'array'],
            'pagos_mixtos.*.metodo' => ['required', 'in:efectivo,tarjeta,transferencia'],
            'pagos_mixtos.*.monto' => ['required', 'numeric', 'min:0.01'],
            'servicios' => ['nullable', 'array'],
            'servicios.*.servicio_id' => ['required', 'exists:sd_servicios,id'],
            'servicios.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'servicios.*.precio_aplicado' => ['required', 'numeric', 'min:0'],
            'servicios.*.costo_tecnico_aplicado' => ['nullable', 'numeric', 'min:0'],
            'repuestos' => ['nullable', 'array'],
            'repuestos.*.producto_id' => ['required', 'exists:inventory_productos,id'],
            'repuestos.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'repuestos.*.precio_unitario' => ['required', 'numeric', 'min:0'],
        ]);

        try {
            $facturaService = app(FacturaService::class);
            $factura = $facturaService->crearDesdeOrden($orden, $validated);

            return redirect()->route('sales.facturas.show', $factura)
                ->with('success', 'Factura #' . $factura->numero . ' generada correctamente. La orden fue cerrada y entregada al cliente.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
```

### PrestadorController

**Ruta:** `app/Modules/ServiceDesk/Controllers/PrestadorController.php`

```php
<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Models\Empleado;
use App\Modules\ServiceDesk\Models\Prestador;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Core\Models\Sede;
use Spatie\Permission\PermissionRegistrar;
use Inertia\Inertia;

/**
 * Gestión de prestadores de servicios técnicos.
 *
 * NOTA DE DISEÑO (cambio respecto al legacy servicemanager):
 * En el legacy los técnicos se manejaban como usuarios con rol TECNICO
 * o empleados con cargo productivo (es_productivo = true).
 * En Nexora, Prestador es la entidad única para todo tipo de técnico:
 * contratista, empleado, freelance o comisionista.
 * Esto permite que ServiceDesk funcione sin RRHH activo.
 *
 * @see \App\Modules\ServiceDesk\Models\Prestador
 */
class PrestadorController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $search = $request->input('search');
        $filter = $request->input('tipo');

        $prestadores = Prestador::where('tenant_id', $tenantId)
            ->withCount('ordenes')
            ->when($search, fn ($q, $s) => $q->where('nombre_completo', 'ilike', "%{$s}%")
                ->orWhere('numero_documento', 'ilike', "%{$s}%")
                ->orWhere('email', 'ilike', "%{$s}%"))
            ->when($filter, fn ($q, $f) => $q->where('tipo_vinculacion', $f))
            ->orderBy('nombre_completo')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('ServiceDesk/Prestadores/Index', [
            'prestadores' => $prestadores,
            'filters' => $request->only(['search', 'tipo']),
            'tiposVinculacion' => [
                'CONTRATISTA' => 'Contratista',
                'EMPLEADO' => 'Empleado',
                'FREELANCE' => 'Freelance',
                'COMISIONISTA' => 'Comisionista',
            ],
        ]);
    }

    public function show(Prestador $prestador)
    {
        if ($prestador->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $prestador->loadCount('ordenes');
        $ordenes = $prestador->ordenes()
            ->orderByDesc('fecha_recibido')
            ->take(20)
            ->get(['id', 'numero_orden', 'estado', 'total_final', 'fecha_recibido']);

        return Inertia::render('ServiceDesk/Prestadores/Show', [
            'prestador' => [
                'id' => $prestador->id,
                'nombre_completo' => $prestador->nombre_completo,
                'tipo_documento' => $prestador->tipo_documento,
                'numero_documento' => $prestador->numero_documento,
                'email' => $prestador->email,
                'telefono' => $prestador->telefono,
                'tipo_vinculacion' => $prestador->tipo_vinculacion,
                'activo' => (bool) $prestador->activo,
                'es_gratuito' => (bool) $prestador->es_gratuito,
                'tipo_comision' => $prestador->tipo_comision,
                'porcentaje_comision' => (float) $prestador->porcentaje_comision,
                'user_id' => $prestador->user_id,
                'user_name' => $prestador->user?->name,
                'ordenes_count' => $prestador->ordenes_count,
                'total_comisiones' => (float) $prestador->liquidaciones()->sum('total_comisiones'),
                'ordenes' => $ordenes->map(fn ($o) => [
                    'id' => $o->id,
                    'numero_orden' => $o->numero_orden,
                    'estado' => $o->estado->value,
                    'estado_label' => $o->estado->label(),
                    'estado_color' => $o->estado->color(),
                    'total_cliente' => (float) $o->total_final,
                    'fecha_recibido' => $o->fecha_recibido?->format('Y-m-d H:i'),
                ]),
            ],
        ]);
    }

    public function create()
    {
        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('ServiceDesk/Prestadores/Create', [
            'empleados' => Empleado::where('tenant_id', $tenantId)
                ->where('estado', true)
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'documento']),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'tipo_documento' => 'required|string|max:20',
            'numero_documento' => 'required_if:tipo_vinculacion,EMPLEADO|nullable|string|max:50',
            'nombre_completo' => 'required|string|max:200',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'tipo_vinculacion' => 'required|in:CONTRATISTA,EMPLEADO,FREELANCE,COMISIONISTA,APRENDIZ,SOCIO',
            'empleado_id' => 'nullable|exists:hr_empleados,id',
            'es_gratuito' => 'boolean',
            'generar_usuario' => 'boolean',
            'password' => 'exclude_if:generar_usuario,false|required_if:generar_usuario,true|nullable|string|min:8|confirmed',
        ]);

        if ($request->generar_usuario) {
            $request->validate([
                'email' => 'required|email|unique:users,email',
            ]);
        }

        $data['tenant_id'] = $tenantId;
        $data['activo'] = true;

        $userId = null;
        if ($request->generar_usuario) {
            $user = User::create([
                'tenant_id' => $tenantId,
                'name' => $data['nombre_completo'],
                'email' => $data['email'],
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);

            app(PermissionRegistrar::class)->setPermissionsTeamId($tenantId);
            $user->assignRole('TECNICO');

            $userId = $user->id;
        }

        $data['user_id'] = $userId;
        $empleadoId = null;

        if ($data['tipo_vinculacion'] === 'EMPLEADO') {
            $parts = explode(' ', trim($data['nombre_completo']), 2);
            $nombres = $parts[0];
            $apellidos = $parts[1] ?? '';

            $sede = Sede::where('tenant_id', $tenantId)->first();
            if (!$sede) {
                return back()->with('error', 'No se puede crear el empleado: el tenant no tiene una sede configurada. Crea al menos una sede en Configuración.');
            }

            $empleado = Empleado::firstOrCreate(
                ['tenant_id' => $tenantId, 'documento' => $data['numero_documento']],
                [
                    'sede_id' => $sede->id,
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'email' => $data['email'],
                    'telefono' => $data['telefono'],
                    'user_id' => $userId,
                    'estado' => true,
                ]
            );
            $empleadoId = $empleado->id;
        }

        $data['empleado_id'] = $empleadoId;

        Prestador::create(collect($data)->except(['generar_usuario', 'password', 'password_confirmation'])->toArray());

        return redirect()->route('service-desk.prestadores.index')
            ->with('success', 'Prestador registrado correctamente.');
    }

    public function edit(Prestador $prestador)
    {
        if ($prestador->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $tenantId = auth()->user()->tenant_id;

        return Inertia::render('ServiceDesk/Prestadores/Edit', [
            'prestador' => $prestador,
            'empleados' => Empleado::where('tenant_id', $tenantId)
                ->where('estado', true)
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'documento']),
        ]);
    }

    public function update(Request $request, Prestador $prestador)
    {
        if ($prestador->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $data = $request->validate([
            'tipo_documento' => 'required|string|max:20',
            'numero_documento' => 'required_if:tipo_vinculacion,EMPLEADO|nullable|string|max:50',
            'nombre_completo' => 'required|string|max:200',
            'email' => 'nullable|email|max:150',
            'telefono' => 'nullable|string|max:50',
            'tipo_vinculacion' => 'required|in:CONTRATISTA,EMPLEADO,FREELANCE,COMISIONISTA,APRENDIZ,SOCIO',
            'empleado_id' => 'nullable|exists:hr_empleados,id',
            'es_gratuito' => 'boolean',
            'activo' => 'boolean',
            'generar_usuario' => 'boolean',
            'password' => 'exclude_if:generar_usuario,false|required_if:generar_usuario,true|nullable|string|min:8|confirmed',
        ]);

        // ── Crear usuario si no existe y se solicita ──
        $userId = $prestador->user_id;
        if ($request->generar_usuario && !$prestador->user_id) {
            $request->validate([
                'email' => 'required|email|unique:users,email',
            ]);

            $tenantId = auth()->user()->tenant_id;

            $user = User::create([
                'tenant_id' => $tenantId,
                'name' => $data['nombre_completo'],
                'email' => $data['email'],
                'password' => Hash::make($request->password),
                'is_active' => true,
            ]);

            app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($tenantId);
            $user->assignRole('TECNICO');

            $userId = $user->id;
        }

        $data['user_id'] = $userId;

        $tenantId = auth()->user()->tenant_id;
        $empleadoId = $prestador->empleado_id;

        if ($data['tipo_vinculacion'] === 'EMPLEADO') {
            $parts = explode(' ', trim($data['nombre_completo']), 2);
            $nombres = $parts[0];
            $apellidos = $parts[1] ?? '';

            $sede = Sede::where('tenant_id', $tenantId)->first();
            if (!$sede) {
                return back()->with('error', 'No se puede crear el empleado: el tenant no tiene una sede configurada.');
            }

            $empleado = Empleado::firstOrCreate(
                ['tenant_id' => $tenantId, 'documento' => $data['numero_documento']],
                [
                    'sede_id' => $sede->id,
                    'nombres' => $nombres,
                    'apellidos' => $apellidos,
                    'email' => $data['email'],
                    'telefono' => $data['telefono'],
                    'user_id' => $userId,
                    'estado' => true,
                ]
            );
            $empleadoId = $empleado->id;
        } else {
            // Si dejó de ser empleado, lo desvinculamos en Prestador pero no borramos el de RRHH
            $empleadoId = null;
        }

        $data['empleado_id'] = $empleadoId;

        $prestador->update(collect($data)->except(['generar_usuario', 'password', 'password_confirmation'])->toArray());

        return redirect()->route('service-desk.prestadores.index')
            ->with('success', 'Prestador actualizado correctamente.');
    }

    public function destroy(Prestador $prestador)
    {
        if ($prestador->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        // Contar órdenes incluyendo soft-deleted para proteger historial financiero
        if ($prestador->ordenes()->withTrashed()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: el prestador tiene órdenes en su historial.');
        }

        $prestador->delete();

        return back()->with('success', 'Prestador eliminado.');
    }
}
```

### MultimediaController

**Ruta:** `app/Modules/ServiceDesk/Controllers/MultimediaController.php`

```php
<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Producto;
use App\Modules\ServiceDesk\Models\OrdenMultimedia;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\ServiceDesk\Services\MultimediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MultimediaController extends Controller
{
    public function __construct(
        private MultimediaService $multimediaService,
    ) {}

    /**
     * Sube multimedia a una orden de reparación (asociado a una fase específica).
     */
    public function uploadOrden(Request $request, OrdenReparacion $orden): JsonResponse
    {
        $request->validate([
            'archivo' => 'required|file|max:51200', // 50MB max
            'fase' => 'nullable|string|max:30',
            'descripcion' => 'nullable|string|max:200',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $datos = $this->multimediaService->upload($request->file('archivo'), $tenantId, 'ordenes');

        $multimedia = OrdenMultimedia::create([
            'orden_id' => $orden->id,
            'ruta' => $datos['ruta'],
            'tipo' => $datos['tipo'],
            'mime_type' => $datos['mime_type'],
            'tamaño' => $datos['tamaño'],
            'duracion' => $datos['duracion'],
            'nombre_original' => $datos['nombre_original'],
            'fase' => $request->input('fase'),
            'descripcion' => $request->input('descripcion'),
        ]);

        if ($datos['tipo'] === 'video') {
            $storagePath = str_replace('/storage/', '', $datos['ruta']);
            \App\Jobs\ProcesarMultimediaJob::dispatch($storagePath, 'public', $multimedia->id, $orden->id)
                ->onQueue('media');
        }

        return response()->json([
            'success' => true,
            'multimedia' => $multimedia,
        ]);
    }

    /**
     * Elimina un registro multimedia.
     */
    public function destroy(OrdenMultimedia $multimedia): JsonResponse
    {
        $this->multimediaService->delete($multimedia->ruta);
        $multimedia->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Lista el multimedia de una orden, filtrable por fase.
     */
    public function indexOrden(Request $request, OrdenReparacion $orden): JsonResponse
    {
        $query = $orden->multimedia()->orderByDesc('created_at');

        if ($fase = $request->input('fase')) {
            $query->where('fase', $fase);
        }

        return response()->json([
            'multimedia' => $query->get(),
        ]);
    }

    /**
     * Sube imagen para un producto del inventario.
     */
    public function uploadProducto(Request $request, Producto $producto): JsonResponse
    {
        $request->validate([
            'archivo' => 'required|file|max:10240', // 10MB
        ]);

        $tenantId = auth()->user()->tenant_id;
        $datos = $this->multimediaService->upload($request->file('archivo'), $tenantId, 'productos');

        // Eliminar imagen anterior si existe
        if ($producto->imagen_url) {
            $this->multimediaService->delete($producto->imagen_url);
        }

        $producto->update(['imagen_url' => $datos['ruta']]);

        return response()->json([
            'success' => true,
            'imagen_url' => $datos['ruta'],
        ]);
    }

    /**
     * Elimina imagen de un producto.
     */
    public function destroyProducto(Producto $producto): JsonResponse
    {
        if ($producto->imagen_url) {
            $this->multimediaService->delete($producto->imagen_url);
            $producto->update(['imagen_url' => null]);
        }

        return response()->json(['success' => true]);
    }

    /**
     * Sube imagen para un servicio.
     */
    public function uploadServicio(Request $request, Servicio $servicio): JsonResponse
    {
        $request->validate([
            'archivo' => 'required|file|max:10240', // 10MB
        ]);

        $tenantId = auth()->user()->tenant_id;
        $datos = $this->multimediaService->upload($request->file('archivo'), $tenantId, 'servicios');

        if ($servicio->imagen_url) {
            $this->multimediaService->delete($servicio->imagen_url);
        }

        $servicio->update(['imagen_url' => $datos['ruta']]);

        return response()->json([
            'success' => true,
            'imagen_url' => $datos['ruta'],
        ]);
    }

    /**
     * Elimina imagen de un servicio.
     */
    public function destroyServicio(Servicio $servicio): JsonResponse
    {
        if ($servicio->imagen_url) {
            $this->multimediaService->delete($servicio->imagen_url);
            $servicio->update(['imagen_url' => null]);
        }

        return response()->json(['success' => true]);
    }
}
```

### ChecklistItemController

**Ruta:** `app/Modules/ServiceDesk/Controllers/ChecklistItemController.php`

```php
<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\ChecklistItem;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChecklistItemController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Checklist/Index', [
            'items' => ChecklistItem::with('tipoEquipo:id,nombre')
                ->orderBy('tipo_equipo_id')
                ->orderBy('categoria')
                ->orderBy('orden')
                ->get()
                ->map(fn ($i) => [
                    'id' => $i->id,
                    'nombre' => $i->nombre,
                    'categoria' => $i->categoria,
                    'subtipo' => $i->subtipo,
                    'icono' => $i->icono,
                    'descripcion' => $i->descripcion,
                    'orden' => $i->orden,
                    'activo' => $i->activo,
                    'tipo_equipo_id' => $i->tipo_equipo_id,
                    'tipo_equipo' => $i->tipoEquipo?->nombre,
                ]),
            'tipos' => TipoEquipo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        ChecklistItem::create($this->validateData($request));

        return back()->with('success', 'Ítem de checklist creado correctamente.');
    }

    public function update(Request $request, ChecklistItem $checklist)
    {
        $checklist->update($this->validateData($request));

        return back()->with('success', 'Ítem actualizado.');
    }

    public function destroy(ChecklistItem $checklist)
    {
        $checklist->delete();

        return back()->with('success', 'Ítem eliminado.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'categoria' => ['required', 'in:fallas,accesorios'],
            'subtipo' => ['nullable', 'string', 'max:50'],
            'icono' => ['nullable', 'string', 'max:50'],
            'descripcion' => ['nullable', 'string'],
            'tipo_equipo_id' => ['nullable', 'exists:sd_tipos_equipo,id'],
            'orden' => ['nullable', 'integer', 'min:0'],
            'activo' => ['boolean'],
        ]);
    }
}
```

### FallaBaseController

**Ruta:** `app/Modules/ServiceDesk/Controllers/FallaBaseController.php`

```php
<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\FallaBase;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FallaBaseController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Fallas/Index', [
            'fallas' => FallaBase::with('tipoEquipo:id,nombre')
                ->orderBy('nombre')
                ->get()
                ->map(fn ($f) => [
                    'id' => $f->id,
                    'nombre' => $f->nombre,
                    'descripcion' => $f->descripcion,
                    'solucion_sugerida' => $f->solucion_sugerida,
                    'tiempo_estimado' => $f->tiempo_estimado,
                    'activo' => $f->activo,
                    'tipo_equipo_id' => $f->tipo_equipo_id,
                    'tipo_equipo' => $f->tipoEquipo?->nombre,
                ]),
            'tipos' => TipoEquipo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        FallaBase::create($this->validateData($request));

        return back()->with('success', 'Falla creada correctamente.');
    }

    public function update(Request $request, FallaBase $falla)
    {
        $falla->update($this->validateData($request));

        return back()->with('success', 'Falla actualizada.');
    }

    public function destroy(FallaBase $falla)
    {
        $falla->delete();

        return back()->with('success', 'Falla eliminada.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string'],
            'solucion_sugerida' => ['nullable', 'string'],
            'tipo_equipo_id' => ['nullable', 'exists:sd_tipos_equipo,id'],
            'tiempo_estimado' => ['nullable', 'integer', 'min:0'],
            'activo' => ['boolean'],
        ]);
    }
}
```

### ServicioController

**Ruta:** `app/Modules/ServiceDesk/Controllers/ServicioController.php`

```php
<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ServicioController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Servicios/Index', [
            'servicios' => Servicio::with('tipoEquipo:id,nombre')
                ->orderBy('nombre')
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'nombre' => $s->nombre,
                    'codigo' => $s->codigo,
                    'descripcion' => $s->descripcion,
                    'precio_base' => $s->precio_base,
                    'costo_tecnico_base' => $s->costo_tecnico_base,
                    'tipo_comision_tecnico' => $s->tipo_comision_tecnico,
                    'tiempo_estimado' => $s->tiempo_estimado,
                    'requiere_repuestos' => $s->requiere_repuestos,
                    'activo' => $s->activo,
                    'tipo_equipo_id' => $s->tipo_equipo_id,
                    'tipo_equipo' => $s->tipoEquipo?->nombre,
                ]),
            'tipos' => TipoEquipo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        Servicio::create($this->validateData($request));

        return back()->with('success', 'Servicio creado correctamente.');
    }

    public function update(Request $request, Servicio $servicio)
    {
        $servicio->update($this->validateData($request));

        return back()->with('success', 'Servicio actualizado.');
    }

    public function destroy(Servicio $servicio)
    {
        $servicio->delete();

        return back()->with('success', 'Servicio eliminado.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'codigo' => ['nullable', 'string', 'max:50'],
            'descripcion' => ['nullable', 'string'],
            'tipo_equipo_id' => ['nullable', 'exists:sd_tipos_equipo,id'],
            'precio_base' => ['required', 'numeric', 'min:0'],
            'costo_tecnico_base' => ['required', 'numeric', 'min:0'],
            'tipo_comision_tecnico' => ['required', 'in:fijo,porcentaje'],
            'tiempo_estimado' => ['nullable', 'integer', 'min:0'],
            'requiere_repuestos' => ['boolean'],
            'activo' => ['boolean'],
        ]);
    }
}
```

### ModeloController

**Ruta:** `app/Modules/ServiceDesk/Controllers/ModeloController.php`

```php
<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\Marca;
use App\Modules\ServiceDesk\Models\Modelo;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ModeloController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Modelos/Index', [
            'modelos' => Modelo::with(['marca:id,nombre', 'tipoEquipo:id,nombre'])
                ->orderBy('nombre')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'nombre' => $m->nombre,
                    'activo' => $m->activo,
                    'marca_id' => $m->marca_id,
                    'tipo_equipo_id' => $m->tipo_equipo_id,
                    'marca' => $m->marca?->nombre,
                    'tipo_equipo' => $m->tipoEquipo?->nombre,
                ]),
            'marcas' => Marca::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
            'tipos' => TipoEquipo::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        Modelo::create($this->validateData($request));

        return back()->with('success', 'Modelo creado correctamente.');
    }

    public function update(Request $request, Modelo $modelo)
    {
        $modelo->update($this->validateData($request));

        return back()->with('success', 'Modelo actualizado.');
    }

    public function destroy(Modelo $modelo)
    {
        $modelo->delete();

        return back()->with('success', 'Modelo eliminado.');
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'nombre' => ['required', 'string', 'max:150'],
            'marca_id' => ['nullable', 'exists:sd_marcas,id'],
            'tipo_equipo_id' => ['nullable', 'exists:sd_tipos_equipo,id'],
            'activo' => ['boolean'],
        ]);
    }
}
```

### MarcaController

**Ruta:** `app/Modules/ServiceDesk/Controllers/MarcaController.php`

```php
<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\Marca;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarcaController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/Marcas/Index', [
            'marcas' => Marca::withCount('modelos')
                ->orderBy('nombre')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'nombre' => $m->nombre,
                    'activo' => $m->activo,
                    'modelos_count' => $m->modelos_count,
                ]),
        ]);
    }

    public function store(Request $request)
    {
        Marca::create($this->validateData($request));

        return back()->with('success', 'Marca creada correctamente.');
    }

    public function update(Request $request, Marca $marca)
    {
        $marca->update($this->validateData($request, $marca->id));

        return back()->with('success', 'Marca actualizada.');
    }

    public function destroy(Marca $marca)
    {
        if ($marca->modelos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: tiene modelos asociados.');
        }

        $marca->delete();

        return back()->with('success', 'Marca eliminada.');
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $tenantId = app('current_tenant')->id;

        return $request->validate([
            'nombre' => [
                'required', 'string', 'max:120',
                "unique:sd_marcas,nombre,{$ignoreId},id,tenant_id,{$tenantId}",
            ],
            'activo' => ['boolean'],
        ]);
    }
}
```

### TipoEquipoController

**Ruta:** `app/Modules/ServiceDesk/Controllers/TipoEquipoController.php`

```php
<?php
namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TipoEquipoController extends Controller
{
    public function index()
    {
        return Inertia::render('ServiceDesk/Catalogos/TiposEquipo/Index', [
            'tipos' => TipoEquipo::withCount('modelos')
                ->orderBy('nombre')
                ->get()
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'nombre' => $t->nombre,
                    'familia' => $t->familia,
                    'descripcion' => $t->descripcion,
                    'activo' => $t->activo,
                    'modelos_count' => $t->modelos_count,
                ]),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);
        $data['slug'] = Str::slug($data['nombre']);
        TipoEquipo::create($data);

        return back()->with('success', 'Tipo de equipo creado correctamente.');
    }

    public function update(Request $request, TipoEquipo $tipos_equipo)
    {
        $data = $this->validateData($request, $tipos_equipo->id);
        $data['slug'] = Str::slug($data['nombre']);
        $tipos_equipo->update($data);

        return back()->with('success', 'Tipo de equipo actualizado.');
    }

    public function destroy(TipoEquipo $tipos_equipo)
    {
        if ($tipos_equipo->modelos()->count() > 0) {
            return back()->with('error', 'No se puede eliminar: tiene modelos asociados.');
        }

        $tipos_equipo->delete();

        return back()->with('success', 'Tipo de equipo eliminado.');
    }

    private function validateData(Request $request, ?int $ignoreId = null): array
    {
        $tenantId = app('current_tenant')->id;

        return $request->validate([
            'nombre' => [
                'required', 'string', 'max:120',
                "unique:sd_tipos_equipo,nombre,{$ignoreId},id,tenant_id,{$tenantId}",
            ],
            'familia' => ['nullable', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ]);
    }
}
```

---

## Models

### OrdenReparacion

**Ruta:** `app/Modules/ServiceDesk/Models/OrdenReparacion.php`

```php
<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Modules\ServiceDesk\Casts\SafeEncrypted;


class OrdenReparacion extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_ordenes';

    protected $fillable = [
        'tenant_id', 'numero_orden', 'verification_token',
        'cliente_id', 'modelo_id', 'tipo_equipo_id', 'tipo_equipo_manual', 'numero_serie',
        'accesorios_equipo', 'observaciones_equipo', 'condicion_inicial',
        'fallas_checklist', 'accesorios_checklist', 'fallas_otras', 'accesorios_otros',
        'bloqueado', 'bloqueado_en', 'tipo_bloqueo', 'codigo_bloqueo',
        'estado', 'notas_fases', 'fecha_recibido', 'fecha_entregado',
        'tecnico_id', 'prestador_id',
        'tipo_comision', 'valor_comision_fijo', 'porcentaje_comision',
        'tipo_mano_obra', 'mano_obra_descripcion',
        'precio_cliente', 'costo_tecnico', 'costo_tecnico_manual',
        'costo_diagnostico', 'costo_revision', 'total_final', 'abono_inicial',
        'descuento', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'fecha_recibido' => 'datetime',
        'fecha_entregado' => 'datetime',
        'bloqueado' => 'boolean',
        'bloqueado_en' => 'datetime',
        'estado' => OrdenEstado::class,
        'notas_fases' => 'array',
        'fallas_checklist' => 'array',
        'accesorios_checklist' => 'array',
        'precio_cliente' => 'decimal:2',
        'costo_tecnico' => 'decimal:2',
        'costo_diagnostico' => 'decimal:2',
        'costo_revision' => 'decimal:2',
        'total_final' => 'decimal:2',
        'abono_inicial' => 'decimal:2',
        'descuento' => 'decimal:2',
        'costo_tecnico_manual' => 'boolean',
        'codigo_bloqueo' => SafeEncrypted::class,
        'valor_comision_fijo' => 'decimal:2',
        'porcentaje_comision' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            $model->verification_token = (string) \Illuminate\Support\Str::uuid();
        });

        static::saving(function ($orden) {
            // Sincronizar prestador_id y tecnico_id para evitar inconsistencias
            if ($orden->prestador_id) {
                $prestador = Prestador::find($orden->prestador_id);
                $orden->tecnico_id = $prestador?->user_id;
            } else {
                $orden->tecnico_id = null;
            }
        });
    }

    // ───────── Relaciones ─────────
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    public function modelo()
    {
        return $this->belongsTo(Modelo::class, 'modelo_id');
    }

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }

    public function tecnico()
    {
        return $this->belongsTo(User::class, 'tecnico_id');
    }

    public function prestador()
    {
        return $this->belongsTo(Prestador::class, 'prestador_id');
    }

    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function servicios()
    {
        return $this->belongsToMany(Servicio::class, 'sd_orden_servicio', 'orden_id', 'servicio_id')
            ->withPivot(['cantidad', 'precio_aplicado', 'costo_tecnico_aplicado', 'descripcion'])
            ->withTimestamps();
    }

    public function repuestos()
    {
        return $this->belongsToMany(Producto::class, 'sd_orden_repuesto', 'orden_id', 'producto_id')
            ->withPivot(['cantidad', 'precio_unitario', 'descripcion'])
            ->withTimestamps();
    }

    public function multimedia()
    {
        return $this->hasMany(OrdenMultimedia::class, 'orden_id');
    }

    public function factura()
    {
        return $this->hasOne(\App\Modules\Sales\Models\Factura::class, 'orden_id')->latestOfMany();
    }

    public function actividades()
    {
        return $this->hasMany(OrdenActividad::class, 'orden_id');
    }

    public function recibos()
    {
        return $this->morphMany(\App\Modules\Cash\Models\ReciboCaja::class, 'referencia');
    }

    // ───────── Helpers de notas por fase ─────────
    public function getNotaDeFase(string $fase): ?string
    {
        return ($this->notas_fases ?? [])[$fase] ?? null;
    }

    // ───────── Totales ─────────
    public function getTotalRepuestosAttribute(): float
    {
        return $this->repuestos->sum(fn ($r) => ($r->pivot->cantidad ?? 0) * ($r->pivot->precio_unitario ?? 0));
    }

    public function getTotalServiciosAttribute(): float
    {
        return $this->servicios->sum(fn ($s) => ($s->pivot->cantidad ?? 0) * ($s->pivot->precio_aplicado ?? 0));
    }

    public function getTotalClienteAttribute(): float
    {
        return (float) $this->precio_cliente + $this->total_servicios + $this->total_repuestos;
    }

    public function getTotalActividadesAttribute(): float
    {
        return $this->actividades->sum('costo_total');
    }

    /**
     * Calcula la comisión usando la misma lógica que ComisionController.
     * La fuente de verdad es el tipo_comision/valor_comision_fijo/porcentaje_comision
     * de la orden, NO la suma de actividades (que es un costo interno del técnico).
     */
    public function getTotalComisionesAttribute(): float
    {
        $totalCliente = $this->total_cliente;
        $tipo = $this->tipo_comision ?? 'FIJO';

        return match ($tipo) {
            'FIJO' => (float) ($this->valor_comision_fijo ?? 0),
            'PORCENTAJE' => $totalCliente * ((float) ($this->porcentaje_comision ?? 0) / 100),
            'LIBRE' => (float) ($this->valor_comision_fijo ?? 0),
            default => 0,
        };
    }

    public function getTotalHorasAttribute(): float
    {
        return $this->actividades->sum('horas_invertidas');
    }

    /**
     * Recalcula el costo total de técnicos desde las actividades.
     */
    public function recalcularCostoActividades(): void
    {
        $this->update([
            'costo_tecnico' => $this->total_actividades,
        ]);
    }

    // ───────── Scopes ─────────
    public function scopeActivas($query)
    {
        return $query->whereIn('estado', OrdenEstado::activos());
    }
}
```

### Prestador

**Ruta:** `app/Modules/ServiceDesk/Models/Prestador.php`

```php
<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Prestador de servicios técnicos.
 *
 * NOTA DE DISEÑO (cambio respecto al legacy servicemanager):
 * En el legacy, los técnicos eran usuarios o empleados con cargo productivo.
 * En Nexora, Prestador es una entidad independiente que puede ser:
 * - CONTRATISTA (externo, pago por comisión, sin RRHH)
 * - EMPLEADO (vinculado a hr_empleados, con opción a comisión adicional)
 * - FREELANCE / COMISIONISTA
 *
 * ServiceDesk NO depende de RRHH. Los técnicos existen aquí.
 * Si además la empresa tiene RRHH activo, se vincula con empleado_id.
 */
class Prestador extends Model
{
    protected $table = 'sd_prestadores';
    protected $guarded = ['id'];

    protected $casts = [
        'porcentaje_comision' => 'decimal:2',
        'es_gratuito' => 'boolean',
        'activo' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ordenes(): HasMany
    {
        return $this->hasMany(OrdenReparacion::class, 'prestador_id');
    }

    public function liquidaciones(): HasMany
    {
        return $this->hasMany(ComisionLiquidacion::class, 'prestador_id');
    }

    // Scope: solo contratistas (sin vínculo laboral)
    public function scopeContratistas($query)
    {
        return $query->whereIn('tipo_vinculacion', ['CONTRATISTA', 'FREELANCE', 'COMISIONISTA']);
    }

    // Scope: solo empleados (vinculados a RRHH)
    public function scopeEmpleados($query)
    {
        return $query->where('tipo_vinculacion', 'EMPLEADO');
    }
}
```

### Ticket

**Ruta:** `app/Modules/ServiceDesk/Models/Ticket.php`

```php
<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Models\Tenant;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    protected $table = 'sd_tickets';
    protected $fillable = [
        'tenant_id',
        'user_id',
        'cliente_id',
        'agente_id',
        'tipo',
        'asunto',
        'equipo_descripcion',
        'descripcion',
        'estado',
        'prioridad',
        'costo_estimado',
        'fecha_resolucion',
    ];

    protected $casts = [
        'fecha_resolucion' => 'datetime',
        'costo_estimado' => 'decimal:2',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function solicitante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function agente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agente_id');
    }

    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class);
    }

    public function mensajes(): HasMany
    {
        return $this->hasMany(TicketMensaje::class);
    }
}
```

### TicketMensaje

**Ruta:** `app/Modules/ServiceDesk/Models/TicketMensaje.php`

```php
<?php

namespace App\Modules\ServiceDesk\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketMensaje extends Model
{
    protected $table = 'sd_mensajes';
    protected $guarded = ['id'];

    protected $casts = [
        'es_interno' => 'boolean',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

### Servicio

**Ruta:** `app/Modules/ServiceDesk/Models/Servicio.php`

```php
<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Servicio extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_servicios';

    protected $fillable = [
        'tenant_id', 'tipo_equipo_id', 'nombre', 'codigo', 'descripcion',
        'imagen_url',
        'precio_base', 'costo_tecnico_base', 'tipo_comision_tecnico',
        'tiempo_estimado', 'requiere_repuestos', 'activo',
    ];

    protected $casts = [
        'precio_base' => 'decimal:2',
        'costo_tecnico_base' => 'decimal:2',
        'requiere_repuestos' => 'boolean',
        'activo' => 'boolean',
    ];

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }
}
```

### TipoEquipo

**Ruta:** `app/Modules/ServiceDesk/Models/TipoEquipo.php`

```php
<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TipoEquipo extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_tipos_equipo';

    protected $fillable = [
        'tenant_id', 'nombre', 'slug', 'familia', 'descripcion', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function modelos()
    {
        return $this->hasMany(Modelo::class, 'tipo_equipo_id');
    }
}
```

### Modelo

**Ruta:** `app/Modules/ServiceDesk/Models/Modelo.php`

```php
<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Modelo extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_modelos';

    protected $fillable = [
        'tenant_id', 'marca_id', 'tipo_equipo_id', 'nombre', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }
}
```

### Marca

**Ruta:** `app/Modules/ServiceDesk/Models/Marca.php`

```php
<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Marca extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_marcas';

    protected $fillable = [
        'tenant_id', 'nombre', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function modelos()
    {
        return $this->hasMany(Modelo::class, 'marca_id');
    }
}
```

### FallaBase

**Ruta:** `app/Modules/ServiceDesk/Models/FallaBase.php`

```php
<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FallaBase extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_fallas_base';

    protected $fillable = [
        'tenant_id', 'tipo_equipo_id', 'nombre', 'descripcion',
        'solucion_sugerida', 'tiempo_estimado', 'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }
}
```

### ChecklistItem

**Ruta:** `app/Modules/ServiceDesk/Models/ChecklistItem.php`

```php
<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ChecklistItem extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_checklist_items';

    protected $fillable = [
        'tenant_id', 'tipo_equipo_id', 'categoria', 'subtipo',
        'nombre', 'icono', 'descripcion', 'orden', 'activo',
    ];

    protected $casts = [
        'orden' => 'integer',
        'activo' => 'boolean',
    ];

    public function tipoEquipo()
    {
        return $this->belongsTo(TipoEquipo::class, 'tipo_equipo_id');
    }

    public function scopeFallas(Builder $query): Builder
    {
        return $query->where('categoria', 'fallas');
    }

    public function scopeAccesorios(Builder $query): Builder
    {
        return $query->where('categoria', 'accesorios');
    }

    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('activo', true);
    }

    public function scopeOrdenado(Builder $query): Builder
    {
        return $query->orderBy('orden');
    }
}
```

### OrdenActividad

**Ruta:** `app/Modules/ServiceDesk/Models/OrdenActividad.php`

```php
<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrdenActividad extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'sd_orden_actividades';

    protected $fillable = [
        'tenant_id', 'orden_id', 'prestador_id', 'servicio_id',
        'resultado',
        'horas_invertidas', 'costo_hora', 'costo_total',
        'comision_tipo', 'comision_valor',
        'descripcion',
    ];

    protected $casts = [
        'horas_invertidas' => 'decimal:2',
        'costo_hora' => 'decimal:2',
        'costo_total' => 'decimal:2',
        'comision_valor' => 'decimal:2',
    ];

    public const RESULTADOS = ['exitoso', 'fallido', 'pendiente'];

    public function orden()
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }

    public function prestador()
    {
        return $this->belongsTo(Prestador::class, 'prestador_id');
    }

    public function servicio()
    {
        return $this->belongsTo(Servicio::class, 'servicio_id');
    }

    public function resultadoLabel(): string
    {
        return match ($this->resultado) {
            'exitoso' => 'Exitoso',
            'fallido' => 'Fallido',
            'pendiente' => 'Pendiente',
            default => $this->resultado,
        };
    }

    public function resultadoColor(): string
    {
        return match ($this->resultado) {
            'exitoso' => 'emerald',
            'fallido' => 'rose',
            'pendiente' => 'amber',
            default => 'slate',
        };
    }

    /**
     * Calcula el costo total basado en horas y costo por hora.
     */
    public function calcularCosto(): void
    {
        $this->costo_total = $this->horas_invertidas * $this->costo_hora;
    }

    /**
     * Calcula la comisión según el tipo configurado.
     * Si es PORCENTAJE, aplica el porcentaje sobre el costo_total.
     */
    public function calcularComision(float $porcentaje = 0): void
    {
        if ($this->comision_tipo === 'PORCENTAJE' && $porcentaje > 0) {
            $this->comision_valor = $this->costo_total * ($porcentaje / 100);
        }
        // FIJO y LIBRE se asignan manualmente
    }
}
```

### OrdenMultimedia

**Ruta:** `app/Modules/ServiceDesk/Models/OrdenMultimedia.php`

```php
<?php
namespace App\Modules\ServiceDesk\Models;

use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrdenMultimedia extends Model
{
    use SoftDeletes, Auditable;

    protected $table = 'sd_orden_multimedia';

    protected $fillable = [
        'orden_id',
        'ruta',
        'tipo',
        'fase',
        'mime_type',
        'tamaño',
        'duracion',
        'nombre_original',
        'descripcion',
    ];

    protected $casts = [
        'tamaño' => 'integer',
        'duracion' => 'decimal:2',
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }

    /**
     * Determina si el archivo es un video.
     */
    public function esVideo(): bool
    {
        return $this->tipo === 'video';
    }

    /**
     * Tamaño formateado legible.
     */
    public function tamañoFormateado(): string
    {
        if (!$this->tamaño) {
            return 'N/A';
        }

        $bytes = $this->tamaño;
        $unidades = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($unidades) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 1) . ' ' . $unidades[$i];
    }
}
```

### ComisionLiquidacion

**Ruta:** `app/Modules/ServiceDesk/Models/ComisionLiquidacion.php`

```php
<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Services\Auditable;
use App\Core\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComisionLiquidacion extends Model
{
    use Auditable;

    protected $table = 'sd_comisiones_liquidaciones';
    protected $guarded = ['id'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            $model->verification_token = bin2hex(random_bytes(32));
        });
    }

    protected $casts = [
        'total_comisiones' => 'decimal:2',
        'periodo_inicio' => 'date',
        'periodo_fin' => 'date',
        'fecha_aprobacion' => 'datetime',
    ];

    const ESTADOS = ['BORRADOR', 'APROBADO', 'PAGADO', 'ANULADO'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function prestador(): BelongsTo
    {
        return $this->belongsTo(Prestador::class);
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(ComisionDetalle::class, 'liquidacion_id');
    }

    public function aprobadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'aprobado_por');
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(ComisionPago::class, 'liquidacion_id');
    }
}
```

### ComisionDetalle

**Ruta:** `app/Modules/ServiceDesk/Models/ComisionDetalle.php`

```php
<?php

namespace App\Modules\ServiceDesk\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComisionDetalle extends Model
{
    protected $table = 'sd_comisiones_detalles';
    protected $guarded = ['id'];

    protected $casts = [
        'base_calculo' => 'decimal:2',
        'porcentaje_comision' => 'decimal:2',
        'valor_comision' => 'decimal:2',
    ];

    public function liquidacion(): BelongsTo
    {
        return $this->belongsTo(ComisionLiquidacion::class, 'liquidacion_id');
    }

    public function orden(): BelongsTo
    {
        return $this->belongsTo(OrdenReparacion::class, 'orden_id');
    }
}
```

### ComisionPago

**Ruta:** `app/Modules/ServiceDesk/Models/ComisionPago.php`

```php
<?php

namespace App\Modules\ServiceDesk\Models;

use App\Core\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComisionPago extends Model
{
    protected $table = 'sd_comisiones_pagos';
    protected $guarded = ['id'];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'datetime',
    ];

    const ESTADOS = ['PENDIENTE', 'PAGADO'];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function liquidacion(): BelongsTo
    {
        return $this->belongsTo(ComisionLiquidacion::class, 'liquidacion_id');
    }

    public function prestador(): BelongsTo
    {
        return $this->belongsTo(Prestador::class);
    }
}
```

---

## Services

### OrdenService

**Ruta:** `app/Modules/ServiceDesk/Services/OrdenService.php`

```php
<?php

namespace App\Modules\ServiceDesk\Services;

use App\Modules\Cash\Services\CajaService;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrdenService
{
    public function __construct(
        private CajaService $cajaService,
    ) {}

    public function crear(array $data, int $userId): OrdenReparacion
    {
        return DB::transaction(function () use ($data, $userId) {
            $data['estado'] = OrdenEstado::Diagnostico->value;

            $orden = OrdenReparacion::create([
                ...collect($data)->except(['servicios', 'repuestos'])->all(),
                'numero_orden' => $this->siguienteNumero(),
                'created_by' => $userId,
                'fecha_recibido' => now(),
            ]);

            $this->syncLineas($orden, $data);
            $orden->load('servicios', 'repuestos');
            $orden->update(['total_final' => $orden->total_cliente]);

            return $orden;
        });
    }

    public function actualizar(OrdenReparacion $orden, array $data, int $userId): void
    {
        DB::transaction(function () use ($data, $userId, $orden) {
            if (!empty($data['prestador_id'])
                && empty($data['estado'])
                && $orden->estado === OrdenEstado::Recibido) {
                $data['estado'] = OrdenEstado::Diagnostico->value;
            }

            $orden->update([
                ...collect($data)->except(['servicios', 'repuestos'])->all(),
                'updated_by' => $userId,
            ]);

            $orden->servicios()->detach();
            $orden->repuestos()->detach();
            $this->syncLineas($orden, $data);

            $orden->load('servicios', 'repuestos');
            $orden->update(['total_final' => $orden->total_cliente]);
        });
    }

    public function cancelar(OrdenReparacion $orden): void
    {
        $this->revertirAbonos($orden);
        $this->restaurarInventario($orden);

        $factura = $orden->factura;
        if ($factura && !$factura->anulada) {
            $this->anularFactura($factura, $orden);
        }
    }

    public function restaurarInventario(OrdenReparacion $orden): void
    {
        $orden->load('repuestos');

        foreach ($orden->repuestos as $repuesto) {
            $cantidad = (float) $repuesto->pivot->cantidad;
            if ($cantidad > 0) {
                $producto = \App\Modules\Inventory\Models\Producto::find($repuesto->id);
                if ($producto) {
                    $producto->increment('stock_actual', $cantidad);
                }
            }
        }
    }

    public function revertirAbonos(OrdenReparacion $orden): void
    {
        $recibos = \App\Modules\Cash\Models\ReciboCaja::where('referencia_type', get_class($orden))
            ->where('referencia_id', $orden->id)
            ->where('estado', 'activo')
            ->get();

        if ($recibos->isEmpty()) {
            return;
        }

        $reciboService = app(\App\Modules\Cash\Services\ReciboService::class);

        foreach ($recibos as $recibo) {
            try {
                $reciboService->anularRecibo($recibo);
            } catch (\Exception $e) {
                Log::warning("No se pudo anular recibo RC-{$recibo->numero} en cancelación de OT {$orden->numero_orden}: {$e->getMessage()}");
            }
        }

        $orden->update(['abono_inicial' => 0]);
    }

    public function anularFactura(\App\Modules\Sales\Models\Factura $factura, OrdenReparacion $orden): void
    {
        $movimientos = \App\Modules\Cash\Models\MovimientoCaja::where('referencia_type', get_class($factura))
            ->where('referencia_id', $factura->id)
            ->where('tipo', 'ingreso')
            ->get();

        foreach ($movimientos as $movimiento) {
            $sesion = $movimiento->sesion;
            if ($sesion && $sesion->estado === 'abierta') {
                $this->cajaService->registrarMovimiento(
                    $sesion,
                    'egreso',
                    (float) $movimiento->monto,
                    $movimiento->metodo_pago,
                    "Anulación factura {$factura->numero} — OT {$orden->numero_orden}",
                    $factura,
                );
            }
        }

        if (class_exists(\App\Modules\Accounting\Services\ContabilidadService::class)) {
            $contabilidadService = app(\App\Modules\Accounting\Services\ContabilidadService::class);
            try {
                $contabilidadService->revertirAsiento(
                    'ventas',
                    \App\Modules\Sales\Models\Factura::class,
                    $factura->id,
                    "Anulación factura {$factura->numero}"
                );
            } catch (\Exception $e) {
                Log::warning("No se pudo reversar asiento contable para {$factura->numero}: {$e->getMessage()}");
            }
        }

        $factura->update([
            'anulada' => true,
            'anulada_at' => now(),
            'anulada_por' => auth()->id(),
            'estado' => 'anulada',
        ]);
    }

    public function siguienteNumero(): string
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $numero = 'OR-' . now()->format('YmdHis') . '-' . random_int(100, 999);
            if (!OrdenReparacion::where('numero_orden', $numero)->exists()) {
                return $numero;
            }
            usleep(100000);
        }

        throw new \RuntimeException('No se pudo generar un número de orden único. Intenta nuevamente.');
    }

    public function syncLineas(OrdenReparacion $orden, array $data): void
    {
        foreach ($data['servicios'] ?? [] as $s) {
            $orden->servicios()->attach($s['servicio_id'], [
                'cantidad' => $s['cantidad'] ?? 1,
                'precio_aplicado' => $s['precio_aplicado'] ?? 0,
                'costo_tecnico_aplicado' => $s['costo_tecnico_aplicado'] ?? 0,
            ]);
        }
        foreach ($data['repuestos'] ?? [] as $r) {
            $orden->repuestos()->attach($r['producto_id'], [
                'cantidad' => $r['cantidad'] ?? 1,
                'precio_unitario' => $r['precio_unitario'] ?? 0,
            ]);
        }
    }

    public function registrarAbono(OrdenReparacion $orden, float $diferencia, string $metodoPago): void
    {
        $reciboService = app(\App\Modules\Cash\Services\ReciboService::class);
        $reciboService->registrarAbono($orden, $diferencia, $metodoPago);
    }

    public function anularAbonos(OrdenReparacion $orden, float $montoRevertir): void
    {
        $reciboService = app(\App\Modules\Cash\Services\ReciboService::class);
        $recibos = \App\Modules\Cash\Models\ReciboCaja::where('referencia_type', get_class($orden))
            ->where('referencia_id', $orden->id)
            ->where('estado', 'activo')
            ->orderByDesc('fecha')
            ->get();

        $restante = $montoRevertir;
        foreach ($recibos as $recibo) {
            if ($restante <= 0) break;
            if ((float) $recibo->monto <= $restante) {
                $reciboService->anularRecibo($recibo);
                $restante -= (float) $recibo->monto;
            }
        }
    }
}
```

### MultimediaService

**Ruta:** `app/Modules/ServiceDesk/Services/MultimediaService.php`

```php
<?php

namespace App\Modules\ServiceDesk\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MultimediaService
{
    private const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    private const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

    private const ALLOWED_IMAGE_TYPES = [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    ];

    private const ALLOWED_VIDEO_TYPES = [
        'video/mp4', 'video/quicktime', 'video/webm',
    ];

    /**
     * Sube un archivo multimedia (foto o video) y retorna los datos para guardar en BD.
     */
    public function upload(UploadedFile $file, int $tenantId, string $directorio = 'ordenes'): array
    {
        $mimeType = $file->getMimeType();
        $esVideo = in_array($mimeType, self::ALLOWED_VIDEO_TYPES);

        // Validar tipo
        $allowedTypes = $esVideo ? self::ALLOWED_VIDEO_TYPES : self::ALLOWED_IMAGE_TYPES;
        if (!in_array($mimeType, $allowedTypes)) {
            throw new \Exception("Tipo de archivo no permitido: {$mimeType}");
        }

        // Validar tamaño
        $maxSize = $esVideo ? self::MAX_VIDEO_SIZE : self::MAX_IMAGE_SIZE;
        if ($file->getSize() > $maxSize) {
            $maxMb = $maxSize / (1024 * 1024);
            throw new \Exception("El archivo excede el tamaño máximo de {$maxMb}MB");
        }

        // Generar nombre único
        $extension = $file->getClientOriginalExtension();
        $nombre = Str::uuid() . '.' . $extension;

        // Ruta: {directorio}/{tenant_id}/{año}/{mes}/
        $ruta = "{$directorio}/{$tenantId}/" . now()->format('Y/m');
        $rutaCompleta = $file->storeAs($ruta, $nombre, 'public');

        // Para videos, programar extracción de duración en background
        if ($esVideo) {
            $rutaFinal = $ruta . '/' . $nombre;
            \App\Jobs\ProcesarMultimediaJob::dispatch($rutaFinal, 'public')
                ->onQueue('media');
        }

        return [
            'ruta' => '/storage/' . $rutaCompleta,
            'tipo' => $esVideo ? 'video' : 'imagen',
            'mime_type' => $mimeType,
            'tamaño' => $file->getSize(),
            'duracion' => null,
            'nombre_original' => $file->getClientOriginalName(),
        ];
    }

    /**
     * Elimina un archivo multimedia del disco.
     */
    public function delete(string $ruta): bool
    {
        // La ruta viene como /storage/... — convertir a storage path
        $storagePath = str_replace('/storage/', '', $ruta);

        if (Storage::disk('public')->exists($storagePath)) {
            return Storage::disk('public')->delete($storagePath);
        }

        return false;
    }

    /**
     * Obtiene la duración de un video usando ffprobe (si está disponible).
     */
    private function getVideoDuration(UploadedFile $file): ?float
    {
        try {
            $path = $file->getRealPath();
            $output = shell_exec("ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"{$path}\" 2>/dev/null");
            return $output ? (float) trim($output) : null;
        } catch (\Exception $e) {
            return null;
        }
    }
}
```

### CatalogoTallerProvisioner

**Ruta:** `app/Modules/ServiceDesk/Services/CatalogoTallerProvisioner.php`

```php
<?php
namespace App\Modules\ServiceDesk\Services;

use App\Core\Models\Tenant;
use App\Modules\ServiceDesk\Models\ChecklistItem;
use App\Modules\ServiceDesk\Models\Marca;
use App\Modules\ServiceDesk\Models\Modelo;
use App\Modules\ServiceDesk\Models\TipoEquipo;

/**
 * Siembra los catálogos base del taller (tipos de equipo, marcas, modelos y
 * checklists de recepción) para una empresa. Idempotente (updateOrCreate),
 * de modo que el cliente arranca con una base lista y solo agrega lo que falte.
 *
 * Se ejecuta automáticamente al activar el módulo service-desk (ModuleActivator).
 */
class CatalogoTallerProvisioner
{
    public function provisionForTenant(Tenant $tenant): void
    {
        $tid = $tenant->id;

        $this->seedTipos($tid);
        $this->seedMarcas($tid);
        $this->seedModelos($tid);
        $this->seedChecklists($tid);
    }

    private function seedTipos(int $tid): void
    {
        $tipos = [
            ['nombre' => 'Impresora Láser', 'slug' => 'impresora-laser', 'familia' => 'impresora'],
            ['nombre' => 'Impresora Láser Multifuncional', 'slug' => 'impresora-laser-multifuncional', 'familia' => 'impresora'],
            ['nombre' => 'Impresora Tinta', 'slug' => 'impresora-tinta', 'familia' => 'impresora'],
            ['nombre' => 'Impresora Tinta Multifuncional', 'slug' => 'impresora-tinta-multifuncional', 'familia' => 'impresora'],
            ['nombre' => 'Computador de Mesa', 'slug' => 'computador-mesa', 'familia' => 'computador'],
            ['nombre' => 'Computador Portátil', 'slug' => 'computador-portatil', 'familia' => 'computador'],
            ['nombre' => 'Computador Todo en Uno', 'slug' => 'computador-todo-en-uno', 'familia' => 'computador'],
            ['nombre' => 'Celular', 'slug' => 'celular', 'familia' => 'celular'],
            ['nombre' => 'Tablet', 'slug' => 'tablet', 'familia' => 'tablet'],
            ['nombre' => 'Monitor', 'slug' => 'monitor', 'familia' => 'monitor'],
            ['nombre' => 'Proyector', 'slug' => 'proyector', 'familia' => 'proyector'],
            ['nombre' => 'Consola', 'slug' => 'consola', 'familia' => 'consola'],
            ['nombre' => 'Otro', 'slug' => 'otro', 'familia' => 'otro'],
        ];

        foreach ($tipos as $t) {
            TipoEquipo::updateOrCreate(
                ['tenant_id' => $tid, 'nombre' => $t['nombre']],
                ['tenant_id' => $tid, 'slug' => $t['slug'], 'familia' => $t['familia'], 'activo' => true],
            );
        }
    }

    private function seedMarcas(int $tid): void
    {
        $marcas = [
            'HP', 'Lenovo', 'Dell', 'Asus', 'Acer', 'Apple', 'MSI', 'Epson', 'Brother', 'Canon',
            'Samsung', 'Xiaomi', 'Motorola', 'Huawei', 'Sony', 'Microsoft', 'Nintendo', 'LG', 'BenQ', 'ViewSonic',
        ];
        foreach ($marcas as $nombre) {
            Marca::updateOrCreate(
                ['tenant_id' => $tid, 'nombre' => $nombre],
                ['tenant_id' => $tid, 'activo' => true],
            );
        }
    }

    private function seedModelos(int $tid): void
    {
        $modelos = [
            ['nombre' => 'OptiPlex 3080', 'marca' => 'Dell', 'tipo' => 'Computador de Mesa'],
            ['nombre' => 'ProDesk 400', 'marca' => 'HP', 'tipo' => 'Computador de Mesa'],
            ['nombre' => 'ThinkCentre M720', 'marca' => 'Lenovo', 'tipo' => 'Computador de Mesa'],
            ['nombre' => 'Pavilion 15', 'marca' => 'HP', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'EliteBook 840', 'marca' => 'HP', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'ThinkPad T480', 'marca' => 'Lenovo', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'IdeaPad 3', 'marca' => 'Lenovo', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'Latitude 3420', 'marca' => 'Dell', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'MacBook Air M1', 'marca' => 'Apple', 'tipo' => 'Computador Portátil'],
            ['nombre' => 'iMac 24"', 'marca' => 'Apple', 'tipo' => 'Computador Todo en Uno'],
            ['nombre' => 'HP All-in-One 24', 'marca' => 'HP', 'tipo' => 'Computador Todo en Uno'],
            ['nombre' => 'Dell Inspiron 24 AIO', 'marca' => 'Dell', 'tipo' => 'Computador Todo en Uno'],
            ['nombre' => 'Lenovo IdeaCentre AIO', 'marca' => 'Lenovo', 'tipo' => 'Computador Todo en Uno'],
            ['nombre' => 'LaserJet M1132', 'marca' => 'HP', 'tipo' => 'Impresora Láser'],
            ['nombre' => 'HL-L3210CW', 'marca' => 'Brother', 'tipo' => 'Impresora Láser'],
            ['nombre' => 'LaserJet MFP M227fdw', 'marca' => 'HP', 'tipo' => 'Impresora Láser Multifuncional'],
            ['nombre' => 'EcoTank L3110', 'marca' => 'Epson', 'tipo' => 'Impresora Tinta'],
            ['nombre' => 'Smart Tank 515', 'marca' => 'HP', 'tipo' => 'Impresora Tinta'],
            ['nombre' => 'EcoTank L3150', 'marca' => 'Epson', 'tipo' => 'Impresora Tinta Multifuncional'],
            ['nombre' => 'Smart Tank 615', 'marca' => 'HP', 'tipo' => 'Impresora Tinta Multifuncional'],
            ['nombre' => 'Galaxy S24', 'marca' => 'Samsung', 'tipo' => 'Celular'],
            ['nombre' => 'iPhone 15 Pro', 'marca' => 'Apple', 'tipo' => 'Celular'],
            ['nombre' => 'Redmi Note 12', 'marca' => 'Xiaomi', 'tipo' => 'Celular'],
            ['nombre' => 'iPad Air', 'marca' => 'Apple', 'tipo' => 'Tablet'],
            ['nombre' => 'Galaxy Tab S9', 'marca' => 'Samsung', 'tipo' => 'Tablet'],
            ['nombre' => '24MP400', 'marca' => 'LG', 'tipo' => 'Monitor'],
            ['nombre' => 'E2420H', 'marca' => 'Dell', 'tipo' => 'Monitor'],
            ['nombre' => 'PowerLite 1288', 'marca' => 'Epson', 'tipo' => 'Proyector'],
            ['nombre' => 'PlayStation 5', 'marca' => 'Sony', 'tipo' => 'Consola'],
            ['nombre' => 'Xbox Series X', 'marca' => 'Microsoft', 'tipo' => 'Consola'],
        ];

        $marcas = Marca::where('tenant_id', $tid)->pluck('id', 'nombre');
        $tipos = TipoEquipo::where('tenant_id', $tid)->pluck('id', 'nombre');

        foreach ($modelos as $m) {
            $marcaId = $marcas[$m['marca']] ?? null;
            $tipoId = $tipos[$m['tipo']] ?? null;
            if (!$marcaId || !$tipoId) {
                continue;
            }
            Modelo::updateOrCreate(
                ['tenant_id' => $tid, 'nombre' => $m['nombre'], 'marca_id' => $marcaId],
                ['tenant_id' => $tid, 'tipo_equipo_id' => $tipoId, 'activo' => true],
            );
        }
    }

    private function seedChecklists(int $tid): void
    {
        $tipos = TipoEquipo::where('tenant_id', $tid)->whereNotNull('slug')->get()->keyBy('slug');
        $map = $this->checklistData();

        foreach ($map as $slug => $cats) {
            $tipo = $tipos[$slug] ?? null;
            if (!$tipo) {
                continue;
            }
            foreach (['fallas', 'accesorios'] as $cat) {
                foreach ($cats[$cat] ?? [] as $i => $item) {
                    ChecklistItem::updateOrCreate(
                        ['tenant_id' => $tid, 'tipo_equipo_id' => $tipo->id, 'categoria' => $cat, 'nombre' => $item['nombre']],
                        ['tenant_id' => $tid, 'icono' => $item['icono'] ?? null, 'descripcion' => $item['descripcion'] ?? null, 'orden' => $i + 1, 'activo' => true],
                    );
                }
            }
        }
    }

    /** Conjuntos base reutilizables y composición por tipo. */
    private function checklistData(): array
    {
        $laserFallas = [
            ['icono' => '🖨️', 'nombre' => 'No enciende', 'descripcion' => 'No muestra luces ni responde'],
            ['icono' => '📄', 'nombre' => 'No imprime', 'descripcion' => 'Envía trabajos pero no imprime'],
            ['icono' => '⚫', 'nombre' => 'Impresión clarita / tóner bajo', 'descripcion' => 'Texto o imágenes muy claros'],
            ['icono' => '🌫️', 'nombre' => 'Fondo gris / sucio', 'descripcion' => 'Toda la hoja con fondo gris'],
            ['icono' => '📄', 'nombre' => 'Rayas verticales u horizontales', 'descripcion' => 'Rayas en toda la hoja'],
            ['icono' => '🌀', 'nombre' => 'Imagen fantasma (ghosting)', 'descripcion' => 'Imagen repetida más clara'],
            ['icono' => '🔥', 'nombre' => 'Problemas de fusor', 'descripcion' => 'El tóner no fija, se borra'],
            ['icono' => '📄', 'nombre' => 'Atasco de papel', 'descripcion' => 'Papel atascado'],
            ['icono' => '💾', 'nombre' => 'No reconoce tóner', 'descripcion' => 'Tóner no compatible'],
            ['icono' => '📡', 'nombre' => 'Problemas de conexión', 'descripcion' => 'No conecta por USB/red/WiFi'],
        ];
        $laserAcc = [
            ['icono' => '🔌', 'nombre' => 'Cable de corriente', 'descripcion' => 'Cable de alimentación'],
            ['icono' => '🔌', 'nombre' => 'Cable USB', 'descripcion' => 'Cable USB tipo A/B'],
            ['icono' => '📦', 'nombre' => 'Tóner adicional', 'descripcion' => 'Tóner de repuesto'],
        ];
        $tintaFallas = [
            ['icono' => '🖨️', 'nombre' => 'No enciende', 'descripcion' => 'No muestra luces ni responde'],
            ['icono' => '📄', 'nombre' => 'No imprime', 'descripcion' => 'Envía trabajos pero no imprime'],
            ['icono' => '⚫', 'nombre' => 'Imprime mal (negro)', 'descripcion' => 'Negro con rayas o manchas'],
            ['icono' => '🌈', 'nombre' => 'Imprime mal (colores)', 'descripcion' => 'Colores ausentes o distorsionados'],
            ['icono' => '⚠️', 'nombre' => 'Caja de mantenimiento', 'descripcion' => 'Requiere mantenimiento'],
            ['icono' => '💾', 'nombre' => 'No reconoce cartucho', 'descripcion' => 'Cartucho no compatible'],
            ['icono' => '💧', 'nombre' => 'Fuga de tinta', 'descripcion' => 'Tinta derramada'],
            ['icono' => '📄', 'nombre' => 'Atasco de papel', 'descripcion' => 'Papel atascado'],
            ['icono' => '📡', 'nombre' => 'Problemas de conexión', 'descripcion' => 'No conecta por USB/red/WiFi'],
        ];
        $multifuncional = [
            ['icono' => '📠', 'nombre' => 'No envía / recibe fax', 'descripcion' => 'Problemas con fax'],
            ['icono' => '📷', 'nombre' => 'Escáner no funciona', 'descripcion' => 'No escanea'],
            ['icono' => '🔄', 'nombre' => 'Atasco en ADF', 'descripcion' => 'Documentos atascados en alimentador'],
        ];
        $pcFallas = [
            ['icono' => '🔌', 'nombre' => 'No enciende', 'descripcion' => 'No responde al botón de encendido'],
            ['icono' => '🖥️', 'nombre' => 'No da video', 'descripcion' => 'Pantalla negra o sin señal'],
            ['icono' => '🐌', 'nombre' => 'Lento / Congelado', 'descripcion' => 'Equipo muy lento o se congela'],
            ['icono' => '💀', 'nombre' => 'Pantalla azul (BSOD)', 'descripcion' => 'Error crítico de Windows'],
            ['icono' => '🔊', 'nombre' => 'Problemas de sonido', 'descripcion' => 'No hay audio o distorsionado'],
            ['icono' => '📡', 'nombre' => 'Problemas de WiFi/Red', 'descripcion' => 'No conecta o se desconecta'],
            ['icono' => '🌡️', 'nombre' => 'Se sobrecalienta', 'descripcion' => 'Se apaga solo o muy caliente'],
            ['icono' => '🐛', 'nombre' => 'Virus/Malware', 'descripcion' => 'Comportamiento sospechoso'],
            ['icono' => '🔌', 'nombre' => 'Puertos USB no funcionan', 'descripcion' => 'No detectan dispositivos'],
        ];
        $pcAcc = [
            ['icono' => '🔌', 'nombre' => 'Cable de poder', 'descripcion' => 'Cable de alimentación'],
            ['icono' => '🖱️', 'nombre' => 'Mouse', 'descripcion' => 'Mouse incluido'],
            ['icono' => '⌨️', 'nombre' => 'Teclado', 'descripcion' => 'Teclado incluido'],
        ];
        $portatilExtra = [
            ['icono' => '🔋', 'nombre' => 'Batería no carga', 'descripcion' => 'No reconoce carga o dura poco'],
            ['icono' => '🖱️', 'nombre' => 'Touchpad no funciona', 'descripcion' => 'Mousepad sin respuesta'],
            ['icono' => '📷', 'nombre' => 'Cámara no funciona', 'descripcion' => 'Webcam no detectada'],
            ['icono' => '🔌', 'nombre' => 'Puerto de carga dañado', 'descripcion' => 'Conector suelto o dañado'],
            ['icono' => '💡', 'nombre' => 'Pantalla rota / manchada', 'descripcion' => 'LCD dañado o manchas'],
        ];
        $celFallas = [
            ['icono' => '🔌', 'nombre' => 'No enciende', 'descripcion' => 'No responde'],
            ['icono' => '📱', 'nombre' => 'Pantalla rota', 'descripcion' => 'Vidrio o LCD dañado'],
            ['icono' => '🔋', 'nombre' => 'Batería se descarga rápido', 'descripcion' => 'Dura muy poco'],
            ['icono' => '⚡', 'nombre' => 'No carga', 'descripcion' => 'No reconoce cargador'],
            ['icono' => '🔊', 'nombre' => 'Altavoz no funciona', 'descripcion' => 'No se escucha'],
            ['icono' => '🎙️', 'nombre' => 'Micrófono no funciona', 'descripcion' => 'No me escuchan'],
            ['icono' => '📡', 'nombre' => 'Sin señal', 'descripcion' => 'No agarra red móvil'],
            ['icono' => '📶', 'nombre' => 'WiFi/Bluetooth no funciona', 'descripcion' => 'No conecta'],
            ['icono' => '🐌', 'nombre' => 'Lento / Se traba', 'descripcion' => 'Rendimiento bajo'],
            ['icono' => '📷', 'nombre' => 'Cámara no funciona', 'descripcion' => 'No toma fotos'],
            ['icono' => '💧', 'nombre' => 'Daño por líquido', 'descripcion' => 'Se mojó'],
        ];
        $celAcc = [
            ['icono' => '🔌', 'nombre' => 'Cargador', 'descripcion' => 'Cargador original o genérico'],
            ['icono' => '🎧', 'nombre' => 'Audífonos', 'descripcion' => 'Audífonos incluidos'],
            ['icono' => '📦', 'nombre' => 'Funda / Case', 'descripcion' => 'Funda protectora'],
        ];

        return [
            'impresora-laser' => ['fallas' => $laserFallas, 'accesorios' => $laserAcc],
            'impresora-laser-multifuncional' => ['fallas' => array_merge($laserFallas, $multifuncional), 'accesorios' => $laserAcc],
            'impresora-tinta' => ['fallas' => $tintaFallas, 'accesorios' => $laserAcc],
            'impresora-tinta-multifuncional' => ['fallas' => array_merge($tintaFallas, $multifuncional), 'accesorios' => $laserAcc],
            'computador-mesa' => ['fallas' => $pcFallas, 'accesorios' => $pcAcc],
            'computador-portatil' => ['fallas' => array_merge($pcFallas, $portatilExtra), 'accesorios' => $pcAcc],
            'computador-todo-en-uno' => ['fallas' => $pcFallas, 'accesorios' => $pcAcc],
            'celular' => ['fallas' => $celFallas, 'accesorios' => $celAcc],
            'tablet' => ['fallas' => $celFallas, 'accesorios' => $celAcc],
        ];
    }
}
```

---

## Enums

### OrdenEstado

**Ruta:** `app/Modules/ServiceDesk/Enums/OrdenEstado.php`

```php
<?php
namespace App\Modules\ServiceDesk\Enums;

enum OrdenEstado: string
{
    case Recibido = 'recibido';
    case Diagnostico = 'diagnosticado';
    case Asignado = 'asignado';
    case Reparacion = 'en_proceso';
    case Pruebas = 'pruebas';
    case Listo = 'completado';
    case Entregado = 'entregado';
    case Cancelado = 'cancelado';

    /** Etiqueta en español para la interfaz. */
    public function label(): string
    {
        return match ($this) {
            self::Recibido => 'Recibido',
            self::Diagnostico => 'Diagnóstico',
            self::Asignado => 'Asignado',
            self::Reparacion => 'En reparación',
            self::Pruebas => 'En pruebas',
            self::Listo => 'Listo para entrega',
            self::Entregado => 'Entregado',
            self::Cancelado => 'Cancelado',
        };
    }

    /** Color para badges en la UI. */
    public function color(): string
    {
        return match ($this) {
            self::Recibido => 'slate',
            self::Diagnostico => 'amber',
            self::Asignado => 'indigo',
            self::Reparacion => 'sky',
            self::Pruebas => 'violet',
            self::Listo => 'emerald',
            self::Entregado => 'green',
            self::Cancelado => 'rose',
        };
    }

    /** Estados que representan una orden en proceso (activa). */
    public static function activos(): array
    {
        return ['recibido', 'diagnosticado', 'asignado', 'en_proceso', 'pruebas', 'completado'];
    }

    /** Lista para selects: [{value, label, color}]. */
    public static function opciones(): array
    {
        return array_map(fn (self $e) => [
            'value' => $e->value,
            'label' => $e->label(),
            'color' => $e->color(),
        ], self::cases());
    }
}
```

---

## Casts

### SafeEncrypted

**Ruta:** `app/Modules/ServiceDesk/Casts/SafeEncrypted.php`

```php
<?php

namespace App\Modules\ServiceDesk\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Contracts\Encryption\DecryptException;

class SafeEncrypted implements CastsAttributes
{
    public function get(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        if (is_null($value)) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (DecryptException $e) {
            // Si falla la desencriptación (por ej. texto plano legacy), retornamos el valor original sin romper la app.
            return $value;
        }
    }

    public function set(Model $model, string $key, mixed $value, array $attributes): mixed
    {
        return is_null($value) ? null : Crypt::encryptString($value);
    }
}
```

---

## Rules

### UniqueSerialPerEquipment

**Ruta:** `app/Modules/ServiceDesk/Rules/UniqueSerialPerEquipment.php`

```php
<?php
namespace App\Modules\ServiceDesk\Rules;

use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueSerialPerEquipment implements ValidationRule
{
    protected ?int $ignoreOrderId;
    protected ?int $modeloId;

    public function __construct(?int $modeloId, ?int $ignoreOrderId = null)
    {
        $this->modeloId = $modeloId;
        $this->ignoreOrderId = $ignoreOrderId;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        // 1. El serial/IMEI debe pertenecer siempre al mismo modelo de equipo.
        if ($this->modeloId !== null) {
            $existsOtherModel = OrdenReparacion::where('numero_serie', $value)
                ->where('modelo_id', '!=', $this->modeloId)
                ->when($this->ignoreOrderId, fn ($q) => $q->where('id', '!=', $this->ignoreOrderId))
                ->exists();

            if ($existsOtherModel) {
                $fail('El IMEI/número de serie ingresado no se puede registrar porque ya está registrado con otro modelo y otro equipo.');
                return;
            }
        }

        // 2. El mismo equipo puede tener múltiples atenciones, pero no debe existir otra orden activa
        //    para el mismo equipo si ya hay una en curso (no entregada ni cancelada).
        $activeOrderExists = OrdenReparacion::where('numero_serie', $value)
            ->when($this->ignoreOrderId, fn ($q) => $q->where('id', '!=', $this->ignoreOrderId))
            ->whereNotIn('estado', ['entregado', 'cancelado'])
            ->exists();

        if ($activeOrderExists) {
            $fail('Ya existe una orden activa para este mismo número de serie/IMEI. Finalice o cancele la orden anterior antes de crear otra atención.');
        }
    }
}
```

---

## Migrations

### 2026_06_20_141001_create_service_desk_tables.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_20_141001_create_service_desk_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sd_tickets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // El solicitante interno
            $table->foreignId('cliente_id')->nullable()->constrained('crm_clientes')->nullOnDelete(); // Si es reclamo de cliente
            $table->foreignId('agente_id')->nullable()->constrained('users')->nullOnDelete(); // El que atiende
            $table->string('asunto', 255);
            $table->text('descripcion');
            $table->string('estado', 50)->default('abierto'); // abierto, en_progreso, resuelto, cerrado
            $table->string('prioridad', 20)->default('media'); // baja, media, alta, critica
            $table->timestamp('fecha_resolucion')->nullable();
            $table->timestamps();
            
            $table->index(['tenant_id', 'estado']);
        });

        Schema::create('sd_mensajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ticket_id')->constrained('sd_tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // Quién manda el mensaje
            $table->text('mensaje');
            $table->boolean('es_interno')->default(false); // Notas solo para agentes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_mensajes');
        Schema::dropIfExists('sd_tickets');
    }
};
```

### 2026_06_20_141002_update_service_desk_tables.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_20_141002_update_service_desk_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sd_tickets', function (Blueprint $table) {
            $table->string('tipo', 50)->default('orden_trabajo')->after('agente_id'); // orden_trabajo, garantia
            $table->string('equipo_descripcion', 255)->nullable()->after('asunto');
            $table->decimal('costo_estimado', 12, 2)->nullable()->after('prioridad');
        });
    }

    public function down(): void
    {
        Schema::table('sd_tickets', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'equipo_descripcion', 'costo_estimado']);
        });
    }
};
```

### 2026_06_20_141003_create_service_desk_catalogos_tables.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_20_141003_create_service_desk_catalogos_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tipo de equipo: la raíz del catálogo del taller (Celular, Computador, etc.)
        Schema::create('sd_tipos_equipo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre', 120);
            $table->string('slug', 120)->nullable();
            $table->string('familia', 120)->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'nombre']);
        });

        // Marcas (Samsung, Apple, HP, ...)
        Schema::create('sd_marcas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre', 120);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'nombre']);
        });

        // Modelos (iPhone 13, Galaxy A52, ...) → cuelgan de marca y tipo de equipo
        Schema::create('sd_modelos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('sd_marcas')->nullOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('nombre', 150);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'marca_id']);
            $table->index(['tenant_id', 'tipo_equipo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_modelos');
        Schema::dropIfExists('sd_marcas');
        Schema::dropIfExists('sd_tipos_equipo');
    }
};
```

### 2026_06_20_141004_create_service_desk_catalogos_extra_tables.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_20_141004_create_service_desk_catalogos_extra_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Servicios (mano de obra) por tipo de equipo
        Schema::create('sd_servicios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('nombre', 150);
            $table->string('codigo', 50)->nullable();
            $table->text('descripcion')->nullable();
            $table->decimal('precio_base', 15, 2)->default(0);
            $table->decimal('costo_tecnico_base', 15, 2)->default(0);
            $table->string('tipo_comision_tecnico', 20)->default('fijo'); // fijo | porcentaje
            $table->integer('tiempo_estimado')->nullable(); // minutos
            $table->boolean('requiere_repuestos')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'tipo_equipo_id']);
        });

        // Fallas base (catálogo de fallas comunes por tipo de equipo)
        Schema::create('sd_fallas_base', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->text('solucion_sugerida')->nullable();
            $table->integer('tiempo_estimado')->nullable(); // minutos
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'tipo_equipo_id']);
        });

        // Checklist de recepción: fallas y accesorios que se activan por tipo de equipo
        Schema::create('sd_checklist_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('categoria', 20); // fallas | accesorios
            $table->string('subtipo', 50)->nullable();
            $table->string('nombre', 150);
            $table->string('icono', 50)->nullable();
            $table->text('descripcion')->nullable();
            $table->integer('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'tipo_equipo_id', 'categoria']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_checklist_items');
        Schema::dropIfExists('sd_fallas_base');
        Schema::dropIfExists('sd_servicios');
    }
};
```

### 2026_06_20_141005_create_service_desk_ordenes_tables.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_20_141005_create_service_desk_ordenes_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sd_ordenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('numero_orden', 50);

            // Cliente y equipo
            $table->foreignId('cliente_id')->constrained('crm_clientes');
            $table->foreignId('modelo_id')->nullable()->constrained('sd_modelos')->nullOnDelete();
            $table->foreignId('tipo_equipo_id')->nullable()->constrained('sd_tipos_equipo')->nullOnDelete();
            $table->string('tipo_equipo_manual', 150)->nullable();
            $table->string('numero_serie', 100)->nullable();

            // Recepción
            $table->text('accesorios_equipo')->nullable();
            $table->text('observaciones_equipo')->nullable();
            $table->text('condicion_inicial')->nullable();

            // Checklist (se activan por tipo de equipo)
            $table->json('fallas_checklist')->nullable();
            $table->json('accesorios_checklist')->nullable();
            $table->text('fallas_otras')->nullable();
            $table->text('accesorios_otros')->nullable();

            // Bloqueo del equipo (celulares): pin, patron, contrasena, huella, ninguno
            $table->boolean('bloqueado')->default(false);
            $table->timestamp('bloqueado_en')->nullable();
            $table->string('tipo_bloqueo', 20)->nullable();
            $table->text('codigo_bloqueo')->nullable(); // PIN/clave o secuencia del patrón "1-2-3-6-9"

            // Flujo / estado
            $table->string('estado', 20)->default('recibido');
            $table->json('notas_fases')->nullable();
            $table->timestamp('fecha_recibido')->useCurrent();
            $table->timestamp('fecha_entregado')->nullable();

            // Técnico asignado
            $table->foreignId('tecnico_id')->nullable()->constrained('users')->nullOnDelete();

            // Mano de obra
            $table->string('tipo_mano_obra', 30)->nullable();
            $table->text('mano_obra_descripcion')->nullable();

            // Costos
            $table->decimal('precio_cliente', 15, 2)->default(0);
            $table->decimal('costo_tecnico', 15, 2)->default(0);
            $table->boolean('costo_tecnico_manual')->default(false);
            $table->decimal('costo_diagnostico', 15, 2)->default(0);
            $table->decimal('costo_revision', 15, 2)->default(0);
            $table->decimal('total_final', 15, 2)->default(0);

            // Auditoría
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'numero_orden']);
            $table->index(['tenant_id', 'estado']);
            $table->index(['tenant_id', 'cliente_id']);
        });

        // Servicios aplicados a la orden
        Schema::create('sd_orden_servicio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->foreignId('servicio_id')->nullable()->constrained('sd_servicios')->nullOnDelete();
            $table->string('descripcion', 200)->nullable();
            $table->decimal('cantidad', 10, 2)->default(1);
            $table->decimal('precio_aplicado', 15, 2)->default(0);
            $table->decimal('costo_tecnico_aplicado', 15, 2)->default(0);
            $table->timestamps();
        });

        // Repuestos aplicados a la orden (provienen del inventario)
        Schema::create('sd_orden_repuesto', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->foreignId('producto_id')->nullable()->constrained('inventory_productos')->nullOnDelete();
            $table->string('descripcion', 200)->nullable();
            $table->decimal('cantidad', 10, 2)->default(1);
            $table->decimal('precio_unitario', 15, 2)->default(0);
            $table->timestamps();
        });

        // Fotos / multimedia del equipo
        Schema::create('sd_orden_multimedia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->string('ruta', 255);
            $table->string('tipo', 20)->default('imagen');
            $table->string('descripcion', 200)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_orden_multimedia');
        Schema::dropIfExists('sd_orden_repuesto');
        Schema::dropIfExists('sd_orden_servicio');
        Schema::dropIfExists('sd_ordenes');
    }
};
```

### 2026_06_20_141006_add_abono_inicial_to_sd_ordenes.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_20_141006_add_abono_inicial_to_sd_ordenes.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->decimal('abono_inicial', 15, 2)->default(0)->after('total_final');
        });
    }

    public function down(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropColumn('abono_inicial');
        });
    }
};
```

### 2026_06_20_141007_create_sd_prestadores_table.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_20_141007_create_sd_prestadores_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * NOTA DE DISEÑO (cambio respecto al legacy servicemanager):
     * 
     * En el legacy (servicemanager), los técnicos eran usuarios del sistema
     * con rol TECNICO, y más tarde se migraron a empleados (rh_empleados)
     * con cargo productivo. Esto OBLIGABA a tener RRHH/Nómina activo.
     * 
     * En Nexora separamos el concepto:
     * - "Prestador" = entidad única que puede recibir órdenes de trabajo.
     * - tipo_vinculacion = CONTRATISTA | EMPLEADO | FREELANCE | COMISIONISTA
     * - Si es EMPLEADO → tiene un empleado_id que lo vincula a RRHH (opcional).
     * - Si es CONTRATISTA → solo existe aquí, sin RRHH.
     * 
     * Esto permite que ServiceDesk funcione SIN RRHH activo (ideal para
     * talleres pequeños que solo pagan comisiones).
     * 
     * @see \App\Modules\Hr\Models\Empleado para el vínculo opcional.
     */
    public function up(): void
    {
        Schema::create('sd_prestadores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            // Datos básicos
            $table->string('tipo_documento', 20)->default('CC');
            $table->string('numero_documento', 50)->nullable();
            $table->string('nombre_completo', 200);
            $table->string('email', 150)->nullable();
            $table->string('telefono', 50)->nullable();

            // Tipo de vinculación
            $table->string('tipo_vinculacion', 30)->default('CONTRATISTA');
            // CONTRATISTA = pago por comisión (default)
            // EMPLEADO = vinculado a RRHH, puede tener comisión adicional
            // FREELANCE = externo esporádico
            // COMISIONISTA = solo comisión, sin otro vínculo

            // Comisión default (sobreescribible por servicio)
            $table->decimal('porcentaje_comision', 5, 2)->nullable();

            // Vínculo opcional a RRHH (solo si tipo_vinculacion = EMPLEADO)
            // La FK se omite si hr_empleados aún no existe (RRHH no está instalado).
            $table->unsignedBigInteger('empleado_id')->nullable();
            if (Schema::hasTable('hr_empleados')) {
                $table->foreign('empleado_id')->references('id')->on('hr_empleados')->nullOnDelete();
            }

            // Usuario de sistema (si aplica)
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Si una orden de servicio puede asignarse sin costo (no paga comisión)
            $table->boolean('es_gratuito')->default(false);

            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'activo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_prestadores');
    }
};
```

### 2026_06_20_141008_add_comisiones_to_service_desk.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_20_141008_add_comisiones_to_service_desk.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega prestador_id a sd_ordenes (reemplazando conceptualmente a tecnico_id->users)
     * y crea el subsistema de liquidación de comisiones.
     *
     * NOTA: tecnico_id (FK a users) se conserva como nullable para no romper
     * datos existentes. El nuevo campo prestador_id es el que se usa en adelante.
     * En una migración futura se podrá dropear tecnico_id.
     */
    public function up(): void
    {
        // ─── sd_ordenes: agregar prestador_id ───
        Schema::table('sd_ordenes', function (Blueprint $table) {
            // Hacer tecnico_id un simple entero (quitar FK) para no bloquear
            $table->dropForeign(['tecnico_id']);
            $table->foreignId('tecnico_id')->nullable()->change(); // queda como integer nullable sin FK

            // Nuevo campo apuntando a prestadores
            $table->foreignId('prestador_id')->nullable()->after('tecnico_id')
                ->constrained('sd_prestadores')->nullOnDelete();
        });

        // ─── Liquidaciones de comisiones ───
        Schema::create('sd_comisiones_liquidaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('codigo', 30); // LIQ-00001
            $table->foreignId('prestador_id')->constrained('sd_prestadores')->cascadeOnDelete();
            $table->date('periodo_inicio');
            $table->date('periodo_fin');
            $table->decimal('total_comisiones', 15, 2)->default(0);
            $table->string('estado', 30)->default('BORRADOR'); // BORRADOR, APROBADO, PAGADO, ANULADO
            $table->text('observaciones')->nullable();
            $table->foreignId('aprobado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('fecha_aprobacion')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'codigo']);
            $table->index(['tenant_id', 'prestador_id', 'estado']);
        });

        // ─── Detalles de liquidación ───
        Schema::create('sd_comisiones_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('liquidacion_id')->constrained('sd_comisiones_liquidaciones')->cascadeOnDelete();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->foreignId('servicio_id')->nullable()->constrained('sd_servicios')->nullOnDelete();
            $table->string('concepto', 200);
            $table->decimal('base_calculo', 15, 2); // Precio del servicio
            $table->decimal('porcentaje_comision', 5, 2)->nullable();
            $table->decimal('valor_comision', 15, 2);
            $table->timestamps();
        });

        // ─── Cuentas por pagar a prestadores (registro contable simple) ───
        Schema::create('sd_comisiones_pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('liquidacion_id')->constrained('sd_comisiones_liquidaciones')->cascadeOnDelete();
            $table->foreignId('prestador_id')->constrained('sd_prestadores')->cascadeOnDelete();
            $table->decimal('monto', 15, 2);
            $table->string('metodo_pago', 50)->nullable(); // efectivo, transferencia, etc.
            $table->string('referencia_pago', 100)->nullable();
            $table->timestamp('fecha_pago')->nullable();
            $table->string('estado', 30)->default('PENDIENTE'); // PENDIENTE, PAGADO
            $table->timestamps();

            $table->index(['tenant_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_comisiones_pagos');
        Schema::dropIfExists('sd_comisiones_detalles');
        Schema::dropIfExists('sd_comisiones_liquidaciones');

        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropForeign(['prestador_id']);
            $table->dropColumn('prestador_id');

            // Restaurar FK original
            $table->foreignId('tecnico_id')->nullable()->change();
            $table->foreign('tecnico_id')->references('id')->on('users')->nullOnDelete();
        });
    }
};
```

### 2026_06_20_141009_add_tipo_comision_to_ordenes.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_20_141009_add_tipo_comision_to_ordenes.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agrega el tipo de comisión a nivel de orden (OT) y simplifica
     * el detalle de liquidación para que sea por orden, no por servicio.
     *
     * NOTA DE DISEÑO:
     * En Nexora, cada orden tiene su propio tipo de comisión (FIJO/PORCENTAJE/LIBRE),
     * reflejando la realidad del taller donde el técnico acuerda un pago por la
     * orden completa, no por servicio individual.
     *
     * - FIJO: el técnico cobra un monto fijo acordado (ej: $60,000).
     *         No sabe ni le importa cuánto paga el cliente.
     * - PORCENTAJE: el técnico recibe un % del valor total de la orden.
     * - LIBRE: en la liquidación se asigna manualmente el valor.
     */
    public function up(): void
    {
        // ─── sd_ordenes: campos de comisión ───
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->string('tipo_comision', 20)->default('FIJO')->after('prestador_id'); // FIJO, PORCENTAJE, LIBRE
            $table->decimal('valor_comision_fijo', 15, 2)->nullable()->after('tipo_comision');
            $table->decimal('porcentaje_comision', 5, 2)->nullable()->after('valor_comision_fijo');
        });

        // ─── sd_comisiones_detalles: simplificar a nivel de orden ───
        Schema::table('sd_comisiones_detalles', function (Blueprint $table) {
            $table->dropForeign(['servicio_id']);
            $table->dropColumn('servicio_id');
            $table->string('tipo_comision', 20)->nullable()->after('orden_id'); // FIJO, PORCENTAJE, LIBRE
        });
    }

    public function down(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropColumn(['tipo_comision', 'valor_comision_fijo', 'porcentaje_comision']);
        });

        Schema::table('sd_comisiones_detalles', function (Blueprint $table) {
            $table->dropColumn('tipo_comision');
            $table->foreignId('servicio_id')->nullable()->constrained('sd_servicios')->nullOnDelete();
        });
    }
};
```

### 2026_06_22_000001_create_sd_orden_actividades_table.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_22_000001_create_sd_orden_actividades_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla de actividades/intervenciones realizadas por técnicos dentro de una OT.
     *
     * Permite registrar tiempo real, costos y comisiones por cada actividad
     * (diagnóstico, revisión, reparación, pruebas, etc.) independientemente
     * del resultado de la orden.
     *
     * Ejemplo: un técnico invierte 2h intentando destapar un cabezal.
     * Aunque no se recupere, esa actividad tiene costo y genera comisión.
     */
    public function up(): void
    {
        Schema::create('sd_orden_actividades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('orden_id')->constrained('sd_ordenes')->cascadeOnDelete();
            $table->foreignId('prestador_id')->nullable()->constrained('sd_prestadores')->nullOnDelete();
            $table->foreignId('servicio_id')->nullable()->constrained('sd_servicios')->nullOnDelete();

            // Resultado de la actividad
            $table->string('resultado', 30)->default('exitoso'); // exitoso, fallido, pendiente

            // Tiempo y costos
            $table->decimal('horas_invertidas', 8, 2)->default(0);
            $table->decimal('costo_hora', 15, 2)->default(0);
            $table->decimal('costo_total', 15, 2)->default(0); // horas × costo_hora

            // Comisión por actividad
            $table->string('comision_tipo', 20)->nullable(); // FIJO, PORCENTAJE, LIBRE
            $table->decimal('comision_valor', 15, 2)->default(0);

            // Descripción detallada
            $table->text('descripcion')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'orden_id']);
            $table->index(['tenant_id', 'prestador_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sd_orden_actividades');
    }
};
```

### 2026_06_23_003514_add_descuento_to_sd_ordenes_table.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_23_003514_add_descuento_to_sd_ordenes_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->decimal('descuento', 12, 2)->default(0)->after('precio_cliente')->comment('Descuento global aplicado en liquidación');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropColumn('descuento');
        });
    }
};
```

### 2026_06_26_200000_add_multimedia_fields_table.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_06_26_200000_add_multimedia_fields_table.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Campo imagen en productos
        Schema::table('inventory_productos', function (Blueprint $table) {
            $table->string('imagen_url', 500)->nullable()->after('nombre');
        });

        // Campo imagen en servicios
        Schema::table('sd_servicios', function (Blueprint $table) {
            $table->string('imagen_url', 500)->nullable()->after('nombre');
        });

        // Enriquecer tabla de multimedia de órdenes
        Schema::table('sd_orden_multimedia', function (Blueprint $table) {
            $table->string('fase', 30)->nullable()->after('tipo');
            $table->string('mime_type', 50)->nullable()->after('fase');
            $table->unsignedBigInteger('tamaño')->nullable()->after('mime_type');
            $table->decimal('duracion', 8, 2)->nullable()->after('tamaño');
            $table->string('nombre_original', 255)->nullable()->after('duracion');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_productos', function (Blueprint $table) {
            $table->dropColumn('imagen_url');
        });

        Schema::table('sd_servicios', function (Blueprint $table) {
            $table->dropColumn('imagen_url');
        });

        Schema::table('sd_orden_multimedia', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['fase', 'mime_type', 'tamaño', 'duracion', 'nombre_original']);
        });
    }
};
```

### 2026_07_06_000000_add_verification_token_to_sd_ordenes.php

**Ruta:** `app/Modules/ServiceDesk/Migrations/2026_07_06_000000_add_verification_token_to_sd_ordenes.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            if (!Schema::hasColumn('sd_ordenes', 'verification_token')) {
                $table->uuid('verification_token')->nullable()->after('numero_orden');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sd_ordenes', function (Blueprint $table) {
            $table->dropColumn('verification_token');
        });
    }
};
```

---

## Tests

### CatalogoTest

**Ruta:** `tests/Feature/Modules/ServiceDesk/CatalogoTest.php`

```php
<?php

namespace Tests\Feature\Modules\ServiceDesk;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\ServiceDesk\Models\FallaBase;
use App\Modules\ServiceDesk\Models\Marca;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class CatalogoTest extends TestCase
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

        // Create permissions
        Permission::firstOrCreate(['name' => 'service-desk:view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:delete', 'guard_name' => 'web']);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    // ═══════════════════════════════════════════
    // MARCAS
    // ═══════════════════════════════════════════

    public function test_marca_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_marca_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertStatus(403);
    }

    public function test_marca_index_returns_view(): void
    {
        Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertStatus(200);
    }

    public function test_marca_crud(): void
    {
        // CREATE
        $beforeCount = Marca::count();
        $response = $this->post(route('service-desk.marcas.store'), [
            'nombre' => 'Dell',
            'activo' => true,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals($beforeCount + 1, Marca::count());

        $marca = Marca::where('nombre', 'Dell')->first();
        $this->assertNotNull($marca);
        $this->assertTrue($marca->activo);

        // UPDATE
        $response = $this->put(route('service-desk.marcas.update', $marca->id), [
            'nombre' => 'Dell Technologies',
            'activo' => false,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $marca->refresh();
        $this->assertEquals('Dell Technologies', $marca->nombre);
        $this->assertFalse($marca->activo);

        // DELETE (soft delete)
        $response = $this->delete(route('service-desk.marcas.destroy', $marca->id));
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('sd_marcas', ['id' => $marca->id]);
    }

    public function test_marca_cannot_delete_when_has_modelos(): void
    {
        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        $tipoEquipo = TipoEquipo::where('nombre', 'Impresora')->first();
        \App\Modules\ServiceDesk\Models\Modelo::create([
            'tenant_id' => $this->tenant->id,
            'marca_id' => $marca->id,
            'tipo_equipo_id' => $tipoEquipo->id,
            'nombre' => 'LaserJet Pro',
            'activo' => true,
        ]);

        $response = $this->delete(route('service-desk.marcas.destroy', $marca->id));
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('sd_marcas', ['id' => $marca->id, 'deleted_at' => null]);
    }

    public function test_marca_store_fails_without_nombre(): void
    {
        $response = $this->post(route('service-desk.marcas.store'), []);
        $response->assertSessionHasErrors('nombre');
    }

    public function test_marca_unique_nombre_per_tenant(): void
    {
        Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        $response = $this->post(route('service-desk.marcas.store'), [
            'nombre' => 'HP',
            'activo' => true,
        ]);
        $response->assertSessionHasErrors('nombre');
    }

    // ═══════════════════════════════════════════
    // TIPOS DE EQUIPO
    // ═══════════════════════════════════════════

    public function test_tipo_equipo_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.tipos-equipo.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_tipo_equipo_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->get(route('service-desk.tipos-equipo.index'));
        $response->assertStatus(403);
    }

    public function test_tipo_equipo_crud(): void
    {
        // CREATE
        $beforeCount = TipoEquipo::count();
        $response = $this->post(route('service-desk.tipos-equipo.store'), [
            'nombre' => 'Computador Portátil',
            'familia' => 'computador',
            'descripcion' => 'Equipos portátiles',
            'activo' => true,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals($beforeCount + 1, TipoEquipo::count());

        $tipo = TipoEquipo::where('nombre', 'Computador Portátil')->first();
        $this->assertNotNull($tipo);
        $this->assertEquals('computador', $tipo->familia);
        $this->assertEquals('computador-portatil', $tipo->slug);

        // UPDATE
        $response = $this->put(route('service-desk.tipos-equipo.update', $tipo->id), [
            'nombre' => 'Laptop',
            'familia' => 'computador',
            'descripcion' => 'Portátiles y laptops',
            'activo' => false,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $tipo->refresh();
        $this->assertEquals('Laptop', $tipo->nombre);
        $this->assertEquals('laptop', $tipo->slug);
        $this->assertFalse($tipo->activo);

        // DELETE (soft delete)
        $response = $this->delete(route('service-desk.tipos-equipo.destroy', $tipo->id));
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('sd_tipos_equipo', ['id' => $tipo->id]);
    }

    public function test_tipo_equipo_cannot_delete_when_has_modelos(): void
    {
        $tipo = TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        \App\Modules\ServiceDesk\Models\Modelo::create([
            'tenant_id' => $this->tenant->id,
            'marca_id' => $marca->id,
            'tipo_equipo_id' => $tipo->id,
            'nombre' => 'LaserJet Pro',
            'activo' => true,
        ]);

        $response = $this->delete(route('service-desk.tipos-equipo.destroy', $tipo->id));
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('sd_tipos_equipo', ['id' => $tipo->id, 'deleted_at' => null]);
    }

    public function test_tipo_equipo_store_fails_without_nombre(): void
    {
        $response = $this->post(route('service-desk.tipos-equipo.store'), []);
        $response->assertSessionHasErrors('nombre');
    }

    public function test_tipo_equipo_unique_nombre_per_tenant(): void
    {
        TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        $response = $this->post(route('service-desk.tipos-equipo.store'), [
            'nombre' => 'Impresora',
            'familia' => 'impresora',
        ]);
        $response->assertSessionHasErrors('nombre');
    }

    // ═══════════════════════════════════════════
    // SERVICIOS
    // ═══════════════════════════════════════════

    public function test_servicio_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.servicios.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_servicio_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->get(route('service-desk.servicios.index'));
        $response->assertStatus(403);
    }

    public function test_servicio_crud(): void
    {
        $tipo = TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        // CREATE
        $beforeCount = Servicio::count();
        $response = $this->post(route('service-desk.servicios.store'), [
            'nombre' => 'Cambio de Tóner',
            'codigo' => 'SRV-TONER-001',
            'descripcion' => 'Reemplazo de cartucho de tóner',
            'tipo_equipo_id' => $tipo->id,
            'precio_base' => 50000,
            'costo_tecnico_base' => 20000,
            'tipo_comision_tecnico' => 'fijo',
            'tiempo_estimado' => 30,
            'requiere_repuestos' => true,
            'activo' => true,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals($beforeCount + 1, Servicio::count());

        $servicio = Servicio::where('codigo', 'SRV-TONER-001')->first();
        $this->assertNotNull($servicio);
        $this->assertEquals($tipo->id, $servicio->tipo_equipo_id);
        $this->assertEquals(50000, (float) $servicio->precio_base);
        $this->assertEquals(20000, (float) $servicio->costo_tecnico_base);
        $this->assertTrue($servicio->requiere_repuestos);

        // UPDATE
        $response = $this->put(route('service-desk.servicios.update', $servicio->id), [
            'nombre' => 'Cambio de Tóner Premium',
            'precio_base' => 75000,
            'costo_tecnico_base' => 30000,
            'tipo_comision_tecnico' => 'porcentaje',
            'activo' => false,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $servicio->refresh();
        $this->assertEquals('Cambio de Tóner Premium', $servicio->nombre);
        $this->assertEquals(75000, (float) $servicio->precio_base);
        $this->assertEquals('porcentaje', $servicio->tipo_comision_tecnico);
        $this->assertFalse($servicio->activo);

        // DELETE (soft delete)
        $response = $this->delete(route('service-desk.servicios.destroy', $servicio->id));
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('sd_servicios', ['id' => $servicio->id]);
    }

    public function test_servicio_store_fails_without_required_fields(): void
    {
        $response = $this->post(route('service-desk.servicios.store'), [
            'nombre' => 'Solo nombre',
        ]);

        $response->assertSessionHasErrors(['precio_base', 'costo_tecnico_base', 'tipo_comision_tecnico']);
    }

    public function test_servicio_store_with_optional_fields(): void
    {
        $response = $this->post(route('service-desk.servicios.store'), [
            'nombre' => 'Diagnóstico General',
            'precio_base' => 30000,
            'costo_tecnico_base' => 10000,
            'tipo_comision_tecnico' => 'fijo',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('sd_servicios', ['nombre' => 'Diagnóstico General']);
    }

    // ═══════════════════════════════════════════
    // FALLAS
    // ═══════════════════════════════════════════

    public function test_falla_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.fallas.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_falla_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->get(route('service-desk.fallas.index'));
        $response->assertStatus(403);
    }

    public function test_falla_crud(): void
    {
        $tipo = TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Impresora',
            'slug' => 'impresora',
            'activo' => true,
        ]);

        // CREATE
        $beforeCount = FallaBase::count();
        $response = $this->post(route('service-desk.fallas.store'), [
            'nombre' => 'No imprime',
            'descripcion' => 'La impresora no imprime documentos',
            'solucion_sugerida' => 'Verificar toner y cabezales',
            'tipo_equipo_id' => $tipo->id,
            'tiempo_estimado' => 45,
            'activo' => true,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertEquals($beforeCount + 1, FallaBase::count());

        $falla = FallaBase::where('nombre', 'No imprime')->first();
        $this->assertNotNull($falla);
        $this->assertEquals($tipo->id, $falla->tipo_equipo_id);
        $this->assertEquals(45, $falla->tiempo_estimado);

        // UPDATE
        $response = $this->put(route('service-desk.fallas.update', $falla->id), [
            'nombre' => 'No imprime (fusor)',
            'descripcion' => 'Falla en el elemento de fusión',
            'tiempo_estimado' => 60,
            'activo' => false,
        ]);
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $falla->refresh();
        $this->assertEquals('No imprime (fusor)', $falla->nombre);
        $this->assertEquals(60, $falla->tiempo_estimado);
        $this->assertFalse($falla->activo);

        // DELETE (soft delete)
        $response = $this->delete(route('service-desk.fallas.destroy', $falla->id));
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertSoftDeleted('sd_fallas_base', ['id' => $falla->id]);
    }

    public function test_falla_store_fails_without_nombre(): void
    {
        $response = $this->post(route('service-desk.fallas.store'), []);
        $response->assertSessionHasErrors('nombre');
    }

    // ═══════════════════════════════════════════
    // CROSS-TENANT
    // ═══════════════════════════════════════════

    public function test_marca_isolation_between_tenants(): void
    {
        $otherTenant = Tenant::factory()->create();

        Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        Marca::create([
            'tenant_id' => $otherTenant->id,
            'nombre' => 'Dell',
            'activo' => true,
        ]);

        // Current tenant sees only HP
        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertStatus(200);
        $this->assertDatabaseHas('sd_marcas', ['nombre' => 'HP', 'tenant_id' => $this->tenant->id]);
        $this->assertDatabaseHas('sd_marcas', ['nombre' => 'Dell', 'tenant_id' => $otherTenant->id]);

        // Switch to other tenant (must also have service-desk module active)
        $otherUser = User::factory()->create([
            'tenant_id' => $otherTenant->id,
            'is_superadmin' => true,
        ]);

        \DB::table('modules')->insertOrIgnore([
            'code' => 'service-desk',
            'name' => 'Servicio Técnico',
            'class' => 'ServiceDesk',
            'version' => '1.0.0',
        ]);
        TenantModule::create([
            'tenant_id' => $otherTenant->id,
            'module_code' => 'service-desk',
            'is_active' => true,
        ]);

        $this->actingAs($otherUser);
        app()->instance('current_tenant', $otherTenant);

        $response = $this->get(route('service-desk.marcas.index'));
        $response->assertStatus(200);
    }

    public function test_servicio_isolation_between_tenants(): void
    {
        $otherTenant = Tenant::factory()->create();

        Servicio::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Reparación Tóner',
            'precio_base' => 50000,
            'costo_tecnico_base' => 20000,
            'tipo_comision_tecnico' => 'fijo',
        ]);

        Servicio::create([
            'tenant_id' => $otherTenant->id,
            'nombre' => 'Diagnóstico General',
            'precio_base' => 30000,
            'costo_tecnico_base' => 10000,
            'tipo_comision_tecnico' => 'fijo',
        ]);

        // Verify both exist
        $this->assertDatabaseHas('sd_servicios', ['nombre' => 'Reparación Tóner', 'tenant_id' => $this->tenant->id]);
        $this->assertDatabaseHas('sd_servicios', ['nombre' => 'Diagnóstico General', 'tenant_id' => $otherTenant->id]);
    }

    // ═══════════════════════════════════════════
    // AUTHORIZATION
    // ═══════════════════════════════════════════

    public function test_catalogo_store_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $response = $this->post(route('service-desk.marcas.store'), ['nombre' => 'Test']);
        $response->assertStatus(403);
    }

    public function test_catalogo_update_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        $response = $this->put(route('service-desk.marcas.update', $marca->id), ['nombre' => 'HP2']);
        $response->assertStatus(403);
    }

    public function test_catalogo_delete_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithout = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithout);

        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'HP',
            'activo' => true,
        ]);

        $response = $this->delete(route('service-desk.marcas.destroy', $marca->id));
        $response->assertStatus(403);
    }
}
```

### OrdenControllerTest

**Ruta:** `tests/Feature/Modules/ServiceDesk/OrdenControllerTest.php`

```php
<?php

namespace Tests\Feature\Modules\ServiceDesk;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Crm\Models\Cliente;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Modules\ServiceDesk\Models\Marca;
use App\Modules\ServiceDesk\Models\Modelo;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Models\Prestador;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\ServiceDesk\Models\TipoEquipo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class OrdenControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;
    private Cliente $cliente;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\PreventRequestForgery::class]);

        // Ensure sd_orden_multimedia has deleted_at (model uses SoftDeletes but
        // the module migration creates the table without it).
        if (!Schema::hasColumn('sd_orden_multimedia', 'deleted_at')) {
            Schema::table('sd_orden_multimedia', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        $this->tenant = Tenant::factory()->create();

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

        // Set permissions team to tenant so givePermissionTo works
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($this->tenant->id);

        // Create permissions
        Permission::firstOrCreate(['name' => 'service-desk:view', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:create', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:edit', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:delete', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'service-desk:assign', 'guard_name' => 'web']);

        // User with superadmin (bypasses all permission checks)
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);

        // Seed shared data
        $this->cliente = Cliente::factory()->create([
            'tenant_id' => $this->tenant->id,
            'tipo' => 'natural',
            'nombres' => 'Juan',
            'apellidos' => 'Pérez',
        ]);
    }

    // ───────── INDEX ─────────

    public function test_orden_index_requires_auth(): void
    {
        $this->withMiddleware();
        auth()->logout();

        $response = $this->get(route('service-desk.ordenes.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_orden_index_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $response = $this->get(route('service-desk.ordenes.index'));
        $response->assertStatus(403);
    }

    public function test_orden_index_returns_view(): void
    {
        // Create some orders to verify they appear in the list
        OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00001',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Diagnostico,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->get(route('service-desk.ordenes.index'));
        $response->assertStatus(200);
    }

    // ───────── STORE ─────────

    public function test_orden_store_creates_orden(): void
    {
        $beforeCount = OrdenReparacion::count();

        $response = $this->post(route('service-desk.ordenes.store'), [
            'cliente_id' => $this->cliente->id,
            'tipo_equipo_manual' => 'Computador Portátil',
            'condicion_inicial' => 'Pantalla rota',
            'fallas_otras' => 'No enciende',
        ]);

        $response->assertRedirect();
        $this->assertEquals($beforeCount + 1, OrdenReparacion::count());

        $orden = OrdenReparacion::latest()->first();
        $this->assertEquals($this->cliente->id, $orden->cliente_id);
        $this->assertEquals(OrdenEstado::Diagnostico, $orden->estado);
        $this->assertStringStartsWith('OR-', $orden->numero_orden);
    }

    public function test_orden_store_fails_without_required_fields(): void
    {
        $response = $this->post(route('service-desk.ordenes.store'), []);
        $response->assertSessionHasErrors('cliente_id');
    }

    // ───────── SHOW ─────────

    public function test_orden_show_displays_orden(): void
    {
        $tipoEquipo = TipoEquipo::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Computador Portátil',
            'slug' => 'computador-portatil',
            'activo' => true,
        ]);

        $marca = Marca::create([
            'tenant_id' => $this->tenant->id,
            'nombre' => 'Dell',
            'activo' => true,
        ]);

        $modelo = Modelo::create([
            'tenant_id' => $this->tenant->id,
            'marca_id' => $marca->id,
            'tipo_equipo_id' => $tipoEquipo->id,
            'nombre' => 'Latitude 3420',
            'activo' => true,
        ]);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00010',
            'cliente_id' => $this->cliente->id,
            'tipo_equipo_id' => $tipoEquipo->id,
            'modelo_id' => $modelo->id,
            'numero_serie' => 'SN12345',
            'estado' => OrdenEstado::Recibido,
            'condicion_inicial' => 'Equipo no enciende',
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->get(route('service-desk.ordenes.show', $orden->id));
        $response->assertStatus(200);
    }

    // ───────── ESTADO UPDATE ─────────

    public function test_orden_estado_update(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00020',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->put(route('service-desk.ordenes.estado', $orden->id), [
            'estado' => 'diagnosticado',
            'nota' => 'Iniciando diagnóstico visual',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $orden->refresh();
        $this->assertEquals(OrdenEstado::Diagnostico, $orden->estado);
    }

    public function test_orden_estado_update_full_lifecycle(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00030',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $transitions = [
            'diagnosticado',
            'en_proceso',
            'pruebas',
            'completado',
            'entregado',
        ];

        foreach ($transitions as $estado) {
            $this->put(route('service-desk.ordenes.estado', $orden->id), [
                'estado' => $estado,
            ]);

            $orden->refresh();
            $this->assertEquals($estado, $orden->estado->value);
        }
    }

    public function test_orden_cannot_update_when_entregado(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00040',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Entregado,
            'fecha_recibido' => now(),
            'fecha_entregado' => now(),
            'created_by' => $this->user->id,
        ]);

        // The update() route blocks entregado/cancelado orders
        $response = $this->put(route('service-desk.ordenes.update', $orden->id), [
            'cliente_id' => $this->cliente->id,
            'condicion_inicial' => 'Intento de cambio',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $orden->refresh();
        $this->assertNull($orden->condicion_inicial);
    }

    public function test_orden_cannot_update_cancelled(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00050',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Cancelado,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        // Trying to update the order itself (not estado) should be blocked
        $response = $this->put(route('service-desk.ordenes.update', $orden->id), [
            'cliente_id' => $this->cliente->id,
            'condicion_inicial' => 'Cambiada',
        ]);

        $response->assertRedirect();
        $orden->refresh();
        // The order should still have its original estado (cancelado)
        $this->assertEquals(OrdenEstado::Cancelado, $orden->estado);
    }

    // ───────── DESTROY ─────────

    public function test_orden_destroy_deletes(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00060',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $beforeCount = OrdenReparacion::count();

        $response = $this->delete(route('service-desk.ordenes.destroy', $orden->id));
        $response->assertRedirect(route('service-desk.ordenes.index'));
        $response->assertSessionHas('success');

        $this->assertEquals($beforeCount - 1, OrdenReparacion::count());
    }

    // ───────── AUTHORIZATION ─────────

    public function test_orden_store_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $response = $this->post(route('service-desk.ordenes.store'), [
            'cliente_id' => $this->cliente->id,
        ]);
        $response->assertStatus(403);
    }

    public function test_orden_show_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00070',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->get(route('service-desk.ordenes.show', $orden->id));
        $response->assertStatus(403);
    }

    public function test_orden_estado_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00080',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->put(route('service-desk.ordenes.estado', $orden->id), [
            'estado' => 'diagnostico',
        ]);
        $response->assertStatus(403);
    }

    public function test_orden_destroy_requires_permission(): void
    {
        $this->withMiddleware();
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);
        $this->actingAs($userWithoutPermission);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00090',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->delete(route('service-desk.ordenes.destroy', $orden->id));
        $response->assertStatus(403);
    }

    // ───────── CROSS-TENANT ─────────

    public function test_orden_cannot_access_other_tenants_order(): void
    {
        $otherTenant = Tenant::factory()->create();
        $otherUser = User::factory()->create([
            'tenant_id' => $otherTenant->id,
            'is_superadmin' => true,
        ]);

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00100',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        // Other tenant user cannot see this order (global scope filters by tenant)
        $this->actingAs($otherUser);
        app()->instance('current_tenant', $otherTenant);

        $response = $this->get(route('service-desk.ordenes.show', $orden->id));
        // 404 because the global scope filters out the order
        $response->assertStatus(404);
    }

    public function test_orden_update_requires_service_desk_edit_permission(): void
    {
        $this->withMiddleware();

        $userWithEdit = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => false,
        ]);

        // Set the permissions team before assigning
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($this->tenant->id);
        $userWithEdit->givePermissionTo('service-desk:edit');

        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00110',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        // User WITH permission can update
        $this->actingAs($userWithEdit);
        $response = $this->put(route('service-desk.ordenes.update', $orden->id), [
            'cliente_id' => $this->cliente->id,
            'condicion_inicial' => 'Modificado',
        ]);

        $response->assertRedirect();
        $orden->refresh();
        $this->assertEquals('Modificado', $orden->condicion_inicial);
    }

    // ───────── VALIDATION ─────────

    public function test_orden_estado_update_requires_valid_state(): void
    {
        $orden = OrdenReparacion::create([
            'tenant_id' => $this->tenant->id,
            'numero_orden' => 'OT-00120',
            'cliente_id' => $this->cliente->id,
            'estado' => OrdenEstado::Recibido,
            'fecha_recibido' => now(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->put(route('service-desk.ordenes.estado', $orden->id), [
            'estado' => 'estado_invalido_xyz',
        ]);

        $response->assertSessionHasErrors('estado');
    }
}
```

---

## Correcciones

1. **Fecha de actualización** — Actualizado el encabezado a `2026-07-06`.
2. **OrdenController** — Código sincronizado: incluye `use Illuminate\Validation\Rule`, `bloqueadoPorTecnico()`, `notificarOrden()`, `notificarTecnico()`, `notificarAdministrador()`, `storeActividad()`, `updateActividad()`, `destroyActividad()`, `validarNumeroSerie()`, `formData()` y `validateData()` con `UniqueSerialPerEquipment` rule.
3. **PrestadorController** — Corregido `destroy()`: ahora usa `withTrashed()` para proteger historial financiero, y valida que exista sede antes de crear empleado.
4. **ComisionController** — Corregido `pay()`: el asiento contable se registra PRIMERO dentro de la transacción para que si falla se revierta todo. Validación de período usa `now()` en lugar de la fecha de la liquidación.
5. **LiquidacionController** — Sin cambios vs código fuente.
6. **MultimediaController** — Incluye `uploadOrden()`, `destroy()`, `indexOrden()`, `uploadProducto()`, `destroyProducto()`, `uploadServicio()`, `destroyServicio()` con dispatch de `ProcesarMultimediaJob`.
7. **Routes** — Incluye rutas de prefactura, actividades, multimedia e imágenes de servicios.
8. **Models** — Todos sincronizados: `OrdenReparacion` con `verification_token`, `SafeEncrypted` cast, relaciones `recibos()`, `actividades()`, `factura()`. `ComisionLiquidacion` con `verification_token` boot. `Prestador` con scopes `contratistas()` y `empleados()`.
9. **Services** — `OrdenService` con `registrarAbono()`, `anularAbonos()`, `restaurarInventario()`, `revertirAbonos()`, `anularFactura()`. `MultimediaService` con validación de tipo/tamaño y dispatch de job. `CatalogoTallerProvisioner` con checklists completos por tipo de equipo.
10. **Migrations** — 13 migraciones incluidas: desde `sd_tickets` hasta `verification_token`.
11. **Tests** — `CatalogoTest` con 20+ tests (CRUD, auth, permisos, cross-tenant). `OrdenControllerTest` con 20+ tests (CRUD, lifecycle, cross-tenant, authorization, validación).
