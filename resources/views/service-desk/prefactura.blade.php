<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $orden->estado->value === 'entregado' ? 'Factura' : 'Prefactura' }} {{ $orden->numero_orden }}</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .header h1 { margin: 0; color: #2c3e50; }
        .details { margin-bottom: 20px; }
        .details table { width: 100%; }
        .details td { padding: 5px; }
        .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items th, .items td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        .items th { background-color: #f8f9fa; }
        .totals { width: 100%; border-collapse: collapse; }
        .totals td { padding: 8px; text-align: right; }
        .totals .bold { font-weight: bold; }
        .totals .total-row { font-size: 16px; color: #2c3e50; border-top: 2px solid #2c3e50; }
    </style>
</head>
<body>

    <div class="header">
        <h1>{{ $orden->estado->value === 'entregado' ? 'FACTURA' : 'PREFACTURA' }}</h1>
        <p>Orden de Servicio: <strong>{{ $orden->numero_orden }}</strong></p>
        <p>Fecha: {{ date('d/m/Y') }}</p>
    </div>

    <div class="details">
        <table>
            <tr>
                <td><strong>Cliente:</strong> {{ $cliente->nombre_completo ?? $cliente->razon_social ?? 'N/A' }}</td>
                <td><strong>Equipo:</strong> {{ $equipo ?? 'N/A' }}{{ $marca ? ' — ' . $marca : '' }}{{ $modelo ? ' ' . $modelo : '' }}</td>
            </tr>
            <tr>
                <td><strong>Documento:</strong> {{ $cliente->documento ?? 'N/A' }}</td>
                <td><strong>N° Serie:</strong> {{ $orden->numero_serie ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td><strong>Falla:</strong> {{ implode(', ', $orden->fallas_checklist ?? []) ?: 'N/A' }}</td>
                <td></td>
            </tr>
        </table>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Descripción</th>
                <th>Cant.</th>
                <th>Precio Unit.</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @if($manoDeObra > 0)
            <tr>
                <td>Mano de Obra / Diagnóstico</td>
                <td>1</td>
                <td>${{ number_format($manoDeObra, 2) }}</td>
                <td>${{ number_format($manoDeObra, 2) }}</td>
            </tr>
            @endif

            @foreach($servicios as $servicio)
            <tr>
                <td>{{ $servicio['nombre'] }}</td>
                <td>{{ $servicio['cantidad'] }}</td>
                <td>${{ number_format($servicio['precio_unitario'], 2) }}</td>
                <td>${{ number_format($servicio['total'], 2) }}</td>
            </tr>
            @endforeach

            @foreach($repuestos as $repuesto)
            <tr>
                <td>{{ $repuesto['nombre'] }}</td>
                <td>{{ $repuesto['cantidad'] }}</td>
                <td>${{ number_format($repuesto['precio_unitario'], 2) }}</td>
                <td>${{ number_format($repuesto['total'], 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <td colspan="3">Subtotal</td>
            <td>${{ number_format($subtotal, 2) }}</td>
        </tr>
        <tr>
            <td colspan="3">Abono Inicial</td>
            <td>-${{ number_format($abono, 2) }}</td>
        </tr>
        @if($descuento > 0)
        <tr>
            <td colspan="3" class="bold">Descuento Aplicado</td>
            <td class="bold" style="color: #e74c3c;">-${{ number_format($descuento, 2) }}</td>
        </tr>
        @endif
        @if(!empty($incluirIva) && $incluirIva)
        <tr>
            <td colspan="3">IVA ({{ $porcentajeIva }}%)</td>
            <td>${{ number_format($iva, 2) }}</td>
        </tr>
        @endif
        <tr class="total-row">
            <td colspan="3" class="bold">Total a Pagar</td>
            <td class="bold">${{ number_format($totalAPagar, 2) }}</td>
        </tr>
    </table>

    <div style="margin-top: 50px; border-top: 1px solid #ddd; padding-top: 15px;">
        <table style="width: 100%; border-collapse: collapse; border: none; background: transparent; margin: 0; padding: 0;">
            <tr style="border: none; background: transparent;">
                @if($orden->verification_token)
                <td style="vertical-align: middle; width: 80px; text-align: left; border: none; padding: 0; background: transparent;">
                    <img src="https://chart.googleapis.com/chart?cht=qr&chs=80x80&chl={{ urlencode(route('document.verify', ['tipo' => 'orden', 'token' => $orden->verification_token])) }}" style="width: 80px; height: 80px; display: inline-block;">
                </td>
                @endif
                <td style="vertical-align: middle; text-align: left; font-size: 11px; color: #666; border: none; padding: 0 0 0 15px; background: transparent; line-height: 1.4;">
                    <strong>VERIFICACIÓN DE AUTENTICIDAD:</strong><br>
                    Escanee este código QR con su dispositivo para validar la originalidad y el estado en tiempo real de esta orden de servicio en la plataforma Nexora. Este documento es {{ $orden->estado->value === 'entregado' ? 'una factura de venta' : 'una prefactura informativa y no constituye un documento equivalente a factura de venta' }}.
                </td>
            </tr>
        </table>
    </div>

</body>
</html>
