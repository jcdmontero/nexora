<?php

namespace App\Modules\Accounting\Console;

use App\Core\Models\Configuracion;
use App\Core\Models\Tenant;
use App\Modules\Accounting\Services\LibroContableProvisioner;
use App\Modules\Accounting\Services\PucColombiaProvisioner;
use App\Modules\Accounting\Services\PucSimplificadoProvisioner;
use Illuminate\Console\Command;

class SeedLibrosContables extends Command
{
    protected $signature = 'accounting:seed-libros';
    protected $description = 'Siembra los libros contables por defecto y completa el PUC para todos los tenants existentes';

    public function handle(): int
    {
        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            $this->warn('No hay tenants registrados.');
            return Command::SUCCESS;
        }

        $bar = $this->output->createProgressBar($tenants->count());
        $bar->start();

        foreach ($tenants as $tenant) {
            try {
                // Sembrar libros
                app(LibroContableProvisioner::class)->provisionForTenant($tenant);

                // Sembrar/actualizar PUC según régimen
                $regimen = Configuracion::get('regimen_fiscal', 'simplificado', $tenant->id);
                if ($regimen === 'simplificado') {
                    app(PucSimplificadoProvisioner::class)->provisionForTenant($tenant);
                } else {
                    app(PucColombiaProvisioner::class)->provisionForTenant($tenant);
                }
            } catch (\Exception $e) {
                $this->error("Error con tenant {$tenant->id}: {$e->getMessage()}");
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Libros contables y PUC actualizados para todos los tenants.');

        return Command::SUCCESS;
    }
}
