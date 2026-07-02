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

        return Inertia::render('Modules/Inventory/Kardex/Index', [
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

        return Inertia::render('Modules/Inventory/Kardex/Show', [
            'producto' => $producto,
            'movimientos' => $movimientos,
        ]);
    }
}
