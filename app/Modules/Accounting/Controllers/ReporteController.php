<?php

namespace App\Modules\Accounting\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\AsientoLinea;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Services\ContabilidadConfig;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Modules\Accounting\Models\AsientoContable;

class ReporteController extends Controller
{
    private function getCacheKey(string $prefix, string $desde, string $hasta, ?string $extra = ''): string
    {
        $tenantId = app('current_tenant')->id;
        $lastUpdate = AsientoContable::where('tenant_id', $tenantId)->max('updated_at');
        return "{$prefix}_{$tenantId}_{$desde}_{$hasta}_{$lastUpdate}_{$extra}";
    }

    public function index(Request $request)
    {
        $desde = $request->input('desde', now()->startOfMonth()->toDateString());
        $hasta = $request->input('hasta', now()->endOfMonth()->toDateString());

        $page = $request->input('page', 1);

        // Métricas separadas (agrupadas solo por tipo para no paginar)
        $porTipo = Cache::remember($this->getCacheKey('index_metricas', $desde, $hasta), now()->addMinutes(10), function () use ($desde, $hasta) {
            return AsientoLinea::query()
                ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
                ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
                ->where('asientos_contables.tenant_id', app('current_tenant')->id)
                ->where('cuentas_contables.tenant_id', app('current_tenant')->id)
                ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
                                ->selectRaw('
                    cuentas_contables.tipo,
                    cuentas_contables.naturaleza,
                    SUM(asiento_lineas.debito) as debito,
                    SUM(asiento_lineas.credito) as credito
                ')
                ->groupBy('cuentas_contables.tipo', 'cuentas_contables.naturaleza')
                ->get()
                ->map(function ($row) {
                    $debito = (float) $row->debito;
                    $credito = (float) $row->credito;
                    // C-03: Calcular saldo relativo al tipo esperado, no a la naturaleza individual.
                    // Para ingreso (espera credito): saldo = credito - debit (positivo = ingreso real)
                    // Para gasto/costo (espera debito): saldo = debito - credito (positivo = gasto real)
                    // Cuentas contra-naturaleza (ej. 4175 devoluciones) quedan con saldo negativo
                    // dentro de su grupo, restando automáticamente del total.
                    $saldo = in_array($row->tipo, ['ingreso'])
                        ? $credito - $debito
                        : $debito - $credito;
                    return ['tipo' => $row->tipo, 'saldo' => $saldo];
                })
                ->groupBy('tipo')
                ->map(fn ($items) => ['saldo' => round($items->sum('saldo'), 2)]);
        });

        $ingresos = round((float) data_get($porTipo, 'ingreso.saldo', 0), 2);
        // M-14: Usar saldo con signo en vez de abs() para no sobreestimar gastos
        // con devoluciones/notas crédito que generan saldo negativo
        $gastosNeto = round(
            (float) data_get($porTipo, 'gasto.saldo', 0)
            + (float) data_get($porTipo, 'costo.saldo', 0),
            2
        );
        $gastos = abs($gastosNeto);
        $utilidad = $ingresos - $gastos;

        $saldos = Cache::remember($this->getCacheKey('index', $desde, $hasta, "page_{$page}"), now()->addMinutes(10), function () use ($desde, $hasta) {
            return AsientoLinea::query()
                ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
                ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
                ->where('asientos_contables.tenant_id', app('current_tenant')->id)
                ->where('cuentas_contables.tenant_id', app('current_tenant')->id)
                ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
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
                ->paginate(50)
                ->through(function ($row) {
                    $debito = (float) $row->debito;
                    $credito = (float) $row->credito;
                    $saldo = $row->naturaleza === 'credito' ? $credito - $debito : $debito - $credito;

                    return [
                        'tipo' => $row->tipo,
                        'codigo' => $row->codigo,
                        'nombre' => $row->nombre,
                        'naturaleza' => $row->naturaleza,
                        'debito' => $debito,
                        'credito' => $credito,
                        'saldo' => $saldo,
                    ];
                })->withQueryString();
        });

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

        $page = $request->input('page', 1);
        $extra = ($cuenta_id ?? 'all') . '_' . ($tercero_numero ?? 'all') . "_page_{$page}";
        $lineas = Cache::remember($this->getCacheKey('auxiliar', $desde, $hasta, $extra), now()->addMinutes(10), function () use ($desde, $hasta, $cuenta_id, $tercero_numero) {
            $query = AsientoLinea::query()
                ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
                ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
                ->where('asientos_contables.tenant_id', app('current_tenant')->id)
                ->where('cuentas_contables.tenant_id', app('current_tenant')->id)
                ->whereBetween('asientos_contables.fecha', [$desde, $hasta]);

            if ($cuenta_id) {
                $query->where('asiento_lineas.cuenta_contable_id', $cuenta_id);
            }
            
            if ($tercero_numero) {
                $query->where('asiento_lineas.tercero_numero_documento', $tercero_numero);
            }

            return $query->selectRaw('
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
                ->paginate(100)
                ->withQueryString();
        });

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

        $saldos = Cache::remember($this->getCacheKey('terceros', $desde, $hasta), now()->addMinutes(10), function () use ($desde, $hasta) {
            return AsientoLinea::query()
                ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
                ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
                ->where('asientos_contables.tenant_id', app('current_tenant')->id)
                ->where('cuentas_contables.tenant_id', app('current_tenant')->id)
                ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
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
        });

        return Inertia::render('Modules/Accounting/Reportes/Terceros', [
            'filters' => [
                'desde' => $desde,
                'hasta' => $hasta,
            ],
            'saldos' => $saldos,
        ]);
    }

    /**
     * Estado de Resultados (PyG) — solo cuentas de ingreso, costo y gasto.
     * Filtra cuentas Clase 4 (ingresos), 5 (gastos), 6 (costos).
     */
    public function pyg(Request $request)
    {
        $desde = $request->input('desde', now()->startOfMonth()->toDateString());
        $hasta = $request->input('hasta', now()->endOfMonth()->toDateString());

        $saldos = Cache::remember($this->getCacheKey('pyg', $desde, $hasta), now()->addMinutes(10), function () use ($desde, $hasta) {
            return AsientoLinea::query()
                ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
                ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
                ->where('asientos_contables.tenant_id', app('current_tenant')->id)
                ->where('cuentas_contables.tenant_id', app('current_tenant')->id)
                ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
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

                    // C-03: Para ingresos, saldo positivo = ingreso real; saldo negativo = devolución.
                    // Para gastos/costos, saldo positivo = gasto real; saldo negativo = reversión.
                    // El signo real del saldo (según naturaleza) determina su efecto en el PyG.
                    $efecto = $saldo; // positivo suma, negativo resta
                    if (in_array($row->tipo, ['gasto', 'costo'])) {
                        $efecto = abs($saldo); // gastos/costos siempre se restan del ingreso
                    }

                    return [
                        'codigo' => $row->codigo,
                        'nombre' => $row->nombre,
                        'tipo' => $row->tipo,
                        'saldo' => abs($saldo),
                        'signo' => in_array($row->tipo, ['ingreso']) ? ($saldo >= 0 ? 1 : -1) : -1,
                    ];
                });
        });

        $ingresos = $saldos->where('tipo', 'ingreso')->sum(fn ($s) => $s['saldo'] * $s['signo']);
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

    /**
     * Balance General — solo cuentas de activo, pasivo y patrimonio.
     */
    public function balance(Request $request)
    {
        $desde = $request->input('desde', now()->startOfMonth()->toDateString());
        $hasta = $request->input('hasta', now()->endOfMonth()->toDateString());

        $saldos = Cache::remember($this->getCacheKey('balance', $desde, $hasta), now()->addMinutes(10), function () use ($desde, $hasta) {
            return AsientoLinea::query()
                ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
                ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
                ->where('asientos_contables.tenant_id', app('current_tenant')->id)
                ->where('cuentas_contables.tenant_id', app('current_tenant')->id)
                ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
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

    /**
     * Libro de IVA — Generado (ventas) vs Descontable (compras).
     * Resume las cuentas 240805 (IVA generado) y 240810 (IVA descontable).
     */
    public function libroIva(Request $request)
    {
        $desde = $request->input('desde', now()->startOfYear()->toDateString());
        $hasta = $request->input('hasta', now()->endOfYear()->toDateString());
        $tenantId = app('current_tenant')->id;

        $ctaIvaGenerado = ContabilidadConfig::ivaGenerado($tenantId);
        $ctaIvaDescontable = ContabilidadConfig::ivaDescontable($tenantId);
        $ctaRteFuente = ContabilidadConfig::retencionFuente($tenantId);
        $ctaRteIva = ContabilidadConfig::retencionIva($tenantId);
        $ctaRteIca = ContabilidadConfig::retencionIca($tenantId);

        // IVA Generado (ventas)
        $ivaGenerado = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->where('asientos_contables.tenant_id', $tenantId)
            ->where('cuentas_contables.tenant_id', $tenantId)
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('cuentas_contables.codigo', $ctaIvaGenerado)
            ->selectRaw('
                SUM(asiento_lineas.credito) as total_gravado,
                SUM(CASE WHEN asiento_lineas.impuesto_tipo = \'iva\' THEN asiento_lineas.base_gravable ELSE 0 END) as base_gravable
            ')
            ->first();

        // IVA Descontable (compras)
        $ivaDescontable = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->where('asientos_contables.tenant_id', $tenantId)
            ->where('cuentas_contables.tenant_id', $tenantId)
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->where('cuentas_contables.codigo', $ctaIvaDescontable)
            ->selectRaw('
                SUM(asiento_lineas.debito) as total_gravado,
                SUM(CASE WHEN asiento_lineas.impuesto_tipo = \'iva\' THEN asiento_lineas.base_gravable ELSE 0 END) as base_gravable
            ')
            ->first();

        // Retenciones — detalle por tipo
        $retenciones = AsientoLinea::query()
            ->join('asientos_contables', 'asiento_lineas.asiento_contable_id', '=', 'asientos_contables.id')
            ->join('cuentas_contables', 'asiento_lineas.cuenta_contable_id', '=', 'cuentas_contables.id')
            ->where('asientos_contables.tenant_id', $tenantId)
            ->where('cuentas_contables.tenant_id', $tenantId)
            ->whereBetween('asientos_contables.fecha', [$desde, $hasta])
            ->whereIn('cuentas_contables.codigo', [$ctaRteFuente, $ctaRteIva, $ctaRteIca])
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
