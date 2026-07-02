<?php

namespace App\Core\Http\Controllers\Core;

use App\Modules\Sales\Models\Factura;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PortalClientesDashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:cliente');
    }

    public function index()
    {
        $cliente = Auth::guard('cliente')->user();

        // Métricas
        $ordenesActivas = OrdenReparacion::where('cliente_id', $cliente->id)
            ->whereNotIn('estado', ['entregado', 'anulado'])
            ->count();

        $facturasPendientes = Factura::where('cliente_id', $cliente->id)
            ->where('estado', 'pendiente')
            ->count();

        $totalPendiente = Factura::where('cliente_id', $cliente->id)
            ->where('estado', 'pendiente')
            ->sum('total');

        // Órdenes recientes
        $ordenesRecientes = OrdenReparacion::where('cliente_id', $cliente->id)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'numero_orden' => $o->numero_orden,
                'estado' => $o->estado,
                'precio_cliente' => $o->precio_cliente,
                'created_at' => $o->created_at?->format('d/m/Y'),
            ]);

        return Inertia::render('PortalClientes/Dashboard', [
            'metrics' => [
                'ordenesActivas' => $ordenesActivas,
                'facturasPendientes' => $facturasPendientes,
                'totalPendiente' => $totalPendiente,
            ],
            'ordenesRecientes' => $ordenesRecientes,
        ]);
    }

    public function ordenes()
    {
        $cliente = Auth::guard('cliente')->user();

        $ordenes = OrdenReparacion::where('cliente_id', $cliente->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($o) => [
                'id' => $o->id,
                'numero_orden' => $o->numero_orden,
                'tipo_equipo_manual' => $o->tipo_equipo_manual,
                'numero_serie' => $o->numero_serie,
                'estado' => $o->estado,
                'precio_cliente' => $o->precio_cliente,
                'created_at' => $o->created_at?->format('d/m/Y'),
                'verification_token' => $o->verification_token,
            ]);

        return Inertia::render('PortalClientes/Ordenes', [
            'ordenes' => $ordenes,
        ]);
    }

    public function ordenShow($id)
    {
        $cliente = Auth::guard('cliente')->user();

        $orden = OrdenReparacion::where('cliente_id', $cliente->id)
            ->where('id', $id)
            ->firstOrFail();

        return Inertia::render('PortalClientes/OrdenDetail', [
            'orden' => [
                'id' => $orden->id,
                'numero_orden' => $orden->numero_orden,
                'tipo_equipo_manual' => $orden->tipo_equipo_manual,
                'numero_serie' => $orden->numero_serie,
                'condicion_inicial' => $orden->condicion_inicial,
                'observaciones_equipo' => $orden->observaciones_equipo,
                'fallas_checklist' => $orden->fallas_checklist,
                'estado' => $orden->estado,
                'precio_cliente' => $orden->precio_cliente,
                'mano_obra_descripcion' => $orden->mano_obra_descripcion,
                'created_at' => $orden->created_at?->format('d/m/Y H:i'),
                'verification_token' => $orden->verification_token,
            ]
        ]);
    }

    public function facturas()
    {
        $cliente = Auth::guard('cliente')->user();

        $facturas = Factura::where('cliente_id', $cliente->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($f) => [
                'id' => $f->id,
                'numero' => $f->numero,
                'subtotal' => $f->subtotal,
                'impuestos' => $f->impuestos,
                'total' => $f->total,
                'estado' => $f->estado,
                'created_at' => $f->created_at?->format('d/m/Y'),
                'verification_token' => $f->verification_token,
            ]);

        return Inertia::render('PortalClientes/Facturas', [
            'facturas' => $facturas,
        ]);
    }
}
