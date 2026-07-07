<?php

namespace App\Modules\Accounting\Services;

use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;
use App\Modules\Accounting\Models\CuentaContable;
use App\Modules\Accounting\Models\TenantRegimenHistorial;
use App\Modules\Accounting\Services\PucColombiaProvisioner;

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
     * A-01: Reutiliza la fuente única de verdad de PucColombiaProvisioner.
     * Se filtra solo las cuentas tributarias (código empieza con 13, 23, 24 o 4135).
     */
    private const CODIGOS_TRIBUTARIOS = [
        '240805', '240810', '135515', '2365', '135518', '2367',
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
        $todasLasCuentas = PucColombiaProvisioner::getCuentasComun();

        foreach ($todasLasCuentas as $cuenta) {
            [$codigo, $nombre, $tipo, $naturaleza, $nivel, $acepta, $tercero, $centroCosto] = $cuenta;

            // Solo provisionar cuentas tributarias (las que simplificado no tiene)
            if (!in_array($codigo, self::CODIGOS_TRIBUTARIOS)) {
                continue;
            }

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
                    'requiere_centro_costo' => $centroCosto,
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
    public function cambiarRegimen(Tenant $tenant, string $nuevoRegimen, ?string $fechaCambio = null, ?int $userId = null): array
    {
        $resultado = [
            'regimen_anterior' => Configuracion::get('regimen_fiscal', 'simplificado', $tenant->id),
            'regimen_nuevo' => $nuevoRegimen,
            'cuentas_creadas' => [],
        ];

        $fecha = $fechaCambio ?? now()->toDateString();

        // Cerrar el periodo vigente anterior en el historial
        TenantRegimenHistorial::where('tenant_id', $tenant->id)
            ->whereNull('fecha_vigente_hasta')
            ->update(['fecha_vigente_hasta' => now()->subDay()->toDateString()]);

        // Registrar el nuevo régimen en el historial
        TenantRegimenHistorial::create([
            'tenant_id' => $tenant->id,
            'regimen' => $nuevoRegimen,
            'fecha_vigente_desde' => $fecha,
            'cambiado_por' => $userId,
            'motivo' => "Cambio de {$resultado['regimen_anterior']} a {$nuevoRegimen}",
        ]);

        // Guardar el nuevo régimen en configuración (compatibilidad)
        Configuracion::setMany([
            'regimen_fiscal' => $nuevoRegimen,
            'fecha_cambio_regimen' => $fecha,
        ], $tenant->id);

        // Si cambia a común, provisionar cuentas tributarias
        if ($nuevoRegimen === 'comun') {
            $resultado['cuentas_creadas'] = $this->provisionarCuentasComun($tenant);
        }

        return $resultado;
    }
}
