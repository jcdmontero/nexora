<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;

class PucSimplificadoProvisioner
{
    public function provisionForTenant(Tenant $tenant): void
    {
        $cuentas = [
            // Activo
            ['1000', 'Activo', 'activo', 'debito', 1, false, false, false],
            ['1105', 'Caja', 'activo', 'debito', 2, false, false, false],
            ['110505', 'Caja general', 'activo', 'debito', 3, true, false, false],
            ['1110', 'Bancos', 'activo', 'debito', 2, false, false, false],
            ['111005', 'Bancos nacionales', 'activo', 'debito', 3, true, false, false],
            ['1305', 'Clientes', 'activo', 'debito', 2, true, true, false],
            ['1405', 'Inventarios', 'activo', 'debito', 2, true, false, false],
            // Pasivo
            ['2000', 'Pasivo', 'pasivo', 'credito', 1, false, false, false],
            ['2205', 'Proveedores nacionales', 'pasivo', 'credito', 2, true, true, false],
            ['2370', 'Retenciones y aportes de nómina', 'pasivo', 'credito', 2, true, true, false],
            ['2408', 'Impuesto sobre las ventas por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['2505', 'Salarios por pagar', 'pasivo', 'credito', 2, true, true, false],
            ['2610', 'Provisiones para obligaciones laborales', 'pasivo', 'credito', 2, true, false, false],
            ['2805', 'Anticipos recibidos de clientes', 'pasivo', 'credito', 2, true, true, false],
            ['2815', 'Anticipos recibidos', 'pasivo', 'credito', 2, true, false, false],
            // Patrimonio
            ['3000', 'Patrimonio', 'patrimonio', 'credito', 1, false, false, false],
            ['3115', 'Aportes sociales', 'patrimonio', 'credito', 2, true, false, false],
            ['3605', 'Utilidad del ejercicio', 'patrimonio', 'credito', 2, true, false, false],
            ['3610', 'Utilidades Retenidas', 'patrimonio', 'credito', 2, true, false, false],
            // Ingresos
            ['4000', 'INGRESOS', 'ingreso', 'credito', 1, false, false, false],
            ['4135', 'Comercio al por mayor y menor', 'ingreso', 'credito', 2, true, true, false],
            ['4175', 'Devoluciones en ventas', 'ingreso', 'debito', 2, true, true, false],
            // Gastos
            ['5000', 'GASTOS', 'gasto', 'debito', 1, false, false, false],
            ['5105', 'Gastos de personal', 'gasto', 'debito', 2, true, false, true],
            // Costos
            ['6000', 'COSTOS', 'costo', 'debito', 1, false, false, false],
            ['6135', 'Costo de ventas', 'costo', 'debito', 2, true, false, false],
        ];

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
