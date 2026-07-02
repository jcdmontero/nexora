<?php
namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Stock;
use App\Modules\Inventory\Models\InventoryAdjustment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AjusteController extends Controller
{
    public function create()
    {
        // Cargamos los productos con sus empaques para que el Frontend sepa convertir
        $productos = Producto::where('is_active', true)
            ->with('packs')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'codigo', 'unidad_medida', 'stock_actual']);

        return Inertia::render('Modules/Inventory/Ajustes/Create', [
            'productos' => $productos,
            'bodegas' => Bodega::where('activo', true)->get(['id', 'nombre'])
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo' => 'required|in:entrada,salida,ajuste',
            'bodega_id' => 'required|exists:inventory_bodegas,id',
            'producto_id' => 'required|exists:inventory_productos,id',
            'pack_id' => 'nullable|exists:inventory_product_packs,id',
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
            // 1. Registrar el movimiento
            InventoryAdjustment::create([
                'producto_id' => $validated['producto_id'],
                'bodega_id' => $validated['bodega_id'],
                'pack_id' => $validated['pack_id'],
                'tipo' => $validated['tipo'],
                'cantidad' => $validated['cantidad'],
                'factor_conversion' => $validated['factor_conversion'],
                'cantidad_base' => $cantidadFisica,
                'observaciones' => $validated['observaciones'],
            ]);

            // 2. Afectar el stock del producto y de la bodega
            if ($validated['tipo'] === 'entrada') {
                $producto->increment('stock_actual', $cantidadFisica);
                $stockBodega->increment('cantidad', $cantidadFisica);
            } elseif ($validated['tipo'] === 'salida') {
                $producto->decrement('stock_actual', $cantidadFisica);
                $stockBodega->decrement('cantidad', $cantidadFisica);
            } else {
                // Ajuste directo (set)
                // Calculamos la diferencia para ajustar el stock_actual global correctamente
                $diferencia = $cantidadFisica - $stockBodega->cantidad;
                $producto->increment('stock_actual', $diferencia);
                $stockBodega->update(['cantidad' => $cantidadFisica]);
            }
        });

        return back()->with('success', 'Movimiento registrado correctamente.');
    }
}
