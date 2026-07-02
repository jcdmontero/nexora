@php
    /* ───────── Helpers de formato (COP) ───────── */
    $money = fn ($v) => '$ ' . number_format((float) $v, 0, ',', '.');

    /* ───────── Mano de obra / Servicios / Repuestos ───────── */
    $manoObra   = (float) $orden->precio_cliente;
    $manoObraTxt = trim($orden->mano_obra_descripcion ?? '') ?: 'Mano de obra / Servicio técnico';

    $totalServicios = $orden->servicios->sum(fn ($s) => ($s->pivot->cantidad ?? 0) * ($s->pivot->precio_aplicado ?? 0));
    $totalRepuestos = $orden->repuestos->sum(fn ($r) => ($r->pivot->cantidad ?? 0) * ($r->pivot->precio_unitario ?? 0));

    /* ───────── Totales ───────── */
    $subtotal  = $manoObra + $totalServicios + $totalRepuestos;
    $descuento = (float) ($orden->descuento ?? 0);
    $base      = max(0, $subtotal - $descuento);

    $incluirIva   = \App\Core\Models\Configuracion::get('incluir_iva', 'false') === 'true';
    $porcentajeIva = $incluirIva ? (float) \App\Core\Models\Configuracion::get('porcentaje_iva', 0) : 0;
    $iva          = $incluirIva ? $base * ($porcentajeIva / 100) : 0;

    $total = $base + $iva;
    $abono = (float) ($orden->abono_inicial ?? 0);
    $saldo = max(0, $total - $abono);

    /* ───────── Cabecera ───────── */
    $numero = $orden->numero_orden;
    $fecha  = $orden->fecha_recibido ?? $orden->created_at;
    $estado = $orden->estado instanceof \BackedEnum ? $orden->estado->label() : (string) $orden->estado;

    $logoPath = $empresa['logo'] ?? '';
    $hasLogo  = $logoPath && @file_exists($logoPath);
