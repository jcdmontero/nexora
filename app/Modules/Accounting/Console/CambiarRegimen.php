<?php

namespace App\Modules\Accounting\Console;

use App\Core\Models\Tenant;
use App\Modules\Accounting\Services\RegimeProvisioner;
use Illuminate\Console\Command;

class CambiarRegimen extends Command
{
    protected $signature = 'accounting:cambiar-regimen
                            {regimen : Nuevo régimen: simplificado o comun}
                            {--tenant= : ID del tenant (default: todos los activos)}';

    protected $description = 'Cambia el régimen tributario de uno o todos los tenants y provisiona cuentas faltantes';

    public function handle(RegimeProvisioner $provisioner): int
    {
        $regimen = $this->argument('regimen');
        $tenantId = $this->option('tenant');

        if (!in_array($regimen, ['simplificado', 'comun'])) {
            $this->error('El régimen debe ser "simplificado" o "comun".');
            return self::FAILURE;
        }

        $tenants = $tenantId
            ? Tenant::where('id', $tenantId)->get()
            : Tenant::where('is_active', true)->get();

        if ($tenants->isEmpty()) {
            $this->error('No se encontraron tenants.');
            return self::FAILURE;
        }

        foreach ($tenants as $tenant) {
            $resultado = $provisioner->cambiarRegimen($tenant, $regimen, null, auth()->id());
            $creadas = count($resultado['cuentas_creadas']);

            $this->info("Tenant \"{$tenant->name}\" (ID: {$tenant->id}):");
            $this->line("  Régimen: {$resultado['regimen_anterior']} → {$regimen}");
            $this->line("  Cuentas tributarias creadas: {$creadas}");

            if ($creadas > 0) {
                foreach ($resultado['cuentas_creadas'] as $cuenta) {
                    $this->line("    - {$cuenta->codigo} {$cuenta->nombre}");
                }
            }
        }

        $this->info('Proceso completado.');
        return self::SUCCESS;
    }
}
