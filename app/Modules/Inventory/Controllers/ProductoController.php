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
            // Generar etiquetas para la unidad base y todas sus presentaciones
            $items = [];
            
            // Unidad base (si tiene código)
            if ($p->codigo) {
                $items[] = [
                    'id' => $p->id . '_base',
                    'nombre' => $p->nombre,
                    'codigo' => $p->codigo,
                    'precio_venta' => $p->precio_venta,
                    'unidad_medida' => $p->unidad_medida,
                ];
            }

            // Packs (empaques)
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
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'codigo' => ['required', 'string', 'max:50', Rule::unique('inventory_productos', 'codigo')->where('tenant_id', $tenantId)->whereNull('deleted_at')],
            'nombre' => 'required|string|max:150',
            'categoria_id' => ['nullable', Rule::exists('inventory_categorias', 'id')->where('tenant_id', $tenantId)],
            'marca_id' => ['nullable', Rule::exists('inventory_marcas', 'id')->where('tenant_id', $tenantId)],
            'unidad_medida' => 'required|string|max:20',
            'precio_venta' => 'required|numeric|min:0',
            'costo_promedio' => 'required|numeric|min:0',
            'stock_actual' => 'required|numeric|min:0',
            'stock_minimo' => 'required|numeric|min:0',
            'is_active' => 'boolean',
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
        $imagenesPaths = [];
        if ($request->hasFile('imagenes')) {
            $imagenesPaths = $this->uploadImages($request->file('imagenes'), $tenantId);
        }

        \DB::transaction(function () use ($validated, $imagenesPaths, $tenantId) {
            $data = \Arr::except($validated, ['packs', 'imagenes']);
            $data['imagenes'] = $imagenesPaths;

            $producto = Producto::create($data);

            if (!empty($validated['packs'])) {
                $producto->packs()->createMany($validated['packs']);
            }

            // A-05: Sincronizar stock en bodega principal si stock_inicial > 0
            if (($validated['stock_actual'] ?? 0) > 0) {
                $bodegaPrincipal = Bodega::where('tenant_id', $tenantId)->where('es_principal', true)->first();
                if ($bodegaPrincipal) {
                    Stock::create([
                        'tenant_id' => $tenantId,
                        'producto_id' => $producto->id,
                        'bodega_id' => $bodegaPrincipal->id,
                        'cantidad' => $validated['stock_actual'],
                    ]);
                } else {
                    // Revertir stock_actual del producto si no hay bodega principal
                    $producto->update(['stock_actual' => 0]);
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
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'codigo' => ['required', 'string', 'max:50', Rule::unique('inventory_productos', 'codigo')->where('tenant_id', $tenantId)->whereNull('deleted_at')->ignore($producto->id)],
            'nombre' => 'required|string|max:150',
            'categoria_id' => ['nullable', Rule::exists('inventory_categorias', 'id')->where('tenant_id', $tenantId)],
            'marca_id' => ['nullable', Rule::exists('inventory_marcas', 'id')->where('tenant_id', $tenantId)],
            'unidad_medida' => 'required|string|max:20',
            'precio_venta' => 'required|numeric|min:0',
            'costo_promedio' => 'required|numeric|min:0',
            'stock_minimo' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'descripcion' => 'nullable|string',
            'imagenes' => 'nullable|array|max:4',
            'imagenes.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'imagenes_existentes' => 'nullable|array',
            'imagenes_existentes.*' => 'string',
            'packs' => 'nullable|array',
            'packs.*.id' => ['nullable', Rule::exists('inventory_product_packs', 'id')],
            'packs.*.nombre' => 'required|string|max:100',
            'packs.*.unidad_medida' => 'required|string|max:20',
            'packs.*.factor_conversion' => 'required|numeric|min:0.0001',
            'packs.*.codigo_barras' => 'nullable|string|max:100',
            'packs.*.precio_venta' => 'nullable|numeric|min:0',
        ]);

        $existingImages = $request->input('imagenes_existentes', []);

        // A-03: Validar cupo ANTES de subir imágenes para evitar huérfanos
        $newImageFiles = $request->file('imagenes', []);
        $availableSlots = 4 - count($existingImages);
        if (count($newImageFiles) > $availableSlots) {
            $newImageFiles = array_slice($newImageFiles, 0, $availableSlots);
        }

        $newImages = [];
        if (!empty($newImageFiles)) {
            $newImages = $this->uploadImages($newImageFiles, $tenantId);
        }

        // Merge existing and new images
        $allImages = array_merge($existingImages, $newImages);

        // Collect images to delete (will be deleted inside the transaction)
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
            
            // Eliminar los packs que no vinieron en el request
            $producto->packs()->whereNotIn('id', $packIds)->delete();

            // Eliminar imágenes obsoletas (dentro de la transacción)
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

        // Delete images
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
