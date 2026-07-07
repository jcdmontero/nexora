# Auditoría: Purchasing (Compras)
> Actualizado: 2026-07-06

---

## module.json
**Ruta:** app/Modules/Purchasing/module.json
```json
{
    "code": "purchasing",
    "name": "Compras",
    "version": "1.0.0",
    "description": "Gestión de proveedores, órdenes de compra y recepción de mercancía.",
    "icon": "Truck",
    "core": false,
    "dependencies": ["inventory"],
    "permissions": [
        "purchasing:view",
        "purchasing:create",
        "purchasing:edit",
        "purchasing:delete"
    ],
    "menus": [
        {
            "section": "COMPRAS",
            "icon": "Truck",
            "items": [
                { "label": "Proveedores", "route": "purchasing.proveedores.index", "permission": "purchasing:view" },
                { "label": "Órdenes de Compra", "route": "purchasing.ordenes.index", "permission": "purchasing:view" }
            ]
        }
    ]
}
```

---

## PurchasingServiceProvider
**Ruta:** app/Modules/Purchasing/Providers/PurchasingServiceProvider.php
```php
<?php

namespace App\Modules\Purchasing\Providers;

use Illuminate\Support\ServiceProvider;

class PurchasingServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');
    }
}
```

---

## Routes (web.php)
**Ruta:** app/Modules/Purchasing/Routes/web.php
```php
<?php

use App\Modules\Purchasing\Controllers\ProveedorController;
use App\Modules\Purchasing\Controllers\OrdenCompraController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth', 'tenant', 'module:purchasing'])->group(function () {
    Route::prefix('purchasing')->name('purchasing.')->group(function () {
        Route::middleware('permission:purchasing:view')->group(function () {
        Route::get('proveedores', [ProveedorController::class, 'index'])->name('proveedores.index');
        
        Route::get('ordenes', [OrdenCompraController::class, 'index'])->name('ordenes.index');
        Route::get('ordenes/{ordene}', [OrdenCompraController::class, 'show'])->name('ordenes.show')->where('ordene', '[0-9]+');
    });

    Route::middleware('permission:purchasing:create')->group(function () {
        Route::get('proveedores/crear', [ProveedorController::class, 'create'])->name('proveedores.create');
        Route::post('proveedores', [ProveedorController::class, 'store'])->name('proveedores.store');

        Route::get('ordenes/crear', [OrdenCompraController::class, 'create'])->name('ordenes.create');
        Route::post('ordenes', [OrdenCompraController::class, 'store'])->name('ordenes.store');
    });

    Route::middleware('permission:purchasing:edit')->group(function () {
        Route::get('proveedores/{proveedore}/editar', [ProveedorController::class, 'edit'])->name('proveedores.edit')->where('proveedore', '[0-9]+');
        Route::put('proveedores/{proveedore}', [ProveedorController::class, 'update'])->name('proveedores.update')->where('proveedore', '[0-9]+');

        Route::get('ordenes/{ordene}/editar', [OrdenCompraController::class, 'edit'])->name('ordenes.edit')->where('ordene', '[0-9]+');
        Route::put('ordenes/{ordene}', [OrdenCompraController::class, 'update'])->name('ordenes.update')->where('ordene', '[0-9]+');
        Route::patch('ordenes/{ordene}/estado', [OrdenCompraController::class, 'updateEstado'])->name('ordenes.estado')->where('ordene', '[0-9]+');
    });

    Route::middleware('permission:purchasing:delete')->group(function () {
        Route::delete('proveedores/{proveedore}', [ProveedorController::class, 'destroy'])->name('proveedores.destroy')->where('proveedore', '[0-9]+');
        
        Route::delete('ordenes/{ordene}', [OrdenCompraController::class, 'destroy'])->name('ordenes.destroy')->where('ordene', '[0-9]+');
        });
    });
});
```

---

## OrdenCompraController
**Ruta:** app/Modules/Purchasing/Controllers/OrdenCompraController.php
```php
<?php
namespace App\Modules\Purchasing\Controllers;

use App\Modules\Purchasing\Models\OrdenCompra;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class OrdenCompraController extends Controller
{
    /** Estados válidos y sus transiciones permitidas */
    private const ESTADOS = [
        'borrador'  => ['enviada', 'cancelada'],
        'enviada'   => ['cancelada'], // #6: recibida solo vía recepción de inventario
        'recibida'  => [],
        'cancelada' => [],
    ];

    private const ESTADOS_LISTA = ['borrador', 'enviada', 'recibida', 'cancelada'];

    public function index()
    {
        return Inertia::render('Purchasing/Ordenes/Index', [
            'ordenes' => Inertia::defer(fn () => OrdenCompra::with('proveedor:id,razon_social')
                ->orderBy('created_at', 'desc')
                ->paginate(20)
                ->withQueryString()),
        ]);
    }

    public function create()
    {
        $proveedores = Proveedor::where('activo', true)->orderBy('razon_social')->get(['id', 'razon_social', 'numero_documento']);
        $productos = Producto::where('is_active', true)->orderBy('nombre')->get(['id', 'codigo', 'nombre', 'costo_promedio']);

        return Inertia::render('Purchasing/Ordenes/Create', [
            'proveedores' => $proveedores,
            'productos' => $productos,
            'numero_sugerido' => 'OC-' . now()->format('YmdHis') . '-' . bin2hex(random_bytes(2)),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->validateData($request);

        DB::transaction(function () use ($data) {
            $orden = OrdenCompra::create([
                'proveedor_id' => $data['proveedor_id'],
                'numero' => $data['numero'],
                'estado' => 'borrador',
                'fecha_emision' => $data['fecha_emision'],
                'fecha_esperada' => $data['fecha_esperada'] ?? null,
                'notas' => $data['notas'] ?? null,
                'subtotal' => 0,
                'impuestos' => 0,
                'total' => 0,
            ]);

            $subtotal = 0;

            foreach ($data['detalles'] as $item) {
                $lineSubtotal = round($item['cantidad'] * $item['precio_unitario'], 2);
                $orden->detalles()->create([
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $lineSubtotal,
                ]);
                $subtotal += $lineSubtotal;
            }

            $orden->update([
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);
        });

        return redirect()->route('purchasing.ordenes.index')
            ->with('success', 'Orden de compra creada correctamente.');
    }

    public function show(OrdenCompra $ordene)
    {
        $ordene->load(['proveedor', 'detalles.producto:id,codigo,nombre']);

        return Inertia::render('Purchasing/Ordenes/Show', [
            'orden' => $ordene,
        ]);
    }

    public function edit(OrdenCompra $ordene)
    {
        if ($ordene->estado !== 'borrador') {
            return redirect()->route('purchasing.ordenes.index')
                ->with('error', 'Solo se pueden editar órdenes en estado borrador.');
        }

        $ordene->load('detalles');

        $proveedores = Proveedor::where('activo', true)->orderBy('razon_social')->get(['id', 'razon_social', 'numero_documento']);
        $productos = Producto::where('is_active', true)->orderBy('nombre')->get(['id', 'codigo', 'nombre', 'costo_promedio']);

        return Inertia::render('Purchasing/Ordenes/Edit', [
            'orden' => $ordene,
            'proveedores' => $proveedores,
            'productos' => $productos,
        ]);
    }

    public function update(Request $request, OrdenCompra $ordene)
    {
        if ($ordene->estado !== 'borrador') {
            return back()->with('error', 'Solo se pueden editar órdenes en estado borrador.');
        }

        $data = $this->validateData($request, $ordene->id);

        DB::transaction(function () use ($data, $ordene) {
            $ordene->update([
                'proveedor_id' => $data['proveedor_id'],
                'numero' => $data['numero'],
                'fecha_emision' => $data['fecha_emision'],
                'fecha_esperada' => $data['fecha_esperada'] ?? null,
                'notas' => $data['notas'] ?? null,
            ]);

            $ordene->detalles()->delete();

            $subtotal = 0;
            foreach ($data['detalles'] as $item) {
                $lineSubtotal = round($item['cantidad'] * $item['precio_unitario'], 2);
                $ordene->detalles()->create([
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $lineSubtotal,
                ]);
                $subtotal += $lineSubtotal;
            }

            $ordene->update([
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);
        });

        return redirect()->route('purchasing.ordenes.index')
            ->with('success', 'Orden de compra actualizada correctamente.');
    }

    public function destroy(OrdenCompra $ordene)
    {
        if ($ordene->estado !== 'borrador') {
            return back()->with('error', 'Solo se pueden eliminar órdenes en borrador.');
        }

        $ordene->delete();

        return redirect()->route('purchasing.ordenes.index')
            ->with('success', 'Orden de compra eliminada.');
    }

    public function updateEstado(Request $request, OrdenCompra $ordene)
    {
        $data = $request->validate([
            'estado' => ['required', Rule::in(self::ESTADOS_LISTA)],
        ]);

        $nuevoEstado = $data['estado'];
        $estadoActual = $ordene->estado;

        if (!in_array($nuevoEstado, self::ESTADOS[$estadoActual] ?? [])) {
            return back()->with('error', "No se puede cambiar de \"{$estadoActual}\" a \"{$nuevoEstado}\".");
        }

        $ordene->update(['estado' => $nuevoEstado]);

        return back()->with('success', "Estado actualizado a {$nuevoEstado}.");
    }

    private function validateData(Request $request, $ignoreId = null): array
    {
        $tenantId = auth()->user()->tenant_id;

        return $request->validate([
            'proveedor_id' => ['required', Rule::in(Proveedor::pluck('id'))],
            'numero' => [
                'required', 'string', 'max:50',
                Rule::unique('purchasing_ordenes', 'numero')
                    ->where('tenant_id', $tenantId)
                    ->ignore($ignoreId),
            ],
            'fecha_emision' => ['required', 'date'],
            'fecha_esperada' => ['nullable', 'date'],
            'notas' => ['nullable', 'string'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', Rule::in(Producto::pluck('id'))],
            'detalles.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'detalles.*.precio_unitario' => ['required', 'numeric', 'min:0'],
        ]);
    }
}
```

