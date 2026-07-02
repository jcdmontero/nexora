<?php

namespace App\Modules\ServiceDesk\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PrefacturaController extends Controller
{
    /**
     * Descarga la prefactura en formato PDF.
     */
    public function generar(OrdenReparacion $orden)
    {
        $orden->load(['cliente', 'tipoEquipo', 'modelo', 'servicios', 'repuestos', 'factura']);

        $totalServicios = $orden->servicios->sum(fn ($s) => $s->pivot->cantidad * $s->pivot->precio_aplicado);
        $totalRepuestos = $orden->repuestos->sum(fn ($r) => $r->pivot->cantidad * $r->pivot->precio_unitario);
        $manoDeObra = $orden->precio_cliente ?? 0;

        $subtotal = $totalServicios + $totalRepuestos + $manoDeObra;
        $abono = $orden->abono_inicial ?? 0;
        $descuento = $orden->descuento ?? 0;

        // IVA desde la factura asociada (si existe)
        $factura = $orden->factura;
        $incluirIva = $factura && (float) $factura->impuestos > 0;
        $porcentajeIva = 0;
        $iva = 0;
        if ($incluirIva) {
            $iva = (float) $factura->impuestos;
            $porcentajeIva = (float) $factura->items->first()?->tasa_impuesto ?: 0;
        }

        $totalAPagar = $subtotal - $descuento - $abono + $iva;

        $datos = [
            'orden' => $orden,
            'cliente' => $orden->cliente,
            'equipo' => $orden->tipo_equipo_manual ?? $orden->tipoEquipo?->nombre,
            'modelo' => $orden->modelo?->nombre,
            'marca' => $orden->modelo?->marca?->nombre,
            'servicios' => $orden->servicios->map(fn ($s) => [
                'nombre' => $s->nombre,
                'cantidad' => (float) $s->pivot->cantidad,
                'precio_unitario' => (float) $s->pivot->precio_aplicado,
                'total' => (float) ($s->pivot->cantidad * $s->pivot->precio_aplicado),
            ]),
            'repuestos' => $orden->repuestos->map(fn ($r) => [
                'nombre' => $r->nombre,
                'cantidad' => (float) $r->pivot->cantidad,
                'precio_unitario' => (float) $r->pivot->precio_unitario,
                'total' => (float) ($r->pivot->cantidad * $r->pivot->precio_unitario),
            ]),
            'totalServicios' => $totalServicios,
            'totalRepuestos' => $totalRepuestos,
            'manoDeObra' => $manoDeObra,
            'subtotal' => $subtotal,
            'abono' => $abono,
            'descuento' => $descuento,
            'incluirIva' => $incluirIva,
            'porcentajeIva' => $porcentajeIva,
            'iva' => $iva,
            'totalAPagar' => $totalAPagar,
            'empresa' => app()->has('current_tenant') ? app('current_tenant') : null
        ];

        // Se usa una vista en Blade para construir el PDF
        $pdf = Pdf::loadView('service-desk.prefactura', $datos);

        return $pdf->stream("prefactura-orden-{$orden->numero_orden}.pdf");
    }

    /**
     * Simula el envío por los canales seleccionados.
     */
    public function notificar(Request $request, OrdenReparacion $orden)
    {
        $request->validate([
            'canales' => 'required|array',
            'canales.*' => 'in:whatsapp,telegram,email'
        ]);

        $enviados = [];

        foreach ($request->canales as $canal) {
            // Aquí en un futuro se integrarán Twilio, Telegram Bot API y Mailer.
            // Por ahora simulamos éxito
            $enviados[] = $canal;
        }

        return back()->with('success', 'Prefactura enviada exitosamente por: ' . implode(', ', $enviados));
    }
}
