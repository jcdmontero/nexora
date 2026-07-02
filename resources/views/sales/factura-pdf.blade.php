@php
    /* ───────── Formato (COP) ───────── */
    $money = fn ($v) => '$ ' . number_format((float) $v, 0, ',', '.');
    $qty   = fn ($v) => rtrim(rtrim(number_format((float) $v, 2, ',', '.'), '0'), ',');

    $items     = $factura->items ?? collect();
    $subtotal  = (float) $factura->subtotal;
    $descuento = (float) $factura->descuento;
    $impuestos = (float) $factura->impuestos;
    $total     = (float) $factura->total;
    $conIva    = $impuestos > 0;

    $estadoMap = [
        'pagada'    => ['Pagada', '#047857', '#ecfdf5', '#a7f3d0'],
        'pendiente' => ['Pendiente (Crédito)', '#b45309', '#fff7ed', '#fed7aa'],
        'credito'   => ['Crédito', '#b45309', '#fff7ed', '#fed7aa'],
        'anulada'   => ['Anulada', '#b91c1c', '#fef2f2', '#fecaca'],
    ];
    $est = $estadoMap[$factura->estado] ?? [ucfirst((string) $factura->estado), '#334155', '#f1f5f9', '#e2e8f0'];

    $logoPath = $empresa['logo'] ?? '';
    $hasLogo  = $logoPath && @file_exists($logoPath);

    $cli = $factura->cliente;
