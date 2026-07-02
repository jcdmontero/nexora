<?php

return [
    App\Core\Providers\CoreServiceProvider::class,
    Spatie\Permission\PermissionServiceProvider::class,
    App\Modules\Accounting\Providers\AccountingServiceProvider::class,
    App\Modules\Inventory\Providers\InventoryServiceProvider::class,
    App\Modules\Crm\Providers\CrmServiceProvider::class,
    App\Modules\Sales\Providers\SalesServiceProvider::class,
    App\Modules\Cash\Providers\CashServiceProvider::class,
    App\Modules\ServiceDesk\Providers\ServiceDeskServiceProvider::class,
    App\Modules\Purchasing\Providers\PurchasingServiceProvider::class,
];