@endphp
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
    @page { size: letter; margin: 12mm 12mm 14mm 12mm; }

    * { box-sizing: border-box; }

    body {
        font-family: "DejaVu Sans", sans-serif;
        color: #1f2937;
        font-size: 10.5px;
        margin: 0;
        line-height: 1.45;
    }

    .accent  { color: #b88a2a; }
    .muted   { color: #6b7280; }
    .text-end{ text-align: right; }
    .text-center { text-align: center; }
    .upper   { text-transform: uppercase; letter-spacing: .5px; }

    /* ───────── Encabezado ───────── */
    .head {
        width: 100%;
        background: #0f172a;
        color: #ffffff;
        border-radius: 10px;
        padding: 16px 20px;
    }
    .head td { vertical-align: top; }
    .brand-logo { max-height: 52px; margin-bottom: 6px; }
    .brand-name {
        font-size: 19px;
        font-weight: bold;
        color: #ffffff;
        margin: 0 0 2px;
        letter-spacing: .3px;
    }
    .brand-meta { font-size: 9.5px; color: #cbd5e1; line-height: 1.6; }

    .doc-box { text-align: right; }
    .doc-title {
        font-size: 15px;
        font-weight: bold;
        color: #e9c46a;
        margin: 0 0 8px;
        letter-spacing: 1px;
    }
    .doc-pill {
        display: inline-block;
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(233,196,106,0.45);
        border-radius: 7px;
        padding: 8px 12px;
        color: #ffffff;
        font-size: 9.5px;
        line-height: 1.7;
        text-align: left;
    }
    .doc-pill .num { font-size: 13px; font-weight: bold; color: #e9c46a; }

    /* ───────── Tarjetas Cliente / Equipo ───────── */
    .cards { width: 100%; margin-top: 14px; border-collapse: separate; border-spacing: 0; }
    .card {
        border: 1px solid #e5e7eb;
        border-top: 3px solid #0f172a;
        border-radius: 8px;
        padding: 10px 12px;
        background: #ffffff;
    }
    .card-label {
        font-size: 8.5px;
        font-weight: bold;
        color: #b88a2a;
        margin-bottom: 5px;
    }
    .card strong { color: #0f172a; font-size: 11.5px; }
    .card .line { color: #374151; }

    /* ───────── Tabla de items ───────── */
    .items { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .items thead th {
        background: #0f172a;
        color: #ffffff;
        font-size: 8.8px;
        font-weight: bold;
        padding: 8px 10px;
        text-align: left;
    }
    .items thead th:last-child, .items thead th.num { text-align: right; }
    .items tbody td {
        padding: 7px 10px;
        border-bottom: 1px solid #eef0f3;
        vertical-align: top;
    }
    .items tbody tr:nth-child(even) { background: #f9fafb; }
    .items .desc strong { color: #111827; }
    .items .desc .sub { color: #9ca3af; font-size: 8.8px; }

    .tag {
        display: inline-block;
        font-size: 7.5px;
        font-weight: bold;
        padding: 1px 6px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: .3px;
    }
    .tag-labor { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .tag-serv  { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .tag-rep   { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

    /* ───────── Totales / Notas ───────── */
    .bottom { width: 100%; margin-top: 16px; }
    .bottom td { vertical-align: top; }

    .notes {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 10px 12px;
        background: #f9fafb;
        font-size: 9px;
        color: #4b5563;
    }
    .notes .h { font-weight: bold; color: #0f172a; margin-bottom: 4px; font-size: 9px; }

    .totals { width: 100%; border-collapse: collapse; }
    .totals td { padding: 6px 10px; font-size: 10.5px; }
    .totals .lbl { color: #6b7280; }
    .totals .val { text-align: right; color: #111827; font-weight: bold; }
    .totals .sep td { border-top: 1px solid #e5e7eb; }
    .total-row td {
        background: #0f172a;
        color: #ffffff;
        font-size: 13px;
        font-weight: bold;
        border-radius: 6px;
    }
    .saldo-row td {
        background: #fff7ed;
        color: #b45309;
        font-weight: bold;
        border: 1px solid #fed7aa;
    }
    .abono-val { color: #047857; }

    /* ───────── Firma / Footer ───────── */
    .sign { width: 100%; margin-top: 26px; }
    .sign td { width: 50%; padding: 0 18px; }
    .sign-line {
        border-top: 1px solid #9ca3af;
        padding-top: 4px;
        text-align: center;
        font-size: 9px;
        color: #6b7280;
    }

    .foot {
        margin-top: 18px;
        border-top: 2px solid #e9c46a;
        padding-top: 8px;
        text-align: center;
        font-size: 8.6px;
        color: #9ca3af;
    }
    .foot strong { color: #0f172a; }
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
                NIT: {{ $empresa['nit'] }}<br>
                {{ $empresa['direccion'] }}<br>
                Tel: {{ $empresa['telefono'] }} &nbsp;·&nbsp; {{ $empresa['email'] }}
            </div>
        </td>
        <td width="42%" class="doc-box">
            <div class="doc-title">FACTURA DE SERVICIO</div>
            <div class="doc-pill">
                <span class="num">{{ $numero }}</span><br>
                Fecha: {{ $fecha?->format('d/m/Y') }}<br>
                Hora: {{ $fecha?->format('H:i') }}<br>
                Estado: {{ $estado }}
            </div>
        </td>
    </tr>
</table>

{{-- ════════ CLIENTE / EQUIPO ════════ --}}
<table class="cards">
    <tr>
        <td width="49%">
            <div class="card">
                <div class="card-label upper">Facturar a</div>
                <strong>{{ $orden->cliente->nombre_completo }}</strong>
                @if($orden->cliente->documento)
                    <div class="line">{{ $orden->cliente->documento }}</div>
                @endif
                <div class="line">{{ $orden->cliente->telefono ?? 'Sin teléfono' }}</div>
                <div class="line">{{ $orden->cliente->direccion ?? 'Sin dirección' }}</div>
                @if($orden->cliente->email)
                    <div class="line muted">{{ $orden->cliente->email }}</div>
                @endif
            </div>
        </td>
        <td width="2%"></td>
        <td width="49%">
            <div class="card">
                <div class="card-label upper">Equipo / Orden</div>
                <strong>
                    {{ $orden->modelo->marca->nombre ?? '' }}
                    {{ $orden->modelo->nombre ?? ($orden->tipo_equipo_manual ?? 'Equipo') }}
                </strong>
                <div class="line">Serie: {{ $orden->numero_serie ?? 'No registrada' }}</div>
                <div class="line">Orden de trabajo: {{ $orden->numero_orden }}</div>
                <div class="line muted">Recibido: {{ optional($orden->fecha_recibido)->format('d/m/Y') }}</div>
            </div>
        </td>
    </tr>
</table>

{{-- ════════ DETALLE ════════ --}}
<table class="items">
    <thead>
        <tr>
            <th width="46%">Descripción</th>
            <th width="14%" class="text-center">Tipo</th>
            <th width="8%" class="num">Cant.</th>
            <th width="16%" class="num">V. Unitario</th>
            <th width="16%" class="num">Importe</th>
        </tr>
    </thead>
    <tbody>
        {{-- Mano de obra --}}
        @if($manoObra > 0)
        <tr>
            <td class="desc"><strong>{{ $manoObraTxt }}</strong></td>
            <td class="text-center"><span class="tag tag-labor">Mano obra</span></td>
            <td class="text-end">1</td>
            <td class="text-end">{{ $money($manoObra) }}</td>
            <td class="text-end">{{ $money($manoObra) }}</td>
        </tr>
        @endif

        {{-- Servicios --}}
        @foreach($orden->servicios as $servicio)
        <tr>
            <td class="desc">
                <strong>{{ $servicio->pivot->descripcion ?: $servicio->nombre }}</strong>
                @if($servicio->codigo)<span class="sub"> · {{ $servicio->codigo }}</span>@endif
            </td>
            <td class="text-center"><span class="tag tag-serv">Servicio</span></td>
            <td class="text-end">{{ rtrim(rtrim(number_format($servicio->pivot->cantidad, 2, ',', '.'), '0'), ',') }}</td>
            <td class="text-end">{{ $money($servicio->pivot->precio_aplicado) }}</td>
            <td class="text-end">{{ $money($servicio->pivot->cantidad * $servicio->pivot->precio_aplicado) }}</td>
        </tr>
        @endforeach

        {{-- Repuestos --}}
        @foreach($orden->repuestos as $repuesto)
        <tr>
            <td class="desc">
                <strong>{{ $repuesto->pivot->descripcion ?: $repuesto->nombre }}</strong>
                @if($repuesto->codigo)<span class="sub"> · {{ $repuesto->codigo }}</span>@endif
            </td>
            <td class="text-center"><span class="tag tag-rep">Repuesto</span></td>
            <td class="text-end">{{ rtrim(rtrim(number_format($repuesto->pivot->cantidad, 2, ',', '.'), '0'), ',') }}</td>
            <td class="text-end">{{ $money($repuesto->pivot->precio_unitario) }}</td>
            <td class="text-end">{{ $money($repuesto->pivot->cantidad * $repuesto->pivot->precio_unitario) }}</td>
        </tr>
        @endforeach

        @if($manoObra <= 0 && $orden->servicios->isEmpty() && $orden->repuestos->isEmpty())
        <tr><td colspan="5" class="text-center muted" style="padding:14px;">Sin items facturados</td></tr>
        @endif
    </tbody>
</table>

{{-- ════════ TOTALES + NOTAS ════════ --}}
<table class="bottom">
    <tr>
        <td width="52%" style="padding-right:14px;">
            <div class="notes">
                <div class="h">Políticas del servicio</div>
                · Todo equipo no reparado tras diagnóstico podrá incurrir en un costo por revisión.<br>
                · El saldo pendiente debe cancelarse al momento de retirar el equipo.<br>
                · Garantía aplica únicamente sobre el trabajo y los repuestos detallados en esta factura.
                @if($orden->observaciones_equipo)
                    <div class="h" style="margin-top:8px;">Observaciones</div>
                    {{ $orden->observaciones_equipo }}
                @endif
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
                @if($incluirIva)
                <tr>
                    <td class="lbl">IVA ({{ rtrim(rtrim(number_format($porcentajeIva, 2, ',', '.'), '0'), ',') }}%)</td>
                    <td class="val">{{ $money($iva) }}</td>
                </tr>
                @endif
                <tr class="total-row">
                    <td class="upper">Total</td>
                    <td class="text-end">{{ $money($total) }}</td>
                </tr>
                @if($abono > 0)
                <tr class="sep">
                    <td class="lbl">Abono recibido</td>
                    <td class="val abono-val">- {{ $money($abono) }}</td>
                </tr>
                <tr class="saldo-row">
                    <td class="upper">Saldo pendiente</td>
                    <td class="text-end">{{ $money($saldo) }}</td>
                </tr>
                @endif
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
    <strong>{{ $empresa['nombre'] }}</strong> &nbsp;·&nbsp; NIT {{ $empresa['nit'] }} &nbsp;·&nbsp; {{ $empresa['telefono'] }}<br>
    Gracias por confiar en nosotros. Este documento es un comprobante válido de su servicio.
</div>

</body>
</html>