@endphp
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
    @page { size: letter; margin: 12mm 12mm 14mm 12mm; }
    * { box-sizing: border-box; }
    body { font-family: "DejaVu Sans", sans-serif; color: #1f2937; font-size: 10.5px; margin: 0; line-height: 1.45; }

    .muted { color: #6b7280; }
    .text-end { text-align: right; }
    .text-center { text-align: center; }
    .upper { text-transform: uppercase; letter-spacing: .5px; }

    .head { width: 100%; background: #0f172a; color: #fff; border-radius: 10px; padding: 16px 20px; }
    .head td { vertical-align: top; }
    .brand-logo { max-height: 52px; margin-bottom: 6px; }
    .brand-name { font-size: 19px; font-weight: bold; color: #fff; margin: 0 0 2px; letter-spacing: .3px; }
    .brand-meta { font-size: 9.5px; color: #cbd5e1; line-height: 1.6; }

    .doc-box { text-align: right; }
    .doc-title { font-size: 15px; font-weight: bold; color: #e9c46a; margin: 0 0 8px; letter-spacing: 1px; }
    .doc-pill { display: inline-block; background: rgba(255,255,255,0.10); border: 1px solid rgba(233,196,106,0.45); border-radius: 7px; padding: 8px 12px; color: #fff; font-size: 9.5px; line-height: 1.7; text-align: left; }
    .doc-pill .num { font-size: 13px; font-weight: bold; color: #e9c46a; }

    .badge { display: inline-block; font-size: 8.5px; font-weight: bold; padding: 2px 9px; border-radius: 20px; }

    .cards { width: 100%; margin-top: 14px; border-collapse: separate; border-spacing: 0; }
    .card { border: 1px solid #e5e7eb; border-top: 3px solid #0f172a; border-radius: 8px; padding: 10px 12px; background: #fff; }
    .card-label { font-size: 8.5px; font-weight: bold; color: #b88a2a; margin-bottom: 5px; }
    .card strong { color: #0f172a; font-size: 11.5px; }
    .card .line { color: #374151; }

    .items { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .items thead th { background: #0f172a; color: #fff; font-size: 8.8px; font-weight: bold; padding: 8px 10px; text-align: left; }
    .items thead th.num { text-align: right; }
    .items tbody td { padding: 7px 10px; border-bottom: 1px solid #eef0f3; vertical-align: top; }
    .items tbody tr:nth-child(even) { background: #f9fafb; }
    .items .desc strong { color: #111827; }
    .items .desc .sub { color: #9ca3af; font-size: 8.8px; }

    .bottom { width: 100%; margin-top: 16px; }
    .bottom td { vertical-align: top; }
    .notes { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; background: #f9fafb; font-size: 9px; color: #4b5563; }
    .notes .h { font-weight: bold; color: #0f172a; margin-bottom: 4px; font-size: 9px; }

    .totals { width: 100%; border-collapse: collapse; }
    .totals td { padding: 6px 10px; font-size: 10.5px; }
    .totals .lbl { color: #6b7280; }
    .totals .val { text-align: right; color: #111827; font-weight: bold; }
    .total-row td { background: #0f172a; color: #fff; font-size: 13px; font-weight: bold; border-radius: 6px; }

    .sign { width: 100%; margin-top: 26px; }
    .sign td { width: 50%; padding: 0 18px; }
    .sign-line { border-top: 1px solid #9ca3af; padding-top: 4px; text-align: center; font-size: 9px; color: #6b7280; }

    .foot { margin-top: 18px; border-top: 2px solid #e9c46a; padding-top: 8px; text-align: center; font-size: 8.6px; color: #9ca3af; }
    .foot strong { color: #0f172a; }
    .cufe { font-family: "DejaVu Sans Mono", monospace; font-size: 7.5px; word-break: break-all; color: #6b7280; }
</style>
</head>
<body>

{{-- ════════ ENCABEZADO ════════ --}}
<table class="head">
    <tr>
        <td width="58%">
            @if($hasLogo)
                <img src="{{ $logoPath }}" class="brand-logo">
            @endif
            <div class="brand-name">{{ $empresa['nombre'] }}</div>
            <div class="brand-meta">
                @if($empresa['nit'])NIT: {{ $empresa['nit'] }}<br>@endif
                @if($empresa['direccion']){{ $empresa['direccion'] }}<br>@endif
                @if($empresa['telefono'])Tel: {{ $empresa['telefono'] }}@endif
                @if($empresa['email']) &nbsp;·&nbsp; {{ $empresa['email'] }}@endif
            </div>
        </td>
        <td width="42%" class="doc-box">
            <div class="doc-title">FACTURA DE VENTA</div>
            <div class="doc-pill">
                <span class="num">{{ $factura->numero }}</span><br>
                Fecha: {{ $factura->created_at?->format('d/m/Y H:i') }}<br>
                @if($factura->metodo_pago)Pago: {{ ucfirst($factura->metodo_pago) }}<br>@endif
                <span class="badge" style="background: {{ $est[2] }}; color: {{ $est[1] }}; border: 1px solid {{ $est[3] }};">{{ $est[0] }}</span>
            </div>
        </td>
    </tr>
</table>

{{-- ════════ CLIENTE / VENDEDOR ════════ --}}
<table class="cards">
    <tr>
        <td width="62%">
            <div class="card">
                <div class="card-label upper">Facturar a</div>
                <strong>{{ $cli?->nombre_completo ?: 'Consumidor Final' }}</strong>
                @if($cli?->documento)<div class="line">{{ $cli->documento }}</div>@endif
                @if($cli?->telefono)<div class="line">{{ $cli->telefono }}</div>@endif
                @if($cli?->direccion)<div class="line">{{ $cli->direccion }}</div>@endif
                @if($cli?->email)<div class="line muted">{{ $cli->email }}</div>@endif
            </div>
        </td>
        <td width="2%"></td>
        <td width="36%">
            <div class="card">
                <div class="card-label upper">Detalles</div>
                <div class="line">Vendedor: <strong style="font-size:10.5px;">{{ $factura->vendedor?->name ?? '—' }}</strong></div>
                <div class="line">Documento: {{ ucfirst($factura->tipo_documento ?? 'factura') }}</div>
                @if($factura->dian_estado && $factura->dian_estado === 'aceptado')
                    <div class="line muted">DIAN: Aceptado</div>
                @endif
            </div>
        </td>
    </tr>
</table>

{{-- ════════ DETALLE ════════ --}}
<table class="items">
    <thead>
        <tr>
            <th width="{{ $conIva ? '42%' : '50%' }}">Descripción</th>
            <th width="9%" class="num">Cant.</th>
            <th width="17%" class="num">V. Unitario</th>
            @if($conIva)<th width="13%" class="num">IVA</th>@endif
            <th width="{{ $conIva ? '19%' : '24%' }}" class="num">Importe</th>
        </tr>
    </thead>
    <tbody>
        @forelse($items as $item)
        <tr>
            <td class="desc">
                <strong>{{ $item->descripcion }}</strong>
                @if($item->producto?->codigo)<span class="sub"> · {{ $item->producto->codigo }}</span>@endif
            </td>
            <td class="text-end">{{ $qty($item->cantidad) }}</td>
            <td class="text-end">{{ $money($item->precio_unitario) }}</td>
            @if($conIva)
                <td class="text-end">{{ (float) $item->tasa_impuesto > 0 ? $qty($item->tasa_impuesto) . '%' : '—' }}</td>
            @endif
            <td class="text-end">{{ $money($item->subtotal) }}</td>
        </tr>
        @empty
        <tr><td colspan="{{ $conIva ? 5 : 4 }}" class="text-center muted" style="padding:14px;">Sin items facturados</td></tr>
        @endforelse
    </tbody>
</table>

{{-- ════════ TOTALES + NOTAS ════════ --}}
<table class="bottom">
    <tr>
        <td width="52%" style="padding-right:14px;">
            <div class="notes">
                <table style="width: 100%; border-collapse: collapse; border: none; background: transparent; margin: 0; padding: 0;">
                    <tr style="background: transparent;">
                        <td style="vertical-align: top; padding: 0; border: none; background: transparent;">
                            <div class="h">Información</div>
                            Este documento es un comprobante válido de su compra.<br>
                            Conserve esta factura para cualquier reclamación o garantía.
                            @if($factura->notas)
                                <div class="h" style="margin-top:8px;">Notas</div>
                                {{ $factura->notas }}
                            @endif
                            @if($factura->cufe)
                                <div class="h" style="margin-top:8px;">CUFE</div>
                                <span class="cufe">{{ $factura->cufe }}</span>
                            @endif
                        </td>
                        @if($factura->verification_token)
                        <td style="vertical-align: top; width: 80px; text-align: right; padding: 0 0 0 10px; border: none; background: transparent;">
                            <img src="https://chart.googleapis.com/chart?cht=qr&chs=80x80&chl={{ urlencode(route('document.verify', ['tipo' => 'factura', 'token' => $factura->verification_token])) }}" style="width: 80px; height: 80px; display: inline-block;">
                            <div style="font-size: 6.5px; color: #6b7280; text-align: center; margin-top: 2px; font-weight: bold; font-family: sans-serif; letter-spacing: 0.5px;">VERIFICACIÓN QR</div>
                        </td>
                        @endif
                    </tr>
                </table>
            </div>
        </td>
        <td width="48%">
            <table class="totals">
                <tr>
                    <td class="lbl">Subtotal</td>
                    <td class="val">{{ $money($subtotal) }}</td>
                </tr>
                @if($descuento > 0)
                <tr>
                    <td class="lbl">Descuento</td>
                    <td class="val">- {{ $money($descuento) }}</td>
                </tr>
                @endif
                @if($conIva)
                <tr>
                    <td class="lbl">IVA</td>
                    <td class="val">{{ $money($impuestos) }}</td>
                </tr>
                @endif
                <tr class="total-row">
                    <td class="upper">Total</td>
                    <td class="text-end">{{ $money($total) }}</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

{{-- ════════ FIRMAS ════════ --}}
<table class="sign">
    <tr>
        <td><div class="sign-line">Recibí a satisfacción</div></td>
        <td><div class="sign-line">{{ $empresa['nombre'] }}</div></td>
    </tr>
</table>

{{-- ════════ FOOTER ════════ --}}
<div class="foot">
    <strong>{{ $empresa['nombre'] }}</strong>
    @if($empresa['nit']) &nbsp;·&nbsp; NIT {{ $empresa['nit'] }}@endif
    @if($empresa['telefono']) &nbsp;·&nbsp; {{ $empresa['telefono'] }}@endif
    <br>Gracias por su compra.
</div>

</body>
</html>
