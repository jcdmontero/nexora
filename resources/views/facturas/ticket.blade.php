<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura #{{ $orden->factura->numero_factura ?? $orden->id }}</title>
    <style>
        @page {
            margin: 0;
            size: 80mm 297mm;
        }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            width: 74mm; /* 80mm minus margins to prevent cutoff */
            margin: 0 auto;
            padding: 3mm;
            color: #000;
            line-height: 1.4;
            box-sizing: border-box;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .mb-1 { margin-bottom: 5px; }
        .mb-2 { margin-bottom: 10px; }
        .mt-1 { margin-top: 5px; }
        .mt-2 { margin-top: 10px; }
        .pt-1 { padding-top: 5px; }
        .d-flex { display: flex; }
        .justify-content-between { justify-content: space-between; }
        .divider {
            border-bottom: 1px dashed #000;
            margin: 8px 0;
        }
        .logo {
            max-width: 50mm;
            max-height: 25mm;
            margin: 0 auto 5px auto;
            display: block;
        }
        .header-title {
            font-size: 14px;
            font-weight: bold;
            margin: 0;
        }
        .info-empresa {
            font-size: 11px;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 3px 0;
            vertical-align: top;
        }
        .item-row td {
            border-bottom: 1px dotted #000;
        }
        .totales-table td {
            padding: 2px 0;
        }
        .total-final {
            font-size: 14px;
            font-weight: bold;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 5px 0;
            margin-top: 5px;
        }
        .footer {
            font-size: 10px;
            text-align: center;
        }
        .no-print {
            text-align: center;
            margin-top: 20px;
        }
        .btn-print {
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            background: #333;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-family: sans-serif;
        }
        @media print {
            .no-print { display: none; }
            body { padding: 0; margin: 0 auto; width: 100%; }
        }
    </style>
