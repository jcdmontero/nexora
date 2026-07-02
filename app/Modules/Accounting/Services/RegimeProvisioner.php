<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;

/**
 * Crea las cuentas contables tributarias necesarias cuando un tenant
 * cambia de régimen simplificado a común (responsable de IVA).
 *
 * Las cuentas se crean solo si no existen aún, sin modificar las existentes.
 */
class RegimeProvisioner
{
    /**
     * Cuentas que un régimen COMÚN necesita y el simplificado no tiene.
     * [codigo, nombre, tipo, naturaleza, nivel, acepta_movimientos, requiere_tercero]
     */
    private const CUENTAS_COMUN = [
        ['240805', 'IVA generado', 'pasivo', 'credito', 3, true, false],
        ['240810', 'IVA descontable', 'activo', 'debito', 3, true, false],
        ['135515', 'Retención en la fuente', 'activo', 'debito', 3, true, true],
        ['2365', 'Retención en la fuente por pagar', 'pasivo', 'credito', 2, true, true],
        ['135518', 'Impuesto de industria y comercio retenido', 'activo', 'debito', 3, true, true],
        ['2367', 'Impuesto a las ventas retenido', 'pasivo', 'credito', 2, true, true],
        ['413505', 'Ingresos por ventas gravadas', 'ingreso', 'credito', 3, true, false],
    ];

    /**
     * Asegura que las cuentas tributarias existan para un tenant.
     * Retorna las cuentas creadas (las que ya existían no se duplican).
     *
     * @return array Cuentas creadas recién
     */
    public function provisionarCuentasComun(Tenant $tenant): array
    {
        $creadas = [];

        foreach (self::CUENTAS_COMUN as [$codigo, $nombre, $tipo, $naturaleza, $nivel, $acepta, $tercero]) {
            $existe = CuentaContable::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('codigo', $codigo)
                ->exists();

            if (!$existe) {
                $cuenta = CuentaContable::withoutGlobalScopes()->create([
                    'tenant_id' => $tenant->id,
                    'codigo' => $codigo,
                    'nombre' => $nombre,
                    'tipo' => $tipo,
                    'naturaleza' => $naturaleza,
                    'nivel' => $nivel,
                    'clase' => substr($codigo, 0, 1),
                    'acepta_movimientos' => $acepta,
                    'requiere_tercero' => $tercero,
                    'requiere_centro_costo' => false,
                    'tipo_regimen' => 'COMUN',
                ]);
                $creadas[] = $cuenta;
            }
        }

        return $creadas;
    }

    /**
     * Cambia el régimen de un tenant y provisiona cuentas si es necesario.
     *
     * @param Tenant $tenant
     * @param string $nuevoRegimen 'simplificado' o 'comun'
     * @param string|null $fechaCambio Fecha del cambio (null = ahora)
     * @return array Resultado con las cuentas creadas
     */
    public function cambiarRegimen(Tenant $tenant, string $nuevoRegimen, ?string $fechaCambio = null): array
    {
        $resultado = [
            'regimen_anterior' => Configuracion::get('regimen_fiscal', 'simplificado', $tenant->id),
            'regimen_nuevo' => $nuevoRegimen,
            'cuentas_creadas' => [],
        ];

        // Guardar el nuevo régimen
        Configuracion::setMany([
            'regimen_fiscal' => $nuevoRegimen,
            'fecha_cambio_regimen' => $fechaCambio ?? now()->toDateString(),
        ], $tenant->id);

        // Si cambia a común, provisionar cuentas tributarias
        if ($nuevoRegimen === 'comun') {
            $resultado['cuentas_creadas'] = $this->provisionarCuentasComun($tenant);
        }

        return $resultado;
    }
}
