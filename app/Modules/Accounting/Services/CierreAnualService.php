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

    /**
     * Ejecuta el cierre anual contable para un año dado.
     *
     * Valida que los 12 periodos estén cerrados, calcula los saldos de
     * ingresos y gastos, y genera el asiento de cierre que transfiere
     * las utilidades a la cuenta 3610 (Utilidades Retenidas).
     */
    public function cerrarAnio(int $anio): array
    {
        $this->validarPeriodosCerrados($anio);

        $saldosIngresos = $this->calcularSaldosPorGrupo($anio, '4');
        $saldosGastos = $this->calcularSaldosPorGrupo($anio, '5');
        $saldosCostos = $this->calcularSaldosPorGrupo($anio, '6');

        $totalIngresos = round($saldosIngresos->sum('saldo'), 2);
        $totalGastos = round($saldosGastos->sum('saldo') + $saldosCostos->sum('saldo'), 2);
        $utilidadNeta = round($totalIngresos - $totalGastos, 2);

        $lineas = $this->construirLineasCierre(
            $saldosIngresos,
            $saldosGastos,
            $saldosCostos,
            $utilidadNeta,
        );

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

        return [
            'asiento_numero' => $asiento->numero,
            'total_ingresos' => $totalIngresos,
            'total_gastos' => $totalGastos,
            'utilidad_neta' => $utilidadNeta,
            'lineas_ingresos' => $saldosIngresos->toArray(),
            'lineas_gastos' => $saldosGastos->toArray(),
            'lineas_costos' => $saldosCostos->toArray(),
        ];
    }

    /**
     * Retorna los años que tienen periodos cerrados pero aún no tienen asiento de cierre anual.
     */
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

    /**
     * Verifica que los 12 periodos del año estén cerrados.
     */
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

    /**
     * Calcula el saldo de todas las cuentas de un grupo (primer dígito del código)
     * para un año específico, usando los asientos no reversados.
     *
     * Retorna Collection de ['cuenta_id', 'codigo', 'nombre', 'naturaleza', 'saldo']
     */
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

    /**
     * Construye las líneas del asiento de cierre:
     *  - Débito a cuentas de ingresos (para cerrarlas a cero)
     *  - Crédito a cuentas de gastos y costos (para cerrarlas a cero)
     *  - Crédito/débito a cuenta 3610 (Utilidades Retenidas) para cuadrar
     */
    private function construirLineasCierre(
        \Illuminate\Support\Collection $saldosIngresos,
        \Illuminate\Support\Collection $saldosGastos,
        \Illuminate\Support\Collection $saldosCostos,
        float $utilidadNeta,
    ): array {
        $lineas = [];

        // Cerrar ingresos: débito por el saldo de cada cuenta (las ingresos son naturaleza crédito)
        foreach ($saldosIngresos as $ingreso) {
            $lineas[] = [
                'cuenta_contable_id' => $ingreso['cuenta_id'],
                'debito' => round(abs($ingreso['saldo']), 2),
                'credito' => 0,
                'descripcion' => "Cierre anual - ingreso {$ingreso['codigo']}",
            ];
        }

        // Cerrar gastos: crédito por el saldo de cada cuenta (los gastos son naturaleza débito)
        foreach ($saldosGastos as $gasto) {
            $lineas[] = [
                'cuenta_contable_id' => $gasto['cuenta_id'],
                'debito' => 0,
                'credito' => round(abs($gasto['saldo']), 2),
                'descripcion' => "Cierre anual - gasto {$gasto['codigo']}",
            ];
        }

        // Cerrar costos: crédito por el saldo de cada cuenta
        foreach ($saldosCostos as $costo) {
            $lineas[] = [
                'cuenta_contable_id' => $costo['cuenta_id'],
                'debito' => 0,
                'credito' => round(abs($costo['saldo']), 2),
                'descripcion' => "Cierre anual - costo {$costo['codigo']}",
            ];
        }

        // Utilidades Retenidas (cuenta 3610) para cuadrar el asiento
        $cuentaUtilidades = $this->contabilidadService->getCuenta('3610');

        if (!$cuentaUtilidades) {
            throw new \RuntimeException(
                'La cuenta 3610 (Utilidades Retenidas) no existe en el plan de cuentas.'
            );
        }

        if ($utilidadNeta > 0) {
            // Utilidad: crédito a 3610 (aumenta patrimonio)
            $lineas[] = [
                'cuenta_contable_id' => $cuentaUtilidades->id,
                'debito' => 0,
                'credito' => $utilidadNeta,
                'descripcion' => "Cierre anual - utilidad neta",
            ];
        } elseif ($utilidadNeta < 0) {
            // Pérdida: débito a 3610 (disminuye patrimonio)
            $lineas[] = [
                'cuenta_contable_id' => $cuentaUtilidades->id,
                'debito' => abs($utilidadNeta),
                'credito' => 0,
                'descripcion' => "Cierre anual - pérdida neta",
            ];
        }
        // Si utilidadNeta == 0, no se genera línea en 3610 (ya cuadra por ingresos = gastos)

        return $lineas;
    }
}
