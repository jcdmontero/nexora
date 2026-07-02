<?php

namespace App\Core\Http\Controllers\Core;

use App\Core\Models\Tenant;
use App\Modules\Sales\Models\Factura;
use App\Modules\ServiceDesk\Models\OrdenReparacion;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class DocumentVerificationController extends Controller
{
    public function verify(Request $request, $tipo, $token)
    {
        $documento = null;
        $items = [];
        $emisor = [];
        $cliente = null;

        if ($tipo === 'factura') {
            $documento = Factura::where('verification_token', $token)->with(['cliente', 'items'])->first();
            if ($documento) {
                $cliente = $documento->cliente;
                $items = $documento->items->map(fn($item) => [
                    'descripcion' => $item->descripcion,
                    'cantidad' => $item->cantidad,
                    'total' => $item->total,
                ]);
            }
        } elseif ($tipo === 'orden') {
            $documento = OrdenReparacion::where('verification_token', $token)->with(['cliente'])->first();
            if ($documento) {
                $cliente = $documento->cliente;
                // Para órdenes de servicio, podemos armar items basados en mano de obra o partes
                $items = [
                    [
                        'descripcion' => 'Servicio técnico: ' . ($documento->mano_obra_descripcion ?? 'Mano de obra general'),
                        'cantidad' => 1,
                        'total' => $documento->precio_cliente,
                    ]
                ];
            }
        }

        if (!$documento) {
            return view('core.verificacion', [
                'valido' => false,
                'mensaje' => 'El código de verificación no corresponde a ningún documento registrado en el sistema.',
            ]);
        }

        // Configurar tenant para consistencia
        $tenant = Tenant::find($documento->tenant_id);
        if ($tenant) {
            app()->instance('current_tenant', $tenant);
            config(['app.tenant' => $tenant]);
        }

        // Obtener datos del emisor (tenant/empresa)
        $emisor = [
            'nombre' => $tenant?->name ?? 'Empresa Registrada',
            'nit' => \App\Core\Models\Configuracion::get('nit', '—', $documento->tenant_id),
            'direccion' => \App\Core\Models\Configuracion::get('direccion', '—', $documento->tenant_id),
            'telefono' => \App\Core\Models\Configuracion::get('telefono', '—', $documento->tenant_id),
        ];

        return view('core.verificacion', [
            'valido' => true,
            'tipo' => $tipo === 'factura' ? 'Factura de Venta' : 'Orden de Servicio',
            'numero' => $tipo === 'factura' ? $documento->numero : $documento->numero_orden,
            'fecha' => $documento->created_at?->format('d/m/Y H:i'),
            'emisor' => $emisor,
            'cliente' => [
                'nombre' => $cliente?->nombre_completo ?: 'Consumidor Final',
                'documento' => $cliente?->documento ?: '—',
            ],
            'items' => $items,
            'total' => $tipo === 'factura' ? $documento->total : $documento->total_final,
            'estado' => $documento->estado,
        ]);
    }
}
