<?php
namespace App\Modules\Inventory\Controllers;

use App\Modules\Inventory\Models\Bodega;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Inventory\Models\Stock;
use App\Modules\Inventory\Models\Traslado;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
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
                ->get()
                ->map(fn ($t) => [
                    'id' => $t->id,
                    'numero' => $t->numero,
                    'origen' => $t->origen->nombre,
                    'destino' => $t->destino->nombre,
                    'fecha' => $t->fecha->format('Y-m-d'),
                    'estado' => $t->estado,
                ])),
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
            'bodega_origen_id' => ['required', 'exists:inventory_bodegas,id'],
            'bodega_destino_id' => ['required', 'exists:inventory_bodegas,id', 'different:bodega_origen_id'],
            'notas' => ['nullable', 'string'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', 'exists:inventory_productos,id'],
            'detalles.*.cantidad' => ['required', 'numeric', 'min:0.01'],
        ]);

        DB::transaction(function () use ($data) {
            $traslado = Traslado::create([
                'numero' => $data['numero'],
                'fecha' => $data['fecha'],
                'bodega_origen_id' => $data['bodega_origen_id'],
                'bodega_destino_id' => $data['bodega_destino_id'],
                'estado' => 'completado', // Auto-completado por simplicidad
                'notas' => $data['notas'] ?? null,
            ]);

            foreach ($data['detalles'] as $item) {
                // Verificar stock en origen
                $stockOrigen = Stock::firstOrCreate([
                    'producto_id' => $item['producto_id'],
                    'bodega_id' => $data['bodega_origen_id']
                ]);

                if ($stockOrigen->cantidad < $item['cantidad']) {
                    $producto = Producto::find($item['producto_id']);
                    throw ValidationException::withMessages([
                        'detalles' => "Stock insuficiente en bodega origen para el producto {$producto->nombre}. Disponible: {$stockOrigen->cantidad}",
                    ]);
                }

                // Guardar detalle
                $traslado->detalles()->create([
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $item['cantidad'],
                ]);

                // Descontar de origen
                $stockOrigen->decrement('cantidad', $item['cantidad']);

                // Sumar a destino
                $stockDestino = Stock::firstOrCreate([
                    'producto_id' => $item['producto_id'],
                    'bodega_id' => $data['bodega_destino_id']
                ]);
                $stockDestino->increment('cantidad', $item['cantidad']);
                
                // NOTA: El global `stock_actual` del producto no se afecta porque la mercancía sigue en la empresa.
            }
        });

        return redirect()->route('inventory.traslados.index')
            ->with('success', 'Traslado registrado exitosamente.');
    }

    public function show(Traslado $traslado)
    {
        $traslado->load(['origen', 'destino', 'detalles.producto:id,codigo,nombre,unidad_medida']);

        return Inertia::render('Inventory/Traslados/Show', [
            'traslado' => $traslado,
        ]);
    }
}
