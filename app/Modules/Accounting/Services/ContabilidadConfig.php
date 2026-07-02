<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Configuracion;

/**
 * Helper para resolver códigos de cuentas contables desde la configuración del tenant.
 *
 * Cada tenant puede personalizar sus cuentas PUC por defecto.
 * Si no están configuradas, se usan los defaults de Configuracion::defaults().
 */
class ContabilidadConfig
{
    /**
     * Obtiene el código de una cuenta contable desde la configuración del tenant.
     *
     * @param string $clave Clave de configuración (ej: 'cta_caja', 'cta_clientes')
     * @param string|null $default Código por defecto si no hay configuración
     * @param int|null $tenantId
     * @return string
     */
    public static function get(string $clave, ?string $default = null, ?int $tenantId = null): string
    {
        return Configuracion::get($clave, $default ?? self::fallback($clave), $tenantId);
    }

    /**
     * Atajos con nombre semántico para usar en servicios.
     */
    public static function caja(?int $tenantId = null): string
    {
        return self::get('cta_caja', '110505', $tenantId);
    }

    public static function bancos(?int $tenantId = null): string
    {
        return self::get('cta_bancos', '111005', $tenantId);
    }

    public static function clientes(?int $tenantId = null): string
    {
        return self::get('cta_clientes', '1305', $tenantId);
    }

    public static function proveedores(?int $tenantId = null): string
    {
        return self::get('cta_proveedores', '2205', $tenantId);
    }

    public static function iva(?int $tenantId = null): string
    {
        return self::get('cta_iva', '2408', $tenantId);
    }

    public static function anticipos(?int $tenantId = null): string
    {
        return self::get('cta_anticipos', '2815', $tenantId);
    }

    public static function inventario(?int $tenantId = null): string
    {
        return self::get('cta_inventario', '1405', $tenantId);
    }

    public static function costoVentas(?int $tenantId = null): string
    {
        return self::get('cta_costo_ventas', '6135', $tenantId);
    }

    public static function gastoComisiones(?int $tenantId = null): string
    {
        return self::get('cta_gasto_comisiones', '5105', $tenantId);
    }

    // ─── Cuentas Tributarias ───

    public static function ivaGenerado(?int $tenantId = null): string
    {
        return self::get('cta_iva_generado', '240805', $tenantId);
    }

    public static function ivaDescontable(?int $tenantId = null): string
    {
        return self::get('cta_iva_descontable', '240810', $tenantId);
    }

    public static function retencionFuente(?int $tenantId = null): string
    {
        return self::get('cta_retencion_fuente', '135515', $tenantId);
    }

    public static function retencionIva(?int $tenantId = null): string
    {
        return self::get('cta_retencion_iva', '2365', $tenantId);
    }

    public static function retencionIca(?int $tenantId = null): string
    {
        return self::get('cta_retencion_ica', '135518', $tenantId);
    }

    public static function ingresoVentas(?int $tenantId = null): string
    {
        return self::get('cta_ingreso_ventas', '4135', $tenantId);
    }

    /**
     * Retorna el código de cuenta para un método de pago según el régimen.
     */
    public static function cuentaPorMetodoPago(string $metodo, string $regimen, ?int $tenantId = null): string
    {
        return match ($metodo) {
            'tarjeta', 'transferencia' => $regimen === 'comun' ? self::bancos($tenantId) : self::caja($tenantId),
            'credito' => self::clientes($tenantId),
            default => self::caja($tenantId),
        };
    }

    private static function fallback(string $clave): ?string
    {
        return match ($clave) {
            'cta_caja' => '110505',
            'cta_bancos' => '111005',
            'cta_clientes' => '1305',
            'cta_proveedores' => '2205',
            'cta_iva' => '2408',
            'cta_anticipos' => '2815',
            'cta_inventario' => '1405',
            'cta_costo_ventas' => '6135',
            'cta_gasto_comisiones' => '5105',
            'cta_iva_generado' => '240805',
            'cta_iva_descontable' => '240810',
            'cta_retencion_fuente' => '135515',
            'cta_retencion_iva' => '2365',
            'cta_retencion_ica' => '135518',
            'cta_ingreso_ventas' => '4135',
            default => null,
        };
    }
}
