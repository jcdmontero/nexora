# Auditoría: Inventory (Inventario)
> Actualizado: 2026-07-06

---

## 1. module.json
**Ruta:** app/Modules/Inventory/module.json
```json
{
    "code": "inventory",
    "name": "Inventario",
    "version": "1.0.0",
    "description": "Catálogo de productos, control de stock y alertas de existencias.",
    "icon": "Package",
    "core": false,
    "dependencies": ["purchasing", "cash", "accounting"],
    "permissions": [
        "inventory:view",
        "inventory:create",
        "inventory:edit",
        "inventory:delete"
    ],
    "menus": [
        {
            "section": "Inventario",
            "icon": "Package",
            "items": [
                { "label": "Productos", "route": "inventory.productos.index", "permission": "inventory:view" },
                { "label": "Entradas y Salidas", "route": "inventory.ajustes.create", "permission": "inventory:view" },
                { "label": "Kardex", "route": "inventory.kardex.index", "permission": "inventory:view" },
                { "label": "Traslados", "route": "inventory.traslados.index", "permission": "inventory:view" },
                { "label": "Categorías", "route": "inventory.categorias.index", "permission": "inventory:view" },
                { "label": "Marcas", "route": "inventory.marcas.index", "permission": "inventory:view" }
            ]
        }
    ]
}
```

---

## 2. Providers

### 2.1 InventoryServiceProvider
**Ruta:** app/Modules/Inventory/Providers/InventoryServiceProvider.php
```php
<?php

namespace App\Modules\Inventory\Providers;

use Illuminate\Support\ServiceProvider;

class InventoryServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Migrations');

        // Las rutas se cargan de forma centralizada en CoreServiceProvider::loadModuleRoutes()
        // (glob de Modules/*/Routes/web.php). No volver a cargarlas aquí: duplicaría las rutas
        // con un prefijo extra (inventario/inventory/...).
    }
}
```

---

## 3. Routes
**Ruta:** app/Modules/Inventory/Routes/web.php
```php
<?php

use Illuminate\Support\Facades\Route;
use App\Modules\Inventory\Controllers\CategoriaController;
use App\Modules\Inventory\Controllers\ProductoController;
use App\Modules\Inventory\Controllers\RecepcionController;
use App\Modules\Inventory\Controllers\TrasladoController;
use App\Modules\Inventory\Controllers\BodegaController;

use App\Modules\Inventory\Controllers\MarcaController;
use App\Modules\Inventory\Controllers\AjusteController;
use App\Modules\Inventory\Controllers\KardexController;
Route::middleware(['web', 'auth', 'tenant', 'module:inventory'])->group(function () {
    Route::prefix('inventory')->name('inventory.')->group(function () {

        Route::middleware('permission:inventory:view')->group(function () {
    Route::get('categorias', [CategoriaController::class, 'index'])->name('categorias.index');
    Route::get('bodegas', [BodegaController::class, 'index'])->name('bodegas.index');
    Route::get('marcas', [MarcaController::class, 'index'])->name('marcas.index');
    Route::get('productos', [ProductoController::class, 'index'])->name('productos.index');
    Route::get('productos/etiquetas', [ProductoController::class, 'printLabels'])->name('productos.etiquetas');
    
    Route::get('kardex', [KardexController::class, 'index'])->name('kardex.index');
    Route::get('kardex/{producto}', [KardexController::class, 'show'])->name('kardex.show');

    Route::get('recepciones', [RecepcionController::class, 'index'])->name('recepciones.index');
    Route::get('recepciones/{recepcione}', [RecepcionController::class, 'show'])->name('recepciones.show')->where('recepcione', '[0-9]+');

    Route::get('traslados', [TrasladoController::class, 'index'])->name('traslados.index');
    Route::get('traslados/{traslado}', [TrasladoController::class, 'show'])->name('traslados.show')->where('traslado', '[0-9]+');
});

Route::middleware('permission:inventory:create')->group(function () {
    Route::post('categorias', [CategoriaController::class, 'store'])->name('categorias.store');
    
    Route::get('bodegas/crear', [BodegaController::class, 'create'])->name('bodegas.create');
    Route::post('bodegas', [BodegaController::class, 'store'])->name('bodegas.store');

    Route::post('marcas', [MarcaController::class, 'store'])->name('marcas.store');
    
    Route::get('productos/crear', [ProductoController::class, 'create'])->name('productos.create');
    Route::post('productos', [ProductoController::class, 'store'])->name('productos.store');

    Route::get('ajustes/crear', [AjusteController::class, 'create'])->name('ajustes.create');
    Route::post('ajustes', [AjusteController::class, 'store'])->name('ajustes.store');

    Route::get('recepciones/crear', [RecepcionController::class, 'create'])->name('recepciones.create');
    Route::post('recepciones', [RecepcionController::class, 'store'])->name('recepciones.store');

    Route::get('traslados/crear', [TrasladoController::class, 'create'])->name('traslados.create');
    Route::post('traslados', [TrasladoController::class, 'store'])->name('traslados.store');
    Route::post('traslados/{traslado}/completar', [TrasladoController::class, 'completar'])->name('traslados.completar')->where('traslado', '[0-9]+');
});

Route::middleware('permission:inventory:edit')->group(function () {
    Route::put('categorias/{categoria}', [CategoriaController::class, 'update'])->name('categorias.update');
    
    Route::get('bodegas/{bodega}/editar', [BodegaController::class, 'edit'])->name('bodegas.edit');
    Route::put('bodegas/{bodega}', [BodegaController::class, 'update'])->name('bodegas.update');

    Route::put('marcas/{marca}', [MarcaController::class, 'update'])->name('marcas.update');
    Route::get('productos/{producto}/editar', [ProductoController::class, 'edit'])->name('productos.edit');
    Route::put('productos/{producto}', [ProductoController::class, 'update'])->name('productos.update');
});

Route::middleware('permission:inventory:delete')->group(function () {
    Route::delete('categorias/{categoria}', [CategoriaController::class, 'destroy'])->name('categorias.destroy');
    Route::delete('bodegas/{bodega}', [BodegaController::class, 'destroy'])->name('bodegas.destroy');
    Route::delete('marcas/{marca}', [MarcaController::class, 'destroy'])->name('marcas.destroy');
        Route::delete('productos/{producto}', [ProductoController::class, 'destroy'])->name('productos.destroy');
    });

    });
});
```

### Resumen de rutas
| Método | Ruta | Permiso | Controller@action |
|--------|------|---------|-------------------|
| GET | inventory/categorias | view | CategoriaController@index |
| POST | inventory/categorias | create | CategoriaController@store |
| PUT | inventory/categorias/{id} | edit | CategoriaController@update |
| DELETE | inventory/categorias/{id} | delete | CategoriaController@destroy |
| GET | inventory/bodegas | view | BodegaController@index |
| GET | inventory/bodegas/crear | create | BodegaController@create |
| POST | inventory/bodegas | create | BodegaController@store |
| GET | inventory/bodegas/{id}/editar | edit | BodegaController@edit |
| PUT | inventory/bodegas/{id} | edit | BodegaController@update |
| DELETE | inventory/bodegas/{id} | delete | BodegaController@destroy |
| GET | inventory/marcas | view | MarcaController@index |
| POST | inventory/marcas | create | MarcaController@store |
| PUT | inventory/marcas/{id} | edit | MarcaController@update |
| DELETE | inventory/marcas/{id} | delete | MarcaController@destroy |
| GET | inventory/productos | view | ProductoController@index |
| GET | inventory/productos/etiquetas | view | ProductoController@printLabels |
| GET | inventory/productos/crear | create | ProductoController@create |
| POST | inventory/productos | create | ProductoController@store |
| GET | inventory/productos/{id}/editar | edit | ProductoController@edit |
| PUT | inventory/productos/{id} | edit | ProductoController@update |
| DELETE | inventory/productos/{id} | delete | ProductoController@destroy |
| GET | inventory/kardex | view | KardexController@index |
| GET | inventory/kardex/{id} | view | KardexController@show |
| GET | inventory/ajustes/crear | create | AjusteController@create |
| POST | inventory/ajustes | create | AjusteController@store |
| GET | inventory/recepciones | view | RecepcionController@index |
| GET | inventory/recepciones/{id} | view | RecepcionController@show |
| GET | inventory/recepciones/crear | create | RecepcionController@create |
| POST | inventory/recepciones | create | RecepcionController@store |
| GET | inventory/traslados | view | TrasladoController@index |
| GET | inventory/traslados/{id} | view | TrasladoController@show |
| GET | inventory/traslados/crear | create | TrasladoController@create |
| POST | inventory/traslados | create | TrasladoController@store |
| POST | inventory/traslados/{id}/completar | create | TrasladoController@completar |

---

## 4. Controllers

