<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;

class PucColombiaProvisioner
{
    /**
     * Retorna el catálogo completo de cuentas PUC Colombia para régimen común.
     * Formato: [codigo, nombre, tipo, naturaleza, nivel, acepta_movimientos, requiere_tercero, requiere_centro_costo]
     *
     * Fuente única de verdad — RegimeProvisioner reutiliza este método.
     */
    public static function getCuentasComun(): array
    {
        return [
            ['1000', 'Activo', 'activo', 'debito', 1, false, false, false],
            ['1105', 'Caja', 'activo', 'debito', 2, false, false, false],
            ['110505', 'Caja general', 'activo', 'debito', 3, true, false, false],
            ['1110', 'Bancos', 'activo', 'debito', 2, false, false, false],
            ['111005', 'Bancos nacionales', 'activo', 'debito', 3, true, false, false],
            ['1305', 'Clientes nacionales', 'activo', 'debito', 2, true, true, false],
            ['130505', 'Clientes nacionales', 'activo', 'debito', 3, true, true, false],
            ['1355', 'Anticipo de impuestos y contribuciones', 'activo', 'debito', 2, true, true, false],
            ['135505', 'Anticipo de renta', 'activo', 'debito', 3, true, true, false],
            ['135515', 'Retención en la fuente', 'activo', 'debito', 3, true, true, false],
            ['135518', 'Impuesto de industria y comercio retenido', 'activo', 'debito', 3, true, true, false],
            ['1405', 'Inventarios', 'activo', 'debito', 2, true, false, false],
            ['2000', 'Pasivo', 'pasivo', 'credito', 1, false, false, false],
            ['2205', 'Proveedores nacionales', 'pasivo', 'credito', 2, true, true, false],
            ['220505', 'Proveedores nacionales', 'pasivo', 'credito', 3, true, true, false],
            ['2365', 'Retención en la fuente por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['236505', 'Retención en la fuente por pagar', 'pasivo', 'credito', 3, true, true, false],
            ['2367', 'Impuesto a las ventas retenido', 'pasivo', 'credito', 2, true, true, false],
            ['236705', 'IVA retenido por pagar', 'pasivo', 'credito', 3, true, true, false],
            ['2368', 'Impuesto de industria y comercio retenido', 'pasivo', 'credito', 2, true, true, false],
            ['236805', 'ICA retenido por pagar', 'pasivo', 'credito', 3, true, true, false],
            ['2370', 'Retenciones y aportes de nómina', 'pasivo', 'credito', 2, true, true, false],
            ['2408', 'Impuesto sobre las ventas por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['240805', 'IVA generado', 'pasivo', 'credito', 3, true, true, false],
            ['240810', 'IVA descontable', 'activo', 'debito', 3, true, true, false],
            ['2505', 'Salarios por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['2610', 'Provisiones para obligaciones laborales', 'pasivo', 'credito', 2, true, false, false],
            ['2805', 'Anticipos recibidos de clientes', 'pasivo', 'credito', 2, true, true, false],
            ['280505', 'Anticipos recibidos de clientes', 'pasivo', 'credito', 3, true, true, false],
            ['2815', 'Anticipos recibidos', 'pasivo', 'credito', 2, true, false, false],
            ['3000', 'Patrimonio', 'patrimonio', 'credito', 1, false, false, false],
            ['3115', 'Aportes sociales', 'patrimonio', 'credito', 2, true, false, false],
            ['311505', 'Aportes sociales pagados', 'patrimonio', 'credito', 3, true, false, false],
            ['3605', 'Utilidad del ejercicio', 'patrimonio', 'credito', 2, true, false, false],
            ['360505', 'Utilidad del ejercicio', 'patrimonio', 'credito', 3, true, false, false],
            ['3610', 'Utilidades Retenidas', 'patrimonio', 'credito', 2, true, false, false],
            ['361005', 'Utilidades Retenidas', 'patrimonio', 'credito', 3, true, false, false],
            ['4000', 'Ingresos', 'ingreso', 'credito', 1, false, false, false],
            ['4135', 'Comercio al por mayor y al por menor', 'ingreso', 'credito', 2, true, false, false],
            ['4175', 'Devoluciones en ventas', 'ingreso', 'debito', 2, true, false, false],
            ['417505', 'Devoluciones en ventas', 'ingreso', 'debito', 3, true, false, false],
            ['5000', 'Gastos', 'gasto', 'debito', 1, false, false, false],
            ['5105', 'Gastos de personal', 'gasto', 'debito', 2, true, false, true],
            ['5135', 'Servicios', 'gasto', 'debito', 2, true, true, true],
            ['5195', 'Diversos', 'gasto', 'debito', 2, true, false, true],
            ['6000', 'Costos de ventas', 'costo', 'debito', 1, false, false, false],
            ['6135', 'Comercio al por mayor y al por menor', 'costo', 'debito', 2, true, false, true],
        ];
    }

    public function provisionForTenant(Tenant $tenant): void
    {
        $cuentas = self::getCuentasComun();

        foreach ($cuentas as [$codigo, $nombre, $tipo, $naturaleza, $nivel, $acepta, $tercero, $centroCosto]) {
            CuentaContable::withoutGlobalScopes()->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'codigo' => $codigo,
                ],
                [
                    'nombre' => $nombre,
                    'tipo' => $tipo,
                    'naturaleza' => $naturaleza,
                    'nivel' => $nivel,
                    'clase' => substr($codigo, 0, 1),
                    'acepta_movimientos' => $acepta,
                    'requiere_tercero' => $tercero,
                    'requiere_centro_costo' => $centroCosto,
                ]
            );
        }
    }
}
