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
    private const CODIGOS_COSTOS = ['6'];  // Costos de ventas (Clase 6)
    private const CODIGOS_GASTOS = ['5'];  // Gastos operacionales (Clase 5)
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

    /**
     * Estado de Resultados (PyG) — solo cuentas de ingreso, costo y gasto.
     * Filtra cuentas Clase 4 (ingresos), 5 (gastos), 6 (costos).
     */
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
                    'signo' => in_array($row->tipo, ['ingreso']) ? 1 : -1, // ingresos suman, gastos/costos restan
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

    /**
     * Balance General — solo cuentas de activo, pasivo y patrimonio.
     */
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

    /**
     * Libro de IVA — Generado (ventas) vs Descontable (compras).
     * Resume las cuentas 240805 (IVA generado) y 240810 (IVA descontable).
     */
    public function libroIva(Request $request)
    {
        $desde = $request->input('desde', now()->startOfYear()->toDateString());
        $hasta = $request->input('hasta', now()->endOfYear()->toDateString());

        // IVA Generado (ventas) — cuenta 240805
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

        // IVA Descontable (compras) — cuenta 240810
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

        // Retenciones — detalle por tipo
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
