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
                ->when($soloPropias, function ($q) use ($prestadorIds, $user) {
                    $q->where(function ($sub) use ($prestadorIds, $user) {
                        $sub->whereIn('prestador_id', $prestadorIds)
                            ->orWhere('tecnico_id', $user->id);
                    });
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
            'recibos' => \App\Modules\Cash\Models\ReciboCaja::where('referencia_type', get_class($orden))
                ->where('referencia_id', $orden->id)
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
            'recibos' => \App\Modules\Cash\Models\ReciboCaja::where('referencia_type', get_class($orden))
                ->where('referencia_id', $orden->id)
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
            'recibido' => 'orden_recibida', 'diagnostico' => 'orden_diagnostico',
            'reparacion' => 'orden_reparacion', 'pruebas' => 'orden_pruebas',
            'listo' => 'orden_listo', 'entregado' => 'orden_entregado',
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

        if (in_array($estado, ['reparacion', 'pruebas'])) {
            $tecnicoUserId = $orden->prestador?->user_id;
            if ($tecnicoUserId && $user->id !== $tecnicoUserId) {
                return true;
            }
        }

        if ($user->hasRole('TECNICO')) {
            if (!in_array($estado, ['reparacion', 'pruebas'])) {
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
        $validated = $request->validate([
            'cliente_id' => ['required', 'exists:crm_clientes,id'],
            'tipo_equipo_id' => ['nullable', 'exists:sd_tipos_equipo,id'],
            'modelo_id' => ['nullable', 'exists:sd_modelos,id'],
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
            'prestador_id' => ['nullable', 'exists:sd_prestadores,id'],
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
            'servicios.*.servicio_id' => ['required', 'exists:sd_servicios,id'],
            'servicios.*.cantidad' => ['nullable', 'numeric', 'min:0.01'],
            'servicios.*.precio_aplicado' => ['nullable', 'numeric', 'min:0'],
            'servicios.*.costo_tecnico_aplicado' => ['nullable', 'numeric', 'min:0'],
            'repuestos' => ['nullable', 'array'],
            'repuestos.*.producto_id' => ['required', 'exists:inventory_productos,id'],
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
