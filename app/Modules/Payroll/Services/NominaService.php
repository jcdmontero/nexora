<?php

declare(strict_types=1);

namespace App\Modules\Payroll\Services;

use App\Modules\Hr\Models\ConfiguracionLegal;
use App\Modules\Hr\Models\Contrato;
use App\Modules\Hr\Models\Empleado;
use App\Modules\Hr\Models\Incapacidad;
use App\Modules\Hr\Models\Prestamo;
use App\Modules\Payroll\Models\ConceptoNomina;
use App\Modules\Payroll\Models\Nomina;
use App\Modules\Payroll\Models\NominaDetalle;
use App\Modules\Payroll\Models\Novedad;
use App\Modules\Payroll\Models\PeriodoNomina;
use App\Modules\Payroll\Models\ProvisionAcumulada;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Servicio de Liquidación de Nómina Colombiana.
 *
 * Motor central de nómina que calcula todos los conceptos retributivos
 * (devengados, deducciones, provisiones y aportes patronales) según la
 * legislación laboral colombiana (CST, Ley 100/93, Ley 797/2003,
 * Ley 2101 de 2021, Estatuto Tributario Art. 383).
 *
 * Convenciones:
 *   - Mes de 30 días para cálculos proporcionales.
 *   - Horas semanales según Ley 2101 (reducción gradual: 46h → 42h desde jul/2026).
 *   - IBC mínimo: 1 SMMLV proporcional; máximo: 25 SMMLV.
 *   - Retefuente: Procedimiento 2 (Art. 383 ET) con tabla de 7 tramos marginales en UVT.
 *
 * @package App\Modules\Payroll\Services
 */
class NominaService
{
    /**
     * Cache de modelos ConceptoNomina por código, a nivel de instancia.
     * Se reinicia por request/job/test para evitar IDs obsoletos entre tenants.
     *
     * @var array<string, ConceptoNomina|null>
     */
    private array $conceptoCache = [];

    // =========================================================================
    //  MÉTODOS PÚBLICOS — API DE LIQUIDACIÓN
    // =========================================================================

