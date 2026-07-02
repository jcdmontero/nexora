<?php

namespace App\Modules\Sales\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Models\CajaSesion;
use App\Modules\Crm\Models\Cliente;
use App\Modules\Inventory\Models\Producto;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Services\FacturaService;
use App\Modules\ServiceDesk\Models\Servicio;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index()
    {
        $tenantId = auth()->user()->tenant_id;

        // Verificar si el usuario tiene una caja abierta
        $sesionActiva = CajaSesion::with('caja')
            ->where('user_id', auth()->id())
            ->where('estado', 'abierta')
            ->first();

        $productos = Producto::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('nombre')
            ->get();

        $clientes = Cliente::where('tenant_id', $tenantId)
            ->where('activo', true)
            ->orderBy('nombres')
            ->get();

        $serviciosCatalogo = Servicio::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'precio_base']);

        return Inertia::render('Sales/Pos/Index', [
            'productos' => $productos,
            'clientes' => $clientes,
            'sesionActiva' => $sesionActiva,
            'serviciosCatalogo' => $serviciosCatalogo,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cliente_id' => 'nullable|exists:crm_clientes,id',
            'metodo_pago' => 'required|string|in:efectivo,tarjeta,transferencia,credito',
            'pagos_mixtos' => ['nullable', 'array'],
            'pagos_mixtos.*.metodo' => ['required', 'in:efectivo,tarjeta,transferencia'],
            'pagos_mixtos.*.monto' => ['required', 'numeric', 'min:0.01'],
            'items' => 'required|array|min:1',
            'items.*.tipo' => 'required|string|in:producto,servicio',
            'items.*.producto_id' => 'required_if:items.*.tipo,producto|nullable|exists:inventory_productos,id',
            'items.*.descripcion' => 'nullable|string',
            'items.*.servicio_nombre' => 'nullable|string',
            'items.*.cantidad' => 'required|numeric|min:0.01',
            'items.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        try {
            $items = array_map(fn ($item) => [
                'tipo' => $item['tipo'],
                'producto_id' => $item['producto_id'] ?? null,
                'descripcion' => $item['descripcion'] ?? '',
                'servicio_nombre' => $item['servicio_nombre'] ?? '',
                'cantidad' => $item['cantidad'],
                'precio_unitario' => $item['precio_unitario'],
            ], $validated['items']);

            $facturaService = app(FacturaService::class);
            $factura = $facturaService->crearDesdePos([
                'cliente_id' => $validated['cliente_id'] ?? null,
                'metodo_pago' => $validated['metodo_pago'],
                'pagos_mixtos' => $validated['pagos_mixtos'] ?? [],
                'items' => $items,
            ]);

            return redirect()->route('sales.facturas.show', $factura->id)
                ->with('success', 'Venta registrada exitosamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al registrar la venta: ' . $e->getMessage());
        }
    }
}
