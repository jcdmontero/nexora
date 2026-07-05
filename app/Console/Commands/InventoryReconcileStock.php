<?php
namespace App\Console\Commands;

use App\Modules\Inventory\Services\StockReconciliationService;
use Illuminate\Console\Command;

class InventoryReconcileStock extends Command
{
    protected $signature = 'inventory:reconcile-stock {--tenant= : ID del tenant a reconciliar (omitir = todos)}';
    protected $description = 'Recalcula stock_actual de productos sumando el stock por bodega (inventory_stocks)';

    public function handle(StockReconciliationService $service): int
    {
        $tenantId = $this->option('tenant') ? (int) $this->option('tenant') : null;

        $this->info('Iniciando conciliación de stock...');

        $corregidos = $service->reconcile($tenantId);

        if (empty($corregidos)) {
            $this->info('Todos los stocks están conciliados. Sin cambios.');
            return Command::SUCCESS;
        }

        $this->newLine();
        $this->table(
            ['Código', 'Producto', 'Anterior', 'Corregido', 'Diferencia'],
            array_map(fn ($r) => [$r['codigo'], $r['nombre'], $r['anterior'], $r['corregido'], $r['diferencia']], $corregidos)
        );

        $this->info(count($corregidos) . ' producto(s) corregido(s).');
        return Command::SUCCESS;
    }
}