### 4.1 ProductoController
**Ruta:** app/Modules/Inventory/Controllers/ProductoController.php
```php
<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Categoria;
use App\Modules\Inventory\Models\Marca;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Str;

class ProductoController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $productos = Producto::query()
            ->with(['categoria', 'marca', 'packs'])
            ->when($search, function ($query, $search) {
                $query->where('codigo', 'like', "%{$search}%")
                      ->orWhere('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($p) {
                $p->is_critical = $p->stock_minimo > 0 && $p->stock_actual <= $p->stock_minimo;
                return $p;
            });

        $criticalStockCount = Producto::where('stock_minimo', '>', 0)
            ->whereColumn('stock_actual', '<=', 'stock_minimo')
            ->count();

        return Inertia::render('Inventory/Productos/Index', [
            'productos' => $productos,
            'filters' => $request->only(['search']),
            'criticalCount' => $criticalStockCount
        ]);
    }

    public function printLabels(Request $request)
    {
        $ids = $request->query('ids', '');
        $productIds = array_filter(explode(',', $ids));

        $query = Producto::with('packs')->where('is_active', true);
        if (count($productIds) > 0) {
            $query->whereIn('id', $productIds);
        }

        $productos = $query->get()->map(function ($p) {
            $items = [];
            
            if ($p->codigo) {
                $items[] = [
                    'id' => $p->id . '_base',
                    'nombre' => $p->nombre,
                    'codigo' => $p->codigo,
                    'precio_venta' => $p->precio_venta,
                    'unidad_medida' => $p->unidad_medida,
                ];
            }

            foreach ($p->packs as $pack) {
                if ($pack->codigo_barras) {
                    $items[] = [
                        'id' => $p->id . '_pack_' . $pack->id,
                        'nombre' => $p->nombre . ' (' . $pack->nombre . ')',
                        'codigo' => $pack->codigo_barras,
                        'precio_venta' => $pack->precio_venta,
                        'unidad_medida' => $pack->unidad_medida,
                    ];
                }
            }

            return $items;
        })->flatten(1);

        return Inertia::render('Inventory/Productos/PrintLabels', [
            'productos' => $productos
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventory/Productos/Create', [
            'categorias' => Categoria::where('is_active', true)->orderBy('nombre')->get(['id', 'nombre']),
            'marcas' => Marca::where('is_active', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:inventory_productos,codigo,NULL,id,tenant_id,' . auth()->user()->tenant_id,
            'nombre' => 'required|string|max:150',
            'categoria_id' => ['nullable', Rule::in(Categoria::pluck('id'))],
            'marca_id' => ['nullable', Rule::in(Marca::pluck('id'))],
            'unidad_medida' => 'required|string|max:20',
            'precio_venta' => 'required|numeric|min:0',
            'costo_promedio' => 'required|numeric|min:0',
            'stock_actual' => 'required|numeric|min:0',
            'stock_minimo' => 'required|numeric|min:0',
            'descripcion' => 'nullable|string',
            'imagenes' => 'nullable|array|max:4',
            'imagenes.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'packs' => 'nullable|array',
            'packs.*.nombre' => 'required|string|max:100',
            'packs.*.unidad_medida' => 'required|string|max:20',
            'packs.*.factor_conversion' => 'required|numeric|min:0.0001',
            'packs.*.codigo_barras' => 'nullable|string|max:100',
            'packs.*.precio_venta' => 'nullable|numeric|min:0',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $imagenesPaths = [];
        if ($request->hasFile('imagenes')) {
            $imagenesPaths = $this->uploadImages($request->file('imagenes'), $tenantId);
        }

        \DB::transaction(function () use ($validated, $imagenesPaths) {
            $data = \Arr::except($validated, ['packs', 'imagenes']);
            $data['imagenes'] = $imagenesPaths;

            $producto = Producto::create($data);

            if (!empty($validated['packs'])) {
                $producto->packs()->createMany($validated['packs']);
            }

            if (($validated['stock_actual'] ?? 0) > 0) {
                $bodegaPrincipal = Bodega::where('es_principal', true)->first();
                if ($bodegaPrincipal) {
                    Stock::create([
                        'producto_id' => $producto->id,
                        'bodega_id' => $bodegaPrincipal->id,
                        'cantidad' => $validated['stock_actual'],
                    ]);
                }
            }
        });

        return redirect()->route('inventory.productos.index')->with('success', 'Producto creado correctamente.');
    }

    public function edit(Producto $producto)
    {
        $producto->load('packs');

        return Inertia::render('Inventory/Productos/Edit', [
            'producto' => $producto,
            'categorias' => Categoria::where('is_active', true)->orderBy('nombre')->get(['id', 'nombre']),
            'marcas' => Marca::where('is_active', true)->orderBy('nombre')->get(['id', 'nombre']),
        ]);
    }

    public function update(Request $request, Producto $producto)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50|unique:inventory_productos,codigo,' . $producto->id . ',id,tenant_id,' . auth()->user()->tenant_id,
            'nombre' => 'required|string|max:150',
            'categoria_id' => ['nullable', Rule::in(Categoria::pluck('id'))],
            'marca_id' => ['nullable', Rule::in(Marca::pluck('id'))],
            'unidad_medida' => 'required|string|max:20',
            'precio_venta' => 'required|numeric|min:0',
            'costo_promedio' => 'required|numeric|min:0',
            'stock_minimo' => 'required|numeric|min:0',
            'descripcion' => 'nullable|string',
            'imagenes' => 'nullable|array|max:4',
            'imagenes.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'imagenes_existentes' => 'nullable|array',
            'imagenes_existentes.*' => 'string',
            'packs' => 'nullable|array',
            'packs.*.id' => ['nullable', Rule::in(\App\Modules\Inventory\Models\ProductPack::pluck('id'))],
            'packs.*.nombre' => 'required|string|max:100',
            'packs.*.unidad_medida' => 'required|string|max:20',
            'packs.*.factor_conversion' => 'required|numeric|min:0.0001',
            'packs.*.codigo_barras' => 'nullable|string|max:100',
            'packs.*.precio_venta' => 'nullable|numeric|min:0',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $existingImages = $request->input('imagenes_existentes', []);
        $newImages = [];
        if ($request->hasFile('imagenes')) {
            $newImages = $this->uploadImages($request->file('imagenes'), $tenantId);
        }

        $allImages = array_slice(array_merge($existingImages, $newImages), 0, 4);

        $oldImages = $producto->imagenes ?? [];
        $imagesToDelete = [];
        foreach ($oldImages as $oldImage) {
            if (!in_array($oldImage, $allImages)) {
                $imagesToDelete[] = str_replace('/storage/', '', $oldImage);
            }
        }

        \DB::transaction(function () use ($validated, $producto, $allImages, $imagesToDelete) {
            $data = \Arr::except($validated, ['packs', 'stock_actual', 'imagenes', 'imagenes_existentes']);
            $data['imagenes'] = $allImages;

            $producto->update($data);

            $packIds = [];
            if (!empty($validated['packs'])) {
                foreach ($validated['packs'] as $packData) {
                    if (isset($packData['id']) && $packData['id']) {
                        $producto->packs()->where('id', $packData['id'])->update($packData);
                        $packIds[] = $packData['id'];
                    } else {
                        $newPack = $producto->packs()->create($packData);
                        $packIds[] = $newPack->id;
                    }
                }
            }
            
            $producto->packs()->whereNotIn('id', $packIds)->delete();

            foreach ($imagesToDelete as $pathInStorage) {
                \Storage::disk('public')->delete($pathInStorage);
            }
        });

        return redirect()->route('inventory.productos.index')->with('success', 'Producto actualizado correctamente.');
    }

    public function destroy(Producto $producto)
    {
        if ($producto->stock_actual > 0) {
            return back()->with('error', 'No puedes eliminar un producto que tiene stock disponible.');
        }

        $images = $producto->imagenes ?? [];
        foreach ($images as $image) {
            $pathInStorage = str_replace('/storage/', '', $image);
            \Storage::disk('public')->delete($pathInStorage);
        }

        $producto->delete();
        return back()->with('success', 'Producto eliminado correctamente.');
    }

    private function uploadImages(array $files, int $tenantId): array
    {
        $paths = [];
        foreach ($files as $file) {
            if ($file instanceof \Illuminate\Http\UploadedFile) {
                $path = $file->store("productos/{$tenantId}", 'public');
                $paths[] = '/storage/' . $path;
            }
        }
        return $paths;
    }
}
```

### 4.2 CategoriaController
**Ruta:** app/Modules/Inventory/Controllers/CategoriaController.php
```php
<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Categoria;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoriaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $categorias = Categoria::query()
            ->when($search, function ($query, $search) {
                $query->where('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Categorias/Index', [
            'categorias' => $categorias,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:inventory_categorias,nombre,NULL,id,tenant_id,' . auth()->user()->tenant_id,
            'descripcion' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Categoria::create($validated);

        return back()->with('success', 'Categoría creada correctamente.');
    }

    public function update(Request $request, Categoria $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:inventory_categorias,nombre,' . $categoria->id . ',id,tenant_id,' . auth()->user()->tenant_id,
            'descripcion' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $categoria->update($validated);

        return back()->with('success', 'Categoría actualizada correctamente.');
    }

    public function destroy(Categoria $categoria)
    {
        if ($categoria->productos()->exists()) {
            return back()->with('error', 'No puedes eliminar una categoría que tiene productos asociados.');
        }

        $categoria->delete();
        return back()->with('success', 'Categoría eliminada correctamente.');
    }
}
```

### 4.3 MarcaController
**Ruta:** app/Modules/Inventory/Controllers/MarcaController.php
```php
<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Marca;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarcaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $marcas = Marca::query()
            ->when($search, function ($query, $search) {
                $query->where('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Marcas/Index', [
            'marcas' => $marcas,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:inventory_marcas,nombre,NULL,id,tenant_id,' . auth()->user()->tenant_id,
            'is_active' => 'boolean',
        ]);

        Marca::create($validated);

        return back()->with('success', 'Marca creada correctamente.');
    }

    public function update(Request $request, Marca $marca)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:inventory_marcas,nombre,' . $marca->id . ',id,tenant_id,' . auth()->user()->tenant_id,
            'is_active' => 'boolean',
        ]);

        $marca->update($validated);

        return back()->with('success', 'Marca actualizada correctamente.');
    }

    public function destroy(Marca $marca)
    {
        if ($marca->productos()->exists()) {
            return back()->with('error', 'No puedes eliminar una marca que tiene productos asociados.');
        }

        $marca->delete();
        return back()->with('success', 'Marca eliminada correctamente.');
    }
}
```

### 4.4 BodegaController
**Ruta:** app/Modules/Inventory/Controllers/BodegaController.php
```php
<?php
namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use App\Core\Models\Sede;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BodegaController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Bodegas/Index', [
            'bodegas' => Bodega::with('sede:id,nombre')->orderBy('nombre')->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventory/Bodegas/Create', [
            'sedes' => Sede::where('activo', true)->get(['id', 'nombre'])
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'sede_id' => ['required', Rule::in(Sede::pluck('id'))],
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'es_principal' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        if (!empty($data['es_principal'])) {
            Bodega::where('es_principal', true)->update(['es_principal' => false]);
        }

        Bodega::create($data);

        return redirect()->route('inventory.bodegas.index')
            ->with('success', 'Bodega creada correctamente.');
    }

    public function edit(Bodega $bodega)
    {
        return Inertia::render('Inventory/Bodegas/Edit', [
            'bodega' => $bodega,
            'sedes' => Sede::where('activo', true)->get(['id', 'nombre'])
        ]);
    }

    public function update(Request $request, Bodega $bodega)
    {
        $data = $request->validate([
            'sede_id' => ['required', Rule::in(Sede::pluck('id'))],
            'nombre' => ['required', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'es_principal' => ['boolean'],
            'activo' => ['boolean'],
        ]);

        if (!empty($data['es_principal'])) {
            Bodega::where('id', '!=', $bodega->id)->where('es_principal', true)->update(['es_principal' => false]);
        }

        $bodega->update($data);

        return redirect()->route('inventory.bodegas.index')
            ->with('success', 'Bodega actualizada correctamente.');
    }

    public function destroy(Bodega $bodega)
    {
        if ($bodega->es_principal) {
            return back()->with('error', 'No puedes eliminar la bodega principal.');
        }

        $tieneStock = Stock::where('bodega_id', $bodega->id)
            ->where('cantidad', '>', 0)
            ->exists();

        if ($tieneStock) {
            return back()->with('error', 'No puedes eliminar una bodega que tiene stock positivo.');
        }

        $bodega->delete();

        return back()->with('success', 'Bodega eliminada.');
    }
}
```

