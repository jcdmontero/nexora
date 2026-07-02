<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Finiquito {{ $liquidacion->codigo }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9px; color: #1e293b; padding: 12px; }
        .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #1e293b; padding-bottom: 10px; }
        .header h1 { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .header h2 { font-size: 12px; font-weight: bold; margin-top: 4px; }
        .header p { font-size: 8px; color: #64748b; }
        .sello-agua { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 60px; color: rgba(0,0,0,0.04); font-weight: bold; z-index: -1; pointer-events: none; }
        .section { margin: 8px 0; }
        .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #475569;
            border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 5px; }
        .info-grid { display: flex; flex-wrap: wrap; gap: 2px 20px; font-size: 9px; }
        .info-grid .item { display: flex; min-width: 180px; }
        .info-grid .label { color: #64748b; width: 90px; }
        .info-grid .value { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 8.5px; }
        th { background: #1e293b; color: #fff; padding: 5px 6px; text-align: left; font-size: 7.5px; text-transform: uppercase; letter-spacing: 0.5px; }
        td { padding: 5px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        tr:nth-child(even) td { background: #f8fafc; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: 'Courier New', monospace; font-size: 8px; }
        .totales { margin-top: 8px; margin-left: auto; width: 280px; }
        .totales td { padding: 3px 8px; border: none; font-size: 9px; }
        .totales .total-row td { border-top: 2px solid #1e293b; font-weight: bold; font-size: 11px; color: #16a34a; }
        .firmas { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 10px; border-top: 1px dashed #cbd5e1; }
        .firma { text-align: center; width: 45%; }
        .firma .linea { border-top: 1px solid #1e293b; margin-top: 30px; padding-top: 4px; font-size: 8px; color: #64748b; }
        .footer { text-align: center; margin-top: 12px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 7px; color: #94a3b8; }
        .badge-estado { display: inline-block; padding: 2px 8px; font-size: 8px; font-weight: bold; border-radius: 10px;
            background: {{ $liquidacion->estado === 'PAGADO' ? '#16a34a' : ($liquidacion->estado === 'APROBADO' ? '#2563eb' : ($liquidacion->estado === 'BORRADOR' ? '#64748b' : '#dc2626')) }};
            color: #fff; }
        .observaciones { background: #fef9c3; border: 1px solid #facc15; border-radius: 4px; padding: 6px 8px; font-size: 8px; margin: 6px 0; }
    </style>
</head>
<body>
    <div class="sello-agua">{{ $liquidacion->codigo }}</div>

    <div class="header">
        <table style="width:100%; border:none;">
            <tr>
                <td style="border:none; vertical-align:middle;">
                    <h1 style="margin:0;">Finiquito de Comisiones</h1>
                    <h2 style="margin:4px 0 0 0;">{{ $empresa->razon_social ?? $empresa->nombre ?? '' }}</h2>
                    <p style="margin:0;">NIT: {{ $empresa->documento ?? '' }} &mdash; {{ $empresa->ciudad ?? '' }}</p>
                </td>
                <td style="border:none; text-align:right; vertical-align:middle;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data={{ route('service-desk.comisiones.verify', $liquidacion->verification_token, false) }}" 
                         style="width:60px; height:60px;" alt="QR Verificación">
                    <p style="font-size:6px; color:#94a3b8; margin-top:2px;">Verificar autenticidad</p>
                </td>
            </tr>
        </table>
    </div>

    <table style="width:100%; border:none; font-size:9px; margin-bottom:8px;">
        <tr>
            <td style="width:50%; border:none; padding:2px; vertical-align:top;">
                <div class="section-title">Prestador de Servicios</div>
                <div style="margin-top:3px;">
                    <strong style="font-size:11px;">{{ $liquidacion->prestador->nombre_completo }}</strong><br>
                    {{ $liquidacion->prestador->tipo_documento }}: {{ $liquidacion->prestador->numero_documento }}<br>
                    {{ $liquidacion->prestador->email ?? '' }}<br>
                    Tel: {{ $liquidacion->prestador->telefono ?? '' }}
                </div>
            </td>
            <td style="width:50%; border:none; padding:2px; vertical-align:top; text-align:right;">
                <div class="section-title" style="text-align:right;">Liquidación</div>
                <div style="margin-top:3px;">
                    <strong>Código:</strong> {{ $liquidacion->codigo }}<br>
                    <strong>Período:</strong> {{ $liquidacion->periodo_inicio->format('d/m/Y') }} al {{ $liquidacion->periodo_fin->format('d/m/Y') }}<br>
                    <strong>Estado:</strong> <span class="badge-estado">{{ $liquidacion->estado }}</span><br>
                    <strong>Generada:</strong> {{ $liquidacion->created_at->format('d/m/Y H:i') }}
                </div>
            </td>
        </tr>
    </table>

    <div class="section">
        <div class="section-title">Desglose de Órdenes de Trabajo</div>
        <table>
            <thead>
                <tr>
                    <th style="width:10%;">OT</th>
                    <th style="width:22%;">Cliente / Vehículo</th>
                    <th style="width:28%;">Servicio / Concepto</th>
                    <th style="width:12%;" class="text-right">Base</th>
                    <th style="width:8%;" class="text-center">%</th>
                    <th style="width:10%;" class="text-right">Tipo</th>
                    <th style="width:10%;" class="text-right">Comisión</th>
                </tr>
            </thead>
            <tbody>
                @forelse($liquidacion->detalles as $det)
                @php
                    $orden = $det->orden;
                    $tipoLabel = ['FIJO'=>'Fijo','PORCENTAJE'=>'%','LIBRE'=>'Libre'][$orden?->tipo_comision ?? ''] ?? '';
                @endphp
                <tr>
                    <td class="font-mono">{{ $orden?->numero_orden ?? '—' }}</td>
                    <td>
                        @if($orden?->cliente)
                            {{ $orden->cliente->nombre_completo }}<br>
                            <span style="font-size:7px;color:#64748b;">{{ $orden->cliente->placa ?? $orden->cliente->documento }}</span>
                        @else
                            <span style="color:#94a3b8;">—</span>
                        @endif
                    </td>
                    <td>{{ $det->concepto }}
                        @if($orden?->falla_reporte)
                        <br><span style="font-size:7px;color:#64748b;">{{ Str::limit($orden->falla_reporte, 60) }}</span>
                        @endif
                    </td>
                    <td class="text-right font-mono">${{ number_format($det->base_calculo, 0, ',', '.') }}</td>
                    <td class="text-center">{{ $det->porcentaje_comision ? number_format($det->porcentaje_comision, 1) . '%' : '—' }}</td>
                    <td class="text-right">{{ $tipoLabel }}</td>
                    <td class="text-right font-mono" style="font-weight:bold;">${{ number_format($det->valor_comision, 0, ',', '.') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="7" class="text-center" style="color:#94a3b8;padding:15px;">No hay órdenes asociadas</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <table class="totales">
        @php
            $totalDetalles = $liquidacion->detalles->sum('valor_comision');
            $totalPendiente = $liquidacion->pagos->where('estado', 'PENDIENTE')->sum('monto');
            $totalPagado = $liquidacion->pagos->where('estado', 'PAGADO')->sum('monto');
        @endphp
        <tr>
            <td style="text-align:right;width:60%;">Subtotal comisiones:</td>
            <td class="font-mono text-right" style="width:40%;">${{ number_format($totalDetalles, 0, ',', '.') }}</td>
        </tr>
        @if($totalPagado > 0)
        <tr>
            <td style="text-align:right;color:#16a34a;">Total pagado:</td>
            <td class="font-mono text-right" style="color:#16a34a;">${{ number_format($totalPagado, 0, ',', '.') }}</td>
        </tr>
        @endif
        @if($totalPendiente > 0)
        <tr>
            <td style="text-align:right;color:#d97706;">Pendiente de pago:</td>
            <td class="font-mono text-right" style="color:#d97706;">${{ number_format($totalPendiente, 0, ',', '.') }}</td>
        </tr>
        @endif
        <tr class="total-row">
            <td style="text-align:right;">Total liquidación:</td>
            <td class="font-mono text-right" style="font-size:13px;">${{ number_format($liquidacion->total_comisiones, 0, ',', '.') }}</td>
        </tr>
    </table>

    @if($liquidacion->observaciones)
    <div class="observaciones">
        <strong>Observaciones:</strong><br>
        {{ $liquidacion->observaciones }}
    </div>
    @endif

    @if($liquidacion->pagos->where('estado', 'PAGADO')->isNotEmpty())
    <div class="section" style="margin-top:8px;">
        <div class="section-title">Historial de Pagos</div>
        <table>
            <thead>
                <tr>
                    <th style="width:25%;">Fecha</th>
                    <th style="width:25%;">Método</th>
                    <th style="width:30%;">Referencia</th>
                    <th style="width:20%;" class="text-right">Monto</th>
                </tr>
            </thead>
            <tbody>
                @foreach($liquidacion->pagos->where('estado', 'PAGADO') as $pago)
                <tr>
                    <td>{{ $pago->fecha_pago ? $pago->fecha_pago->format('d/m/Y H:i') : '—' }}</td>
                    <td>{{ ucfirst($pago->metodo_pago ?? '—') }}</td>
                    <td>{{ $pago->referencia_pago ?? '—' }}</td>
                    <td class="text-right font-mono">${{ number_format($pago->monto, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="firmas">
        <div class="firma">
            <div class="linea">
                <strong>Firma del Prestador</strong><br>
                {{ $liquidacion->prestador->nombre_completo }}<br>
                {{ $liquidacion->prestador->tipo_documento }}: {{ $liquidacion->prestador->documento }}
            </div>
        </div>
        <div class="firma">
            <div class="linea">
                <strong>Firma {{ $liquidacion->estado === 'APROBADO' || $liquidacion->estado === 'PAGADO' ? 'Responsable' : '—' }}</strong><br>
                @if($liquidacion->aprobadoPor)
                    {{ $liquidacion->aprobadoPor->name }}<br>
                @endif
                @if($liquidacion->fecha_aprobacion)
                    {{ $liquidacion->fecha_aprobacion->format('d/m/Y H:i') }}
                @endif
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Documento generado electrónicamente &mdash; {{ $liquidacion->codigo }}</p>
        <p>{{ now()->format('d/m/Y H:i') }} &mdash; NEXORA &mdash; {{ config('app.url') }}</p>
    </div>
</body>
</html>
