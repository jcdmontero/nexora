<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Configuracion;
use App\Modules\Accounting\Models\TenantRegimenHistorial;
use App\Modules\Accounting\Services\ContabilidadConfig;
use Carbon\Carbon;

class TributaryRuleService
{
    /**
     * Umbral mínimo para retención en la fuente (Art. 376 E.T.).
     * Si el valor de la retención es inferior a este monto, no se cobra.
     * A-11: Se resuelve desde Configuracion; este es el fallback por defecto (1 UVT 2026).
     */
    private const UMBRAL_MINIMO_RETENCION_DEFAULT = 107000;

    /**
     * Calcula el desglose tributario de una transacción.
     * 
     * @param float $base El valor base antes de impuestos
     * @param string $tipo 'venta' o 'compra'
     * @param int $tenantId
     * @param ?string $fecha Fecha de la transacción para validar el régimen en ese momento
     * @return array [ 'base' => x, 'iva' => x, 'retenciones' => x, 'total' => x ]
     */
    /**
     * Calcula el desglose tributario de una transacción.
     * 
     * @param float $base El valor base antes de impuestos
     * @param string $tipo 'venta' o 'compra'
     * @param int $tenantId
     * @param mixed $tercero El modelo Cliente o Proveedor
     * @param ?string $fecha Fecha de la transacción para validar el régimen en ese momento
     * @return array [ 'base' => x, 'iva' => x, 'retenciones' => x, 'total' => x ]
     */
    public function calculateTaxes(float $base, string $tipo, int $tenantId, $tercero = null, ?string $fecha = null): array
    {
        $regimen = $this->getRegimeAtDate($tenantId, $fecha);

        if ($regimen === 'simplificado') {
            return [
                'base' => $base,
                'iva' => 0,
                'retenciones' => [],
                'total_retenciones' => 0,
                'total' => $base,
                'regimen' => 'simplificado',
                'regimen_label' => 'Régimen Simplificado',
            ];
        }

        // Régimen Responsable de IVA
        $tax = \App\Core\Models\Tax::where('tenant_id', $tenantId)
            ->where('codigo', 'IVA')
            ->where('activo', true)
            ->first();

        $porcentajeIva = $tax ? (float)$tax->porcentaje : 19.0;
        $iva = round($base * ($porcentajeIva / 100), 2);

        // Retenciones — solo se aplican en ventas (al cliente) o compras (al proveedor)
        $retenciones = [];
        $totalRetenciones = 0;

        if ($tercero) {
            // Retención en la Fuente — base pre-IVA según Art. 376 E.T.
            if (isset($tercero->porcentaje_retencion_fuente) && $tercero->porcentaje_retencion_fuente > 0) {
                $baseRetencion = $base;
                $reteFuente = round($baseRetencion * ($tercero->porcentaje_retencion_fuente / 100), 2);

                // Art. 376 E.T.: no se cobra retención si el valor es inferior al umbral mínimo (1 UVT)
                $umbral = ContabilidadConfig::umbralRetencionFuente($tenantId);
                if ($reteFuente >= $umbral) {
                    $retenciones['rete_fuente'] = [
                        'tipo' => 'rete_fuente',
                        'base' => round($baseRetencion, 2),
                        'tarifa' => $tercero->porcentaje_retencion_fuente,
                        'valor' => $reteFuente,
                    ];
                    $totalRetenciones += $reteFuente;
                }
            }

            // Retención de IVA (solo en ventas)
            if ($tipo === 'venta' && isset($tercero->porcentaje_retencion_iva) && $tercero->porcentaje_retencion_iva > 0) {
                $reteIva = round($iva * ($tercero->porcentaje_retencion_iva / 100), 2);
                $retenciones['rete_iva'] = [
                    'tipo' => 'rete_iva',
                    'base' => $iva,
                    'tarifa' => $tercero->porcentaje_retencion_iva,
                    'valor' => $reteIva,
                ];
                $totalRetenciones += $reteIva;
            }

            // Retención de ICA (solo en ventas) — tarifa del municipio según Art. 376 E.T.
            if ($tipo === 'venta') {
                $tarifaIcaMunicipio = $this->getTarifaIcaMunicipio($tenantId);
                if ($tarifaIcaMunicipio > 0) {
                    $reteIca = round($base * ($tarifaIcaMunicipio / 100), 2);
                    $retenciones['rete_ica'] = [
                        'tipo' => 'rete_ica',
                        'base' => $base,
                        'tarifa' => $tarifaIcaMunicipio,
                        'valor' => $reteIca,
                    ];
                    $totalRetenciones += $reteIca;
                }
            }
        }

        return [
            'base' => $base,
            'iva' => $iva,
            'retenciones' => $retenciones,
            'total_retenciones' => $totalRetenciones,
            'total' => $base + $iva - $totalRetenciones,
            'regimen' => 'comun',
            'regimen_label' => 'Régimen Común',
        ];
    }

    /**
     * Determina el régimen que tenía el tenant en una fecha específica.
     * A-04: Consulta el historial versionado de cambios de régimen.
     */
    public function getRegimeAtDate(int $tenantId, ?string $fecha = null): string
    {
        $fechaConsulta = $fecha ? Carbon::parse($fecha) : now();

        // Buscar en el historial versionado el régimen vigente para la fecha consultada
        $historial = TenantRegimenHistorial::where('tenant_id', $tenantId)
            ->where('fecha_vigente_desde', '<=', $fechaConsulta->toDateString())
            ->where(function ($q) use ($fechaConsulta) {
                $q->whereNull('fecha_vigente_hasta')
                  ->orWhere('fecha_vigente_hasta', '>=', $fechaConsulta->toDateString());
            })
            ->orderByDesc('fecha_vigente_desde')
            ->first();

        if ($historial) {
            return $historial->regimen;
        }

        // Fallback: usar configuración legacy si no hay historial
        return Configuracion::get('regimen_fiscal', 'simplificado', $tenantId);
    }

    /**
     * Obtiene la tarifa ICA del municipio configurado para el tenant.
     * Art. 376 E.T.: la retención ICA se calcula con la tarifa del municipio donde se presta el servicio.
     */
    private function getTarifaIcaMunicipio(int $tenantId): float
    {
        $ciudadCodigo = Configuracion::get('codigo_municipio', null, $tenantId);
        if (!$ciudadCodigo) {
            return 0;
        }

        $tarifa = Configuracion::get("ica_municipio_{$ciudadCodigo}", null, $tenantId);
        return $tarifa !== null ? (float) $tarifa : 0;
    }

    /**
     * Obtiene las cuentas contables necesarias para una operación según el régimen.
     */
    public function getRequiredAccounts(string $operacion, string $tipo, int $tenantId): array
    {
        $regimen = $this->getRegimeAtDate($tenantId);
        $cuentas = [];

        if ($operacion === 'venta') {
            $cuentas['ingreso'] = ContabilidadConfig::ingresoVentas($tenantId);
            $cuentas['cobro'] = ContabilidadConfig::clientes($tenantId);

            if ($regimen === 'comun') {
                $cuentas['iva'] = ContabilidadConfig::ivaGenerado($tenantId);
                $cuentas['retencion'] = ContabilidadConfig::retencionFuente($tenantId);
            }
        }

        if ($operacion === 'compra') {
            $cuentas['gasto'] = ContabilidadConfig::get('cta_gasto_compras', '5105', $tenantId);
            $cuentas['pago'] = ContabilidadConfig::proveedores($tenantId);

            if ($regimen === 'comun') {
                $cuentas['iva'] = ContabilidadConfig::ivaDescontable($tenantId);
            }
        }

        return $cuentas;
    }
}