### 4.5 KardexController
**Ruta:** app/Modules/Inventory/Controllers/KardexController.php
```php
<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KardexController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $productos = Producto::query()
            ->with(['categoria'])
            ->when($search, function ($query, $search) {
                $query->where('codigo', 'like', "%{$search}%")
                      ->orWhere('nombre', 'ilike', "%{$search}%");
            })
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Inventory/Kardex/Index', [
            'productos' => $productos,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show($id)
    {
        $producto = Producto::with(['categoria', 'marca'])->findOrFail($id);

        $movimientos = $producto->adjustments()
            ->with(['user:id,name', 'pack'])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20);

        return Inertia::render('Inventory/Kardex/Show', [
            'producto' => $producto,
            'movimientos' => $movimientos,
        ]);
    }
}
```

### 4.6 AjusteController
**Ruta:** app/Modules/Inventory/Controllers/AjusteController.php
```php
<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use App\Modules\Inventory\Models\InventoryAdjustment;
use App\Modules\Inventory\Models\ProductPack;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AjusteController extends Controller
{
    public function create()
    {
        $productos = Producto::where('is_active', true)
            ->with('packs')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'codigo', 'unidad_medida', 'stock_actual']);

        return Inertia::render('Inventory/Ajustes/Create', [
            'productos' => $productos,
            'bodegas' => Bodega::where('activo', true)->get(['id', 'nombre'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo' => 'required|in:entrada,salida,ajuste',
            'bodega_id' => ['required', Rule::in(Bodega::pluck('id'))],
            'producto_id' => ['required', Rule::in(Producto::pluck('id'))],
            'pack_id' => ['nullable', Rule::in(ProductPack::pluck('id'))],
            'cantidad' => 'required|numeric|min:0.0001',
            'factor_conversion' => 'required|numeric|min:0.0001',
            'observaciones' => 'required|string|min:5|max:500',
        ], [
            'observaciones.required' => 'Debes ingresar una justificación para este movimiento.',
            'observaciones.min' => 'La justificación es muy corta (mínimo 5 caracteres).'
        ]);

        $producto = Producto::findOrFail($validated['producto_id']);
        $cantidadFisica = $validated['cantidad'] * $validated['factor_conversion'];

        $stockBodega = Stock::firstOrCreate([
            'producto_id' => $producto->id,
            'bodega_id' => $validated['bodega_id']
        ]);

        if ($validated['tipo'] === 'salida' && $stockBodega->cantidad < $cantidadFisica) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'cantidad' => "La cantidad total a retirar ({$cantidadFisica} {$producto->unidad_medida}) supera el stock disponible en esta bodega ({$stockBodega->cantidad} {$producto->unidad_medida}).",
            ]);
        }

        DB::transaction(function () use ($validated, $cantidadFisica, $producto, $stockBodega) {
            InventoryAdjustment::create([
                'producto_id' => $validated['producto_id'],
                'bodega_id' => $validated['bodega_id'],
                'pack_id' => $validated['pack_id'] ?? null,
                'tipo' => $validated['tipo'],
                'cantidad' => $validated['cantidad'],
                'factor_conversion' => $validated['factor_conversion'],
                'cantidad_base' => $cantidadFisica,
                'observaciones' => $validated['observaciones'],
            ]);

            if ($validated['tipo'] === 'entrada') {
                $producto->increment('stock_actual', $cantidadFisica);
                $stockBodega->increment('cantidad', $cantidadFisica);
            } elseif ($validated['tipo'] === 'salida') {
                $producto->decrement('stock_actual', $cantidadFisica);
                $stockBodega->decrement('cantidad', $cantidadFisica);
            } else {
                $diferencia = $cantidadFisica - $stockBodega->cantidad;
                $producto->increment('stock_actual', $diferencia);
                $stockBodega->update(['cantidad' => $cantidadFisica]);
            }
        });

        return back()->with('success', 'Movimiento registrado correctamente.');
    }
}
```

### 4.7 RecepcionController
**Ruta:** app/Modules/Inventory/Controllers/RecepcionController.php
```php
<?php
namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Recepcion;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RecepcionController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Recepciones/Index', [
            'recepciones' => Inertia::defer(fn () => Recepcion::with('ordenCompra:id,numero')
                ->orderBy('created_at', 'desc')
                ->paginate(20)
                ->withQueryString()),
        ]);
    }

    public function create(Request $request)
    {
        if (!class_exists(\App\Modules\Purchasing\Models\OrdenCompra::class)) {
            return redirect()->route('inventory.recepciones.index')
                ->with('error', 'El módulo de Compras no está instalado.');
        }

        $orden_id = $request->query('orden_id');
        $orden = null;

        if ($orden_id) {
            $orden = \App\Modules\Purchasing\Models\OrdenCompra::with('detalles.producto:id,codigo,nombre')->find($orden_id);
            if ($orden && $orden->estado === 'recibida') {
                return redirect()->route('inventory.recepciones.index')->with('error', 'Esta orden ya ha sido recibida.');
            }
        }

        if (!$orden) {
            return redirect()->route('inventory.recepciones.index')->with('error', 'Debe seleccionar una orden de compra para recibir mercancía.');
        }

        $sesion = null;
        if (class_exists(\App\Modules\Cash\Services\CajaService::class)) {
            $cajaService = app(\App\Modules\Cash\Services\CajaService::class);
            $sesion = $cajaService->getSesionAbierta(auth()->id());
        }

        return Inertia::render('Inventory/Recepciones/Create', [
            'orden' => $orden,
            'bodegas' => Bodega::where('activo', true)->get(['id', 'nombre']),
            'numero_sugerido' => 'REC-' . date('Ymd-His'),
            'sesion_caja' => $sesion ? [
                'id' => $sesion->id,
                'caja_nombre' => $sesion->caja->nombre,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $data = $request->validate([
            'orden_compra_id' => ['required'],
            'bodega_id' => ['required', Rule::in(Bodega::pluck('id'))],
            'numero' => ['required', 'string', 'max:50'],
            'fecha' => ['required', 'date'],
            'metodo_pago' => ['required', 'string', 'in:efectivo,transferencia,credito'],
            'fecha_vencimiento' => ['nullable', 'date'],
            'notas' => ['nullable', 'string'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', Rule::in(Producto::pluck('id'))],
            'detalles.*.cantidad' => ['required', 'numeric', 'min:0.01'],
        ]);

        if (!class_exists(\App\Modules\Purchasing\Models\OrdenCompra::class)) {
            return back()->with('error', 'El módulo de Compras no está instalado.');
        }

        $orden = \App\Modules\Purchasing\Models\OrdenCompra::with(['proveedor', 'detalles'])->findOrFail($data['orden_compra_id']);

        $recepcionesExistentes = Recepcion::where('orden_compra_id', $orden->id)
            ->with('detalles')
            ->get();

        $cantidadesRecibidas = [];
        foreach ($recepcionesExistentes as $recAnt) {
            foreach ($recAnt->detalles as $det) {
                $cantidadesRecibidas[$det->producto_id] = ($cantidadesRecibidas[$det->producto_id] ?? 0) + (float) $det->cantidad;
            }
        }

        $montoTotal = 0.0;
        foreach ($data['detalles'] as $item) {
            $lineaOrden = $orden->detalles->firstWhere('producto_id', $item['producto_id']);

            if (!$lineaOrden) {
                return back()->withErrors([
                    'detalles' => "El producto ID {$item['producto_id']} no pertenece a esta orden de compra.",
                ])->withInput();
            }

            $precioUnitario = (float) $lineaOrden->precio_unitario;

            $cantidadOrdenada = (float) $lineaOrden->cantidad;
            $cantidadYaRecibida = $cantidadesRecibidas[$item['producto_id']] ?? 0;
            $cantidadPendiente = $cantidadOrdenada - $cantidadYaRecibida;

            if ($item['cantidad'] > $cantidadPendiente) {
                $nombreProducto = $lineaOrden->producto->nombre ?? ('ID ' . $item['producto_id']);
                return back()->withErrors([
                    'detalles' => "La cantidad recibida ({$item['cantidad']}) excede la cantidad pendiente ({$cantidadPendiente}) para el producto {$nombreProducto}.",
                ])->withInput();
            }

            $montoTotal += round($item['cantidad'] * $precioUnitario, 2);
        }

        $mensajesAdvertencia = [];

        DB::transaction(function () use ($data, $orden, $montoTotal, &$mensajesAdvertencia) {
            $sesion = null;
            if ($data['metodo_pago'] === 'efectivo' && class_exists(\App\Modules\Cash\Services\CajaService::class)) {
                $cajaService = app(\App\Modules\Cash\Services\CajaService::class);
                $sesion = $cajaService->getSesionAbierta(auth()->id());
                if (!$sesion) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'metodo_pago' => 'La sesión de caja se cerró. Abre un nuevo turno para continuar.',
                    ]);
                }
            }

            $recepcion = Recepcion::create([
                'tenant_id' => $orden->tenant_id,
                'orden_compra_id' => $data['orden_compra_id'],
                'bodega_id' => $data['bodega_id'],
                'numero' => $data['numero'],
                'fecha' => $data['fecha'],
                'metodo_pago' => $data['metodo_pago'],
                'monto_total' => $montoTotal,
                'caja_sesion_id' => $sesion?->id,
                'notas' => $data['notas'] ?? null,
            ]);

            foreach ($data['detalles'] as $item) {
                $recepcion->detalles()->create([
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                ]);

                $producto = Producto::find($item['producto_id']);
                if ($producto) {
                    $producto->increment('stock_actual', $item['cantidad']);
                }

                $stock = Stock::firstOrCreate([
                    'producto_id' => $item['producto_id'],
                    'bodega_id' => $data['bodega_id'],
                ]);
                $stock->increment('cantidad', $item['cantidad']);
            }

            $orden->load('detalles');
            $todasRecibidas = true;
            foreach ($orden->detalles as $linea) {
                $recibido = DB::table('inventory_recepcion_detalles')
                    ->join('inventory_recepciones', 'inventory_recepciones.id', '=', 'inventory_recepcion_detalles.recepcion_id')
                    ->where('inventory_recepciones.orden_compra_id', $orden->id)
                    ->where('inventory_recepcion_detalles.producto_id', $linea->producto_id)
                    ->sum('inventory_recepcion_detalles.cantidad');

                if ($recibido < (float) $linea->cantidad) {
                    $todasRecibidas = false;
                    break;
                }
            }

            if ($todasRecibidas) {
                $orden->update(['estado' => 'recibida']);
            }

            if ($data['metodo_pago'] === 'efectivo' && $montoTotal > 0 && $sesion && class_exists(\App\Modules\Cash\Services\CajaService::class)) {
                $cajaService = app(\App\Modules\Cash\Services\CajaService::class);
                $cajaService->registrarMovimiento(
                    $sesion,
                    'egreso',
                    $montoTotal,
                    'efectivo',
                    "Pago compra Recepción: {$recepcion->numero}",
                    $recepcion
                );
            }

            if (class_exists(\App\Modules\Accounting\Models\CuentaPorPagar::class) && class_exists(\App\Modules\Accounting\Services\ContabilidadService::class)) {
                if ($data['metodo_pago'] === 'credito' && $montoTotal > 0) {
                    \App\Modules\Accounting\Models\CuentaPorPagar::create([
                        'tenant_id' => $orden->tenant_id,
                        'acreedor_id' => $orden->proveedor_id,
                        'acreedor_type' => get_class($orden->proveedor),
                        'documento_origen_id' => $recepcion->id,
                        'documento_origen_type' => Recepcion::class,
                        'monto_total' => $montoTotal,
                        'monto_pagado' => 0,
                        'estado' => 'pendiente',
                        'fecha_vencimiento' => $data['fecha_vencimiento'] ?? \Carbon\Carbon::parse($data['fecha'])->addDays(30)->toDateString(),
                        'notas' => "Compra a crédito Recepción {$recepcion->numero}",
                    ]);
                }

                $contabilidadService = app(\App\Modules\Accounting\Services\ContabilidadService::class);
                $lineasContables = [];

                $cuentaInventario = $contabilidadService->getCuenta('1405');
                if ($cuentaInventario) {
                    $lineasContables[] = [
                        'cuenta_contable_id' => $cuentaInventario->id,
                        'descripcion' => "Ingreso Inventario Recepción {$recepcion->numero}",
                        'debito' => $montoTotal,
                        'credito' => 0,
                    ];
                } else {
                    $mensajesAdvertencia[] = 'No se generó asiento contable: cuenta de inventario (1405) no configurada en el plan de cuentas.';
                }

                $codigoCredito = match ($data['metodo_pago']) {
                    'transferencia' => '111005',
                    'credito' => '2205',
                    default => '110505',
                };

                $cuentaCredito = $contabilidadService->getCuenta($codigoCredito);
                if (!$cuentaCredito) {
                    if ($data['metodo_pago'] === 'transferencia') {
                        $cuentaCredito = $contabilidadService->getCuenta('110505');
                    } elseif ($data['metodo_pago'] === 'credito') {
                        $cuentaCredito = $contabilidadService->getCuenta('2000');
                    }
                }

                if ($cuentaCredito) {
                    $lineasContables[] = [
                        'cuenta_contable_id' => $cuentaCredito->id,
                        'descripcion' => "Pago compra Recepción {$recepcion->numero}",
                        'debito' => 0,
                        'credito' => $montoTotal,
                        'tercero_tipo_documento' => $orden->proveedor->tipo_documento ?? null,
                        'tercero_numero_documento' => $orden->proveedor->numero_documento ?? null,
                        'tercero_nombre' => $orden->proveedor->razon_social ?? null,
                    ];
                } else {
                    $mensajesAdvertencia[] = "No se generó contrapartida contable: cuenta para método '{$data['metodo_pago']}' no configurada en el plan de cuentas.";
                }

                if (count($lineasContables) >= 2) {
                    $contabilidadService->registrarAsiento([
                        'fecha' => $data['fecha'],
                        'concepto' => "Compra mercancía Recepción {$recepcion->numero}",
                        'modulo_origen' => 'compras',
                        'documento_tipo' => 'REC',
                        'documento_numero' => $recepcion->numero,
                        'tercero_tipo_documento' => $orden->proveedor->tipo_documento ?? null,
                        'tercero_numero_documento' => $orden->proveedor->numero_documento ?? null,
                        'tercero_nombre' => $orden->proveedor->razon_social ?? null,
                        'referencia_type' => Recepcion::class,
                        'referencia_id' => $recepcion->id,
                    ], $lineasContables);
                } else {
                    $mensajesAdvertencia[] = 'El asiento contable no se registró: faltan cuentas del PUC. La recepción se guardó correctamente.';
                }
            }
        });

        $redirect = redirect()->route('inventory.recepciones.index');

        if (!empty($mensajesAdvertencia)) {
            $redirect->with('warning', implode(' ', $mensajesAdvertencia));
        }

        return $redirect->with('success', 'Mercancía recibida correctamente.');
    }

    public function show(Recepcion $recepcione)
    {
        $recepcione->load(['ordenCompra', 'detalles.producto:id,codigo,nombre']);

        return Inertia::render('Inventory/Recepciones/Show', [
            'recepcion' => $recepcione,
        ]);
    }
}
```