---

## ProveedorController
**Ruta:** app/Modules/Purchasing/Controllers/ProveedorController.php
```php
<?php
namespace App\Modules\Purchasing\Controllers;

use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\Purchasing\Services\PurchasingService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class ProveedorController extends Controller
{
    public function __construct(
        private PurchasingService $purchasingService,
    ) {}

    public function index()
    {
        return Inertia::render('Purchasing/Proveedores/Index', [
            'proveedores' => Inertia::defer(fn () => Proveedor::orderBy('razon_social', 'asc')
                ->paginate(20)
                ->withQueryString()),
        ]);
    }

    public function create()
    {
        return Inertia::render('Purchasing/Proveedores/Create');
    }

    public function store(Request $request)
    {
        Proveedor::create($this->validateData($request));

        return redirect()->route('purchasing.proveedores.index')
            ->with('success', 'Proveedor creado correctamente.');
    }

    public function edit(Proveedor $proveedore)
    {
        return Inertia::render('Purchasing/Proveedores/Edit', [
            'proveedor' => $proveedore->only([
                'id', 'tipo_documento', 'numero_documento', 'razon_social',
                'regimen_tributario', 'porcentaje_retencion_fuente',
                'porcentaje_retencion_iva', 'porcentaje_retencion_ica',
                'nombre_contacto', 'email', 'telefono', 'direccion', 'ciudad', 'notas', 'activo'
            ]),
        ]);
    }

    public function update(Request $request, Proveedor $proveedore)
    {
        $proveedore->update($this->validateData($request, $proveedore->id));

        return redirect()->route('purchasing.proveedores.index')
            ->with('success', 'Proveedor actualizado correctamente.');
    }

    public function destroy(Proveedor $proveedore)
    {
        $check = $this->purchasingService->canDeleteProveedor($proveedore);

        if (!$check['can_delete']) {
            return back()->with('error', 'No se puede eliminar el proveedor: ' . $check['reason']);
        }

        $proveedore->delete();

        return redirect()->route('purchasing.proveedores.index')
            ->with('success', 'Proveedor eliminado.');
    }

    private function validateData(Request $request, $ignoreId = null): array
    {
        return $request->validate([
            'regimen_tributario' => ['nullable', 'in:simplificado,comun'],
            'porcentaje_retencion_fuente' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_iva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'porcentaje_retencion_ica' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tipo_documento' => ['nullable', 'string', 'max:20'],
            'numero_documento' => ['nullable', 'string', 'max:40'],
            'razon_social' => ['required', 'string', 'max:200'],
            'nombre_contacto' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:30'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'ciudad' => ['nullable', 'string', 'max:120'],
            'notas' => ['nullable', 'string'],
            'activo' => ['boolean'],
        ]);
    }
}
```

---

## Modelo: OrdenCompra
**Ruta:** app/Modules/Purchasing/Models/OrdenCompra.php
```php
<?php
namespace App\Modules\Purchasing\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrdenCompra extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'purchasing_ordenes';

    protected $fillable = [
        'tenant_id',
        'proveedor_id',
        'numero',
        'estado',
        'fecha_emision',
        'fecha_esperada',
        'subtotal',
        'impuestos',
        'total',
        'notas',
    ];

    protected $casts = [
        'fecha_emision' => 'date',
        'fecha_esperada' => 'date',
        'subtotal' => 'decimal:2',
        'impuestos' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    public function proveedor()
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    public function detalles()
    {
        return $this->hasMany(OrdenCompraDetalle::class, 'orden_compra_id');
    }
}
```

---

## Modelo: OrdenCompraDetalle
**Ruta:** app/Modules/Purchasing/Models/OrdenCompraDetalle.php
```php
<?php
namespace App\Modules\Purchasing\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Database\Eloquent\Model;

class OrdenCompraDetalle extends Model
{
    use BelongsToTenant;

    protected $table = 'purchasing_orden_detalles';

    protected $fillable = [
        'tenant_id',
        'orden_compra_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
        'precio_unitario' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
```