    /**
     * Liquida un empleado para un período de nómina.
     *
     * Calcula todos los conceptos devengados, deducciones, provisiones
     * y aportes patronales según la legislación colombiana, retornando
     * un arreglo estructurado para que el llamador persista los datos.
     *
     * @param Empleado           $empleado   Empleado a liquidar.
     * @param PeriodoNomina      $periodo    Período de nómina.
     * @param ConfiguracionLegal $configLegal Configuración legal del año vigente.
     *
     * @return array{
     *     conceptos: list<array{concepto_codigo: string, valor: float, base_calculo: float}>,
     *     resumen: array{
     *         dias_laborados: int,
     *         dias_incapacidad: int,
     *         ibc_seguridad_social: float,
     *         ibc_parafiscales: float,
     *         total_devengado: float,
     *         total_deducciones: float,
     *         neto_pagar: float,
     *         total_provisiones: float,
     *         total_aportes_patronales: float,
     *         costo_laboral_total: float,
     *     },
     * }
     *
     * @throws \RuntimeException Si el empleado no tiene contrato activo
     *                          o no se encuentra la configuración legal.
     */
    public function liquidarEmpleado(
        Empleado $empleado,
        PeriodoNomina $periodo,
        ConfiguracionLegal $configLegal,
    ): array {
        // ─── Preliminares ──────────────────────────────────────────────────
        $contrato = $this->getContratoActivo($empleado, $periodo);
        $datosPeriodo = $this->calcularDiasProporcionales($contrato, $periodo);
        $diasTrabajados = $datosPeriodo['dias_trabajados'];

        $horasSemanales = $this->getHorasSemanales($periodo, $configLegal);
        $valorHoraOrdinaria = $this->calcularValorHoraOrdinaria(
            (float) $contrato->salario_base,
            $horasSemanales,
        );

        $incapacidades = $this->obtenerIncapacidades($empleado, $periodo);
        $diasIncapacidad = (int) $incapacidades->sum('dias');
        $diasEfectivos = max(0, $diasTrabajados - $diasIncapacidad);

        $novedades = $this->obtenerNovedades($empleado, $periodo);

        // ─── Acumuladores ──────────────────────────────────────────────────
        $conceptos = [];
        $totalDevengado = 0.0;
        $totalDeducciones = 0.0;

        $ibcSeguridadSocial = 0.0;
        $ibcParafiscales = 0.0;
        $basePrestaciones = 0.0;
        $baseVacaciones = 0.0;

        // ==================================================================
        //  1. SALARIO BÁSICO PROPORCIONAL (SAL01)
        // ==================================================================
        {
            $salarioProporcional = round(((float) $contrato->salario_base / 30) * $diasEfectivos);
            $conceptos[] = $this->entry('SAL01', $salarioProporcional, (float) $contrato->salario_base);
            $totalDevengado += $salarioProporcional;
            $ibcSeguridadSocial += $salarioProporcional;
            $ibcParafiscales += $salarioProporcional;
            $basePrestaciones += $salarioProporcional;
            $baseVacaciones += $salarioProporcional;
        }

        // ==================================================================
        //  2. INCAPACIDADES (INC01) — una línea por cada registro
        // ==================================================================
        foreach ($incapacidades as $incapacidad) {
            $diasInc = (int) $incapacidad->dias;
            if ($diasInc <= 0) {
                continue;
            }

            $tasa = (float) ($incapacidad->porcentaje_pago ?? 66.67) / 100;
            $valorInc = round(((float) $contrato->salario_base / 30) * $diasInc * $tasa);

            if ($valorInc > 0) {
                $conceptos[] = $this->entry(
                    'INC01',
                    $valorInc,
                    round(((float) $contrato->salario_base / 30) * $diasInc),
                );
                $totalDevengado += $valorInc;
                $ibcSeguridadSocial += $valorInc;
                $basePrestaciones += $valorInc;
            }
        }

        // ==================================================================
        //  3. NOVEDADES (horas extras, recargos, bonos, comisiones)
        // ==================================================================
        foreach ($novedades as $novedad) {
            $codigoConcepto = $novedad->codigo ?? $novedad->conceptoNomina?->codigo ?? 'NOV01';
            $multiplicador = $this->getMultiplicadorConcepto($codigoConcepto);

            // Si la novedad no trae valor explícito, calcular desde horas/cantidad.
            $valorNovedad = (float) ($novedad->valor ?? 0);
            if ($valorNovedad <= 0) {
                // Intentar calcular desde cantidad de horas (si existe el campo).
                $cantidad = \is_numeric($novedad->getAttribute('cantidad') ?? null)
                    ? (float) $novedad->cantidad
                    : 0;
                $unidades = max(1, $cantidad);
                $valorNovedad = round($valorHoraOrdinaria * $multiplicador * $unidades);
            }

            if ($valorNovedad <= 0) {
                continue;
            }

            $conceptos[] = $this->entry(
                $codigoConcepto,
                $valorNovedad,
                round($valorNovedad / max($multiplicador, 1)),
            );
            $totalDevengado += $valorNovedad;

            if ($novedad->conceptoNomina?->base_seguridad_social) {
                $ibcSeguridadSocial += $valorNovedad;
            }
            if ($novedad->conceptoNomina?->base_parafiscales) {
                $ibcParafiscales += $valorNovedad;
            }
            if ($novedad->conceptoNomina?->base_prestaciones) {
                $basePrestaciones += $valorNovedad;
            }
        }

        // ==================================================================
        //  4. AUXILIO DE TRANSPORTE (AUX01) — medio de prueba, prorrateado
        // ==================================================================
        {
            $salarioMinimo = (float) $configLegal->salario_minimo;
            $topeSalarios = (float) ($configLegal->tope_auxilio_transporte_salarios ?? 2);
            $topeAuxilio = $salarioMinimo * $topeSalarios;

            if ((float) $contrato->salario_base <= $topeAuxilio && $diasEfectivos > 0) {
                $valorAuxilio = round(((float) $configLegal->auxilio_transporte / 30) * $diasEfectivos);
                if ($valorAuxilio > 0) {
                    $conceptos[] = $this->entry('AUX01', $valorAuxilio, $valorAuxilio);
                    $totalDevengado += $valorAuxilio;
                    $basePrestaciones += $valorAuxilio;
                }
            }
        }

        // ==================================================================
        //  5. IBC — INGRESO BASE DE COTIZACIÓN
        // ==================================================================
        {
            $ibcMinimo = round($salarioMinimo / 30 * $diasTrabajados);
            $ibcSeguridadSocial = max($ibcSeguridadSocial, (float) $ibcMinimo);
            $ibcParafiscales = max($ibcParafiscales, (float) $ibcMinimo);

            $ibcMaximo = 25 * $salarioMinimo;
            $ibcSeguridadSocial = min($ibcSeguridadSocial, (float) $ibcMaximo);
        }

        // ==================================================================
        //  6. SALUD (DED01) — 4% empleado
        // ==================================================================
        {
            $tasaSalud = (float) ($configLegal->aporte_salud_empleado ?? 4) / 100;
            $valorSalud = round($ibcSeguridadSocial * $tasaSalud);
            $conceptos[] = $this->entry('DED01', $valorSalud, $ibcSeguridadSocial);
            $totalDeducciones += $valorSalud;
        }

        // ==================================================================
        //  7. PENSIÓN (DED02) — 4% empleado
        // ==================================================================
        {
            $tasaPension = (float) ($configLegal->aporte_pension_empleado ?? 4) / 100;
            $valorPension = round($ibcSeguridadSocial * $tasaPension);
            $conceptos[] = $this->entry('DED02', $valorPension, $ibcSeguridadSocial);
            $totalDeducciones += $valorPension;
        }

        // ==================================================================
        //  8. FONDO DE SOLIDARIDAD PENSIONAL — FSP (DED05)
        // ==================================================================
        {
            $salariosMinimos = $salarioMinimo > 0 ? $ibcSeguridadSocial / $salarioMinimo : 0;
            $tasaFsp = $this->getTasaFondoSolidaridad($salariosMinimos);

            if ($tasaFsp > 0) {
                $valorFsp = round($ibcSeguridadSocial * ($tasaFsp / 100));
                $conceptos[] = $this->entry('DED05', $valorFsp, $ibcSeguridadSocial);
                $totalDeducciones += $valorFsp;
            }
        }

        // ==================================================================
        //  9. RETENCIÓN EN LA FUENTE (DED03) — Procedimiento 2 Art. 383 ET
        // ==================================================================
        {
            $valorRetefuente = $this->calcularRetefuente(
                ingresoLaboral: $totalDevengado,
                deducciones: $totalDeducciones,
                configLegal: $configLegal,
            );

            if ($valorRetefuente > 0) {
                $conceptos[] = $this->entry('DED03', $valorRetefuente, $totalDevengado);
                $totalDeducciones += $valorRetefuente;
            }
        }

        // ==================================================================
        //  10. PRÉSTAMOS (DED04) — cuota vencida más antigua
        // ==================================================================
        {
            $fechaFinStr = $this->dateToString($periodo->fecha_fin);

            $prestamosActivos = Prestamo::with('cuotas')
                ->where('empleado_id', $empleado->id)
                ->where('estado', 'ACTIVO')
                ->get();

            foreach ($prestamosActivos as $prestamo) {
                $cuotaVencida = $prestamo->cuotas()
                    ->where('estado', 'PENDIENTE')
                    ->where('fecha_vencimiento', '<=', $fechaFinStr)
                    ->orderBy('numero_cuota')
                    ->first();

                if (!$cuotaVencida) {
                    continue;
                }

                $conceptos[] = $this->entry('DED04', (float) $cuotaVencida->monto, (float) $cuotaVencida->monto);
                $totalDeducciones += (float) $cuotaVencida->monto;
            }
        }

        // ==================================================================
        //  11. PROVISIONES (PRESTACIONES SOCIALES)
        // ==================================================================
        $totalProvisiones = 0.0;
        foreach ($this->calcularProvisiones($basePrestaciones, $baseVacaciones) as $entry) {
            $conceptos[] = $entry;
            $totalProvisiones += $entry['valor'];
        }

        // ==================================================================
        //  12. APORTES PATRONALES
        // ==================================================================
        $riesgoArl = $contrato->getAttribute('riesgo_arl_clase') ?? 'I';
        $exonerado = (bool) ($contrato->getAttribute('aplica_exoneracion_aportes') ?? false);

        $totalPatronales = 0.0;
        foreach ($this->calcularAportesPatronales(
            ibcSeguridadSocial: $ibcSeguridadSocial,
            ibcParafiscales: $ibcParafiscales,
            configLegal: $configLegal,
            riesgoArlClase: $riesgoArl,
            exonerado: $exonerado,
        ) as $entry) {
            $conceptos[] = $entry;
            $totalPatronales += $entry['valor'];
        }

        // ==================================================================
        //  VINCULAR NOVEDADES AL PERÍODO (side-effect)
        // ==================================================================
        $this->vincularNovedades($novedades, $periodo);

        // ==================================================================
        //  RESUMEN NUMÉRICO
        // ==================================================================
        $netoPagar = $totalDevengado - $totalDeducciones;

        return [
            'conceptos' => $conceptos,
            'resumen'   => [
                'dias_laborados'           => $diasTrabajados,
                'dias_incapacidad'         => $diasIncapacidad,
                'ibc_seguridad_social'     => $ibcSeguridadSocial,
                'ibc_parafiscales'         => $ibcParafiscales,
                'total_devengado'          => $totalDevengado,
                'total_deducciones'        => $totalDeducciones,
                'neto_pagar'               => $netoPagar,
                'total_provisiones'        => $totalProvisiones,
                'total_aportes_patronales' => $totalPatronales,
                'costo_laboral_total'      => $totalDevengado + $totalProvisiones + $totalPatronales,
            ],
        ];
    }