### 4.8 TrasladoController
**Ruta:** app/Modules/Inventory/Controllers/TrasladoController.php
```php
<?php
namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Stock;
use App\Modules\Inventory\Models\Traslado;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TrasladoController extends Controller
{
    public function index()
    {
        return Inertia::render('Inventory/Traslados/Index', [
            'traslados' => Inertia::defer(fn () => Traslado::with(['origen:id,nombre', 'destino:id,nombre'])
                ->orderBy('created_at', 'desc')
                ->paginate(20)
                ->withQueryString()),
        ]);
    }

    public function create()
    {
        return Inertia::render('Inventory/Traslados/Create', [
            'bodegas' => Bodega::where('activo', true)->get(['id', 'nombre']),
            'productos' => Producto::where('is_active', true)->get(['id', 'codigo', 'nombre', 'unidad_medida']),
            'numero_sugerido' => 'TR-' . date('Ymd-His'),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'numero' => ['required', 'string', 'max:50'],
            'fecha' => ['required', 'date'],
            'bodega_origen_id' => ['required', Rule::in(Bodega::pluck('id'))],
            'bodega_destino_id' => ['required', Rule::in(Bodega::pluck('id')), 'different:bodega_origen_id'],
            'notas' => ['nullable', 'string'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', Rule::in(Producto::pluck('id'))],
            'detalles.*.cantidad' => ['required', 'numeric', 'min:0.01'],
        ]);

        DB::transaction(function () use ($data) {
            $traslado = Traslado::create([
                'numero' => $data['numero'],
                'fecha' => $data['fecha'],
                'bodega_origen_id' => $data['bodega_origen_id'],
                'bodega_destino_id' => $data['bodega_destino_id'],
                'estado' => 'borrador',
                'notas' => $data['notas'] ?? null,
            ]);

            foreach ($data['detalles'] as $item) {
                $traslado->detalles()->create([
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                ]);
            }
        });

        return redirect()->route('inventory.traslados.index')
            ->with('success', 'Traslado creado como borrador. Confírmalo cuando estés listo para ejecutar.');
    }

    public function show(Traslado $traslado)
    {
        $traslado->load(['origen', 'destino', 'detalles.producto:id,codigo,nombre,unidad_medida']);

        return Inertia::render('Inventory/Traslados/Show', [
            'traslado' => $traslado,
        ]);
    }

    public function completar(Traslado $traslado)
    {
        if ($traslado->estado !== 'borrador') {
            return back()->with('error', 'Solo se pueden completar traslados en estado borrador.');
        }

        $detalles = $traslado->detalles()->with('producto:id,nombre')->get();

        DB::transaction(function () use ($traslado, $detalles) {
            foreach ($detalles as $item) {
                $stockOrigen = Stock::firstOrCreate([
                    'producto_id' => $item->producto_id,
                    'bodega_id' => $traslado->bodega_origen_id,
                ]);

                if ($stockOrigen->cantidad < $item->cantidad) {
                    throw ValidationException::withMessages([
                        'detalles' => "Stock insuficiente en bodega origen para el producto {$item->producto->nombre}. Disponible: {$stockOrigen->cantidad}",
                    ]);
                }

                $stockOrigen->decrement('cantidad', $item['cantidad']);

                $stockDestino = Stock::firstOrCreate([
                    'producto_id' => $item->producto_id,
                    'bodega_id' => $traslado->bodega_destino_id,
                ]);
                $stockDestino->increment('cantidad', $item['cantidad']);

                Producto::where('id', $item->producto_id)->update([
                    'stock_actual' => Stock::where('producto_id', $item->producto_id)->sum('cantidad'),
                ]);
            }

            $traslado->update(['estado' => 'completado']);
        });

        return back()->with('success', 'Traslado completado. Stock actualizado en ambas bodegas.');
    }
}
```

---

## 5. Models

### 5.1 Producto
**Ruta:** app/Modules/Inventory/Models/Producto.php
```php
<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Producto extends Model
{
    use HasFactory, BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_productos';

    protected $fillable = [
        'tenant_id',
        'codigo',
        'nombre',
        'imagenes',
        'descripcion',
        'categoria_id',
        'marca_id',
        'unidad_medida',
        'precio_venta',
        'costo_promedio',
        'stock_actual',
        'stock_minimo',
        'is_active',
    ];

    protected $casts = [
        'precio_venta' => 'decimal:2',
        'costo_promedio' => 'decimal:2',
        'stock_actual' => 'decimal:4',
        'stock_minimo' => 'decimal:4',
        'is_active' => 'boolean',
        'imagenes' => 'array',
    ];

    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'categoria_id');
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'producto_id');
    }

    public function packs()
    {
        return $this->hasMany(ProductPack::class, 'producto_id');
    }

    public function adjustments()
    {
        return $this->hasMany(InventoryAdjustment::class, 'producto_id');
    }

    public function getStockBajoAttribute(): bool
    {
        return $this->stock_actual <= $this->stock_minimo;
    }
}
```

### 5.2 Categoria
**Ruta:** app/Modules/Inventory/Models/Categoria.php
```php
<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Categoria extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_categorias';

    protected $fillable = [
        'tenant_id',
        'nombre',
        'descripcion',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function productos()
    {
        return $this->hasMany(Producto::class, 'categoria_id');
    }
}
```

### 5.3 Marca
**Ruta:** app/Modules/Inventory/Models/Marca.php
```php
<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Marca extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_marcas';

    protected $fillable = [
        'tenant_id',
        'nombre',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function productos()
    {
        return $this->hasMany(Producto::class, 'marca_id');
    }
}
```

### 5.4 Bodega
**Ruta:** app/Modules/Inventory/Models/Bodega.php
```php
<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Models\Tenant;
use App\Core\Models\Sede;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bodega extends Model
{
    use BelongsToTenant, SoftDeletes;

    protected $table = 'inventory_bodegas';

    protected $fillable = [
        'tenant_id',
        'sede_id',
        'nombre',
        'direccion',
        'es_principal',
        'activo',
    ];

    protected $casts = [
        'es_principal' => 'boolean',
        'activo' => 'boolean',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function sede()
    {
        return $this->belongsTo(Sede::class, 'sede_id');
    }

    public function stocks()
    {
        return $this->hasMany(Stock::class, 'bodega_id');
    }
}
```

### 5.5 Stock
**Ruta:** app/Modules/Inventory/Models/Stock.php
```php
<?php
namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    protected $table = 'inventory_stocks';

    protected $fillable = [
        'producto_id',
        'bodega_id',
        'cantidad',
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }
}
```

