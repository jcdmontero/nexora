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

        // Validar que el período de la liquidación no esté cerrado
        $fecha = \Carbon\Carbon::parse($liquidacion->periodo_inicio);
        try {
            app(\App\Modules\Accounting\Services\ContabilidadService::class)->resolverPeriodoAbierto($fecha);
        } catch (\Exception $e) {
            return back()->with('error', 'No se puede procesar el pago: ' . $e->getMessage());
        }

        $data = $request->validate([
            'metodo_pago' => 'nullable|string|max:50',
            'referencia_pago' => 'nullable|string|max:100',
        ]);

        DB::transaction(function () use ($liquidacion, $data) {
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

            // Registrar asiento contable: Gasto Comisiones (D) / Caja-Banco (C)
            $this->registrarAsientoPago($liquidacion, $data['metodo_pago'] ?? 'efectivo');
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
