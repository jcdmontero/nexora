<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10px; color: #333; padding: 10px; }
        .header { text-align: center; margin-bottom: 8px; border-bottom: 1px dashed #999; padding-bottom: 8px; }
        .header h2 { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
        .header p { font-size: 9px; color: #666; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 9px; }
        .info-row .label { color: #666; }
        .info-row .value { font-weight: bold; }
        .divider { border-top: 1px dashed #999; margin: 8px 0; }
        .amount { text-align: center; margin: 10px 0; }
        .amount .total { font-size: 18px; font-weight: bold; color: #16a34a; }
        .footer { text-align: center; margin-top: 10px; border-top: 1px dashed #999; padding-top: 8px; font-size: 8px; color: #999; }
        .estado { text-align: center; font-size: 10px; font-weight: bold; color: {{ $recibo->estado === 'anulado' ? '#dc2626' : '#16a34a' }}; }
    </style>
</head>
<body>
    <div class="header">
        <h2>RECIBO DE CAJA</h2>
        <p>{{ $empresa->razon_social ?? $empresa->nombre ?? '' }}</p>
        <p>Nit: {{ $empresa->documento ?? '' }}</p>
    </div>

    <div style="text-align: center; margin-bottom: 8px;">
        <strong style="font-size: 12px;">{{ $recibo->numero_formateado }}</strong>
    </div>

    <div class="info-row">
        <span class="label">Fecha:</span>
        <span class="value">{{ $recibo->fecha->format('d/m/Y H:i') }}</span>
    </div>
    <div class="info-row">
        <span class="label">Cajero:</span>
        <span class="value">{{ $recibo->usuario?->name }}</span>
    </div>
    <div class="info-row">
        <span class="label">Caja:</span>
        <span class="value">{{ $recibo->sesion?->caja?->nombre }}</span>
    </div>

    <div class="divider"></div>

    @if($recibo->cliente)
    <div class="info-row">
        <span class="label">Cliente:</span>
        <span class="value">{{ $recibo->cliente->nombre_completo }}</span>
    </div>
    <div class="info-row">
        <span class="label">Documento:</span>
        <span class="value">{{ $recibo->cliente->documento }}</span>
    </div>
    @endif

    @if($recibo->referencia)
    <div class="info-row">
        <span class="label">Orden:</span>
        <span class="value">{{ $recibo->referencia->numero_orden ?? $recibo->referencia->numero }}</span>
    </div>
    @endif

    <div class="info-row">
        <span class="label">Concepto:</span>
        <span class="value">{{ $recibo->concepto }}</span>
    </div>
    <div class="info-row">
        <span class="label">Método de pago:</span>
        <span class="value">{{ ucfirst($recibo->metodo_pago) }}</span>
    </div>

    <div class="divider"></div>

    <div class="amount">
        <div class="total">$ {{ number_format($recibo->monto, 0, ',', '.') }}</div>
    </div>

    <div class="estado">
        {{ strtoupper($recibo->estado) }}
    </div>

    @if($recibo->notas)
    <div style="margin-top: 8px; font-size: 8px; color: #666;">
        Notas: {{ $recibo->notas }}
    </div>
    @endif

    <div class="footer">
        <p>Gracias por su preferencia</p>
        <p>{{ $recibo->numero_formateado }} — {{ $recibo->fecha->format('d/m/Y H:i') }}</p>
    </div>
</body>
</html>
