<?php

namespace App\Console\Commands;

use App\Core\Models\Module;
use App\Core\Services\ModuleRegistry;
use Illuminate\Console\Command;

class ModulesScan extends Command
{
    protected $signature = 'modules:scan';

    protected $description = 'Escanea app/Modules/*/module.json y registra los módulos en el catálogo.';

    public function handle(ModuleRegistry $registry): int
    {
        $this->info('Escaneando módulos en app/Modules/ ...');

        $registry->scanAndRegister();

        $modules = Module::orderBy('is_core', 'desc')->orderBy('name')->get();

        $this->table(
            ['Código', 'Nombre', 'Core', 'Dependencias'],
            $modules->map(fn ($m) => [
                $m->code,
                $m->name,
                $m->is_core ? 'Sí' : 'No',
                implode(', ', $m->dependencies ?? []) ?: '—',
            ])
        );

        $this->info("Registrados {$modules->count()} módulos en el catálogo.");

        return self::SUCCESS;
    }
}