---

## Modelo: Proveedor
**Ruta:** app/Modules/Purchasing/Models/Proveedor.php
```php
<?php
namespace App\Modules\Purchasing\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Proveedor extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'purchasing_proveedores';

    protected $fillable = [
        'tenant_id',
        'regimen_tributario',
        'porcentaje_retencion_fuente',
        'porcentaje_retencion_iva',
        'porcentaje_retencion_ica',
        'tipo_documento',
        'numero_documento',
        'razon_social',
        'nombre_contacto',
        'email',
        'telefono',
        'direccion',
        'ciudad',
        'notas',
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
        'porcentaje_retencion_fuente' => 'decimal:2',
        'porcentaje_retencion_iva' => 'decimal:2',
        'porcentaje_retencion_ica' => 'decimal:2',
    ];

    public function getDocumentoAttribute(): string
    {
        if (!$this->tipo_documento && !$this->numero_documento) {
            return '';
        }
        $tipo = $this->tipo_documento ?? 'Identificación';
        return "{$tipo} {$this->numero_documento}";
    }

    /**
     * Órdenes de compra asociadas a este proveedor.
     */
    public function ordenes()
    {
        return $this->hasMany(OrdenCompra::class, 'proveedor_id');
    }

    /**
     * Cuentas por pagar asociadas a este proveedor.
     */
    public function cuentasPorPagar()
    {
        return $this->morphMany(\App\Modules\Accounting\Models\CuentaPorPagar::class, 'acreedor');
    }
}
```

---

## PurchasingService
**Ruta:** app/Modules/Purchasing/Services/PurchasingService.php
```php
<?php

namespace App\Modules\Purchasing\Services;

use App\Modules\Purchasing\Models\Proveedor;

class PurchasingService
{
    /**
     * Verifica si un proveedor puede ser eliminado.
     * No se puede eliminar si tiene órdenes de compra activas (no canceladas/recibidas/facturadas).
     *
     * @return array{can_delete: bool, reason: string|null, pending_count: int}
     */
    public function canDeleteProveedor(Proveedor $proveedor): array
    {
        $pendingCount = $proveedor->ordenes()
            ->whereNotIn('estado', ['cancelada', 'recibida'])
            ->count();

        if ($pendingCount > 0) {
            return [
                'can_delete' => false,
                'reason' => "Tiene {$pendingCount} órden(es) de compra activa(s).",
                'pending_count' => $pendingCount,
            ];
        }

        return [
            'can_delete' => true,
            'reason' => null,
            'pending_count' => 0,
        ];
    }
}
```

---

## Migración: create_purchasing_proveedores_table
**Ruta:** app/Modules/Purchasing/Migrations/2026_06_20_000000_create_purchasing_proveedores_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchasing_proveedores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('tipo_documento', 20)->nullable();
            $table->string('numero_documento', 40)->nullable();
            $table->string('razon_social', 200);
            $table->string('nombre_contacto', 120)->nullable();
            $table->string('email')->nullable();
            $table->string('telefono', 30)->nullable();
            $table->string('direccion', 255)->nullable();
            $table->string('ciudad', 120)->nullable();
            $table->text('notas')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchasing_proveedores');
    }
};
```

---

## Migración: create_purchasing_ordenes_table
**Ruta:** app/Modules/Purchasing/Migrations/2026_06_20_000001_create_purchasing_ordenes_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchasing_ordenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('proveedor_id')->constrained('purchasing_proveedores');
            $table->string('numero', 50);
            $table->string('estado', 20)->default('borrador'); // borrador, enviada, recibida, cancelada
            $table->date('fecha_emision');
            $table->date('fecha_esperada')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('impuestos', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchasing_ordenes');
    }
};
```

---

## Migración: create_purchasing_orden_detalles_table
**Ruta:** app/Modules/Purchasing/Migrations/2026_06_20_110000_create_purchasing_orden_detalles_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchasing_orden_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_compra_id')->constrained('purchasing_ordenes')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos')->restrictOnDelete();
            $table->decimal('cantidad', 10, 4);
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchasing_orden_detalles');
    }
};
```

---

## Migración: add_tax_profile_to_purchasing_proveedores_table
**Ruta:** app/Modules/Purchasing/Migrations/2026_06_26_190000_add_tax_profile_to_purchasing_proveedores_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchasing_proveedores', function (Blueprint $table) {
            $table->string('regimen_tributario', 30)->default('simplificado')->after('razon_social');
            $table->decimal('porcentaje_retencion_fuente', 5, 2)->default(0)->after('regimen_tributario');
            $table->decimal('porcentaje_retencion_iva', 5, 2)->default(0)->after('porcentaje_retencion_fuente');
            $table->decimal('porcentaje_retencion_ica', 5, 2)->default(0)->after('porcentaje_retencion_iva');
            $table->index('regimen_tributario');
        });
    }

    public function down(): void
    {
        Schema::table('purchasing_proveedores', function (Blueprint $table) {
            $table->dropColumn([
                'regimen_tributario',
                'porcentaje_retencion_fuente',
                'porcentaje_retencion_iva',
                'porcentaje_retencion_ica',
            ]);
        });
    }
};
```

---

