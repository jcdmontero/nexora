import { useState } from 'react'
import { Link, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Separator } from '@/Components/ui/separator'
import { Modal } from '@/Components/ui/modal'
import { DataTable } from '@/Components/ui/data-table'
import { cn } from '@/lib/utils'
import { useToast } from '@/Components/toasts/ToastProvider'
import {
  ArrowLeft, Printer, FileText, CheckCircle2, Clock, Send,
  ShieldCheck, AlertCircle, Receipt, Download, User, CreditCard,
  Hash, Calendar, Building2, Store, Tag, ChevronRight,
  Ban, TriangleAlert
} from 'lucide-react'

/* ─── Formato moneda COP ─── */
function formatoCOP(n) {
  return '$' + Number(n).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/* ─── Badge de estado premium ─── */
function EstadoBadge({ estado }) {
  if (estado === 'pagada') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-400/20 print:px-1.5 print:py-0.5 print:text-[7pt]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse print:hidden-deco" />
        Pagada
      </span>
    )
  }
  if (estado === 'anulada') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-400/20 print:px-1.5 print:py-0.5 print:text-[7pt]">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 print:hidden-deco" />
        Anulada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-400/20 print:px-1.5 print:py-0.5 print:text-[7pt]">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 print:hidden-deco" />
      Pendiente (CxC)
    </span>
  )
}

/* ─── Ticket térmico (80mm) ─── */

/* ─── Info row para detalles ─── */
function InfoRow({ icon: Icon, label, value, className }) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5 print:hidden-deco">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium print:text-xs">{label}</p>
        <p className="text-sm font-semibold text-foreground break-words print:text-sm">{value || '—'}</p>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════
   VISTA PRINCIPAL DE FACTURA (DISEÑO PREMIUM)
   ════════════════════════════════════════════ */
