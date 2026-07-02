<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factura {{ $orden->factura->numero_factura }}</title>
    @php
        $incluirIva = \App\Models\Configuracion::get('incluir_iva', 'false') === 'true';
        $porcentajeIva = $incluirIva
            ? (float) \App\Models\Configuracion::get('porcentaje_iva', 0)
            : 0;
        $ivaCalculado = $incluirIva
            ? $orden->factura->subtotal * ($porcentajeIva / 100)
            : 0;
    @endphp
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
<div class="factura-container">
    {{-- HEADER --}}
    <div class="factura-header d-flex justify-content-between align-items-center">
        <div>
            @if($empresa['logo'])
                <img src="{{ $empresa['logo'] }}" class="factura-logo mb-3" alt="Logo empresa" loading="lazy">
            @endif
            <h2 class="fw-bold mb-1">
                {{ $empresa['nombre'] }}
            </h2>
            <div class="small opacity-75">
                Servicio Técnico Profesional
            </div>
        </div>
        <div class="empresa-info">
            <strong>NIT:</strong>
            {{ $empresa['nit'] }}
            <br>
            <i class="bi bi-geo-alt"></i>
            {{ $empresa['direccion'] }}
            <br>
            <i class="bi bi-telephone"></i>
            {{ $empresa['telefono'] }}
            <br>
            <i class="bi bi-envelope"></i>
            {{ $empresa['email'] }}
        </div>
    </div>
    {{-- BODY --}}
    <div class="factura-body">
        {{-- TITULO --}}
        <div class="row align-items-end mb-4">
            <div class="col-md-7">
                <div class="titulo-factura">
                    Factura de Venta
                </div>
                <div class="text-muted-small">
                    Documento generado automáticamente por el sistema.
                </div>
            </div>
            <div class="col-md-5 text-md-end mt-4 mt-md-0">
                <div>
                    <strong>Factura:</strong>
                    {{ $orden->factura->numero_factura }}
                </div>
                <div>
                    <strong>Orden:</strong>
                    #{{ $orden->numero_orden }}
                </div>
                <div>
                    <strong>Fecha:</strong>
                    {{ $orden->factura->created_at->format('d/m/Y H:i') }}
                </div>
            </div>
        </div>
        {{-- CLIENTE Y EQUIPO --}}
        <div class="row g-4">
            <div class="col-md-6">
                <div class="bloque-info">
                    <div class="bloque-titulo">
                        Datos del Cliente
                    </div>
                    <div class="fw-bold fs-5">
                        {{ $orden->cliente->nombre_completo }}
                    </div>
                    <div class="mt-2 text-muted-small">
                        @if($orden->cliente->documento)
                        <div>
                            <i class="bi bi-credit-card"></i>
                            {{ $orden->cliente->documento }}
                        </div>
                        @endif
                        <div>
                            <i class="bi bi-telephone"></i>
                            {{ $orden->cliente->telefono ?? 'Sin teléfono' }}
                        </div>
                        <div>
                            <i class="bi bi-geo-alt"></i>
                            {{ $orden->cliente->direccion ?? 'Sin dirección' }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="bloque-info">
                    <div class="bloque-titulo">
                        Equipo Reparado
                    </div>
                    <div class="fw-bold fs-5">
                        {{ $orden->modelo->marca->nombre ?? '' }}
                        {{ $orden->modelo->nombre ?? '' }}
                    </div>
                    <div class="mt-2 text-muted-small">
                        <div>
                            <strong>Serie:</strong>
                            {{ $orden->numero_serie ?? 'No registrada' }}
                        </div>
                        @if($orden->diagnostico)
                        <div class="mt-1">
                            <strong>Diagnóstico:</strong>
                            {{ $orden->diagnostico }}
                        </div>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        {{-- TABLA --}}
        <div class="tabla-factura">
            <table class="table align-middle">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th class="text-center" width="90">Cant.</th>
                        <th class="text-end" width="170">Precio Unit.</th>
                        <th class="text-end" width="170">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>
                                Mano de obra / Servicio técnico
                            </strong>
                        </td>
                        <td class="text-center">
                            1
                        </td>
                        <td class="text-end">
                            {{ moneyCOP($orden->precio_cliente) }}
                        </td>
                        <td class="text-end fw-bold">
                            {{ moneyCOP($orden->precio_cliente) }}
                        </td>
                    </tr>
                    @foreach($orden->repuestos as $repuesto)
                    <tr>
                        <td>
                            {{ $repuesto->nombre }}
                            <small class="text-muted">
                                ({{ $repuesto->codigo }})
                            </small>
                        </td>
                        <td class="text-center">
                            {{ $repuesto->pivot->cantidad }}
                        </td>
                        <td class="text-end">
                            {{ moneyCOP($repuesto->pivot->precio_unitario) }}
                        </td>
                        <td class="text-end">
                            {{ moneyCOP($repuesto->pivot->cantidad * $repuesto->pivot->precio_unitario) }}
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        {{-- TOTALES --}}
        <div class="totales">
            <div class="row">
                <div class="col-md-6 offset-md-6">
                    <table class="table table-borderless">
                        <tr>
                            <td>
                                Subtotal:
                            </td>
                            <td class="text-end fw-semibold">
                                {{ moneyCOP($orden->factura->subtotal) }}
                            </td>
                        </tr>
                        @if($orden->factura->descuento > 0)
                        <tr>
                            <td class="text-danger">
                                Descuento:
                            </td>
                            <td class="text-end text-danger fw-semibold">
                                - {{ moneyCOP($orden->factura->descuento) }}
                            </td>
                        </tr>
                        @endif
                        @if($incluirIva)
                        <tr>
                            <td>
                                IVA ({{ $porcentajeIva }}%):
                            </td>
                            <td class="text-end">
                                {{ moneyCOP($ivaCalculado) }}
                            </td>
                        </tr>
                        @endif
                        <tr class="border-top">
                            <td class="pt-3 fw-bold">
                                Total Factura:
                            </td>
                            <td class="text-end pt-3 total-final">
                                {{ moneyCOP($orden->factura->total) }}
                            </td>
                        </tr>
                        @php
                            $abonosTotales = $orden->abonos->where('anulado', false)->sum('monto');
                        @endphp
                        @if($abonosTotales > 0)
                        <tr>
                            <td class="text-success fw-semibold pt-2">
                                (-) Abonos / Anticipos:
                            </td>
                            <td class="text-end text-success fw-semibold pt-2">
                                - {{ moneyCOP($abonosTotales) }}
                            </td>
                        </tr>
                        <tr class="border-top">
                            <td class="pt-2 fw-bold fs-5 text-danger">
                                Saldo Pendiente:
                            </td>
                            <td class="text-end pt-2 fw-bold fs-5 text-danger">
                                {{ moneyCOP(max(0, $orden->factura->total - $abonosTotales)) }}
                            </td>
                        </tr>
                        @endif
                    </table>
                </div>
            </div>
        </div>
        {{-- FOOTER --}}
        <div class="footer">
            <div class="fw-bold mb-2">
                ¡Gracias por confiar en nosotros!
            </div>
            <div>
                Este documento sirve como comprobante de pago y garantía del servicio.
            </div>
            <div class="mt-2">
                Para soporte o garantía comuníquese al
                {{ $empresa['telefono'] }}
            </div>
        </div>
    </div>
   {{-- BOTONES DE ENVÍO --}}
<div class="action-btn-group no-print">
    <a href="{{ route('facturas.pdf', $orden) }}" class="btn btn-danger" target="_blank">
        <i class="bi bi-file-pdf"></i> <span class="d-none d-sm-inline">Descargar PDF</span>
    </a>
    <form action="{{ route('facturas.enviar.email', $orden) }}" method="POST" class="d-inline">
        @csrf
        <button type="submit" class="btn btn-primary">
            <i class="bi bi-envelope"></i> <span class="d-none d-sm-inline">Enviar Email</span>
        </button>
    </form>
    <form action="{{ route('facturas.enviar.whatsapp', $orden) }}" method="POST" class="d-inline">
        @csrf
        <button type="submit" class="btn btn-success">
            <i class="bi bi-whatsapp"></i> <span class="d-none d-sm-inline">Enviar por WhatsApp</span>
        </button>
    </form>
    <form action="{{ route('facturas.enviar.telegram', $orden) }}" method="POST" class="d-inline">
        @csrf
        <button type="submit" class="btn btn-info">
            <i class="bi bi-telegram"></i> <span class="d-none d-sm-inline">Enviar Telegram</span>
        </button>
    </form>
    <a href="{{ route('notificaciones.pendientes', ['referencia_tipo' => 'App\\Models\\Factura', 'referencia_id' => $orden->factura->id]) }}" class="btn btn-secondary">
        <i class="bi bi-bell"></i> <span class="d-none d-sm-inline">Notificaciones</span>
    </a>
    <button type="button" class="btn btn-outline-dark" data-bs-toggle="modal" data-bs-target="#ticketPreviewModal">
        <i class="bi bi-receipt"></i> <span class="d-none d-sm-inline">Vista previa ticket</span>
    </button>
    <button onclick="window.print()" class="btn btn-primary">
        <i class="bi bi-printer"></i> <span class="d-none d-sm-inline">Imprimir</span>
    </button>
    {{-- ANULAR FACTURA --}}
    @if(auth()->user()->role == 'admin' && !($orden->factura->anulada ?? false))
        <form action="{{ route('facturas.anular', $orden->factura) }}" method="POST" class="delete-record-form d-inline" data-record-name="¿Anular esta factura? Podrás generar una nueva factura corregida.">
            @csrf
            @method('DELETE')
            <button type="submit" class="btn btn-danger">
                <i class="bi bi-x-circle"></i> <span class="d-none d-sm-inline">Anular factura</span>
            </button>
        </form>
    @endif
    {{-- GENERAR FACTURA CORREGIDA --}}
    @if(auth()->user()->role == 'admin' && ($orden->factura->anulada ?? false))
        <a href="{{ route('facturas.regenerar', $orden) }}" class="btn btn-warning">
            <i class="bi bi-arrow-repeat"></i> <span class="d-none d-sm-inline">Generar nueva factura corregida</span>
        </a>
    @endif
    <button onclick="window.close()" class="btn btn-outline-secondary">
        <i class="bi bi-x-lg"></i> <span class="d-none d-sm-inline">Cerrar</span>
    </button>
</div>
</div>
</div>
{{-- MODAL VISTA PREVIA TICKET --}}
<div class="modal fade" id="ticketPreviewModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" style="max-width:380px;">
        <div class="modal-content">
            <div class="modal-header border-0 pb-0">
                <h6 class="modal-title">Ticket térmico</h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body p-3 text-center">
                <iframe src="{{ route('facturas.ticket-preview', $orden) }}" style="width:100%;height:520px;border:none;border-radius:8px;background:#fff;" title="Vista previa ticket"></iframe>
            </div>
            <div class="modal-footer border-0 justify-content-center pt-0">
                <button onclick="document.querySelector('#ticketPreviewModal iframe').contentWindow.print()" class="btn btn-primary">
                    <i class="bi bi-printer"></i> Imprimir ticket
                </button>
            </div>
        </div>
    </div>
</div>
</body>
</html>