</head>
<body>
    <div class="text-center">
        @if(!empty($empresa['logo']))
            <img src="{{ $empresa['logo'] }}" alt="Logo" class="logo" loading="lazy">
        @endif
        <h3 class="header-title">{{ $empresa['nombre'] ?? 'ServiceManager' }}</h3>
        <div class="info-empresa">
            NIT: {{ $empresa['nit'] ?? 'N/A' }}<br>
            {{ $empresa['direccion'] ?? '' }}<br>
            Tel: {{ $empresa['telefono'] ?? '' }}<br>
            {{ $empresa['email'] ?? '' }}
        </div>
    </div>
    <div class="divider"></div>
    <div class="mb-2">
        <div class="font-bold mb-1">FACTURA DE VENTA No: {{ $orden->factura->numero_factura ?? $orden->id }}</div>
        <div>Fecha: {{ $orden->factura->created_at->format('d/m/Y H:i') }}</div>
        <div>Cliente: {{ $orden->cliente->nombre_completo ?: 'Consumidor Final' }}</div>
        @if($orden->cliente->documento)
        <div>Doc: {{ $orden->cliente->documento }}</div>
        @endif
        @if($orden->cliente->telefono)
        <div>Tel: {{ $orden->cliente->telefono }}</div>
        @endif
    </div>
    <div class="divider"></div>
    <div class="mb-2">
        <div class="font-bold mb-1">DETALLE DEL SERVICIO:</div>
        <div><strong>Equipo:</strong> {{ $orden->modelo->marca->nombre ?? '' }} {{ $orden->modelo->nombre ?? 'N/A' }}</div>
        @if($orden->diagnostico)
        <div class="mt-1"><strong>Servicio:</strong> {{ Str::limit($orden->diagnostico, 60) }}</div>
        @endif
    </div>
    @if($orden->repuestos && $orden->repuestos->count() > 0)
    <div class="divider"></div>
    <div class="mb-1 font-bold">REPUESTOS/INSUMOS:</div>
    <table class="mb-2">
        <thead>
            <tr style="border-bottom: 1px dashed #000;">
                <th class="text-left" style="width: 15%;">Cant</th>
                <th class="text-left" style="width: 50%;">Desc.</th>
                <th class="text-right" style="width: 35%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($orden->repuestos as $repuesto)
            <tr class="item-row">
                <td>{{ $repuesto->pivot->cantidad }}</td>
                <td>{{ Str::limit($repuesto->nombre, 15) }}</td>
                <td class="text-right">{{ moneyCOP($repuesto->pivot->cantidad * $repuesto->pivot->precio_unitario) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif
    <div class="divider"></div>
    @php
        $totalRepuestos = $orden->repuestos->sum(fn($r) => $r->pivot->cantidad * $r->pivot->precio_unitario);
        $subtotal = $orden->precio_cliente + $totalRepuestos;
        $incluirIva = \App\Models\Configuracion::get('incluir_iva', 'false') === 'true';
        $porcentajeIva = $incluirIva ? (float) \App\Models\Configuracion::get('porcentaje_iva', 0) : 0;
        $ivaCalculado = $incluirIva ? $subtotal * ($porcentajeIva / 100) : 0;
        $total = $subtotal + $ivaCalculado;
        $abonosTotales = $orden->abonos->where('anulado', false)->sum('monto');
        $saldoPendiente = max(0, $orden->factura->total - $abonosTotales);
    @endphp
    <table class="totales-table mb-2">
        <tr>
            <td>Servicio/Mano Obra:</td>
            <td class="text-right">{{ moneyCOP($orden->precio_cliente) }}</td>
        </tr>
        @if($totalRepuestos > 0)
        <tr>
            <td>Repuestos:</td>
            <td class="text-right">{{ moneyCOP($totalRepuestos) }}</td>
        </tr>
        @endif
        @if($orden->factura->descuento > 0)
        <tr>
            <td>Descuento:</td>
            <td class="text-right">-{{ moneyCOP($orden->factura->descuento) }}</td>
        </tr>
        @endif
        @if($incluirIva)
        <tr>
            <td>Subtotal:</td>
            <td class="text-right">{{ moneyCOP($subtotal - $orden->factura->descuento) }}</td>
        </tr>
        <tr>
            <td>IVA ({{ $porcentajeIva }}%):</td>
            <td class="text-right">{{ moneyCOP($ivaCalculado) }}</td>
        </tr>
        @endif
    </table>
    <div class="total-final d-flex justify-content-between">
        <span>TOTAL FACTURA:</span>
        <span class="text-right">{{ moneyCOP($orden->factura->total) }}</span>
    </div>
    @if($abonosTotales > 0)
    <table class="totales-table mt-1 mb-2">
        <tr>
            <td>(-) Abonos/Anticipos:</td>
            <td class="text-right font-bold">-{{ moneyCOP($abonosTotales) }}</td>
        </tr>
        <tr style="font-size: 13px;">
            <td class="font-bold pt-1">SALDO PENDIENTE:</td>
            <td class="text-right font-bold pt-1">{{ moneyCOP($saldoPendiente) }}</td>
        </tr>
    </table>
    @endif
    <div class="divider"></div>
    <div class="footer mt-2">
        <div class="font-bold mb-1">¡Gracias por su preferencia!</div>
        <div class="mb-1">Este documento es un comprobante de pago.</div>
        <div class="text-left mt-2">
            <strong>Políticas del Servicio:</strong><br>
            - Todo equipo no reparado tras diagnóstico podrá incurrir en un costo por revisión.<br>
            - El saldo pendiente debe ser cancelado al retirar el equipo.<br>
        </div>
        <div class="mt-2 font-bold">Soporte: {{ $empresa['telefono'] ?? '' }}</div>
    </div>
    <div class="no-print">
        <button onclick="window.print();" class="btn-print">🖨️ Imprimir Recibo</button>
    </div>
    <script>
        // Auto-imprimir solo si NO estamos dentro de un iframe (vista previa)
        if (window === window.top) {
            window.onload = function () {
                window.print();
            };
        }
    </script>
</body>
</html>