### 5.6 ProductPack
**Ruta:** app/Modules/Inventory/Models/ProductPack.php
```php
<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class ProductPack extends Model
{
    use BelongsToTenant;

    protected $table = 'inventory_product_packs';

    protected $fillable = [
        'tenant_id',
        'producto_id',
        'nombre',
        'unidad_medida',
        'factor_conversion',
        'codigo_barras',
        'precio_venta',
    ];

    protected $casts = [
        'factor_conversion' => 'decimal:4',
        'precio_venta' => 'decimal:2',
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
```

### 5.7 InventoryAdjustment
**Ruta:** app/Modules/Inventory/Models/InventoryAdjustment.php
```php
<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class InventoryAdjustment extends Model
{
    use BelongsToTenant;

    protected $table = 'inventory_adjustments';

    protected $fillable = [
        'tenant_id',
        'producto_id',
        'pack_id',
        'bodega_id',
        'tipo',
        'cantidad',
        'factor_conversion',
        'cantidad_base',
        'costo_unitario',
        'observaciones',
        'referencia_id',
        'referencia_type',
        'created_by'
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
        'factor_conversion' => 'decimal:4',
        'cantidad_base' => 'decimal:4',
        'costo_unitario' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->created_by && auth()->check()) {
                $model->created_by = auth()->id();
            }
        });
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }

    public function pack()
    {
        return $this->belongsTo(ProductPack::class, 'pack_id');
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function referencia()
    {
        return $this->morphTo();
    }
}
```

### 5.8 Recepcion
**Ruta:** app/Modules/Inventory/Models/Recepcion.php
```php
<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use App\Modules\Purchasing\Models\OrdenCompra;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recepcion extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_recepciones';

    protected $fillable = [
        'tenant_id',
        'orden_compra_id',
        'bodega_id',
        'numero',
        'fecha',
        'notas',
        'metodo_pago',
        'monto_total',
        'caja_sesion_id',
    ];

    protected $casts = [
        'fecha' => 'date',
        'monto_total' => 'decimal:2',
    ];

    public function ordenCompra()
    {
        return $this->belongsTo(OrdenCompra::class, 'orden_compra_id');
    }

    public function detalles()
    {
        return $this->hasMany(RecepcionDetalle::class, 'recepcion_id');
    }

    public function bodega()
    {
        return $this->belongsTo(Bodega::class, 'bodega_id');
    }

    public function cajaSesion()
    {
        return $this->belongsTo(\App\Modules\Cash\Models\CajaSesion::class, 'caja_sesion_id');
    }
}
```

### 5.9 RecepcionDetalle
**Ruta:** app/Modules/Inventory/Models/RecepcionDetalle.php
```php
<?php
namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class RecepcionDetalle extends Model
{
    protected $table = 'inventory_recepcion_detalles';

    protected $fillable = [
        'recepcion_id',
        'producto_id',
        'cantidad',
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
    ];

    public function recepcion()
    {
        return $this->belongsTo(Recepcion::class, 'recepcion_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
```

### 5.10 Traslado
**Ruta:** app/Modules/Inventory/Models/Traslado.php
```php
<?php
namespace App\Modules\Inventory\Models;

use App\Core\Concerns\BelongsToTenant;
use App\Core\Services\Auditable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Traslado extends Model
{
    use BelongsToTenant, SoftDeletes, Auditable;

    protected $table = 'inventory_traslados';

    protected $fillable = [
        'tenant_id',
        'bodega_origen_id',
        'bodega_destino_id',
        'numero',
        'fecha',
        'estado',
        'notas',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function origen()
    {
        return $this->belongsTo(Bodega::class, 'bodega_origen_id');
    }

    public function destino()
    {
        return $this->belongsTo(Bodega::class, 'bodega_destino_id');
    }

    public function detalles()
    {
        return $this->hasMany(TrasladoDetalle::class, 'traslado_id');
    }
}
```

### 5.11 TrasladoDetalle
**Ruta:** app/Modules/Inventory/Models/TrasladoDetalle.php
```php
<?php
namespace App\Modules\Inventory\Models;

use Illuminate\Database\Eloquent\Model;

class TrasladoDetalle extends Model
{
    protected $table = 'inventory_traslado_detalles';

    protected $fillable = [
        'traslado_id',
        'producto_id',
        'cantidad',
    ];

    protected $casts = [
        'cantidad' => 'decimal:4',
    ];

    public function traslado()
    {
        return $this->belongsTo(Traslado::class, 'traslado_id');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'producto_id');
    }
}
```

---

## 6. Services

### 6.1 StockReconciliationService
**Ruta:** app/Modules/Inventory/Services/StockReconciliationService.php
```php
<?php
namespace App\Modules\Inventory\Services;

use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Stock;
use Illuminate\Support\Facades\DB;

class StockReconciliationService
{
    /**
     * Recalcula stock_actual de cada producto sumando sus Stock por bodega.
     * Retorna array con los productos corregidos.
     */
    public function reconcile(?int $tenantId = null): array
    {
        $query = Producto::query();

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $productos = $query->select('id', 'tenant_id', 'codigo', 'nombre', 'stock_actual')->get();
        $corregidos = [];

        DB::transaction(function () use ($productos, &$corregidos) {
            foreach ($productos as $producto) {
                $sumaBodegas = Stock::where('producto_id', $producto->id)->sum('cantidad');
                $sumaBodegas = (float) $sumaBodegas;
                $actual = (float) $producto->stock_actual;

                if (abs($sumaBodegas - $actual) > 0.0001) {
                    $diferencia = $sumaBodegas - $actual;
                    $producto->stock_actual = $sumaBodegas;
                    $producto->save();

                    $corregidos[] = [
                        'id' => $producto->id,
                        'codigo' => $producto->codigo,
                        'nombre' => $producto->nombre,
                        'anterior' => $actual,
                        'corregido' => $sumaBodegas,
                        'diferencia' => $diferencia,
                    ];
                }
            }
        });

        return $corregidos;
    }
}
```

---

## 7. Migrations

### 7.1 create_inventory_tables
**Ruta:** app/Modules/Inventory/Migrations/2026_06_20_100000_create_inventory_tables.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Categorías
        Schema::create('inventory_categorias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['tenant_id', 'nombre']);
        });

        // 2. Marcas
        Schema::create('inventory_marcas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('nombre', 100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            
            $table->unique(['tenant_id', 'nombre']);
        });

        // 3. Productos / Catálogo Base
        Schema::create('inventory_productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('codigo', 50); // SKU
            $table->string('nombre', 150);
            $table->text('descripcion')->nullable();
            $table->foreignId('categoria_id')->nullable()->constrained('inventory_categorias')->nullOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('inventory_marcas')->nullOnDelete();
            $table->string('unidad_medida', 20)->default('unidad'); // kg, mt, lt, unidad
            
            // Precios y Costos
            $table->decimal('precio_venta', 15, 2)->default(0);
            $table->decimal('costo_promedio', 15, 2)->default(0);
            
            // Stock (Caché rápido, alimentado por movimientos)
            $table->decimal('stock_actual', 15, 4)->default(0);
            $table->decimal('stock_minimo', 15, 4)->default(0);
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'codigo']);
        });

        // 3.5 Presentaciones / Empaques (Conversión de Unidades)
        Schema::create('inventory_product_packs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos')->cascadeOnDelete();
            $table->string('nombre', 100); // Ej: "Docena", "Caja x24"
            $table->string('unidad_medida', 20); // 'docena', 'caja'
            $table->decimal('factor_conversion', 10, 4); // Cuántas unidades base contiene
            $table->string('codigo_barras', 100)->nullable();
            $table->decimal('precio_venta', 15, 2)->nullable(); // Precio mayorista opcional
            $table->timestamps();
        });

        // 4. Ajustes y Movimientos (Kardex)
        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos')->cascadeOnDelete();
            $table->foreignId('pack_id')->nullable()->constrained('inventory_product_packs')->nullOnDelete();
            $table->enum('tipo', ['entrada', 'salida', 'ajuste', 'inicial']);
            $table->decimal('cantidad', 15, 4); // Cantidad en la unidad seleccionada (Ej: 3 docenas)
            $table->decimal('factor_conversion', 10, 4)->default(1); // Histórico del factor
            $table->decimal('cantidad_base', 15, 4); // Cantidad física real (Ej: 36 unidades)
            $table->decimal('costo_unitario', 15, 2)->nullable();
            $table->text('observaciones')->nullable();
            
            $table->nullableMorphs('referencia');
            
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            
            $table->index(['tenant_id', 'producto_id']);
            $table->index(['tenant_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_adjustments');
        Schema::dropIfExists('inventory_product_packs');
        Schema::dropIfExists('inventory_productos');
        Schema::dropIfExists('inventory_marcas');
        Schema::dropIfExists('inventory_categorias');
    }
};
```

### 7.2 create_inventory_recepciones_table
**Ruta:** app/Modules/Inventory/Migrations/2026_06_20_100001_create_inventory_recepciones_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_recepciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('orden_compra_id')->nullable(); // Soft reference to purchasing_ordenes
            $table->string('numero', 50); // Número de albarán o recepción interno
            $table->date('fecha');
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_recepciones');
    }
};
```

### 7.3 create_inventory_recepcion_detalles_table
**Ruta:** app/Modules/Inventory/Migrations/2026_06_20_100002_create_inventory_recepcion_detalles_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_recepcion_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recepcion_id')->constrained('inventory_recepciones')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos');
            $table->decimal('cantidad', 10, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_recepcion_detalles');
    }
};
```

### 7.4 create_inventory_bodegas_table
**Ruta:** app/Modules/Inventory/Migrations/2026_06_20_100003_create_inventory_bodegas_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_bodegas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('nombre');
            $table->string('direccion')->nullable();
            $table->boolean('es_principal')->default(false);
            $table->boolean('activo')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('inventory_productos')->cascadeOnDelete();
            $table->foreignId('bodega_id')->constrained('inventory_bodegas')->cascadeOnDelete();
            $table->decimal('cantidad', 15, 4)->default(0);
            $table->timestamps();

            $table->unique(['producto_id', 'bodega_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_stocks');
        Schema::dropIfExists('inventory_bodegas');
    }
};
```