## Migración: add_tenant_id_to_purchasing_orden_detalles
**Ruta:** app/Modules/Purchasing/Migrations/2026_07_05_400000_add_tenant_id_to_purchasing_orden_detalles.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchasing_orden_detalles', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id');
        });

        // Backfill desde la orden padre
        DB::statement('
            UPDATE purchasing_orden_detalles
            SET tenant_id = (
                SELECT o.tenant_id
                FROM purchasing_ordenes o
                WHERE o.id = purchasing_orden_detalles.orden_compra_id
            )
            WHERE tenant_id IS NULL
        ');

        Schema::table('purchasing_orden_detalles', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable(false)->change();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('purchasing_orden_detalles', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropIndex(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
```

---

## Página: Ordenes/Index.jsx
**Ruta:** resources/js/Pages/Purchasing/Ordenes/Index.jsx
```jsx
import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Plus, ShoppingCart, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/Components/ui/data-table';
import { Badge } from '@/Components/ui/badge';
import EmptyState from '@/Components/ui/empty-state';
import { TableSkeleton } from '@/Components/ui/skeleton';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';
import { usePermissions } from '@/Hooks/usePermissions';

export default function Index({ ordenes }) {
    const { can } = usePermissions();
    const loading = ordenes == null;

    const columns = [
        {
            header: 'Número',
            key: 'numero',
            cell: (row) => <span className="font-medium">{row.numero}</span>,
        },
        {
            header: 'Proveedor',
            key: 'proveedor',
        },
        {
            header: 'Fecha Emisión',
            key: 'fecha_emision',
        },
        {
            header: 'Estado',
            key: 'estado',
            cell: (row) => {
                const colors = {
                    'borrador': 'bg-gray-100 text-gray-800',
                    'enviada': 'bg-blue-100 text-blue-800',
                    'recibida': 'bg-green-100 text-green-800',
                    'cancelada': 'bg-red-100 text-red-800',
                };
                return (
                    <Badge variant="outline" className={`${colors[row.estado] || ''} capitalize`}>
                        {row.estado}
                    </Badge>
                );
            }
        },
        {
            header: 'Total',
            key: 'total',
            cell: (row) => `$${row.total}`,
        },
        {
            key: 'actions',
            alignEnd: true,
            cell: (row) => (
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('purchasing.ordenes.show', row.id)}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </Link>
                    </Button>
                    
                    {row.estado === 'borrador' && can('purchasing:edit') && (
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('purchasing.ordenes.edit', row.id)}>
                                <Edit className="h-4 w-4 text-blue-500" />
                            </Link>
                        </Button>
                    )}

                    {row.estado === 'borrador' && can('purchasing:delete') && (
                        <ConfirmDialog
                            trigger={
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            }
                            title="¿Eliminar esta orden?"
                            description="Se eliminará la orden de compra y todos sus detalles. Esta acción no se puede deshacer."
                            deleteUrl={route('purchasing.ordenes.destroy', row.id)}
                        />
                    )}
                </div>
            )
        }
    ];

    return (
        <AuthenticatedLayout
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Órdenes de Compra</h2>}
        >
            <Head title="Órdenes de Compra" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Listado de Órdenes</h3>
                        {can('purchasing:create') && (
                            <Button asChild>
                                <Link href={route('purchasing.ordenes.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nueva Orden
                                </Link>
                            </Button>
                        )}
                    </div>

                    {loading ? (
                        <TableSkeleton rows={6} cols={5} />
                    ) : !ordenes || (ordenes.data?.length ?? ordenes.length) === 0 ? (
                        <EmptyState
                            icon={ShoppingCart}
                            title="No hay órdenes de compra"
                            description="Comience creando su primera orden de compra para reabastecer su inventario."
                            actionLabel={can('purchasing:create') ? "Nueva Orden" : null}
                            actionHref={route('purchasing.ordenes.create')}
                        />
                    ) : (
                        <div className="bg-white p-6 shadow-sm sm:rounded-lg border">
                            <DataTable
                                columns={columns}
                                data={ordenes.data}
                                searchPlaceholder="Buscar por número..."
                                searchColumn="numero"
                            />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

---

## Página: Ordenes/Create.jsx
**Ruta:** resources/js/Pages/Purchasing/Ordenes/Create.jsx
```jsx
import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import OrdenForm from './OrdenForm';
import { Button } from '@/Components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Create({ proveedores, productos, numero_sugerido }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('purchasing.ordenes.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Nueva Orden de Compra
                    </h2>
                </div>
            }
        >
            <Head title="Nueva Orden de Compra" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <OrdenForm 
                        proveedores={proveedores} 
                        productos={productos} 
                        numeroSugerido={numero_sugerido} 
                        isEditing={false} 
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

---

## Página: Ordenes/Edit.jsx
**Ruta:** resources/js/Pages/Purchasing/Ordenes/Edit.jsx
```jsx
import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import OrdenForm from './OrdenForm';
import { Button } from '@/Components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Edit({ orden, proveedores, productos }) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('purchasing.ordenes.index')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Editar Orden: {orden.numero}
                    </h2>
                </div>
            }
        >
            <Head title={`Editar Orden ${orden.numero}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <OrdenForm 
                        orden={orden}
                        proveedores={proveedores} 
                        productos={productos} 
                        isEditing={true} 
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

---

## Página: Ordenes/Show.tsx
**Ruta:** resources/js/Pages/Purchasing/Ordenes/Show.tsx
```tsx
import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, Send, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { DataTable } from '@/Components/ui/data-table';
import { Badge } from '@/Components/ui/badge';
import { ConfirmDialog } from '@/Components/ui/confirm-dialog';
import { usePermissions } from '@/Hooks/usePermissions';

export default function Show({ orden }) {
    const { can } = usePermissions();

    const columns = [
      {
        key: 'producto',
        header: 'Producto',
        cell: (row) => (
          <>
            <div className="font-medium">{row.producto?.nombre}</div>
            <div className="text-xs text-muted-foreground">Ref: {row.producto?.codigo}</div>
          </>
        ),
      },
      {
        key: 'cantidad',
        header: 'Cantidad',
        className: 'text-right',
        cell: (row) => parseFloat(row.cantidad).toString(),
        alignEnd: true,
      },
      {
        key: 'precio_unitario',
        header: 'Precio Unitario',
        className: 'text-right',
        cell: (row) => `$${row.precio_unitario}`,
        alignEnd: true,
      },
      {
        key: 'subtotal',
        header: 'Subtotal',
        className: 'text-right',
        cell: (row) => <span className="font-medium">${row.subtotal}</span>,
        alignEnd: true,
      },
    ];

    const statusColors = {
        'borrador': 'bg-gray-100 text-gray-800',
        'enviada': 'bg-blue-100 text-blue-800',
        'recibida': 'bg-green-100 text-green-800',
        'cancelada': 'bg-red-100 text-red-800',
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('purchasing.ordenes.index')}>
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight flex items-center gap-3">
                            Orden de Compra: {orden.numero}
                            <Badge variant="outline" className={`${statusColors[orden.estado] || ''} capitalize`}>
                                {orden.estado}
                            </Badge>
                        </h2>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="w-4 h-4 mr-2" /> Imprimir
                        </Button>

                        {can('purchasing:edit') && orden.estado === 'borrador' && (
                            <ConfirmDialog
                                trigger={
                                    <Button variant="default" className="bg-blue-600 hover:bg-blue-700">
                                        <Send className="w-4 h-4 mr-2" /> Enviar a Proveedor
                                    </Button>
                                }
                                title="¿Enviar orden a proveedor?"
                                description="La orden cambiará a estado 'enviada' y ya no podrá editarse."
                                confirmLabel="Enviar"
                                onConfirm={() => router.patch(route('purchasing.ordenes.estado', orden.id), { estado: 'enviada' })}
                            />
                        )}

                        {can('purchasing:edit') && orden.estado === 'enviada' && (
                            <Button variant="default" className="bg-green-600 hover:bg-green-700" asChild>
                                <Link href={route('inventory.recepciones.create', { orden_id: orden.id })}>
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Recibir Mercancía
                                </Link>
                            </Button>
                        )}

                        {can('purchasing:edit') && (orden.estado === 'borrador' || orden.estado === 'enviada') && (
                            <ConfirmDialog
                                trigger={
                                    <Button variant="destructive">
                                        <XCircle className="w-4 h-4 mr-2" /> Cancelar Orden
                                    </Button>
                                }
                                title="¿Cancelar esta orden?"
                                description="La orden quedará en estado 'cancelada' y no podrá reactivarse."
                                confirmLabel="Cancelar orden"
                                onConfirm={() => router.patch(route('purchasing.ordenes.estado', orden.id), { estado: 'cancelada' })}
                            />
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Orden ${orden.numero}`} />

            <div className="py-12 print:py-0">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Datos del Proveedor</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-1 text-sm">
                                    <span className="text-muted-foreground">Razón Social:</span>
                                    <span className="font-medium">{orden.proveedor?.razon_social}</span>
                                     
                                    <span className="text-muted-foreground">Documento:</span>
                                    <span>{orden.proveedor?.numero_documento}</span>
                                     
                                    <span className="text-muted-foreground">Email:</span>
                                    <span>{orden.proveedor?.email || '—'}</span>
                                     
                                    <span className="text-muted-foreground">Teléfono:</span>
                                    <span>{orden.proveedor?.telefono || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Detalles de la Orden</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-1 text-sm">
                                    <span className="text-muted-foreground">Número:</span>
                                    <span className="font-medium">{orden.numero}</span>
                                     
                                    <span className="text-muted-foreground">Fecha Emisión:</span>
                                    <span>{orden.fecha_emision}</span>
                                     
                                    <span className="text-muted-foreground">Fecha Esperada:</span>
                                    <span>{orden.fecha_esperada || '—'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Líneas de Compra</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns} data={orden.detalles} rowKey={(r) => r.id} />

                            <div className="flex justify-end mt-6">
                                <div className="w-64 bg-muted/30 p-4 rounded-lg border">
                                    <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                                        <span>Subtotal:</span>
                                        <span>${orden.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Total:</span>
                                        <span>${orden.total}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {orden.notas && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Notas Adicionales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm whitespace-pre-wrap">{orden.notas}</p>
                            </CardContent>
                        </Card>
                    )}

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

---

## Página: Ordenes/OrdenForm.jsx
**Ruta:** resources/js/Pages/Purchasing/Ordenes/OrdenForm.jsx
```jsx
import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Loader2, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';

export default function OrdenForm({ orden = null, proveedores = [], productos = [], numeroSugerido = '', isEditing = false }) {
    const { data, setData, post, put, processing, errors } = useForm({
        proveedor_id: orden?.proveedor_id?.toString() || '',
        numero: orden?.numero || numeroSugerido,
        fecha_emision: orden?.fecha_emision || new Date().toISOString().split('T')[0],
        fecha_esperada: orden?.fecha_esperada || '',
        notas: orden?.notas || '',
        detalles: orden?.detalles || [],
    });

    // Update totals when details change
    const subtotal = data.detalles.reduce((sum, item) => sum + (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)), 0);
    const total = subtotal; // Simple logic for now, no taxes implemented in UI

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('purchasing.ordenes.update', orden.id));
        } else {
            post(route('purchasing.ordenes.store'));
        }
    };

    const addRow = () => {
        setData('detalles', [...data.detalles, { producto_id: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
    };

    const removeRow = (index) => {
        const newDetalles = [...data.detalles];
        newDetalles.splice(index, 1);
        setData('detalles', newDetalles);
    };

    const updateRow = (index, field, value) => {
        const newDetalles = [...data.detalles];
        newDetalles[index][field] = value;

        // Auto-fill price when product is selected
        if (field === 'producto_id') {
            const product = productos.find(p => p.id.toString() === value);
            if (product) {
                newDetalles[index]['precio_unitario'] = product.costo_promedio || 0;
            }
        }

        // Calculate subtotal
        const qty = parseFloat(newDetalles[index]['cantidad']) || 0;
        const price = parseFloat(newDetalles[index]['precio_unitario']) || 0;
        newDetalles[index]['subtotal'] = parseFloat((qty * price).toFixed(2));

        setData('detalles', newDetalles);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        Información Principal
                    </CardTitle>
                    <CardDescription>
                        Datos básicos de la orden de compra.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="proveedor_id">Proveedor <span className="text-destructive">*</span></Label>
                        <Select
                            value={data.proveedor_id}
                            onValueChange={(v) => setData('proveedor_id', v)}
                        >
                            <SelectTrigger id="proveedor_id" className={errors.proveedor_id ? 'border-destructive' : ''}>
                                <SelectValue placeholder="Seleccione un proveedor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {proveedores.map(p => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                        {p.razon_social}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.proveedor_id && <p className="text-sm text-destructive">{errors.proveedor_id}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="numero">Número de Orden <span className="text-destructive">*</span></Label>
                        <Input
                            id="numero"
                            value={data.numero}
                            onChange={e => setData('numero', e.target.value)}
                            className={errors.numero ? 'border-destructive' : ''}
                        />
                        {errors.numero && <p className="text-sm text-destructive">{errors.numero}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fecha_emision">Fecha de Emisión <span className="text-destructive">*</span></Label>
                        <Input
                            id="fecha_emision"
                            type="date"
                            value={data.fecha_emision}
                            onChange={e => setData('fecha_emision', e.target.value)}
                            className={errors.fecha_emision ? 'border-destructive' : ''}
                        />
                        {errors.fecha_emision && <p className="text-sm text-destructive">{errors.fecha_emision}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fecha_esperada">Fecha Esperada</Label>
                        <Input
                            id="fecha_esperada"
                            type="date"
                            value={data.fecha_esperada}
                            onChange={e => setData('fecha_esperada', e.target.value)}
                            className={errors.fecha_esperada ? 'border-destructive' : ''}
                        />
                        {errors.fecha_esperada && <p className="text-sm text-destructive">{errors.fecha_esperada}</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Productos</CardTitle>
                    <CardDescription>Añada los productos que desea solicitar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {typeof errors.detalles === 'string' && (
                        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                            {errors.detalles}
                        </div>
                    )}

                    <div className="border rounded-lg overflow-x-auto">
                        <Table aria-label="Productos de la orden de compra">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40%]">Producto</TableHead>
                                    <TableHead className="w-[15%]">Cantidad</TableHead>
                                    <TableHead className="w-[20%]">Precio Unit.</TableHead>
                                    <TableHead className="w-[15%]">Subtotal</TableHead>
                                    <TableHead className="w-[10%] text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.detalles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            No hay productos en esta orden. Haga clic en "Añadir Producto" para comenzar.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.detalles.map((row, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Select
                                                    value={row.producto_id?.toString()}
                                                    onValueChange={(v) => updateRow(index, 'producto_id', v)}
                                                >
                                                    <SelectTrigger className={errors[`detalles.${index}.producto_id`] ? 'border-destructive' : ''}>
                                                        <SelectValue placeholder="Seleccione..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {productos.map(p => (
                                                            <SelectItem key={p.id} value={p.id.toString()}>
                                                                {p.nombre} ({p.codigo})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={row.cantidad}
                                                    onChange={e => updateRow(index, 'cantidad', e.target.value)}
                                                    className={errors[`detalles.${index}.cantidad`] ? 'border-destructive' : ''}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={row.precio_unitario}
                                                    onChange={e => updateRow(index, 'precio_unitario', e.target.value)}
                                                    className={errors[`detalles.${index}.precio_unitario`] ? 'border-destructive' : ''}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium flex items-center h-full px-3 bg-muted/50 rounded-md border">
                                                    ${row.subtotal}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeRow(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-between items-start mt-4">
                        <Button type="button" variant="outline" onClick={addRow} size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Añadir Producto
                        </Button>

                        <div className="bg-muted p-4 rounded-lg w-64 space-y-2 border">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notas Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={data.notas}
                        onChange={e => setData('notas', e.target.value)}
                        placeholder="Instrucciones para el proveedor, condiciones de entrega..."
                        rows={3}
                        className={errors.notas ? 'border-destructive' : ''}
                    />
                    {errors.notas && <p className="text-sm text-destructive mt-1">{errors.notas}</p>}
                </CardContent>
                <CardFooter className="flex justify-end gap-3 bg-muted/50 py-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            isEditing ? 'Actualizar Orden' : 'Crear Orden'
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
```

---

## Página: Proveedores/Index.jsx
**Ruta:** resources/js/Pages/Purchasing/Proveedores/Index.jsx
```jsx
import { Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Skeleton, TableSkeleton } from '@/Components/ui/skeleton'
import { ConfirmDialog } from '@/Components/ui/confirm-dialog'
import { Truck, Plus, Trash2 } from 'lucide-react'

export default function ProveedoresIndex({ proveedores }) {
  const loading = proveedores == null

  const columns = [
    { key: 'razon_social', header: 'Razón Social / Nombre', className: 'font-medium' },
    { key: 'documento', header: 'Documento', cell: (p) => p.documento || '—' },
    { key: 'nombre_contacto', header: 'Contacto', cell: (p) => p.nombre_contacto || '—' },
    { key: 'email', header: 'Email', cell: (p) => p.email || '—' },
    { key: 'telefono', header: 'Teléfono', cell: (p) => p.telefono || '—' },
    {
      key: 'activo',
      header: 'Estado',
      cell: (p) => <Badge variant={p.activo ? 'default' : 'outline'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (p) => (
        <div className="flex gap-3 justify-end">
          <Link href={route('purchasing.proveedores.edit', p.id)} className="text-sm text-primary hover:underline">Editar</Link>
          <ConfirmDialog
            trigger={
              <button className="text-sm text-destructive hover:underline">
                Eliminar
              </button>
            }
            title={`¿Eliminar al proveedor "${p.razon_social}"?`}
            deleteUrl={route('purchasing.proveedores.destroy', p.id)}
          />
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Proveedores</h2>
        <Link href={route('purchasing.proveedores.create')}>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Nuevo proveedor</Button>
        </Link>
      </div>

      {loading ? (
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent className="p-0"><TableSkeleton rows={6} cols={5} /></CardContent>
        </Card>
      ) : (proveedores.data?.length ?? 0) === 0 ? (
        <Card>
          <EmptyState
            icon={Truck}
            title="Aún no tienes proveedores"
            description="Registra tus proveedores para gestionar tus compras, órdenes y abastecimiento."
            action={{ label: 'Crear primer proveedor', href: route('purchasing.proveedores.create') }}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Directorio de proveedores</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={proveedores.data} rowKey={(p) => p.id} />
          </CardContent>
        </Card>
      )}
    </AuthenticatedLayout>
  )
}
```

---

## Página: Proveedores/Create.jsx
**Ruta:** resources/js/Pages/Purchasing/Proveedores/Create.jsx
```jsx
import { useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ProveedorForm from './ProveedorForm'
import { Button } from '@/Components/ui/button'
import { ArrowLeft, CheckCircle2, Truck, Lightbulb } from 'lucide-react'

export default function ProveedorCreate() {
  const { data, setData, post, processing, errors } = useForm({
    tipo_documento: 'NIT',
    numero_documento: '',
    razon_social: '',
    regimen_tributario: '',
    porcentaje_retencion_fuente: '',
    porcentaje_retencion_iva: '',
    porcentaje_retencion_ica: '',
    nombre_contacto: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    notas: '',
    activo: true,
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('purchasing.proveedores.store'))
  }

  return (
    <AuthenticatedLayout>
      <form onSubmit={submit} className="pb-12">
        {/* Header Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href={route('purchasing.proveedores.index')} 
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Nuevo proveedor</h2>
              <p className="text-sm text-slate-500 mt-1">Registra un nuevo proveedor para tus compras.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={route('purchasing.proveedores.index')}>
              <Button type="button" variant="outline" className="rounded-xl border-slate-200 text-slate-700">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={processing}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {processing ? 'Creando...' : 'Crear proveedor'}
            </Button>
          </div>
        </div>

        {/* Contenido Principal (2 Columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <ProveedorForm data={data} setData={setData} errors={errors} />
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              
              <div className="w-full h-40 bg-slate-50 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                 <Truck className="w-20 h-20 text-blue-200 absolute bottom-4" />
              </div>

              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px] text-slate-500">i</span>
                Información importante
              </h3>
              
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Completa la información del proveedor para facilitar el proceso de abastecimiento.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  ['Los campos con * son obligatorios', true],
                  ['El contacto principal es clave para las órdenes', true],
                ].map(([text, check], i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100/50">
                <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-1.5">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  Consejo
                </h4>
                <p className="text-xs text-blue-800/80 leading-relaxed">
                  Un correo electrónico válido es necesario si planeas enviar órdenes de compra automáticas en el futuro.
                </p>
              </div>
            </div>
          </div>

        </div>
      </form>
    </AuthenticatedLayout>
  )
}
```

---

## Página: Proveedores/Edit.jsx
**Ruta:** resources/js/Pages/Purchasing/Proveedores/Edit.jsx
```jsx
import { useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import ProveedorForm from './ProveedorForm'
import { Button } from '@/Components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ProveedorEdit({ proveedor }) {
  const { data, setData, put, processing, errors } = useForm({
    tipo_documento: proveedor.tipo_documento || 'NIT',
    numero_documento: proveedor.numero_documento || '',
    razon_social: proveedor.razon_social || '',
    regimen_tributario: proveedor.regimen_tributario || '',
    porcentaje_retencion_fuente: proveedor.porcentaje_retencion_fuente || '',
    porcentaje_retencion_iva: proveedor.porcentaje_retencion_iva || '',
    porcentaje_retencion_ica: proveedor.porcentaje_retencion_ica || '',
    nombre_contacto: proveedor.nombre_contacto || '',
    email: proveedor.email || '',
    telefono: proveedor.telefono || '',
    direccion: proveedor.direccion || '',
    ciudad: proveedor.ciudad || '',
    notas: proveedor.notas || '',
    activo: proveedor.activo ?? true,
  })

  const submit = (e) => {
    e.preventDefault()
    put(route('purchasing.proveedores.update', proveedor.id))
  }

  return (
    <AuthenticatedLayout>
      <form onSubmit={submit} className="pb-12 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href={route('purchasing.proveedores.index')} 
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Editar proveedor</h2>
              <p className="text-sm text-slate-500 mt-1">{proveedor.razon_social}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={route('purchasing.proveedores.index')}>
              <Button type="button" variant="outline" className="rounded-xl border-slate-200 text-slate-700">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={processing}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {processing ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <ProveedorForm data={data} setData={setData} errors={errors} isEdit />
        </div>
      </form>
    </AuthenticatedLayout>
  )
}
```

---

## Página: Proveedores/ProveedorForm.jsx
**Ruta:** resources/js/Pages/Purchasing/Proveedores/ProveedorForm.jsx
```jsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Switch } from '@/Components/ui/switch'

export default function ProveedorForm({ data, setData, errors, isEdit = false }) {
  return (
    <>
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg">Información principal</CardTitle>
          <CardDescription>Datos básicos del proveedor para su identificación.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social / Nombre <span className="text-red-500">*</span></Label>
              <Input
                id="razon_social"
                name="razon_social"
                value={data.razon_social}
                onChange={e => setData('razon_social', e.target.value)}
                error={errors.razon_social}
                placeholder="Ej. Suministros Globales SAS"
              />
              {errors.razon_social && <p className="text-sm text-red-500 mt-1">{errors.razon_social}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo Doc.</Label>
                <Select value={data.tipo_documento} onValueChange={(v) => setData('tipo_documento', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CC">CC</SelectItem>
                    <SelectItem value="RUT">RUT</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                {errors.tipo_documento && <p className="text-sm text-red-500 mt-1">{errors.tipo_documento}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_documento">Número</Label>
                <Input
                  id="numero_documento"
                  name="numero_documento"
                  value={data.numero_documento}
                  onChange={e => setData('numero_documento', e.target.value)}
                  error={errors.numero_documento}
                />
                {errors.numero_documento && <p className="text-sm text-red-500 mt-1">{errors.numero_documento}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nombre_contacto">Persona de Contacto</Label>
              <Input
                id="nombre_contacto"
                name="nombre_contacto"
                value={data.nombre_contacto}
                onChange={e => setData('nombre_contacto', e.target.value)}
                error={errors.nombre_contacto}
                placeholder="Nombre de quien atiende"
              />
              {errors.nombre_contacto && <p className="text-sm text-red-500 mt-1">{errors.nombre_contacto}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={data.email}
                onChange={e => setData('email', e.target.value)}
                error={errors.email}
                placeholder="correo@empresa.com"
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>
          </div>
          
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-6">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg">Régimen Tributario y Retenciones</CardTitle>
          <CardDescription>Configuración fiscal del proveedor para cálculo automático de retenciones.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Régimen Tributario</Label>
              <Select value={data.regimen_tributario || ''} onValueChange={(v) => setData('regimen_tributario', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simplificado">Simplificado</SelectItem>
                  <SelectItem value="comun">Común</SelectItem>
                </SelectContent>
              </Select>
              {errors.regimen_tributario && <p className="text-sm text-red-500 mt-1">{errors.regimen_tributario}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="porcentaje_retencion_fuente">Ret. Fuente (%)</Label>
              <Input
                id="porcentaje_retencion_fuente"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={data.porcentaje_retencion_fuente || ''}
                onChange={e => setData('porcentaje_retencion_fuente', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="porcentaje_retencion_iva">Ret. IVA (%)</Label>
              <Input
                id="porcentaje_retencion_iva"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={data.porcentaje_retencion_iva || ''}
                onChange={e => setData('porcentaje_retencion_iva', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="porcentaje_retencion_ica">Ret. ICA (%)</Label>
              <Input
                id="porcentaje_retencion_ica"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={data.porcentaje_retencion_ica || ''}
                onChange={e => setData('porcentaje_retencion_ica', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden mt-6">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg">Información de ubicación y estado</CardTitle>
          <CardDescription>Detalles adicionales para contacto y envío.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={data.telefono}
                onChange={e => setData('telefono', e.target.value)}
                error={errors.telefono}
              />
              {errors.telefono && <p className="text-sm text-red-500 mt-1">{errors.telefono}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                name="ciudad"
                value={data.ciudad}
                onChange={e => setData('ciudad', e.target.value)}
                error={errors.ciudad}
              />
              {errors.ciudad && <p className="text-sm text-red-500 mt-1">{errors.ciudad}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              name="direccion"
              value={data.direccion}
              onChange={e => setData('direccion', e.target.value)}
              error={errors.direccion}
            />
            {errors.direccion && <p className="text-sm text-red-500 mt-1">{errors.direccion}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas internas</Label>
            <textarea
              id="notas"
              name="notas"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={data.notas}
              onChange={e => setData('notas', e.target.value)}
            />
            {errors.notas && <p className="text-sm text-red-500 mt-1">{errors.notas}</p>}
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <Label className="text-base font-medium">Estado del proveedor</Label>
              <p className="text-sm text-slate-500 mt-1">
                Los proveedores inactivos no aparecerán en nuevas órdenes de compra.
              </p>
            </div>
            <Switch
              checked={data.activo}
              onCheckedChange={(v) => setData('activo', v)}
            />
          </div>
        </CardContent>
      </Card>
    </>
  )
}
```

---

## Test: ProveedorTest.php
**Ruta:** tests/Feature/Modules/Purchasing/ProveedorTest.php
```php
<?php

namespace Tests\Feature\Modules\Purchasing;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\Purchasing\Models\OrdenCompra;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProveedorTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure the 'purchasing' module exists in the modules catalog
        \DB::table('modules')->insertOrIgnore([
            'code' => 'purchasing',
            'name' => 'Compras',
            'class' => 'Purchasing',
            'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();

        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'purchasing',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    public function test_proveedor_index_requires_auth(): void
    {
        auth()->logout();
        $response = $this->get(route('purchasing.proveedores.index'));
        $response->assertRedirect(route('core.login'));
    }

    public function test_proveedor_store_creates_proveedor(): void
    {
        $response = $this->post(route('purchasing.proveedores.store'), [
            'razon_social' => 'Proveedor Test S.A.S.',
            'tipo_documento' => 'NIT',
            'numero_documento' => '900123456',
            'email' => 'contacto@proveedor.test',
            'telefono' => '3001234567',
            'ciudad' => 'Bogotá',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('purchasing_proveedores', [
            'tenant_id' => $this->tenant->id,
            'razon_social' => 'Proveedor Test S.A.S.',
            'numero_documento' => '900123456',
            'activo' => true,
        ]);
    }

    public function test_proveedor_update_modifies_fields(): void
    {
        $proveedor = Proveedor::create([
            'tenant_id' => $this->tenant->id,
            'razon_social' => 'Proveedor Original',
            'ciudad' => 'Medellín',
        ]);

        $response = $this->put(route('purchasing.proveedores.update', $proveedor), [
            'razon_social' => 'Proveedor Actualizado',
            'ciudad' => 'Cali',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('purchasing_proveedores', [
            'id' => $proveedor->id,
            'razon_social' => 'Proveedor Actualizado',
            'ciudad' => 'Cali',
        ]);
    }

    public function test_proveedor_cannot_delete_with_pending_orders(): void
    {
        $proveedor = Proveedor::create([
            'tenant_id' => $this->tenant->id,
            'razon_social' => 'Proveedor Con Órdenes',
        ]);

        // Create a pending purchase order (estado != cancelada/recibida/facturada)
        OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TEST-001',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->delete(route('purchasing.proveedores.destroy', $proveedor));

        // Should be rejected because there are pending orders
        $response->assertSessionHas('error');

        $this->assertDatabaseHas('purchasing_proveedores', [
            'id' => $proveedor->id,
            'deleted_at' => null,
        ]);
    }
}
```

---

## Test: OrdenCompraTest.php
**Ruta:** tests/Feature/Modules/Purchasing/OrdenCompraTest.php
```php
<?php

namespace Tests\Feature\Modules\Purchasing;

use App\Core\Models\Tenant;
use App\Core\Models\TenantModule;
use App\Models\User;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\Purchasing\Models\OrdenCompra;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrdenCompraTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        \DB::table('modules')->insertOrIgnore([
            'code' => 'purchasing',
            'name' => 'Compras',
            'class' => 'Purchasing',
            'version' => '1.0.0',
        ]);

        $this->tenant = Tenant::factory()->create();

        TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'purchasing',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_superadmin' => true,
        ]);

        $this->actingAs($this->user);
        app()->instance('current_tenant', $this->tenant);
    }

    private function createProveedor(): Proveedor
    {
        return Proveedor::create([
            'tenant_id' => $this->tenant->id,
            'razon_social' => 'Proveedor Test',
            'tipo_documento' => 'NIT',
            'numero_documento' => '900123456',
        ]);
    }

    private function createProducto(): Producto
    {
        return Producto::create([
            'tenant_id' => $this->tenant->id,
            'codigo' => 'PROD-001',
            'nombre' => 'Producto Test',
            'unidad_medida' => 'unidad',
            'costo_promedio' => 10000,
            'stock_actual' => 100,
            'stock_minimo' => 5,
            'is_active' => true,
        ]);
    }

    private function ordenData(Proveedor $proveedor, Producto $producto, string $numero = 'OC-TEST-001'): array
    {
        return [
            'proveedor_id' => $proveedor->id,
            'numero' => $numero,
            'fecha_emision' => now()->toDateString(),
            'detalles' => [
                ['producto_id' => $producto->id, 'cantidad' => 10, 'precio_unitario' => 10000],
            ],
        ];
    }

    public function test_store_creates_orden(): void
    {
        $proveedor = $this->createProveedor();
        $producto = $this->createProducto();

        $response = $this->post(route('purchasing.ordenes.store'), $this->ordenData($proveedor, $producto));

        $response->assertRedirect();

        $this->assertDatabaseHas('purchasing_ordenes', [
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TEST-001',
            'estado' => 'borrador',
        ]);

        $this->assertDatabaseHas('purchasing_orden_detalles', [
            'tenant_id' => $this->tenant->id,
            'producto_id' => $producto->id,
            'cantidad' => 10,
            'precio_unitario' => 10000,
            'subtotal' => 100000,
        ]);
    }

    public function test_store_rejects_duplicate_numero(): void
    {
        $proveedor = $this->createProveedor();
        $producto = $this->createProducto();

        $this->post(route('purchasing.ordenes.store'), $this->ordenData($proveedor, $producto, 'OC-DUP'));

        $response = $this->post(route('purchasing.ordenes.store'), $this->ordenData($proveedor, $producto, 'OC-DUP'));

        $response->assertSessionHasErrors('numero');
    }

    public function test_update_modifies_orden(): void
    {
        $proveedor = $this->createProveedor();
        $producto = $this->createProducto();

        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-UPD-001',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->put(route('purchasing.ordenes.update', $orden), [
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-UPD-001',
            'fecha_emision' => now()->toDateString(),
            'detalles' => [
                ['producto_id' => $producto->id, 'cantidad' => 5, 'precio_unitario' => 20000],
            ],
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('purchasing_ordenes', [
            'id' => $orden->id,
            'subtotal' => 100000,
            'total' => 100000,
        ]);
    }

    public function test_update_rejected_if_not_borrador(): void
    {
        $proveedor = $this->createProveedor();

        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-NOUPD',
            'estado' => 'enviada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->put(route('purchasing.ordenes.update', $orden), [
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-NOUPD',
            'fecha_emision' => now()->toDateString(),
            'detalles' => [['producto_id' => 1, 'cantidad' => 1, 'precio_unitario' => 0]],
        ]);

        $response->assertSessionHas('error');
    }

    public function test_destroy_only_borrador(): void
    {
        $proveedor = $this->createProveedor();

        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-DEL-001',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->delete(route('purchasing.ordenes.destroy', $orden));

        $response->assertRedirect();
        $this->assertSoftDeleted('purchasing_ordenes', ['id' => $orden->id]);
    }

    public function test_destroy_rejected_if_not_borrador(): void
    {
        $proveedor = $this->createProveedor();

        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-NODEL',
            'estado' => 'enviada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0,
            'impuestos' => 0,
            'total' => 0,
        ]);

        $response = $this->delete(route('purchasing.ordenes.destroy', $orden));

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'deleted_at' => null]);
    }

    // --- State transition tests ---

    public function test_transition_borrador_to_enviada(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-001',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'enviada']);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'enviada']);
    }

    public function test_transition_borrador_to_cancelada(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-002',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'cancelada']);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'cancelada']);
    }

    public function test_transition_enviada_to_recibida_is_blocked(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-003',
            'estado' => 'enviada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'recibida']);

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'enviada']);
    }

    public function test_transition_enviada_to_cancelada(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-004',
            'estado' => 'enviada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'cancelada']);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'cancelada']);
    }

    public function test_transition_borrador_to_recibida_is_blocked(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-005',
            'estado' => 'borrador',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'recibida']);

        $response->assertSessionHas('error');
        $this->assertDatabaseHas('purchasing_ordenes', ['id' => $orden->id, 'estado' => 'borrador']);
    }

    public function test_cancelled_orden_cannot_transition(): void
    {
        $proveedor = $this->createProveedor();
        $orden = OrdenCompra::create([
            'tenant_id' => $this->tenant->id,
            'proveedor_id' => $proveedor->id,
            'numero' => 'OC-TR-006',
            'estado' => 'cancelada',
            'fecha_emision' => now()->toDateString(),
            'subtotal' => 0, 'impuestos' => 0, 'total' => 0,
        ]);

        $response = $this->patch(route('purchasing.ordenes.estado', $orden), ['estado' => 'borrador']);

        $response->assertSessionHas('error');
    }
}
```

---

## Correcciones

> Archivo generado íntegramente desde el código fuente actual del módulo Purchasing. No se aplicaron correcciones — el documento refleja exactamente el estado del código al 2026-07-06.

**Archivos auditados:** 22 archivos totales (1 module.json, 1 ServiceProvider, 1 Routes, 2 Controllers, 3 Models, 1 Service, 5 Migrations, 9 Frontend pages, 2 Tests).
