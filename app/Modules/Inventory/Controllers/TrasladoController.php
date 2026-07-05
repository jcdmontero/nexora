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

                // sync aggregate stock_actual on producto
                Producto::where('id', $item->producto_id)->update([
                    'stock_actual' => Stock::where('producto_id', $item->producto_id)->sum('cantidad'),
                ]);
            }

            $traslado->update(['estado' => 'completado']);
        });

        return back()->with('success', 'Traslado completado. Stock actualizado en ambas bodegas.');
    }
}