### 7.5 create_inventory_traslados_table
**Ruta:** app/Modules/Inventory/Migrations/2026_06_20_100004_create_inventory_traslados_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_traslados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('bodega_origen_id')->constrained('inventory_bodegas');
            $table->foreignId('bodega_destino_id')->constrained('inventory_bodegas');
            $table->string('numero', 50);
            $table->date('fecha');
            $table->string('estado', 20)->default('completado'); // borrador, transito, completado
            $table->text('notas')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('inventory_traslado_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('traslado_id')->constrained('inventory_traslados')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('inventory_productos');
            $table->decimal('cantidad', 10, 4);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_traslado_detalles');
        Schema::dropIfExists('inventory_traslados');
    }
};
```

### 7.6 migrate_stock_to_bodegas
**Ruta:** app/Modules/Inventory/Migrations/2026_06_20_100005_migrate_stock_to_bodegas.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $tenants = DB::table('tenants')->get();

        foreach ($tenants as $tenant) {
            $bodegaId = DB::table('inventory_bodegas')->insertGetId([
                'tenant_id' => $tenant->id,
                'nombre' => 'Bodega Principal',
                'direccion' => 'Sede Principal',
                'es_principal' => true,
                'activo' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $productos = DB::table('inventory_productos')
                ->where('tenant_id', $tenant->id)
                ->get();

            foreach ($productos as $producto) {
                DB::table('inventory_stocks')->insert([
                    'producto_id' => $producto->id,
                    'bodega_id' => $bodegaId,
                    'cantidad' => $producto->stock_actual,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Data migration — no-op to avoid destroying user data.
    }
};
```

### 7.7 add_bodega_id_to_documents
**Ruta:** app/Modules/Inventory/Migrations/2026_06_20_100006_add_bodega_id_to_documents.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable()->constrained('inventory_bodegas');
        });

        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable()->constrained('inventory_bodegas');
        });

        $defaultBodega = \Illuminate\Support\Facades\DB::table('inventory_bodegas')->where('es_principal', true)->first();
        if ($defaultBodega) {
            \Illuminate\Support\Facades\DB::table('inventory_adjustments')->update(['bodega_id' => $defaultBodega->id]);
            \Illuminate\Support\Facades\DB::table('inventory_recepciones')->update(['bodega_id' => $defaultBodega->id]);
        }

        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable(false)->change();
        });

        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->dropForeign(['bodega_id']);
            $table->dropColumn('bodega_id');
        });

        Schema::table('inventory_adjustments', function (Blueprint $table) {
            $table->dropForeign(['bodega_id']);
            $table->dropColumn('bodega_id');
        });
    }
};
```

### 7.8 add_sede_id_to_inventory_bodegas_table
**Ruta:** app/Modules/Inventory/Migrations/2026_06_20_130351_add_sede_id_to_inventory_bodegas_table.php
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
        Schema::table('inventory_bodegas', function (Blueprint $table) {
            $table->foreignId('sede_id')->nullable()->constrained('core_sedes')->nullOnDelete();
        });

        $bodegas = DB::table('inventory_bodegas')->get();
        foreach ($bodegas as $bodega) {
            $sedeId = DB::table('core_sedes')->insertGetId([
                'tenant_id' => $bodega->tenant_id,
                'nombre' => $bodega->nombre,
                'direccion' => $bodega->direccion,
                'es_principal' => $bodega->es_principal,
                'activo' => $bodega->activo,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('inventory_bodegas')
                ->where('id', $bodega->id)
                ->update(['sede_id' => $sedeId]);
        }
    }

    public function down(): void
    {
        Schema::table('inventory_bodegas', function (Blueprint $table) {
            $table->dropForeign(['sede_id']);
            $table->dropColumn('sede_id');
        });
    }
};
```

### 7.9 add_payment_fields_to_recepciones_table
**Ruta:** app/Modules/Inventory/Migrations/2026_06_25_000000_add_payment_fields_to_recepciones_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->string('metodo_pago', 20)->default('efectivo')->after('fecha');
            $table->decimal('monto_total', 15, 2)->default(0)->after('metodo_pago');
            $table->foreignId('caja_sesion_id')->nullable()->after('monto_total')->constrained('cash_caja_sesiones')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('inventory_recepciones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('caja_sesion_id');
            $table->dropColumn(['metodo_pago', 'monto_total']);
        });
    }
};
```

### 7.10 add_imagenes_to_inventory_productos_table
**Ruta:** app/Modules/Inventory/Migrations/2026_07_02_100000_add_imagenes_to_inventory_productos_table.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_productos', function (Blueprint $table) {
            $table->json('imagenes')->nullable()->after('imagen_url');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_productos', function (Blueprint $table) {
            $table->dropColumn('imagenes');
        });
    }
};
```

### 7.11 fix_bodega_principal_per_tenant
**Ruta:** app/Modules/Inventory/Migrations/2026_07_05_100000_fix_bodega_principal_per_tenant.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $tenants = DB::table('tenants')->get();

        foreach ($tenants as $tenant) {
            $bodegaPrincipal = DB::table('inventory_bodegas')
                ->where('tenant_id', $tenant->id)
                ->where('es_principal', true)
                ->first();

            if ($bodegaPrincipal) {
                DB::table('inventory_adjustments')
                    ->where('tenant_id', $tenant->id)
                    ->whereNotIn('bodega_id', function ($q) use ($tenant) {
                        $q->select('id')
                            ->from('inventory_bodegas')
                            ->where('tenant_id', $tenant->id);
                    })
                    ->update(['bodega_id' => $bodegaPrincipal->id]);

                DB::table('inventory_recepciones')
                    ->where('tenant_id', $tenant->id)
                    ->whereNotIn('bodega_id', function ($q) use ($tenant) {
                        $q->select('id')
                            ->from('inventory_bodegas')
                            ->where('tenant_id', $tenant->id);
                    })
                    ->update(['bodega_id' => $bodegaPrincipal->id]);
            }
        }
    }

    public function down(): void
    {
        // No reversible - data correction only
    }
};
```

### 7.12 fix_duplicate_sedes_from_inventory
**Ruta:** app/Modules/Inventory/Migrations/2026_07_05_200000_fix_duplicate_sedes_from_inventory.php
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $bodegas = DB::table('inventory_bodegas')
            ->whereNotNull('sede_id')
            ->get();

        foreach ($bodegas as $bodega) {
            $duplicada = DB::table('core_sedes')
                ->where('tenant_id', $bodega->tenant_id)
                ->where('nombre', $bodega->nombre)
                ->where('id', '!=', $bodega->sede_id)
                ->first();

            if ($duplicada) {
                DB::table('inventory_bodegas')
                    ->where('id', $bodega->id)
                    ->update(['sede_id' => $duplicada->id]);

                DB::table('core_sedes')
                    ->where('id', $bodega->sede_id)
                    ->delete();
            }
        }
    }

    public function down(): void
    {
        // No reversible — las sedes duplicadas eliminadas no se pueden restaurar
    }
};
```

---

## 8. Frontend Pages

