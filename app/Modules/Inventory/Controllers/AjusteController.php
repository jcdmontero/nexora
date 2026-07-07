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
        // Cargamos los productos con sus empaques para que el Frontend sepa convertir
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
        $tenantId = auth()->user()->tenant_id;

        $validated = $request->validate([
            'tipo' => 'required|in:entrada,salida,ajuste',
            'bodega_id' => ['required', Rule::exists('inventory_bodegas', 'id')->where('tenant_id', $tenantId)],
            'producto_id' => ['required', Rule::exists('inventory_productos', 'id')->where('tenant_id', $tenantId)],
            'pack_id' => ['nullable', Rule::exists('inventory_product_packs', 'id')],
            'cantidad' => 'required|numeric|min:0.0001',
            'factor_conversion' => 'required|numeric|min:0.0001',
            'observaciones' => 'required|string|min:5|max:500',
        ], [
            'observaciones.required' => 'Debes ingresar una justificación para este movimiento.',
            'observaciones.min' => 'La justificación es muy corta (mínimo 5 caracteres).'
        ]);

        $producto = Producto::findOrFail($validated['producto_id']);

        // C-03: Validar factor_conversion server-side si se proporciona pack_id
        if (!empty($validated['pack_id'])) {
            $pack = ProductPack::where('id', $validated['pack_id'])
                ->where('producto_id', $producto->id)
                ->first();
            if (!$pack) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'pack_id' => 'El empaque seleccionado no pertenece a este producto.',
                ]);
            }
            $factorConversion = (float) $pack->factor_conversion;
        } else {
            // Sin pack: usar el factor ingresado por el usuario (unidad base)
            $factorConversion = (float) $validated['factor_conversion'];
        }

        $cantidadFisica = $validated['cantidad'] * $factorConversion;

        DB::transaction(function () use ($validated, $cantidadFisica, $factorConversion, $producto) {
            // C-01: Bloqueo pesimista sobre la fila de stock para evitar race conditions
            $stockBodega = Stock::where('producto_id', $producto->id)
                ->where('bodega_id', $validated['bodega_id'])
                ->lockForUpdate()
                ->first();

            if (!$stockBodega) {
                $stockBodega = Stock::create([
                    'producto_id' => $producto->id,
                    'bodega_id' => $validated['bodega_id'],
                    'cantidad' => 0,
                ]);
            }

            if ($validated['tipo'] === 'salida' && $stockBodega->cantidad < $cantidadFisica) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'cantidad' => "La cantidad total a retirar ({$cantidadFisica} {$producto->unidad_medida}) supera el stock disponible en esta bodega ({$stockBodega->cantidad} {$producto->unidad_medida}).",
                ]);
            }

            // 1. Registrar el movimiento
            InventoryAdjustment::create([
                'producto_id' => $validated['producto_id'],
                'bodega_id' => $validated['bodega_id'],
                'pack_id' => $validated['pack_id'] ?? null,
                'tipo' => $validated['tipo'],
                'cantidad' => $validated['cantidad'],
                'factor_conversion' => $factorConversion,
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
                $diferencia = $cantidadFisica - $stockBodega->cantidad;
                $producto->increment('stock_actual', $diferencia);
                $stockBodega->update(['cantidad' => $cantidadFisica]);
            }
        });

        return back()->with('success', 'Movimiento registrado correctamente.');
    }
}
