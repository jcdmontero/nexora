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
        // C-02: Validar idempotencia — no cerrar dos veces el mismo año
        $cierreExistente = AsientoContable::query()
            ->where('concepto', 'like', "CIERRE ANUAL {$anio}%")
            ->where('estado', '!=', 'reversado')
            ->exists();

        if ($cierreExistente) {
            throw new \RuntimeException(
                "El año {$anio} ya fue cerrado. No se puede ejecutar el cierre anual dos veces."
            );
        }

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

        $conceptosCierre = AsientoContable::query()
            ->where('concepto', 'like', 'CIERRE ANUAL %')
            ->where('estado', '!=', 'reversado')
            ->pluck('concepto');

        $aniosConCierre = $conceptosCierre->map(function ($concepto) {
            if (preg_match('/CIERRE ANUAL (\d+)/', $concepto, $matches)) {
                return (int) $matches[1];
            }
            return null;
        })->filter()->unique()->values();

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
            ->where('asiento_lineas.tenant_id', app('current_tenant')->id)
            ->where('cuentas_contables.tenant_id', app('current_tenant')->id)
            ->whereYear('asientos_contables.fecha', $anio)
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

        $todasLasCuentas = $saldosIngresos->concat($saldosGastos)->concat($saldosCostos);

        // Cerrar todas las cuentas de resultados (Ingresos, Gastos, Costos)
        foreach ($todasLasCuentas as $cuenta) {
            $saldo = (float) $cuenta['saldo'];
            
            if (abs($saldo) < 0.005) {
                continue;
            }

            // Si saldo es positivo, la cuenta tiene saldo acorde a su naturaleza.
            // Si saldo es negativo, la cuenta tiene saldo contrario a su naturaleza.
            $esSaldoDeudor = ($cuenta['naturaleza'] === 'debito' && $saldo > 0) || 
                             ($cuenta['naturaleza'] === 'credito' && $saldo < 0);
            
            $monto = round(abs($saldo), 2);

            if ($esSaldoDeudor) {
                // Para cerrar una cuenta con saldo deudor (positivo de naturaleza débito, o negativo de naturaleza crédito), acreditamos
                $lineas[] = [
                    'cuenta_contable_id' => $cuenta['cuenta_id'],
                    'debito' => 0,
                    'credito' => $monto,
                    'descripcion' => "Cierre anual - cierre de cuenta {$cuenta['codigo']}",
                ];
            } else {
                // Para cerrar una cuenta con saldo acreedor (positivo de naturaleza crédito, o negativo de naturaleza débito), debitamos
                $lineas[] = [
                    'cuenta_contable_id' => $cuenta['cuenta_id'],
                    'debito' => $monto,
                    'credito' => 0,
                    'descripcion' => "Cierre anual - cierre de cuenta {$cuenta['codigo']}",
                ];
            }
        }

        // Utilidades Retenidas (cuenta 3610) — cuadrar con valores redondeados reales
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