    /**
     * Liquida la nómina completa para todos los empleados con contrato activo
     * dentro del período. Persiste los resultados en BD dentro de una transacción.
     *
     * @param PeriodoNomina $periodo Período a liquidar.
     *
     * @return int Cantidad de nóminas liquidadas.
     *
     * @throws \RuntimeException Si el período no está en estado BORRADOR
     *                          o no se encuentra configuración legal.
     */
    public function liquidarPeriodo(PeriodoNomina $periodo): int
    {
        $estado = strtoupper($periodo->estado ?? '');
        if (!\in_array($estado, ['BORRADOR', 'DRAFT'], true)) {
            throw new \RuntimeException(
                "El período {$periodo->codigo} no está en estado BORRADOR ({$periodo->estado}).",
            );
        }

        return DB::transaction(function () use ($periodo): int {
            // Revertir cuotas de préstamo de una liquidación previa.
            $this->revertirCuotasDelPeriodo($periodo);

            // Limpiar nóminas previas del período.
            $periodo->nominas()->each(function (Nomina $nomina): void {
                $nomina->detalles()->delete();
                $nomina->delete();
            });

            // Obtener configuración legal del año.
            $fechaInicio = $this->dateToString($periodo->fecha_inicio);
            $ano = (int) date('Y', strtotime($fechaInicio));

            $configLegal = ConfiguracionLegal::where('ano_vigencia', $ano)
                ->where('tenant_id', $periodo->tenant_id)
                ->first();

            if (!$configLegal) {
                throw new \RuntimeException("No se encontró configuración legal para el año {$ano}.");
            }

            $fechaFin = $this->dateToString($periodo->fecha_fin);

            // Contratos activos dentro del período.
            $contratos = Contrato::with('empleado')
                ->where('estado', true)
                ->where('fecha_inicio', '<=', $fechaFin)
                ->where(function ($q) use ($fechaInicio): void {
                    $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $fechaInicio);
                })
                ->get();

            $contador = 0;

            foreach ($contratos as $contrato) {
                $empleado = $contrato->empleado;
                if (!$empleado) {
                    continue;
                }

                $resultado = $this->liquidarEmpleado($empleado, $periodo, $configLegal);
                $this->persistirLiquidacion($periodo, $contrato, $empleado, $resultado, $ano);
                $contador++;
            }

            // Actualizar totales del período.
            $periodo->refresh();
            $periodo->update([
                'total_devengado'          => $periodo->nominas()->sum('total_devengado'),
                'total_deducciones'        => $periodo->nominas()->sum('total_deducciones'),
                'total_provisiones'        => $periodo->nominas()->sum('total_provisiones'),
                'total_aportes_patronales' => $periodo->nominas()->sum('total_aportes_patronales'),
                'neto_pagar'               => $periodo->nominas()->sum('neto_pagar'),
                'estado'                   => 'LIQUIDADA',
            ]);

            return $contador;
        });
    }

    /**
     * Recalcula los totales de una nómina a partir de sus detalles.
     */
    public function recalcularTotales(Nomina $nomina): void
    {
        $detalles = $nomina->detalles()->with('concepto')->get();

        $totalDevengado = 0.0;
        $totalDeducciones = 0.0;
        $totalProvisiones = 0.0;
        $totalPatronales = 0.0;

        foreach ($detalles as $detalle) {
            $tipo = $detalle->concepto?->tipo;
            $valor = (float) $detalle->valor;

            match ($tipo) {
                'DEVENGADO'      => $totalDevengado += $valor,
                'DEDUCCION'      => $totalDeducciones += $valor,
                'PROVISION'      => $totalProvisiones += $valor,
                'APORTE_PATRONAL'=> $totalPatronales += $valor,
                default          => null,
            };
        }

        $nomina->update([
            'total_devengado'           => $totalDevengado,
            'total_deducciones'         => $totalDeducciones,
            'neto_pagar'                => $totalDevengado - $totalDeducciones,
            'total_provisiones'         => $totalProvisiones,
            'total_aportes_patronales'  => $totalPatronales,
            'costo_laboral_total'       => $totalDevengado + $totalProvisiones + $totalPatronales,
        ]);
    }

    /**
     * Actualiza un concepto individual en una nómina ya liquidada.
     * Crea o actualiza el detalle y recalcula los totales.
     *
     * @param Nomina $nomina     Nómina a modificar.
     * @param int    $conceptoId ID del concepto de nómina.
     * @param float  $nuevoValor Nuevo valor a aplicar.
     */
    public function actualizarConcepto(Nomina $nomina, int $conceptoId, float $nuevoValor): void
    {
        $detalle = $nomina->detalles()->firstOrCreate(
            ['concepto_id' => $conceptoId],
            [
                'empleado_id' => $nomina->contrato->empleado_id ?? $nomina->contrato_id,
                'contrato_id' => $nomina->contrato_id,
                'cantidad'    => 1,
                'base_calculo'=> $nuevoValor,
            ],
        );

        $detalle->update(['valor' => $nuevoValor]);
        $this->recalcularTotales($nomina);
    }

    // =========================================================================
    //  CÁLCULOS ESPECÍFICOS (públicos para testeo unitario)
    // =========================================================================

    /**
     * Calcula la Retención en la Fuente por salarios (Procedimiento 2).
     *
     * Basada en el Artículo 383 del Estatuto Tributario, con tabla de
     * 7 tramos marginales expresados en UVT:
     *
     *   Desde (UVT)   Hasta (UVT)   Tarifa   Impuesto acumulado (UVT)
     *        0             95         0%          0
     *       95            150        19%         10.45
     *      150            360        28%         69.25
     *      360            640        33%        161.65
     *      640            945        35%        268.40
     *      945           2300        37%        769.75
     *     2300          adelante     39%
     *
     * Depuración: 25% del ingreso laboral mensual, límite 240 UVT.
     *
     * @param float              $ingresoLaboral Total ingresos laborales gravables.
     * @param float              $deducciones    Deducciones (salud + pensión + FSP).
     * @param ConfiguracionLegal $configLegal    Configuración legal con valor UVT.
     *
     * @return float Valor de la retención en pesos COP, redondeado.
     */
    public function calcularRetefuente(
        float $ingresoLaboral,
        float $deducciones,
        ConfiguracionLegal $configLegal,
    ): float {
        $uvt = (float) ($configLegal->valor_uvt ?? 0);

        if ($uvt <= 0) {
            return 0;
        }

        $ingresoBase = $ingresoLaboral - $deducciones;

        if ($ingresoBase <= 0) {
            return 0;
        }

        $pctDepuracion = (float) config('retefuente.depuracion_porcentaje', 0.25);
        $topeDepuracionUvt = (float) config('retefuente.depuracion_tope_uvt', 240);
        $exencion = min($ingresoLaboral * $pctDepuracion, $topeDepuracionUvt * $uvt);

        $baseGravable = $ingresoBase - $exencion;

        if ($baseGravable <= 0) {
            return 0;
        }

        $baseUvt = $baseGravable / $uvt;
        $tramos = config('retefuente.tramos', []);
        $impuestoUvt = $this->aplicarTramosRetefuente($baseUvt, $tramos);

        return round($impuestoUvt * $uvt);
    }

    /**
     * Calcula las provisiones de prestaciones sociales.
     *
     * @param float $basePrestaciones Base para prima, cesantías e intereses.
     * @param float $baseVacaciones   Base para vacaciones.
     *
     * @return list<array{concepto_codigo: string, valor: float, base_calculo: float}>
     */
    public function calcularProvisiones(float $basePrestaciones, float $baseVacaciones): array
    {
        $result = [];

        $valorPrima = round($basePrestaciones / 12);
        if ($valorPrima > 0) {
            $result[] = $this->entry('PRO01', $valorPrima, $basePrestaciones);
        }

        $valorCesantias = round($basePrestaciones / 12);
        if ($valorCesantias > 0) {
            $result[] = $this->entry('PRO02', $valorCesantias, $basePrestaciones);
        }

        $valorIntereses = round($valorCesantias * 0.12);
        if ($valorIntereses > 0) {
            $result[] = $this->entry('PRO03', $valorIntereses, $valorCesantias);
        }

        $valorVacaciones = round($baseVacaciones / 24);
        if ($valorVacaciones > 0) {
            $result[] = $this->entry('PRO04', $valorVacaciones, $baseVacaciones);
        }

        return $result;
    }

    /**
     * Calcula los aportes patronales (seguridad social y parafiscales).
     *
     * @param float              $ibcSeguridadSocial IBC para seguridad social.
     * @param float              $ibcParafiscales    IBC para parafiscales.
     * @param ConfiguracionLegal $configLegal        Configuración legal vigente.
     * @param string             $riesgoArlClase     Clase de riesgo ARL (I, II, III, IV, V).
     * @param bool               $exonerado          Si aplica exoneración de parafiscales.
     *
     * @return list<array{concepto_codigo: string, valor: float, base_calculo: float}>
     */
    public function calcularAportesPatronales(
        float $ibcSeguridadSocial,
        float $ibcParafiscales,
        ConfiguracionLegal $configLegal,
        string $riesgoArlClase = 'I',
        bool $exonerado = false,
    ): array {
        $result = [];

        // PAT01 — Pensión patronal (12% del IBC SS).
        $tasaPensionPatronal = (float) ($configLegal->aporte_pension_patronal ?? 12) / 100;
        $result[] = $this->entry('PAT01', round($ibcSeguridadSocial * $tasaPensionPatronal), $ibcSeguridadSocial);

        if (!$exonerado) {
            // PAT02 — Salud patronal (8.5% del IBC SS).
            $tasaSaludPatronal = (float) ($configLegal->aporte_salud_patronal ?? 8.5) / 100;
            $result[] = $this->entry('PAT02', round($ibcSeguridadSocial * $tasaSaludPatronal), $ibcSeguridadSocial);
        }

        // PAT03 — ARL según clase de riesgo.
        $tasaArl = $this->getTasaArl($riesgoArlClase) / 100;
        $result[] = $this->entry('PAT03', round($ibcSeguridadSocial * $tasaArl), $ibcSeguridadSocial);

        // PAT04 — Caja de Compensación Familiar (4% del IBC parafiscales).
        $tasaCcf = (float) ($configLegal->caja_compensacion ?? 4) / 100;
        $result[] = $this->entry('PAT04', round($ibcParafiscales * $tasaCcf), $ibcParafiscales);

        if (!$exonerado) {
            // PAT05 — SENA (2% del IBC parafiscales).
            $tasaSena = (float) ($configLegal->sena ?? 2) / 100;
            $result[] = $this->entry('PAT05', round($ibcParafiscales * $tasaSena), $ibcParafiscales);

            // PAT06 — ICBF (3% del IBC parafiscales).
            $tasaIcbf = (float) ($configLegal->icbf ?? 3) / 100;
            $result[] = $this->entry('PAT06', round($ibcParafiscales * $tasaIcbf), $ibcParafiscales);
        }

        return $result;
    }

    // =========================================================================
    //  MÉTODOS PRIVADOS — HELPERS
    // =========================================================================

    /**
     * Crea una entrada de concepto para el array de retorno.
     */
    private function entry(string $codigo, float $valor, float $baseCalculo): array
    {
        return [
            'concepto_codigo' => $codigo,
            'valor'           => $valor,
            'base_calculo'    => $baseCalculo,
        ];
    }

    /**
     * Obtiene (y cachea) un concepto de nómina por su código.
     */
    private function conceptoPorCodigo(string $codigo): ?ConceptoNomina
    {
        if (!\array_key_exists($codigo, $this->conceptoCache)) {
            $this->conceptoCache[$codigo] = ConceptoNomina::where('codigo', $codigo)->first();
        }

        return $this->conceptoCache[$codigo];
    }

    /**
     * Obtiene (y cachea) un concepto por su ID.
     */
    private function conceptoPorId(int $id): ?ConceptoNomina
    {
        $key = "id_{$id}";
        if (!\array_key_exists($key, $this->conceptoCache)) {
            $this->conceptoCache[$key] = ConceptoNomina::find($id);
        }

        return $this->conceptoCache[$key];
    }

    /**
     * Obtiene el contrato activo del empleado vigente durante el período.
     */
    private function getContratoActivo(Empleado $empleado, PeriodoNomina $periodo): Contrato
    {
        $fechaInicio = $this->dateToString($periodo->fecha_inicio);
        $fechaFin = $this->dateToString($periodo->fecha_fin);

        $contrato = Contrato::where('empleado_id', $empleado->id)
            ->where('estado', true)
            ->where('fecha_inicio', '<=', $fechaFin)
            ->where(function ($q) use ($fechaInicio): void {
                $q->whereNull('fecha_fin')->orWhere('fecha_fin', '>=', $fechaInicio);
            })
            ->latest('fecha_inicio')
            ->first();

        if (!$contrato) {
            throw new \RuntimeException(
                \sprintf(
                    'El empleado %s no tiene contrato activo en el período %s — %s.',
                    $empleado->id,
                    $fechaInicio,
                    $fechaFin,
                ),
            );
        }

        return $contrato;
    }

    /**
     * Calcula los días proporcionales laborados en el período.
     *
     * Mes de 30 días. Si el contrato cubre el mes completo (día 1 al último
     * día del mes), se liquidan exactamente 30 días.
     */
    private function calcularDiasProporcionales(Contrato $contrato, PeriodoNomina $periodo): array
    {
        $inicioPeriodo = $this->carbonDate($periodo->fecha_inicio);
        $finPeriodo = $this->carbonDate($periodo->fecha_fin);

        $inicioContrato = $this->carbonDate($contrato->fecha_inicio);
        $inicioReal = $inicioContrato->max($inicioPeriodo);

        $finReal = $contrato->fecha_fin
            ? $this->carbonDate($contrato->fecha_fin)->min($finPeriodo)
            : $finPeriodo;

        $diasCalendario = (int) $inicioReal->diffInDays($finReal) + 1;

        // Mes completo (día 1 al último día del mes) → 30 días exactos.
        $cubreMesCompleto = $inicioReal->day === 1
            && $finReal->isLastOfMonth()
            && $inicioReal->isSameMonth($finReal);

        $diasTrabajados = $cubreMesCompleto ? 30 : \min($diasCalendario, 30);

        return [
            'dias_trabajados'    => $diasTrabajados,
            'inicio_real'        => $inicioReal,
            'fin_real'           => $finReal,
            'cubre_mes_completo' => $cubreMesCompleto,
        ];
    }

    /**
     * Determina las horas semanales según la Ley 2101.
     * A partir del 15 de julio de 2026: 42 horas semanales.
     */
    private function getHorasSemanales(PeriodoNomina $periodo, ConfiguracionLegal $configLegal): int
    {
        $fechaInicio = $this->dateToString($periodo->fecha_inicio);
        $fechaCorte = date('Y-07-15', strtotime($fechaInicio));

        return $fechaInicio >= $fechaCorte
            ? 42
            : ($configLegal->horas_semanales ?? 46);
    }

    /**
     * Valor de hora ordinaria: salario_base / ((horas_semanales / 48) * 240)
     */
    private function calcularValorHoraOrdinaria(float $salarioBase, int $horasSemanales): float
    {
        $divisor = ($horasSemanales / 48) * 240;

        return $divisor > 0 ? $salarioBase / $divisor : 0;
    }

    /**
     * Obtiene las incapacidades del empleado dentro del período.
     *
     * @return Collection<int, Incapacidad>
     */
    private function obtenerIncapacidades(Empleado $empleado, PeriodoNomina $periodo): Collection
    {
        return Incapacidad::where('empleado_id', $empleado->id)
            ->whereBetween('fecha_inicio', [
                $this->dateToString($periodo->fecha_inicio),
                $this->dateToString($periodo->fecha_fin),
            ])
            ->get();
    }

    /**
     * Obtiene las novedades pendientes del empleado para el período.
     *
     * @return Collection<int, Novedad>
     */
    private function obtenerNovedades(Empleado $empleado, PeriodoNomina $periodo): Collection
    {
        return Novedad::with('conceptoNomina')
            ->where('empleado_id', $empleado->id)
            ->where('estado', 'pendiente')
            ->where(function ($q) use ($periodo): void {
                $q->where('periodo_id', $periodo->id)
                    ->orWhere(function ($sub) use ($periodo): void {
                        $sub->whereNull('periodo_id')
                            ->whereBetween('fecha_registro', [
                                $this->dateToString($periodo->fecha_inicio),
                                $this->dateToString($periodo->fecha_fin),
                            ]);
                    });
            })
            ->get();
    }

    /**
     * Marca las novedades como aplicadas y las asocia al período.
     */
    private function vincularNovedades(Collection $novedades, PeriodoNomina $periodo): void
    {
        foreach ($novedades as $novedad) {
            if ($novedad->periodo_id === null) {
                $novedad->updateQuietly(['periodo_id' => $periodo->id]);
            }
            if ($novedad->estado === 'pendiente') {
                $novedad->updateQuietly(['estado' => 'aplicada']);
            }
        }
    }

    /**
     * Persiste una liquidación en la base de datos.
     */
    private function persistirLiquidacion(
        PeriodoNomina $periodo,
        Contrato $contrato,
        Empleado $empleado,
        array $resultado,
        int $ano,
    ): void {
        // Cabecera de nómina.
        $nomina = Nomina::create([
            'tenant_id'              => $periodo->tenant_id,
            'periodo_id'             => $periodo->id,
            'contrato_id'            => $contrato->id,
            'empleado_id'            => $empleado->id,
            'fecha_inicio'           => $periodo->fecha_inicio,
            'fecha_fin'              => $periodo->fecha_fin,
            'dias_laborados'         => $resultado['resumen']['dias_laborados'],
            'ibc_seguridad_social'   => $resultado['resumen']['ibc_seguridad_social'],
            'ibc_parafiscales'       => $resultado['resumen']['ibc_parafiscales'],
            'auxilio_transporte'     => $this->extraerValor($resultado['conceptos'], 'AUX01'),
            'total_devengado'        => $resultado['resumen']['total_devengado'],
            'total_deducciones'      => $resultado['resumen']['total_deducciones'],
            'neto_pagar'             => $resultado['resumen']['neto_pagar'],
            'total_provisiones'      => $resultado['resumen']['total_provisiones'],
            'total_aportes_patronales' => $resultado['resumen']['total_aportes_patronales'],
            'costo_laboral_total'    => $resultado['resumen']['costo_laboral_total'],
        ]);

        // Detalles por concepto.
        foreach ($resultado['conceptos'] as $entry) {
            $conceptoModelo = $this->conceptoPorCodigo($entry['concepto_codigo']);

            NominaDetalle::create([
                'nomina_id'    => $nomina->id,
                'concepto_id'  => $conceptoModelo?->id,
                'empleado_id'  => $empleado->id,
                'contrato_id'  => $contrato->id,
                'cantidad'     => 1,
                'valor'        => $entry['valor'],
                'base_calculo' => $entry['base_calculo'],
            ]);
        }

        // Actualizar cuotas de préstamo.
        $this->aplicarCuotasPrestamo($nomina, $contrato, $periodo, $resultado['conceptos']);

        // Actualizar provisiones acumuladas.
        $this->actualizarProvisionesAcumuladas($nomina, $resultado['conceptos'], $ano);
    }

    /**
     * Actualiza las cuotas de préstamo marcándolas como pagadas.
     */
    private function aplicarCuotasPrestamo(
        Nomina $nomina,
        Contrato $contrato,
        PeriodoNomina $periodo,
        array $conceptos,
    ): void {
        $fechaFin = $this->dateToString($periodo->fecha_fin);

        foreach ($conceptos as $entry) {
            if ($entry['concepto_codigo'] !== 'DED04') {
                continue;
            }

            $cuota = \App\Modules\Hr\Models\PrestamoCuota::whereHas('prestamo', function ($q) use ($contrato): void {
                $q->where('empleado_id', $contrato->empleado_id);
            })
                ->where('estado', 'PENDIENTE')
                ->where('fecha_vencimiento', '<=', $fechaFin)
                ->where('monto', $entry['valor'])
                ->orderBy('numero_cuota')
                ->first();

            if ($cuota) {
                $cuota->update([
                    'estado'    => 'PAGADA',
                    'nomina_id' => $nomina->id,
                ]);

                $prestamo = $cuota->prestamo;
                if ($prestamo) {
                    $prestamo->decrement('saldo_pendiente', (float) $cuota->monto);
                    if ((float) $prestamo->saldo_pendiente <= 0) {
                        $prestamo->update(['estado' => 'PAGADO']);
                    }
                }
            }
        }
    }

    /**
     * Revierte cuotas de préstamo de una liquidación previa del período.
     */
    private function revertirCuotasDelPeriodo(PeriodoNomina $periodo): void
    {
        $nominaIds = $periodo->nominas()->pluck('id');

        if ($nominaIds->isEmpty()) {
            return;
        }

        $cuotas = \App\Modules\Hr\Models\PrestamoCuota::with('prestamo')
            ->whereIn('nomina_id', $nominaIds)
            ->where('estado', 'PAGADA')
            ->get();

        foreach ($cuotas as $cuota) {
            $prestamo = $cuota->prestamo;
            if ($prestamo) {
                $prestamo->increment('saldo_pendiente', (float) $cuota->monto);
                if ($prestamo->estado === 'PAGADO') {
                    $prestamo->update(['estado' => 'ACTIVO']);
                }
            }
            $cuota->update(['estado' => 'PENDIENTE', 'nomina_id' => null]);
        }
    }

    /**
     * Acumula las provisiones anuales del empleado.
     */
    private function actualizarProvisionesAcumuladas(Nomina $nomina, array $conceptos, int $ano): void
    {
        $tipoPorCodigo = [
            'PRO01' => 'PRIMA',
            'PRO02' => 'CESANTIAS',
            'PRO03' => 'INT_CESANTIAS',
            'PRO04' => 'VACACIONES',
        ];

        foreach ($conceptos as $entry) {
            $tipo = $tipoPorCodigo[$entry['concepto_codigo']] ?? null;

            if ($tipo === null) {
                continue;
            }

            $provision = ProvisionAcumulada::firstOrCreate(
                [
                    'empleado_id'   => $nomina->contrato->empleado_id,
                    'tipo_provision' => $tipo,
                    'ano'           => $ano,
                ],
                [
                    'tenant_id'    => $nomina->tenant_id,
                    'saldo_inicial' => 0,
                    'saldo_final'   => 0,
                ],
            );

            $provision->increment('movimiento_mes', (float) $entry['valor']);
            $provision->increment('saldo_final', (float) $entry['valor']);
        }
    }

    /**
     * Extrae el valor de un concepto del array de resultados.
     */
    private function extraerValor(array $conceptos, string $codigo): float
    {
        foreach ($conceptos as $entry) {
            if ($entry['concepto_codigo'] === $codigo) {
                return (float) $entry['valor'];
            }
        }

        return 0.0;
    }

    /**
     * Normaliza una fecha (Carbon, string, DateTime) a string Y-m-d.
     */
    private function dateToString(mixed $fecha): string
    {
        if ($fecha instanceof \DateTimeInterface) {
            return $fecha->format('Y-m-d');
        }

        return (string) $fecha;
    }

    /**
     * Convierte una fecha (Carbon, string, DateTime) a Carbon.
     */
    private function carbonDate(mixed $fecha): Carbon
    {
        if ($fecha instanceof Carbon) {
            return $fecha;
        }

        if ($fecha instanceof \DateTimeInterface) {
            return Carbon::parse($fecha->format('Y-m-d'));
        }

        return Carbon::parse((string) $fecha);
    }

    // =========================================================================
    //  MULTIPLICADORES Y TASAS LEGALES
    // =========================================================================

    /**
     * Multiplicador para horas extras y recargos según el código de concepto.
     *
     *   HEX01 — Extra diurna:              1.25
     *   HEX02 — Extra nocturna:            1.75
     *   HEX03 — Extra diurna festiva:      2.00
     *   HEX04 — Extra nocturna festiva:    2.50
     *   REC01 — Recargo nocturno:          1.35  (base + 35%)
     *   REC02 — Recargo diurno festivo:    1.75  (base + 75%)
     *   REC03 — Recargo nocturno festivo:  2.10  (base + 110%)
     *   EDF01 — Dominical/Festivo diurno:  1.75  (base + 75%)
     *   ENF01 — Dominical/Festivo nocturno:2.10  (base + 110%)
     */
    private function getMultiplicadorConcepto(string $codigo): float
    {
        return match ($codigo) {
            'HEX01' => 1.25,
            'HEX02' => 1.75,
            'HEX03' => 2.00,
            'HEX04' => 2.50,
            'REC01' => 1.35,
            'REC02' => 1.75,
            'REC03' => 2.10,
            'EDF01' => 1.75,
            'ENF01' => 2.10,
            default => 1.00,
        };
    }

    /**
     * Tasa ARL según clase de riesgo (Decreto 1607/2002).
     *
     *   I   (Mínimo):   0.522%
     *   II  (Bajo):     1.044%
     *   III (Medio):    2.436%
     *   IV  (Alto):     4.350%
     *   V   (Máximo):   6.960%
     */
    private function getTasaArl(string $clase): float
    {
        return match ($clase) {
            'I'    => 0.522,
            'II'   => 1.044,
            'III'  => 2.436,
            'IV'   => 4.350,
            'V'    => 6.960,
            default => 0.522,
        };
    }

    /**
     * Aplica los tramos marginales de retefuente leídos desde config/retefuente.php.
     *
     * @param float   $baseUvt Base gravable en UVT.
     * @param array[] $tramos  Tramos del config (desde, hasta, tarifa, acumulado).
     *
     * @return float Impuesto en UVT.
     */
    private function aplicarTramosRetefuente(float $baseUvt, array $tramos): float
    {
        foreach (array_reverse($tramos) as $tramo) {
            if ($baseUvt > $tramo['desde']) {
                return ($baseUvt - $tramo['desde']) * $tramo['tarifa'] + $tramo['acumulado'];
            }
        }

        return 0.0;
    }

    /**
     * Tasa del Fondo de Solidaridad Pensional (Ley 797/2003).
     *
     *   < 4  SMLMV → 0.0%
     *   4–16       → 1.0%
     *   16–17      → 1.2%
     *   17–18      → 1.4%
     *   18–19      → 1.6%
     *   19–20      → 1.8%
     *   ≥ 20       → 2.0%
     */
    private function getTasaFondoSolidaridad(float $salariosMinimos): float
    {
        return match (true) {
            $salariosMinimos < 4  => 0.0,
            $salariosMinimos < 16 => 1.0,
            $salariosMinimos < 17 => 1.2,
            $salariosMinimos < 18 => 1.4,
            $salariosMinimos < 19 => 1.6,
            $salariosMinimos < 20 => 1.8,
            default               => 2.0,
        };
    }
}

