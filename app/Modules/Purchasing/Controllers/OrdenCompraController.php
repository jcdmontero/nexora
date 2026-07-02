<?php
namespace App\Modules\Purchasing\Controllers;

use App\Modules\Purchasing\Models\OrdenCompra;
use App\Modules\Purchasing\Models\Proveedor;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class OrdenCompraController extends Controller
{
    public function index()
    {
        return Inertia::render('Purchasing/Ordenes/Index', [
            'ordenes' => Inertia::defer(fn () => OrdenCompra::with('proveedor:id,razon_social')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'numero' => $o->numero,
                    'proveedor' => $o->proveedor->razon_social ?? '—',
                    'estado' => $o->estado,
                    'fecha_emision' => $o->fecha_emision ? $o->fecha_emision->format('Y-m-d') : null,
                    'total' => $o->total,
                ])),
        ]);
    }

    public function create()
    {
        $proveedores = Proveedor::where('activo', true)->orderBy('razon_social')->get(['id', 'razon_social', 'numero_documento']);
        $productos = Producto::where('is_active', true)->orderBy('nombre')->get(['id', 'codigo', 'nombre', 'costo_promedio']);

        return Inertia::render('Purchasing/Ordenes/Create', [
            'proveedores' => $proveedores,
            'productos' => $productos,
            'numero_sugerido' => 'OC-' . date('Ymd-His'), // Numeración automática temporal
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

            // Aplicar impuestos si hay lógica (simplificado a 0 en esta versión)
            $orden->update([
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ]);
        });

        return redirect()->route('purchasing.ordenes.index')
            ->with('success', 'Orden de compra creada correctamente.');
    }

    public function show(OrdenCompra $ordene) // Resource param is usually singular form of ordenes -> ordene
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

            // Eliminar detalles viejos e insertar los nuevos (enfoque más seguro)
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
            'estado' => 'required|in:borrador,enviada,recibida,cancelada',
        ]);

        $nuevoEstado = $data['estado'];
        $estadoActual = $ordene->estado;

        // Validar transiciones válidas
        $transicionesValidas = [
            'borrador'  => ['enviada', 'cancelada'],
            'enviada'   => ['recibida', 'cancelada'],
            'recibida'  => [],
            'cancelada' => [],
        ];

        if (!in_array($nuevoEstado, $transicionesValidas[$estadoActual] ?? [])) {
            return back()->with('error', "No se puede cambiar de \"{$estadoActual}\" a \"{$nuevoEstado}\".");
        }

        $ordene->update(['estado' => $nuevoEstado]);

        return back()->with('success', "Estado actualizado a {$nuevoEstado}.");
    }

    private function validateData(Request $request, $ignoreId = null): array
    {
        $ruleUnique = 'unique:purchasing_ordenes,numero' . ($ignoreId ? ',' . $ignoreId : '');

        return $request->validate([
            'proveedor_id' => ['required', 'exists:purchasing_proveedores,id'],
            'numero' => ['required', 'string', 'max:50'], // Idealmente validado con TenantScope (en backend lo manejamos unique x tenant en bd)
            'fecha_emision' => ['required', 'date'],
            'fecha_esperada' => ['nullable', 'date'],
            'notas' => ['nullable', 'string'],
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', 'exists:inventory_productos,id'],
            'detalles.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'detalles.*.precio_unitario' => ['required', 'numeric', 'min:0'],
        ]);
    }
}
