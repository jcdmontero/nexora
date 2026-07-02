import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/Components/ui/dialog'
import { PageHeader } from '@/Components/ui/page-header'
import { EmptyState } from '@/Components/ui/empty-state'
import { DataTable } from '@/Components/ui/data-table'
import { useToast } from '@/Components/toasts/ToastProvider'
import { DollarSign, ArrowLeft, CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle } from 'lucide-react'

interface CxP {
  id: number
  numero_recepcion: string
  fecha: string
  monto_total: number
  saldo_pendiente: number
  estado: string
  notas: string
}

interface Proveedor {
  id: number
  razon_social: string
  numero_documento: string
  tipo_documento: string
}

export default function PagoProveedoresPendientes({ proveedor, cxps }: { proveedor: Proveedor; cxps: CxP[] }) {
  const { toast: toastFn } = useToast()
  const addToast = (opts: { title: string; description?: string; type?: string }) => toastFn(`${opts.title}${opts.description ? ': ' + opts.description : ''}`, opts.type ?? 'info')
  const [pagoDialog, setPagoDialog] = useState<{ open: boolean; cxp: CxP | null }>({ open: false, cxp: null })
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [loading, setLoading] = useState(false)

  const abrirPago = (cxp: CxP) => {
    setPagoDialog({ open: true, cxp })
    setMonto(cxp.saldo_pendiente.toString())
    setMetodoPago('efectivo')
  }

  const procesarPago = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pagoDialog.cxp) return

    const cxpId = pagoDialog.cxp.id
    if (!monto || parseFloat(monto) <= 0) return

    setLoading(true)
    try {
      router.post(route('cash.pagos-proveedores.pagar', cxpId), {
        monto: parseFloat(monto),
        metodo_pago: metodoPago,
      }, {
        onSuccess: () => {
          setPagoDialog({ open: false, cxp: null })
          setLoading(false)
        },
        onError: (errors) => {
          const msg = errors.error || errors.monto || 'Error al procesar el pago'
          addToast({ title: 'Error', description: msg, type: 'error' })
          setLoading(false)
        },
      })
    } catch (e) {
      setLoading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <Head title={`Pendientes — ${proveedor.razon_social}`} />

      <PageHeader
        title={`Cuentas por pagar — ${proveedor.razon_social}`}
        description={`${proveedor.tipo_documento} ${proveedor.numero_documento}`}
        icon={DollarSign}
      >
        <Link
          href={route('cash.pagos-proveedores.index')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a proveedores
        </Link>
      </PageHeader>

      {cxps.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Sin deudas pendientes"
          description="Este proveedor no tiene cuentas por pagar pendientes."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recepciones / Compras a crédito</CardTitle>
            <CardDescription>
              {cxps.length} CxP{cxps.length !== 1 ? 's' : ''} pendiente{cxps.length !== 1 ? 's' : ''} de pago
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                {
                  header: 'Documento',
                  accessorKey: 'numero_recepcion',
                  cell: ({ row }) => (
                    <div>
                      <div className="font-medium">{row.original.numero_recepcion}</div>
                      <div className="text-xs text-muted-foreground">{row.original.fecha}</div>
                    </div>
                  ),
                },
                {
                  header: 'Total',
                  accessorKey: 'monto_total',
                  alignEnd: true,
                  cell: ({ row }) => (
                    <span className="text-muted-foreground">
                      ${Number(row.original.monto_total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: 'Saldo',
                  accessorKey: 'saldo_pendiente',
                  alignEnd: true,
                  cell: ({ row }) => (
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      ${Number(row.original.saldo_pendiente).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: 'Estado',
                  accessorKey: 'estado',
                  cell: ({ row }) => (
                    <Badge variant={row.original.estado === 'pendiente' ? 'warning' : 'success'}>
                      {row.original.estado === 'pendiente' ? 'Pendiente' : 'Pagado'}
                    </Badge>
                  ),
                },
                {
                  header: 'Acción',
                  id: 'actions',
                  alignEnd: true,
                  cell: ({ row }) => (
                    <Button
                      size="sm"
                      onClick={() => abrirPago(row.original)}
                      variant={row.original.saldo_pendiente > 0 ? 'default' : 'outline'}
                      disabled={row.original.saldo_pendiente <= 0}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Pagar
                    </Button>
                  ),
                },
              ]}
              data={cxps}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog de pago */}
      <Dialog open={pagoDialog.open} onOpenChange={(open) => { if (!loading) setPagoDialog({ open, cxp: open ? pagoDialog.cxp : null }) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              {pagoDialog.cxp?.numero_recepcion} — Saldo pendiente:{' '}
              <span className="font-semibold">
                ${Number(pagoDialog.cxp?.saldo_pendiente || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={procesarPago} className="space-y-5">
            {/* Monto */}
            <div>
              <Label htmlFor="monto">Monto a pagar *</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={pagoDialog.cxp?.saldo_pendiente || 0}
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
              {pagoDialog.cxp && parseFloat(monto || '0') > pagoDialog.cxp.saldo_pendiente && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  El monto no puede superar el saldo pendiente
                </p>
              )}
            </div>

            {/* Método de pago */}
            <div>
              <Label>Método de pago</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPago('efectivo')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                    metodoPago === 'efectivo'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span className="text-xs font-medium">Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('tarjeta')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                    metodoPago === 'tarjeta'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                      : 'hover:bg-muted'
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium">Tarjeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('transferencia')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                    metodoPago === 'transferencia'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  <span className="text-xs font-medium">Transf.</span>
                </button>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPagoDialog({ open: false, cxp: null })}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !monto || parseFloat(monto) <= 0 || (pagoDialog.cxp ? parseFloat(monto) > pagoDialog.cxp.saldo_pendiente : false)}
              >
                {loading ? 'Procesando...' : 'Registrar Pago'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
