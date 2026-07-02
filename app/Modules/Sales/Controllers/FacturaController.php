<?php

namespace App\Modules\Sales\Controllers;

use App\Core\Models\Configuracion;
use App\Http\Controllers\Controller;
use App\Modules\Sales\Models\Factura;
use App\Modules\Sales\Services\ElectronicBilling\DianService;
use App\Modules\Sales\Services\FacturaService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FacturaController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        
        $search = $request->input('search');
        $like = \Illuminate\Support\Facades\DB::connection()->getDriverName() === 'sqlite' ? 'like' : 'ilike';

        $facturas = Factura::with(['cliente', 'vendedor'])
            ->where('tenant_id', $tenantId)
            ->when($search, function ($query, $search) use ($like) {
                $query->where('numero', $like, "%{$search}%")
                      ->orWhereHas('cliente', function($q) use ($search, $like) {
                          $q->where('nombres', $like, "%{$search}%")
                            ->orWhere('apellidos', $like, "%{$search}%")
                            ->orWhere('razon_social', $like, "%{$search}%");
                      });
            })
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Facturas/Index', [
            'facturas' => $facturas,
            'filters' => $request->only(['search']),
        ]);
    }

    public function show(Factura $factura)
    {
        if ($factura->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $factura->load([
            'cliente', 'vendedor', 'items.producto', 'tenant', 'orden',
            'asientos' => fn ($q) => $q->with(['lineas' => fn ($lq) => $lq->with('cuenta')]),
        ]);

        // Desglose para mostrar en el frontend como la prefactura
        $abono = (float) ($factura->orden?->abono_inicial ?? 0);
        $manoDeObraTotal = $factura->items
            ->filter(fn ($i) => str_contains($i->descripcion, 'Mano de Obra'))
            ->sum(fn ($i) => (float) $i->subtotal);
        $serviciosTotal = $factura->items
            ->filter(fn ($i) => !$i->producto_id && !str_contains($i->descripcion, 'Mano de Obra'))
            ->sum(fn ($i) => (float) $i->subtotal);
        $repuestosTotal = $factura->items
            ->filter(fn ($i) => $i->producto_id)
            ->sum(fn ($i) => (float) $i->subtotal);
        $porcentajeIva = (float) ($factura->items->first()?->tasa_impuesto ?? 0);

        return Inertia::render('Sales/Facturas/Show', [
            'factura' => $factura,
            'desglose' => [
                'manoDeObra' => $manoDeObraTotal,
                'servicios' => $serviciosTotal,
                'repuestos' => $repuestosTotal,
                'subtotal' => (float) $factura->subtotal,
                'descuento' => (float) $factura->descuento,
                'abono' => $abono,
                'iva' => (float) $factura->impuestos,
                'porcentajeIva' => $porcentajeIva,
                'total' => (float) $factura->total,
            ],
        ]);
    }

    public function pdf(Request $request, Factura $factura)
    {
        if ($factura->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $factura->load(['cliente', 'vendedor', 'items.producto']);
        $empresa = $this->datosEmpresa($factura->tenant_id);

        // Modo debug: ver el HTML en el navegador
        if ($request->boolean('debug')) {
            return view('sales.factura-pdf', compact('factura', 'empresa'));
        }

        $pdf = Pdf::loadView('sales.factura-pdf', compact('factura', 'empresa'))
            ->setPaper('letter', 'portrait');

        return $pdf->stream("Factura_{$factura->numero}.pdf");
    }

    private function datosEmpresa(int $tenantId): array
    {
        $tenant = \App\Core\Models\Tenant::find($tenantId);

        return [
            'nombre' => Configuracion::get('nombre_empresa', $tenant?->name ?? 'Mi Empresa', $tenantId),
            'nit' => Configuracion::get('nit', '', $tenantId),
            'direccion' => Configuracion::get('direccion', '', $tenantId),
            'telefono' => Configuracion::get('telefono', '', $tenantId),
            'email' => Configuracion::get('email_empresa', $tenant?->email ?? '', $tenantId),
            'logo' => Configuracion::get('logo_url', '', $tenantId),
        ];
    }

    public function emitir(Factura $factura, DianService $dianService)
    {
        if ($factura->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        try {
            $empresa = $this->datosEmpresa($factura->tenant_id);

            // Map empresa data to DIAN expected keys
            $empresaDian = [
                'nit' => $empresa['nit'],
                'razon_social' => $empresa['nombre'],
                'direccion' => $empresa['direccion'],
                'ciudad_codigo' => Configuracion::get('dian_ciudad_codigo', '11001', $factura->tenant_id),
                'pais' => 'CO',
            ];

            $dianService->emitirFactura($factura, $empresaDian);
            return back()->with('success', 'Factura enviada a la DIAN correctamente.');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al emitir a DIAN: ' . $e->getMessage());
        }
    }

    public function anular(Request $request, Factura $factura, FacturaService $facturaService)
    {
        if ($factura->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'motivo' => 'required|string|min:5|max:500',
        ]);

        try {
            $facturaService->anular($factura, $request->input('motivo'));
            return redirect()->route('sales.facturas.show', $factura)
                ->with('success', "Factura {$factura->numero} anulada correctamente. Stock, caja y contabilidad reversados.");
        } catch (\Exception $e) {
            return back()->with('error', 'Error al anular la factura: ' . $e->getMessage());
        }
    }
}