### 8.1 Productos/Index.jsx
**Ruta:** resources/js/Pages/Inventory/Productos/Index.jsx
```jsx
import { useState, useEffect } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Badge } from '@/Components/ui/badge'
import { 
  PackageOpen, Plus, Search, AlertTriangle, Pencil, Printer, Trash2, 
  Eye, X, ChevronLeft, ChevronRight, ImageOff 
} from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/Components/ui/alert-dialog"
import { Dialog, DialogContent } from '@/Components/ui/dialog'
import { usePermissions } from '@/Hooks/usePermissions'

const ProductThumbnail = ({ images = [], defaultImage, nombre, onClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const allImages = images && images.length > 0 ? images : (defaultImage ? [defaultImage] : [])
  useEffect(() => {
    let interval
    if (isHovered && allImages.length > 1) {
      interval = setInterval(() => setCurrentIndex((prev) => (prev + 1) % allImages.length), 1200)
    } else { setCurrentIndex(0) }
    return () => clearInterval(interval)
  }, [isHovered, allImages])
  if (allImages.length === 0) {
    return (
      <div onClick={onClick} className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border cursor-pointer hover:bg-muted/80 transition-colors shrink-0">
        <PackageOpen className="h-5 w-5 opacity-40" />
      </div>
    )
  }
  return (
    <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border bg-card cursor-pointer shrink-0 transition-all duration-200 hover:scale-105 shadow-sm"
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onClick={onClick}>
      <img src={allImages[currentIndex]} alt={nombre} className="h-full w-full object-cover transition-opacity duration-300" />
      {allImages.length > 1 && (
        <span className="absolute bottom-0.5 right-0.5 bg-black/65 text-white text-[8px] px-1 rounded font-sans scale-90">
          {currentIndex + 1}/{allImages.length}
        </span>
      )}
    </div>
  )
}

function ProductDetailModal({ product, open, onClose }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  useEffect(() => { setActiveImageIndex(0) }, [product])
  if (!product) return null
  const images = product.imagenes && product.imagenes.length > 0 ? product.imagenes : (product.imagen_url ? [product.imagen_url] : [])
  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
  const formatNumber = (val) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val)
  const precio = parseFloat(product.precio_venta) || 0
  const costo = parseFloat(product.costo_promedio) || 0
  const margen = precio > 0 ? ((precio - costo) / precio) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border rounded-xl shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 h-[80vh] max-h-[600px]">
          {/* Columna Izquierda: Galería de imágenes */}
          <div className="md:col-span-6 bg-muted/30 flex flex-col justify-between p-6 relative border-r border-border h-full">
            {images.length > 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center relative">
                <div className="w-full aspect-video md:aspect-square max-h-[350px] relative rounded-lg overflow-hidden group border border-border shadow-sm">
                  <img src={images[activeImageIndex]} alt={product.nombre} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" />
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button onClick={() => setActiveImageIndex((prev) => (prev + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4 overflow-x-auto w-full py-1">
                    {images.map((img, idx) => (
                      <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`h-12 w-12 rounded-md overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-primary scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        <img src={img} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <ImageOff className="h-16 w-16 opacity-30 mb-2" />
                <span className="text-sm font-medium">Sin imágenes de producto</span>
              </div>
            )}
            {images.length > 0 && (
              <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-md">
                {activeImageIndex + 1} de {images.length} fotos
              </div>
            )}
          </div>
          {/* Columna Derecha: Información del producto */}
          <div className="md:col-span-6 p-6 flex flex-col justify-between overflow-y-auto h-full bg-card">
            <div>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="bg-primary/5 text-primary text-[10px] uppercase font-bold border-primary/20">{product.categoria?.nombre || 'General'}</Badge>
                  {product.marca?.nombre && <Badge variant="secondary" className="text-[10px] uppercase font-bold">{product.marca.nombre}</Badge>}
                </div>
              </div>
              <h2 className="text-xl font-bold text-foreground leading-tight">{product.nombre}</h2>
              <span className="font-mono text-xs text-muted-foreground block mt-1">SKU: {product.codigo}</span>
              <div className="grid grid-cols-2 gap-4 mt-6 p-4 rounded-xl bg-muted/40 border border-border/50">
                <div><span className="text-[10px] text-muted-foreground uppercase font-semibold block">Precio Venta</span><span className="text-lg font-bold text-emerald-600 font-mono">{formatCurrency(precio)}</span></div>
                <div><span className="text-[10px] text-muted-foreground uppercase font-semibold block">Costo Promedio</span><span className="text-lg font-bold text-foreground/80 font-mono">{formatCurrency(costo)}</span></div>
                <div className="col-span-2 pt-2 border-t border-border/40 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Margen de Utilidad</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${margen > 30 ? 'bg-emerald-500/10 text-emerald-600' : margen > 15 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>{margen.toFixed(1)}%</span>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">Estado de Stock</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-foreground text-sm">{formatNumber(product.stock_actual)} {product.unidad_medida}</span>
                    {product.is_critical && <Badge variant="destructive" className="animate-pulse py-0 px-1.5 text-[9px] uppercase">Bajo</Badge>}
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${product.is_critical ? 'bg-rose-500' : parseFloat(product.stock_actual) > parseFloat(product.stock_minimo) * 2 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min((parseFloat(product.stock_actual) / Math.max(parseFloat(product.stock_minimo) * 3, 1)) * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Mínimo requerido: {formatNumber(product.stock_minimo)}</span>
                  <span>{product.is_critical ? 'Reabastecimiento urgente' : 'Nivel seguro'}</span>
                </div>
              </div>
              {product.descripcion && (
                <div className="mt-6">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block mb-1">Descripción</span>
                  <p className="text-sm text-foreground/80 leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/30">{product.descripcion}</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-border flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
              <Link href={route('inventory.productos.edit', product.id)}><Button size="sm"><Pencil className="h-4 w-4 mr-2" />Editar Producto</Button></Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductosIndex({ productos, filters, criticalCount }) {
  const { can } = usePermissions()
  const [search, setSearch] = useState(filters.search || '')
  const [itemToDelete, setItemToDelete] = useState(null)
  const [viewItem, setViewItem] = useState(null)

  const confirmDelete = () => {
    if (itemToDelete) {
      router.delete(route('inventory.productos.destroy', itemToDelete.id), { preserveScroll: true, onSuccess: () => setItemToDelete(null) })
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('inventory.productos.index'), { search }, { preserveState: true })
  }

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
  const formatNumber = (val) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val)

  const columns = [
    { header: 'SKU', accessorKey: 'codigo', cell: (row) => <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{row.codigo}</span> },
    { header: 'Producto', accessorKey: 'nombre', cell: (row) => (
      <div className="flex items-center gap-3">
        <ProductThumbnail images={row.imagenes} defaultImage={row.imagen_url} nombre={row.nombre} onClick={() => setViewItem(row)} />
        <div className="flex flex-col">
          <span className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer transition-colors" onClick={() => setViewItem(row)}>{row.nombre}</span>
          <span className="text-xs text-muted-foreground">{row.categoria?.nombre || 'Sin categoría'}</span>
        </div>
      </div>
    )},
    { header: 'Stock Actual', accessorKey: 'stock_actual', cell: (row) => (
      <div className="flex items-center gap-2">
        <span className="font-mono">{formatNumber(row.stock_actual)} {row.unidad_medida}</span>
        {row.is_critical && <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" title="Stock por debajo del mínimo" />}
      </div>
    )},
    { header: 'Precio Venta', accessorKey: 'precio_venta', cell: (row) => <span className="font-mono text-emerald-600 font-medium">{formatCurrency(row.precio_venta)}</span> },
    { header: 'Estado', accessorKey: 'is_active', cell: (row) => <Badge variant={row.is_active ? 'default' : 'secondary'} className={row.is_active ? 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' : ''}>{row.is_active ? 'Activo' : 'Inactivo'}</Badge> },
    { header: '', id: 'actions', alignEnd: true, cell: (row) => (
      <div className="flex items-center justify-end gap-2">
        {can('inventory:edit') && <Link href={route('inventory.productos.edit', row.id)}><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"><Pencil className="h-4 w-4" /></Button></Link>}
        {can('inventory:delete') && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setItemToDelete(row)}><Trash2 className="h-4 w-4" /></Button>}
      </div>
    )},
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Catálogo de Productos" />
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div><h2 className="text-2xl font-bold tracking-tight text-foreground">Catálogo de Productos</h2><p className="text-sm text-muted-foreground mt-1">Gestiona los productos, controla el stock y configura alertas de inventario mínimo.</p></div>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar por código o nombre..." className="w-full bg-card pl-9 shadow-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </form>
            <Link href={route('inventory.productos.etiquetas')}><Button variant="outline" size="sm" className="h-9 shrink-0"><Printer className="h-4 w-4 mr-2" />Etiquetas</Button></Link>
            {can('inventory:create') && <Link href={route('inventory.productos.create')}><Button size="sm" className="h-9 shrink-0"><Plus className="h-4 w-4 mr-2" />Nuevo Producto</Button></Link>}
          </div>
        </div>
        {criticalCount > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-start gap-3 shadow-sm">
            <div className="bg-rose-100 p-2 rounded-full shrink-0"><AlertTriangle className="h-5 w-5 text-rose-600" /></div>
            <div><h3 className="font-semibold text-rose-800">Atención: Tienes {criticalCount} productos con stock crítico</h3><p className="text-sm text-rose-600 mt-1">Estos productos han caído por debajo de su stock mínimo configurado. Considera hacer un pedido a tus proveedores pronto para evitar desabastecimiento.</p></div>
          </div>
        )}
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          {productos.data.length > 0 ? <DataTable columns={columns} data={productos.data} rowKey={(row) => row.id} /> : <EmptyState icon={PackageOpen} title={search ? 'No se encontraron productos' : 'El catálogo está vacío'} description={search ? 'Intenta buscar con otro SKU o término.' : 'Registra tu primer producto para comenzar a rastrear inventario y ventas.'} action={can('inventory:create') && !search ? { label: 'Crear Producto', href: route('inventory.productos.create') } : undefined} className="py-20" />}
        </Card>
      </div>
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará el producto y su historial de inventario permanentemente.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <ProductDetailModal product={viewItem} open={!!viewItem} onClose={() => setViewItem(null)} />
    </AuthenticatedLayout>
  )
}
```

### 8.2 Productos/Create.jsx
**Ruta:** resources/js/Pages/Inventory/Productos/Create.jsx
- Validación client-side con Zod (codigo, nombre, categoria_id, precio_venta)
- Upload de hasta 4 imágenes (max 5MB cada una) con preview
- Formulario de packs/empaques (nombre, unidad, factor_conversion, código barras, precio mayorista)
- Selects de categoría y marca con modales inline (CategoriaFormModal, MarcaFormModal)
- Unidades de medida agrupadas: Cantidad, Empaques, Peso, Volumen, Longitud, Servicios
- Stock inicial sincronizado en bodega principal al crear

### 8.3 Productos/Edit.jsx
**Ruta:** resources/js/Pages/Inventory/Productos/Edit.jsx
- Mismos campos que Create pero pre-llenados
- Stock actual es solo lectura (solo se modifica vía ajustes/entradas/salidas)
- Gestión de imágenes existentes + nuevas con eliminación
- Packs con sync (update existentes, crear nuevos, eliminar los no enviados)

### 8.4 Productos/PrintLabels.jsx
**Ruta:** resources/js/Pages/Inventory/Productos/PrintLabels.jsx
- Generación de etiquetas térmicas (50x25mm) con react-barcode
- Cantidad configurable por producto
- Vista previa en pantalla + layout de impresión oculto

### 8.5 Categorias/Index.jsx
**Ruta:** resources/js/Pages/Inventory/Categorias/Index.jsx
- DataTable con búsqueda, paginación
- Modal inline para crear/editar (CategoriaFormModal)
- AlertDialog para confirmar eliminación
- EmptyState con CTA

### 8.6 Categorias/CategoriaFormModal.jsx
**Ruta:** resources/js/Pages/Inventory/Categorias/CategoriaFormModal.jsx
- Modal reutilizable para crear/editar categoría
- Campos: nombre, descripción, is_active

### 8.7 Marcas/Index.jsx
**Ruta:** resources/js/Pages/Inventory/Marcas/Index.jsx
- Mismo patrón que Categorías: DataTable + Modal + AlertDialog

### 8.8 Marcas/MarcaFormModal.jsx
**Ruta:** resources/js/Pages/Inventory/Marcas/MarcaFormModal.jsx
- Modal reutilizable para crear/editar marca
- Campos: nombre, is_active

### 8.9 Bodegas/Index.jsx
**Ruta:** resources/js/Pages/Inventory/Bodegas/Index.jsx
- DataTable con Badge para principal/activo
- Botón eliminar deshabilitado para bodega principal

### 8.10 Bodegas/Create.jsx, Edit.jsx, Form.jsx
**Ruta:** resources/js/Pages/Inventory/Bodegas/{Create,Edit,Form}.jsx
- Formulario compartido (Form.jsx) con campos: sede_id (select), nombre, dirección, es_principal, activo
- Create y Edit son wrappers que pasan bodega opcional al Form

### 8.11 Ajustes/Create.jsx
**Ruta:** resources/js/Pages/Inventory/Ajustes/Create.jsx
- Formulario de movimiento de inventario (entrada/salida)
- Conversión automática de unidades basada en packs seleccionados
- Validación de stock insuficiente server-side

### 8.12 Recepciones/Index.jsx, Create.jsx, Show.tsx
**Ruta:** resources/js/Pages/Inventory/Recepciones/{Index,Create,Show.tsx}
- Index: lista de recepciones con deferred loading
- Create: formulario completo con datos de recepción, pago (efectivo/transferencia/credito), detalle de productos, notas
- Show.tsx: vista detallada con DataTable de productos recibidos

### 8.13 Traslados/Index.jsx, Create.jsx, Show.tsx
**Ruta:** resources/js/Pages/Inventory/Traslados/{Index,Create,Show.tsx}
- Index: lista con badges de estado (borrador/completado)
- Create: formulario con selección de bodegas origen/destino, agregar productos dinámicamente
- Show.tsx: vista detallada con botón "Completar Traslado" para borradores

### 8.14 Kardex/Index.jsx, Show.jsx
**Ruta:** resources/js/Pages/Inventory/Kardex/{Index,Show.jsx}
- Index: lista de productos con stock actual y enlace a kardex
- Show.jsx: resumen de stock (actual + mínimo), historial de movimientos con badges de tipo (entrada/salida/ajuste), cantidad en empaques y base, usuario responsable

---

## 9. Tests

### 9.1 ProductoTest
**Ruta:** tests/Feature/Modules/Inventory/ProductoTest.php
```php
<?php

namespace Tests\Feature\Modules\Inventory;

use App\Core\Models\Tenant;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductoTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedTenant();
    }

    private function seedTenant(): void
    {
        $this->tenant = Tenant::create(['name' => 'Test', 'slug' => uniqid('inv-'), 'email' => 'inv@test.com', 'is_active' => true]);
        app()->bind('current_tenant', fn () => $this->tenant);
        app(\Spatie\Permission\PermissionRegistrar::class)->setPermissionsTeamId($this->tenant->id);

        \DB::table('modules')->insertOrIgnore([
            'code' => 'inventory', 'name' => 'Inventario', 'class' => 'Inventory',
            'version' => '1.0.0', 'is_active_globally' => true, 'estado' => 'publicado',
        ]);

        \App\Core\Models\TenantModule::create([
            'tenant_id' => $this->tenant->id,
            'module_code' => 'inventory',
            'is_active' => true,
        ]);

        $user = \App\Models\User::factory()->create(['tenant_id' => $this->tenant->id]);

        foreach (['inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete'] as $perm) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
        $user->givePermissionTo('inventory:view', 'inventory:create', 'inventory:edit', 'inventory:delete');
        $this->actingAs($user);
    }

    public function test_store_crea_producto(): void
    {
        $this->post(route('inventory.productos.store'), [
            'codigo' => 'PROD-NEW', 'nombre' => 'Cable USB', 'unidad_medida' => 'unidad',
            'precio_venta' => 15000, 'costo_promedio' => 8000, 'stock_actual' => 50, 'stock_minimo' => 5,
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_productos', [
            'tenant_id' => $this->tenant->id, 'codigo' => 'PROD-NEW', 'nombre' => 'Cable USB',
        ]);
    }

    public function test_store_requiere_codigo_unico(): void
    {
        Producto::create([
            'tenant_id' => $this->tenant->id, 'codigo' => 'DUP-001', 'nombre' => 'Existente',
            'unidad_medida' => 'unidad', 'precio_venta' => 10000, 'costo_promedio' => 5000,
            'stock_actual' => 1, 'stock_minimo' => 1,
        ]);

        $this->post(route('inventory.productos.store'), [
            'codigo' => 'DUP-001', 'nombre' => 'Duplicado', 'unidad_medida' => 'unidad',
            'precio_venta' => 10000, 'costo_promedio' => 5000, 'stock_actual' => 1, 'stock_minimo' => 1,
        ])->assertSessionHasErrors('codigo');
    }

    public function test_update_modifica_producto(): void
    {
        $producto = Producto::create([
            'tenant_id' => $this->tenant->id, 'codigo' => 'UPD-001', 'nombre' => 'Original',
            'unidad_medida' => 'unidad', 'precio_venta' => 10000, 'costo_promedio' => 5000,
            'stock_actual' => 10, 'stock_minimo' => 1,
        ]);

        $this->put(route('inventory.productos.update', $producto->id), [
            'codigo' => 'UPD-001', 'nombre' => 'Modificado', 'unidad_medida' => 'unidad',
            'precio_venta' => 20000, 'costo_promedio' => 5000, 'stock_minimo' => 1,
        ])->assertRedirect();

        $this->assertDatabaseHas('inventory_productos', ['id' => $producto->id, 'nombre' => 'Modificado']);
    }

    public function test_delete_elimina_producto(): void
    {
        $producto = Producto::create([
            'tenant_id' => $this->tenant->id, 'codigo' => 'DEL-001', 'nombre' => 'Para borrar',
            'unidad_medida' => 'unidad', 'precio_venta' => 10000, 'costo_promedio' => 5000,
            'stock_actual' => 0, 'stock_minimo' => 0,
        ]);

        $this->delete(route('inventory.productos.destroy', $producto->id))->assertRedirect();
        $this->assertSoftDeleted('inventory_productos', ['id' => $producto->id]);
    }

    public function test_producto_store_con_imagenes(): void
    {
        Storage::fake('public');
        $archivo = UploadedFile::fake()->image('foto.jpg', 200, 200);

        $this->post(route('inventory.productos.store'), [
            'codigo' => 'IMG-001', 'nombre' => 'Con imagen', 'unidad_medida' => 'unidad',
            'precio_venta' => 15000, 'costo_promedio' => 8000, 'stock_actual' => 10, 'stock_minimo' => 1,
            'imagenes' => [$archivo],
        ])->assertRedirect();

        $producto = Producto::where('codigo', 'IMG-001')->first();
        $this->assertNotNull($producto);
        $this->assertNotEmpty($producto->imagenes);
    }
}
```

### 9.2 AjusteControllerTest
**Ruta:** tests/Feature/Modules/Inventory/AjusteControllerTest.php
- test_entrada_incrementa_stock: Verifica que entrada incrementa stock_actual y stock en bodega
- test_salida_decrementa_stock: Verifica decremento
- test_salida_rechaza_stock_insuficiente: Valida error cuando stock < cantidad solicitada
- test_ajuste_directo_setea_stock: Verifica tipo "ajuste" setea directamente
- test_ajuste_requiere_observaciones_min_5_caracteres: Valida mín. 5 caracteres en justificación
- test_factor_conversion_multipliica_cantidad: Verifica conversión (3 docenas x 12 = 36 unidades)

### 9.3 TrasladoControllerTest
**Ruta:** tests/Feature/Modules/Inventory/TrasladoControllerTest.php
- test_store_crea_traslado_borrador: Verifica creación en estado borrador sin mover stock
- test_completar_mueve_stock: Verifica decremento en origen, incremento en destino
- test_completar_rechaza_stock_insuficiente: Valida error cuando stock origen < cantidad
- test_completar_rechaza_estado_no_borrador: Solo borradores se pueden completar
- test_store_rechaza_misma_bodega_origen_destino: Valida different:bodega_origen_id

### 9.4 RecepcionIntegrationTest
**Ruta:** tests/Feature/Modules/Inventory/RecepcionIntegrationTest.php
- test_recepcion_pago_efectivo_registra_egreso_y_asiento_contable: Verifica integración con Caja (egreso) y Contabilidad (asiento 1405/110505)
- test_recepcion_credito_crea_cuenta_por_pagar_y_asiento_proveedores: Verifica creación de CuentaPorPagar y asiento 1405/2205
- test_recepcion_transferencia_bancaria_registra_asiento_bancos: Verifica asiento 1405/111005
- test_recepcion_pago_efectivo_falla_sin_caja_abierta: Valida que sin sesión de caja falla

### 9.5 CrossTenantTest
**Ruta:** tests/Feature/Modules/Inventory/CrossTenantTest.php
- test_producto_store_rechaza_categoria_de_otro_tenant: Valida aislamiento por tenant
- test_producto_store_rechaza_marca_de_otro_tenant: Valida aislamiento
- test_bodega_store_no_rechaza_sede_de_otro_tenant: **HUECO DE SEGURIDAD CONOCIDO** - Sede no tiene BelongsToTenant, Rule::in retorna todas las sedes
- test_producto_no_visible_en_otro_tenant: Valida global scope
- test_categoria_no_visible_en_otro_tenant: Valida global scope
- test_ajuste_rechaza_producto_de_otro_tenant: Valida aislamiento en ajustes
- test_traslado_rechaza_bodega_de_otro_tenant: Valida aislamiento en traslados

### 9.6 CatalogosInventarioTest
**Ruta:** tests/Feature/Modules/Inventory/CatalogosInventarioTest.php
- CRUD completo de Categorías (store, duplicado, update, destroy, aislamiento)
- CRUD completo de Marcas (store, duplicado, update, destroy, aislamiento)
- CRUD completo de Bodegas (store, validaciones, update, destroy, aislamiento)
- Verificación de aislamiento entre tenants para todas las entidades

---

## 10. Diagrama ER (Tablas)

```
tenants ──< inventory_categorias (tenant_id)
tenants ──< inventory_marcas (tenant_id)
tenants ──< inventory_productos (tenant_id)
tenants ──< inventory_product_packs (tenant_id)
tenants ──< inventory_adjustments (tenant_id)
tenants ──< inventory_bodegas (tenant_id)
tenants ──< inventory_recepciones (tenant_id)
tenants ──< inventory_traslados (tenant_id)

inventory_categorias ──< inventory_productos (categoria_id)
inventory_marcas ──< inventory_productos (marca_id)
inventory_productos ──< inventory_product_packs (producto_id)
inventory_productos ──< inventory_adjustments (producto_id)
inventory_productos ──< inventory_stocks (producto_id)
inventory_productos ──< inventory_recepcion_detalles (producto_id)
inventory_productos ──< inventory_traslado_detalles (producto_id)
inventory_product_packs ──< inventory_adjustments (pack_id)

inventory_bodegas ──< inventory_stocks (bodega_id)
inventory_bodegas ──< inventory_adjustments (bodega_id)
inventory_bodegas ──< inventory_recepciones (bodega_id)
inventory_bodegas ──< inventory_traslados (bodega_origen_id)
inventory_bodegas ──< inventory_traslados (bodega_destino_id)
core_sedes ──< inventory_bodegas (sede_id)

inventory_recepciones ──< inventory_recepcion_detalles (recepcion_id)
inventory_traslados ──< inventory_traslado_detalles (traslado_id)

inventory_adjustments >── referencia (polymorphic: referencia_type/referencia_id)
inventory_adjustments >── users (created_by)
```

---

## 11. Correcciones pendientes

1. **Hueco de seguridad en BodegaController.store/update** (CrossTenantTest): `Rule::in(Sede::pluck('id'))` retorna TODAS las sedes de todos los tenants porque `Sede` no tiene `BelongsToTenant`. Se debe scoping la query: `Sede::where('tenant_id', auth()->user()->tenant_id)->pluck('id')`.

2. **Stock no sincronizado en ProductoController.store**: Cuando se crea un producto con `stock_actual > 0`, se crea el registro Stock en bodega principal, pero el `stock_actual` del producto se guarda directamente. Si no hay bodega principal, el stock queda huérfano (existe en producto pero no en ninguna bodega).

3. **TrasladoController.store**: El estado default en la migración es `'completado'` pero el controller crea con `'borrador'`. La migración dice `->default('completado')` en `inventory_traslados.estado`, lo cual es inconsistente con la lógica de negocio (debería ser `'borrador'` por defecto).

4. **RecepcionController.store sin validación de `orden_compra_id`**: La validación usa `'required'` pero no valida que la orden pertenezca al tenant actual (solo valida que exista vía `findOrFail`).

5. **ProductoController.update no actualiza `stock_actual`**: El campo se excluye con `\Arr::except($validated, [..., 'stock_actual', ...])`, lo cual es correcto (el stock solo se modifica vía ajustes), pero la interfaz de edición muestra el campo como editable aunque el backend lo ignora.

6. **BodegaController.store no valida unicidad de nombre por tenant**: Dos bodegas con el mismo nombre pueden existir en el mismo tenant.

7. **Recepciones y Traslados usan Inertia::defer**: Los datos se cargan diferidamente, lo cual puede causar `undefined` en el primer render si el componente no maneja el estado de carga.

8. **TrasladoDetalle y RecepcionDetalle no tienen `tenant_id`**: Dependen del padre para el aislamiento, pero no tienen global scope propio (funciona correctamente porque se acceden via relación, pero queries directas podrían filtrar mal).