export default function FacturaShow({ factura, desglose }) {
  const d = desglose || {};
  const isPaid = factura.estado === 'pagada'
  const esAnulada = factura.anulada === true || factura.estado === 'anulada'
  const { post, processing } = useForm()
  const [printingTicket, setPrintingTicket] = useState(false)
  const [showAnularModal, setShowAnularModal] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [anulando, setAnulando] = useState(false)
  const { toast: toastFn } = useToast()
  const addToast = (opts) => toastFn(`${opts.title}${opts.description ? ': ' + opts.description : ''}`, opts.type ?? 'info')

  const emitirDian = () => post(route('sales.facturas.emitir', factura.id))

  const confirmarAnulacion = () => {
    if (!motivoAnulacion.trim() || motivoAnulacion.trim().length < 5) {
      addToast({ title: 'Motivo requerido', description: 'Escribe un motivo de al menos 5 caracteres.', type: 'error' })
      return
    }
    setAnulando(true)
    router.post(route('sales.facturas.anular', factura.id), {
      motivo: motivoAnulacion.trim(),
    }, {
      preserveState: true,
      preserveScroll: true,
      onSuccess: () => {
        setShowAnularModal(false)
        setMotivoAnulacion('')
        setAnulando(false)
      },
      onError: (errors) => {
        setAnulando(false)
        const msg = Object.values(errors).flat().join(', ')
        addToast({ title: 'Error al anular', description: msg || 'Ocurrió un error.', type: 'error' })
      },
    })
  }

  const columns = [
    { key: 'descripcion', header: 'Producto / Servicio', className: 'font-medium' },
    {
      key: 'cantidad', header: 'Cant.',
      hideOnMobile: false,
      cell: (i) => <span className="tabular-nums">{Number(i.cantidad)}</span>,
    },
    {
      key: 'precio_unitario', header: 'Precio Unit.',
      hideOnMobile: true,
      cell: (i) => <span className="tabular-nums text-muted-foreground">{formatoCOP(Number(i.precio_unitario))}</span>,
    },
    {
      key: 'impuesto_total', header: 'Impuestos',
      hideOnMobile: true,
      cell: (i) => <span className="tabular-nums text-muted-foreground">{formatoCOP(Number(i.impuesto_total))}</span>,
    },
    {
      key: 'total', header: 'Subtotal', alignEnd: true,
      cell: (i) => <span className="tabular-nums font-semibold">{formatoCOP(Number(i.total))}</span>,
    },
  ]

  /* ─── Abrir ticket térmico en ventana nueva ─── */
  const imprimirTicket = () => {
    setPrintingTicket(true)
    const win = window.open('', '_blank', 'width=380,height=600,menubar=no,toolbar=no,scrollbars=yes')
    if (!win) {
      addToast({ title: 'Error', description: 'Permite ventanas emergentes para imprimir el ticket.', type: 'error' })
      setPrintingTicket(false)
      return
    }

    const items = factura.items ?? []
    const cliente = factura.cliente
    const empresa = factura.tenant?.name ?? 'Nexora'

    win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>Ticket #${factura.numero}</title>
      <style>
        @page { margin: 0; size: 80mm 297mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 74mm; margin: 0 auto; padding: 3mm; color: #000; line-height: 1.4; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 3px 0; vertical-align: top; }
        .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
        .total-final { font-size: 14px; font-weight: 700; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 0; margin-top: 5px; }
        .empresa { font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
      </style></head><body>
      <div class="text-center"><h3 class="empresa">${empresa}</h3>
      ${factura.tenant?.email ? `<p style="font-size:11px;margin:2px 0">${factura.tenant.email}</p>` : ''}</div>
      <div class="divider"></div>
      <div style="margin-bottom:10px;font-size:11px">
        <div class="font-bold" style="font-size:12px">FACTURA No: ${factura.numero}</div>
        <div style="margin-top:4px">Fecha: ${new Date(factura.created_at).toLocaleDateString('es-CO')} ${new Date(factura.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</div>
        <div style="margin-top:2px">Cliente: ${cliente ? `${cliente.nombres ?? ''} ${cliente.apellidos ?? ''}` : 'Consumidor Final'}${cliente?.razon_social ? ` (${cliente.razon_social})` : ''}</div>
        ${cliente?.documento ? `<div>Doc: ${cliente.documento}</div>` : ''}
        ${cliente?.telefono ? `<div>Tel: ${cliente.telefono}</div>` : ''}
      </div>
      <div class="divider"></div>
      <table><thead><tr style="border-bottom:1px dashed #000">
        <th style="text-align:left;width:15%;font-size:10px">Cant</th>
        <th style="text-align:left;width:50%;font-size:10px">Desc.</th>
        <th style="text-align:right;width:35%;font-size:10px">Total</th>
      </tr></thead><tbody>
      ${items.map((i) => `<tr style="border-bottom:1px dotted #000">
        <td style="padding:2px 0">${Number(i.cantidad)}</td>
        <td style="padding:2px 0;font-size:11px">${(i.descripcion || '').substring(0, 28)}</td>
        <td style="padding:2px 0;text-align:right">${formatoCOP(Number(i.total))}</td>
      </tr>`).join('')}
      </tbody></table>
      <div class="divider"></div>
      <div style="margin-top:8px;font-size:11px">
        <div style="display:flex;justify-content:space-between;padding:2px 0"><span>Subtotal</span><span>${formatoCOP(Number(factura.subtotal))}</span></div>
        ${Number(factura.descuento) > 0 ? `<div style="display:flex;justify-content:space-between;padding:2px 0;color:#dc2626"><span>Descuento</span><span>-${formatoCOP(Number(factura.descuento))}</span></div>` : ''}
        ${Number(factura.impuestos) > 0 ? `<div style="display:flex;justify-content:space-between;padding:2px 0"><span>Impuestos</span><span>${formatoCOP(Number(factura.impuestos))}</span></div>` : ''}
      </div>
      <div class="total-final" style="display:flex;justify-content:space-between;margin-top:8px;padding:5px 0">
        <span>TOTAL</span><span>${formatoCOP(Number(factura.total))}</span>
      </div>
      <div style="text-align:center;font-size:10px;margin-top:20px;border-top:1px dashed #000;padding-top:10px">
        <p style="font-weight:700">¡Gracias por su preferencia!</p>
        <p style="margin-top:3px">Este documento es un comprobante de pago.</p>
        <p style="margin-top:8px;font-size:9px;color:#666">Soporte: ${factura.tenant?.email ?? ''}</p>
      </div>
      <script>window.onload = function() { window.print(); window.close(); }</script>
      </body></html>`)
    win.document.close()
    setPrintingTicket(false)
  }

  return (
    <>
      {/* ─── Print Styles (todo en UNA página A4) ─── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 6mm 8mm; }
          html, body { height: auto !important; overflow: visible !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          aside, header, footer, nav, .no-print, .no-print * { display: none !important; }
          main.flex-1 { width: 100% !important; margin-left: 0 !important; max-width: 100% !important; }

          /* Comprimir Hero */
          .print\\:mb-2 { margin-bottom: 4px !important; }
          .print\\:p-3 { padding: 6px 10px !important; }
          .print\\:text-2xl { font-size: 16pt !important; line-height: 1.2 !important; }
          .print\\:text-lg { font-size: 11pt !important; }
          .print\\:text-sm { font-size: 8pt !important; }
          .print\\:text-xs { font-size: 7pt !important; }
          .print\\:gap-2 { gap: 4px !important; }
          .print\\:grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
          .print\\:hidden-deco { display: none !important; }
          .print\\:border-0 { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:bg-transparent { background: transparent !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:compact-card { padding: 6px 10px !important; }
          .print\\:compact-card-header { padding: 4px 10px 2px !important; }
          .print\\:compact-card-content { padding: 4px 10px 6px !important; }
          .print\\:compact-table { font-size: 7.5pt !important; }
          .print\\:compact-table td, .print\\:compact-table th { padding: 1px 4px !important; }

          /* Forzar que no se partan */
          .print\\:avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .print\\:no-break { break-inside: avoid !important; page-break-inside: avoid !important; }

          /* Ocultar blobs decorativos */
          .blur-3xl, .blur-2xl { display: none !important; }
        }
      `}</style>

      {/* ═══ HEADER PREMIUM ═══ */}
      <AuthenticatedLayout>
        <div className="no-print">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-8">
            <Link href={route('sales.facturas.index')}>
              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex-1 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground tracking-tight">
                    Factura {factura.numero}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {new Date(factura.created_at).toLocaleDateString('es-CO', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })} a las {new Date(factura.created_at).toLocaleTimeString('es-CO', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={imprimirTicket} disabled={printingTicket}>
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">{printingTicket ? 'Abriendo…' : 'Ticket'}</span>
                </Button>
                <a
                  href={route('sales.facturas.pdf', factura.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-3 h-9 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden sm:inline">Imprimir / PDF</span>
                </a>
                {!esAnulada && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 rounded-xl border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                    onClick={() => setShowAnularModal(true)}
                  >
                    <Ban className="h-4 w-4" />
                    <span className="hidden sm:inline">Anular</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ HERO: Total + Estado ═══ */}
        <div className="print:no-break relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card/95 to-card/90 dark:from-card dark:via-card/95 dark:to-muted/10 p-8 mb-8 print:p-3 print:mb-2 print:bg-transparent print:shadow-none print:border-0">
          {/* Decorative gradient blob */}
          <div className="print:hidden-deco absolute -top-24 -right-24 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="print:hidden-deco absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary/[0.03] blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 print:gap-2">
            <div className="space-y-1 print:space-y-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest print:text-xs">Total de factura</p>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground print:text-2xl">
                {formatoCOP(Number(factura.total))}
              </p>
              <div className="flex items-center gap-3 print:gap-2">
                <EstadoBadge estado={factura.estado} />
                {factura.metodo_pago && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground print:text-xs">
                    <CreditCard className="w-3.5 h-3.5 print:hidden-deco" />
                    {factura.metodo_pago}
                  </span>
                )}
              </div>
            </div>

            {factura.notas && (
              <div className="max-w-xs text-right print:text-xs">
                <p className="text-xs text-muted-foreground font-medium mb-1 print:text-xs">Notas</p>
                <p className="text-sm text-muted-foreground/80 italic print:text-sm">{factura.notas}</p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ INFO GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:gap-2 print:mb-2 print:grid-cols-2">
          {/* Cliente */}
          <Card className="print:avoid-break lg:col-span-2 border-border/80 shadow-sm hover:shadow-md transition-shadow duration-200 print:shadow-none print:border-0 print:bg-transparent">
            <CardHeader className="pb-4 print:compact-card-header">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground print:text-xs">
                <Building2 className="h-4 w-4 print:hidden-deco" /> Datos del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="print:compact-card-content">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 print:gap-1 print:text-xs">
                <InfoRow
                  icon={User}
                  label="Cliente"
                  value={
                    factura.cliente ? (
                      <Link href={route('crm.clientes.show', factura.cliente_id)} className="text-primary hover:underline">
                        {factura.cliente.nombres} {factura.cliente.apellidos}
                        {factura.cliente.razon_social && (
                          <span className="text-muted-foreground font-normal"> ({factura.cliente.razon_social})</span>
                        )}
                      </Link>
                    ) : 'Consumidor Final'
                  }
                />
                <InfoRow
                  icon={Hash}
                  label="Documento"
                  value={factura.cliente?.documento || '—'}
                />
                <InfoRow
                  icon={CreditCard}
                  label="Método de Pago"
                  value={factura.metodo_pago ? factura.metodo_pago.charAt(0).toUpperCase() + factura.metodo_pago.slice(1) : '—'}
                />
                <InfoRow
                  icon={User}
                  label="Vendedor / Cajero"
                  value={factura.vendedor?.name || '—'}
                />
                {factura.cliente?.direccion && (
                  <InfoRow
                    icon={Building2}
                    label="Dirección"
                    value={factura.cliente.direccion}
                  />
                )}
                {factura.cliente?.telefono && (
                  <InfoRow
                    icon={Hash}
                    label="Teléfono"
                    value={factura.cliente.telefono}
                  />
                )}
                {factura.cliente?.email && (
                  <InfoRow
                    icon={Hash}
                    label="Email"
                    value={factura.cliente.email}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estado / DIAN */}
          <div className="space-y-4 print:space-y-1">
            {/* Estado de pago */}
            <Card className={cn(
              'print:avoid-break border shadow-sm print:shadow-none print:border-0 print:bg-transparent',
              isPaid ? 'border-emerald-200 dark:border-emerald-900' : 'border-amber-200 dark:border-amber-900',
            )}>
              <CardContent className="p-5 print:compact-card">
                <div className="flex items-start gap-4 print:gap-2">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 print:hidden-deco',
                    isPaid ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-amber-100 dark:bg-amber-950/40',
                  )}>
                    {isPaid
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      : <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    }
                  </div>
                  <div>
                    <p className={cn(
                      'text-sm font-bold print:text-xs',
                      isPaid ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
                    )}>
                      {isPaid ? 'Transacción Pagada' : 'Factura a Crédito'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed print:text-xs">
                      {isPaid
                        ? 'El ingreso fue registrado en la caja del turno activo.'
                        : 'Esta venta generó una Cuenta por Cobrar (CxC) asociada al cliente.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DIAN */}
            <Card className={cn(
              'print:avoid-break border shadow-sm print:shadow-none print:border-0 print:bg-transparent',
              factura.dian_estado === 'aceptado' && 'border-blue-200 dark:border-blue-900',
            )}>
              <CardHeader className="pb-3 print:compact-card-header">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground print:text-xs">
                  <ShieldCheck className="h-4 w-4 text-blue-600 print:hidden-deco" /> Facturación Electrónica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 print:compact-card-content print:space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground print:text-xs">Estado DIAN</span>
                  {(!factura.dian_estado || factura.dian_estado === 'borrador') && (
                    <Badge variant="secondary" className="text-[10px] print:text-xs">Borrador Local</Badge>
                  )}
                  {factura.dian_estado === 'aceptado' && (
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-[10px] print:text-xs">Aceptado DIAN</Badge>
                  )}
                  {(factura.dian_estado === 'rechazado' || factura.dian_estado === 'error') && (
                    <Badge variant="destructive" className="text-[10px] print:text-xs">Rechazado DIAN</Badge>
                  )}
                </div>

                {factura.cufe && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1 font-medium print:text-xs">CUFE</p>
                    <p className="font-mono text-[10px] break-all text-muted-foreground bg-muted p-2 rounded-lg border border-border/50 select-all print:text-xs print:p-1">
                      {factura.cufe}
                    </p>
                  </div>
                )}

                {factura.dian_mensaje && factura.dian_estado && factura.dian_estado !== 'borrador' && (
                  <div className={cn(
                    'p-3 rounded-xl text-xs flex gap-2.5 items-start print:p-1 print:text-xs',
                    factura.dian_estado === 'aceptado'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300',
                  )}>
                    {factura.dian_estado === 'aceptado'
                      ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 print:hidden-deco" />
                      : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 print:hidden-deco" />
                    }
                    <p>{factura.dian_mensaje}</p>
                  </div>
                )}

                {(!factura.dian_estado || factura.dian_estado === 'borrador') && (
                  <Button onClick={emitirDian} disabled={processing} className="w-full gap-2 rounded-xl h-9 text-xs" size="sm">
                    <Send className="h-3.5 w-3.5" />
                    {processing ? 'Enviando…' : 'Emitir Factura Electrónica'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ═══ LÍNEAS DE FACTURA ═══ */}
        <Card className="print:avoid-break border-border/80 shadow-sm overflow-hidden mb-8 print:shadow-none print:border-0 print:bg-transparent print:mb-1">
          <CardHeader className="pb-0 print:compact-card-header">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground print:text-xs">
              <Tag className="h-4 w-4 print:hidden-deco" /> Líneas de Factura
            </CardTitle>
            <CardDescription className="print:text-xs">
              {factura.items?.length ?? 0} {factura.items?.length === 1 ? 'línea' : 'líneas'} en total
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="print:compact-table">
              <DataTable columns={columns} data={factura.items ?? []} />
            </div>
          </CardContent>
        </Card>

        {/* ═══ TOTALES (desglose como prefactura) ═══ */}
        <div className="flex justify-end mb-8 print:mb-0">
          <div className="w-full sm:w-80 lg:w-96 bg-card border border-border/80 rounded-2xl p-6 shadow-sm print:shadow-none print:border-0 print:bg-transparent print:compact-card">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 print:text-xs print:mb-1">
              Resumen de Factura
            </h3>
            <div className="space-y-3 print:space-y-1">
              <div className="flex justify-between items-center py-0.5 text-sm print:text-xs">
                <span className="text-muted-foreground">Servicios</span>
                <span className="font-semibold tabular-nums">{formatoCOP(Number(d.servicios) || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-sm print:text-xs">
                <span className="text-muted-foreground">Repuestos</span>
                <span className="font-semibold tabular-nums">{formatoCOP(Number(d.repuestos) || 0)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-sm print:text-xs">
                <span className="text-muted-foreground">Mano de Obra</span>
                <span className="font-semibold tabular-nums">{formatoCOP(Number(d.manoDeObra) || 0)}</span>
              </div>

              <Separator className="my-1 print:hidden-deco" />

              <div className="flex justify-between items-center text-sm print:text-xs">
                <span className="font-semibold text-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatoCOP(Number(d.subtotal) || Number(factura.subtotal))}</span>
              </div>

              {Number(d.descuento) > 0 && (
                <div className="flex justify-between items-center text-sm print:text-xs">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">
                    -{formatoCOP(Number(d.descuento))}
                  </span>
                </div>
              )}

              {Number(d.iva) > 0 && (
                <div className="flex justify-between items-center text-sm print:text-xs">
                  <span className="text-muted-foreground">IVA ({Number(d.porcentajeIva) || 0}%)</span>
                  <span className="font-semibold tabular-nums text-amber-600">{formatoCOP(Number(d.iva))}</span>
                </div>
              )}

              {Number(d.abono) > 0 && (
                <div className="flex justify-between items-center text-sm print:text-xs">
                  <span className="text-muted-foreground">Abono inicial</span>
                  <span className="font-semibold tabular-nums text-red-600">
                    -{formatoCOP(Number(d.abono))}
                  </span>
                </div>
              )}

              <Separator className="my-1 print:hidden-deco" />

              <div className="flex justify-between items-center print:pt-0">
                <span className="text-base font-bold text-foreground print:text-sm">Total</span>
                <span className="text-xl font-bold text-primary tabular-nums print:text-sm">
                  {formatoCOP(Number(d.total) || Number(factura.total))}
                </span>
              </div>

              {Number(d.abono) > 0 && (
                <div className="flex justify-between items-center text-sm print:text-xs">
                  <span className="text-muted-foreground font-semibold">Saldo pendiente</span>
                  <span className="font-semibold tabular-nums text-amber-600">
                    {formatoCOP(Math.max(0, (Number(d.total) || Number(factura.total)) - Number(d.abono)))}
                  </span>
                </div>
              )}

              {factura.metodo_pago && (
                <div className="flex justify-between items-center pt-1 text-xs text-muted-foreground border-t border-border/50 pt-2 print:text-xs print:pt-0 print:border-t-0">
                  <span>Método de pago</span>
                  <span className="font-medium capitalize">{factura.metodo_pago}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ ASIENTO CONTABLE ═══ */}
        {factura.asientos?.length > 0 && (
          <div className="mb-8 print:hidden-deco">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-indigo-500" /> Asiento(s) Contable(s)
                </CardTitle>
                <CardDescription>
                  {factura.asientos.length} asiento{factura.asientos.length > 1 ? 's' : ''} generado{factura.asientos.length > 1 ? 's' : ''} automáticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {factura.asientos.map((asiento, i) => {
                  const totalDebe = asiento.lineas.reduce((s, l) => s + Number(l.debito || 0), 0)
                  const totalHaber = asiento.lineas.reduce((s, l) => s + Number(l.credito || 0), 0)
                  return (
                    <div key={asiento.id} className={i > 0 ? 'mt-6 border-t border-border pt-6' : ''}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {asiento.concepto}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            #{asiento.numero} · {asiento.fecha}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {asiento.estado}
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Código</th>
                              <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Cuenta</th>
                              <th className="text-left font-medium text-muted-foreground pb-2 pr-4">Descripción</th>
                              <th className="text-right font-medium text-muted-foreground pb-2 pl-4">Débito</th>
                              <th className="text-right font-medium text-muted-foreground pb-2 pl-4">Crédito</th>
                            </tr>
                          </thead>
                          <tbody>
                            {asiento.lineas.map((linea) => (
                              <tr key={linea.id} className="border-b border-border/50">
                                <td className="py-2 pr-4 font-mono text-muted-foreground">{linea.cuenta?.codigo || '—'}</td>
                                <td className="py-2 pr-4 font-medium text-foreground">{linea.cuenta?.nombre || '—'}</td>
                                <td className="py-2 pr-4 text-muted-foreground">{linea.descripcion || '—'}</td>
                                <td className="py-2 pl-4 text-right tabular-nums">{Number(linea.debito) > 0 ? formatoCOP(linea.debito) : '—'}</td>
                                <td className="py-2 pl-4 text-right tabular-nums">{Number(linea.credito) > 0 ? formatoCOP(linea.credito) : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-semibold text-foreground">
                              <td colSpan={3} className="pt-2 text-right">Totales</td>
                              <td className="pt-2 pl-4 text-right tabular-nums">{formatoCOP(totalDebe)}</td>
                              <td className="pt-2 pl-4 text-right tabular-nums">{formatoCOP(totalHaber)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ FOOTER ═══ */}
        <div className="text-center pb-8 no-print">
          <p className="text-xs text-muted-foreground/60">
            Generado por Nexora · {new Date().toLocaleDateString('es-CO')}
          </p>
        </div>
      </AuthenticatedLayout>

      {/* ═══ MODAL ANULAR FACTURA ═══ */}
      <Modal
        open={showAnularModal}
        onClose={() => { if (!anulando) { setShowAnularModal(false); setMotivoAnulacion('') } }}
        title="Anular Factura"
        description={`Estás a punto de anular la factura ${factura.numero}. Esta acción es irreversible y reversará el stock, caja y contabilidad.`}
        icon={TriangleAlert}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setShowAnularModal(false); setMotivoAnulacion('') }}
              disabled={anulando}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmarAnulacion}
              disabled={anulando || motivoAnulacion.trim().length < 5}
              className="gap-2"
            >
              {anulando ? 'Anulando…' : <><Ban className="h-4 w-4" /> Anular Factura</>}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 p-4 text-sm text-red-700 dark:text-red-400">
            <p className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Reversión completa
            </p>
            <ul className="mt-2 list-disc list-inside text-xs space-y-1 text-red-600 dark:text-red-400/80">
              <li>Se restaurará el stock de los repuestos al inventario</li>
              <li>Se registrará un egreso en caja por cada ingreso original</li>
              <li>Se reversarán los asientos contables</li>
              <li>La orden de reparación volverá a estado "Listo"</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo-anulacion" className="text-sm font-semibold">
              Motivo de anulación <span className="text-destructive">*</span>
            </Label>
            <textarea
              id="motivo-anulacion"
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              rows={3}
              placeholder="Ej. El cliente solicitó cancelación del servicio por error en el diagnóstico..."
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Mínimo 5 caracteres. Este motivo quedará registrado en la auditoría.
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
