<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Cash\Services\CajaService;
use App\Modules\Sales\Services\FacturaService;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use App\Modules\ServiceDesk\Enums\OrdenEstado;
use App\Modules\ServiceDesk\Models\Servicio;
use App\Modules\Inventory\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LiquidacionController extends Controller
{
    /**
     * Muestra la pantalla de prefactura interactiva de la orden.
     */
    public function edit(OrdenReparacion $orden)
    {
        // Una vez facturada/entregada la orden, no se vuelve a mostrar la prefactura.
        if ($orden->estado === OrdenEstado::Entregado || $orden->factura()->exists()) {
            $factura = $orden->factura;
            if ($factura) {
                return redirect()->route('sales.facturas.show', $factura->id);
            }
            return redirect()->route('service-desk.ordenes.show', $orden->id)
                ->with('info', 'Esta orden ya fue facturada.');
        }

        $orden->load(['cliente', 'tipoEquipo', 'modelo', 'servicios', 'repuestos']);
        
        $totalServicios = $orden->total_servicios;
        $totalRepuestos = $orden->total_repuestos;
        $manoDeObra = $orden->precio_cliente ?? 0;
        
        $subtotal = $orden->total_cliente;
        $abono = $orden->abono_inicial ?? 0;
        $descuento = $orden->descuento ?? 0;
        
        $totalAPagar = $subtotal - $descuento - $abono;

        $cajaService = app(CajaService::class);
        $sesion = $cajaService->getSesionAbierta(auth()->id());

        // Mapear servicios y repuestos con estructura limpia para React
        $serviciosOrden = $orden->servicios->map(fn ($s) => [
            'servicio_id' => $s->id,
            'nombre' => $s->nombre,
            'cantidad' => (float) $s->pivot->cantidad,
            'precio_aplicado' => (float) $s->pivot->precio_aplicado,
            'costo_tecnico_aplicado' => (float) $s->pivot->costo_tecnico_aplicado,
        ]);

        $repuestosOrden = $orden->repuestos->map(fn ($r) => [
            'producto_id' => $r->id,
            'nombre' => $r->nombre,
            'cantidad' => (float) $r->pivot->cantidad,
            'precio_unitario' => (float) $r->pivot->precio_unitario,
        ]);

        // Cargar catálogos
        $serviciosCatalogo = Servicio::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'precio_base', 'costo_tecnico_base']);

        $productosCatalogo = Producto::where('is_active', true)
            ->whereHas('categoria', function ($query) {
                $query->where('descripcion', 'not like', 'Computadores%');
            })
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'codigo', 'precio_venta']);

        $cliente = $orden->cliente;
        $modelo = $orden->modelo;

        return Inertia::render('ServiceDesk/Ordenes/Liquidacion', [
            'ordenData' => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'estado' => $orden->estado->value,
                'numero_serie' => $orden->numero_serie,
                'tipo_equipo_manual' => $orden->tipo_equipo_manual,
                'fallas_checklist' => $orden->fallas_checklist ?? [],
                'cliente' => $cliente ? [
                    'id' => $cliente->id,
                    'nombre_completo' => $cliente->nombre_completo,
                    'numero_documento' => $cliente->numero_documento,
                    'tipo_documento' => $cliente->tipo_documento,
                    'telefono' => $cliente->telefono,
                    'email' => $cliente->email,
                ] : null,
                'tipoEquipo' => $orden->tipoEquipo ? ['nombre' => $orden->tipoEquipo->nombre] : null,
                'modelo' => $modelo ? [
                    'nombre' => $modelo->nombre,
                    'marca' => $modelo->marca ? ['nombre' => $modelo->marca->nombre] : null,
                ] : null,
            ],
            'serviciosOrden' => $serviciosOrden,
            'repuestosOrden' => $repuestosOrden,
            'serviciosCatalogo' => $serviciosCatalogo,
            'productosCatalogo' => $productosCatalogo,
            'cajaAbierta' => $sesion ? true : false,
            'totales' => [
                'totalServicios' => $totalServicios,
                'totalRepuestos' => $totalRepuestos,
                'manoDeObra' => $manoDeObra,
                'subtotal' => $subtotal,
                'abono' => $abono,
                'descuento' => $descuento,
                'totalAPagar' => $totalAPagar,
            ]
        ]);
    }

    public function update(Request $request, OrdenReparacion $orden)
    {
        $validated = $request->validate([
            'precio_cliente' => ['nullable', 'numeric', 'min:0'],
            'descuento' => ['nullable', 'numeric', 'min:0'],
            'incluir_iva' => ['nullable', 'boolean'],
            'porcentaje_iva' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'base_apertura' => ['nullable', 'numeric', 'min:0'],
            'caja_id' => ['nullable', 'exists:cash_cajas,id'],
            'metodo_pago' => ['nullable', 'in:efectivo,tarjeta,transferencia,credito'],
            'pagos_mixtos' => ['nullable', 'array'],
            'pagos_mixtos.*.metodo' => ['required', 'in:efectivo,tarjeta,transferencia'],
            'pagos_mixtos.*.monto' => ['required', 'numeric', 'min:0.01'],
            'servicios' => ['nullable', 'array'],
            'servicios.*.servicio_id' => ['required', 'exists:sd_servicios,id'],
            'servicios.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'servicios.*.precio_aplicado' => ['required', 'numeric', 'min:0'],
            'servicios.*.costo_tecnico_aplicado' => ['nullable', 'numeric', 'min:0'],
            'repuestos' => ['nullable', 'array'],
            'repuestos.*.producto_id' => ['required', 'exists:inventory_productos,id'],
            'repuestos.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'repuestos.*.precio_unitario' => ['required', 'numeric', 'min:0'],
        ]);

        try {
            $facturaService = app(FacturaService::class);
            $factura = $facturaService->crearDesdeOrden($orden, $validated);

            return redirect()->route('sales.facturas.show', $factura)
                ->with('success', 'Factura #' . $factura->numero . ' generada correctamente. La orden fue cerrada y entregada al cliente.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
