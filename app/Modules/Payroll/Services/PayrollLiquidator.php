<?php

namespace App\Modules\Payroll\Services;

use App\Modules\Hr\Models\Empleado;
use App\Modules\Payroll\Models\Novedad;

/**
 * @deprecated 2026-06-26 — Eliminado de LiquidacionController y PeriodoController.
 *             Ambos controladores ahora usan NominaService exclusivamente.
 *             Este archivo solo se mantiene por referencia histórica y será
 *             eliminado en la siguiente iteración de limpieza.
 *
 *             Si necesitas liquidar nómina, usa:
 *               - NominaService::liquidarPeriodo(PeriodoNomina $periodo)
 *               - NominaService::liquidarEmpleado(Empleado, PeriodoNomina, ConfiguracionLegal)
 */
class PayrollLiquidator
{
    // Parámetros legales (Fijos para MVP 2026)
    public const SMLMV = 1300000;
    public const AUXILIO_TRANSPORTE = 162000;
    public const PORCENTAJE_SALUD = 0.04;
    public const PORCENTAJE_PENSION = 0.04;

    /**
     * Calcula una nómina mensual (30 días) o proporcional para un empleado.
     */
    public function liquidarMensualidad(Empleado $empleado, array $novedadesPeriodo = []): array
    {
        $contrato = $empleado->contratoActivo;
        
        if (!$contrato) {
            throw new \Exception("El empleado {$empleado->documento} no tiene contrato activo.");
        }

        $salarioBase = $contrato->salario_base;
        $diasLaborados = 30; // Para MVP asumimos mes completo, las ausencias se manejarán luego.

        // Cálculo Devengos base
        $salarioProporcional = ($salarioBase / 30) * $diasLaborados;
        
        // Auxilio de Transporte (Si gana hasta 2 SMLMV)
        $auxilioTransporte = 0;
        if ($salarioBase <= (self::SMLMV * 2)) {
            $auxilioTransporte = (self::AUXILIO_TRANSPORTE / 30) * $diasLaborados;
        }

        // Novedades
        $ingresosAdicionales = 0;
        $descuentosAdicionales = 0;

        foreach ($novedadesPeriodo as $novedad) {
            if ($novedad->tipo === 'ingreso') {
                $ingresosAdicionales += $novedad->valor;
            } elseif ($novedad->tipo === 'descuento') {
                $descuentosAdicionales += $novedad->valor;
            }
        }

        $totalDevengos = $salarioProporcional + $auxilioTransporte + $ingresosAdicionales;

        // Base de Cotización a Seguridad Social (No incluye Auxilio Transporte)
        $ibc = $salarioProporcional + $ingresosAdicionales;
        
        // Regla: El IBC NUNCA puede ser inferior a 1 SMLMV (Proporcional a los días)
        $ibcMinimo = (self::SMLMV / 30) * $diasLaborados;
        if ($ibc < $ibcMinimo) {
            $ibc = $ibcMinimo;
        }

        // Deducciones Legales
        $salud = round($ibc * self::PORCENTAJE_SALUD, 0); // Redondeo pila
        $pension = round($ibc * self::PORCENTAJE_PENSION, 0);

        $totalDeducciones = $salud + $pension + $descuentosAdicionales;

        $neto = $totalDevengos - $totalDeducciones;

        return [
            'empleado_id' => $empleado->id,
            'dias_laborados' => $diasLaborados,
            'salario_base' => $salarioBase,
            'auxilio_transporte' => $auxilioTransporte,
            'total_devengos' => $totalDevengos,
            'salud_deduccion' => $salud,
            'pension_deduccion' => $pension,
            'total_deducciones' => $totalDeducciones,
            'neto_pagar' => $neto,
        ];
    }
}
