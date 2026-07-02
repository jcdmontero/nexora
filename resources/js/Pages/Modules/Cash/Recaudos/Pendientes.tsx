import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/Components/ui/dialog'
import { PageHeader } from '@/Components/ui/page-header'
import { EmptyState } from '@/Components/ui/empty-state'
import { DataTable } from '@/Components/ui/data-table'
import { useToast } from '@/Components/toasts/ToastProvider'
import { DollarSign, ArrowLeft, CreditCard, Banknote, Smartphone, CheckCircle, AlertCircle } from 'lucide-react'

interface Cliente {
  id: number
  nombre_completo: string
  numero_documento: string
  tipo_documento: string
}

interface FacturaPendiente {
  id: number
  numero: string
  fecha: string
  total: number
  saldo_pendiente: number
  metodo_pago: string
  estado: string
}

export default function RecaudosPendientes({ cliente, facturas }: { cliente: Cliente; facturas: FacturaPendiente[] }) {
  const { toast: toastFn } = useToast()
  const addToast = (opts: { title: string; description?: string; type?: string }) => toastFn(`${opts.title}${opts.description ? ': ' + opts.description : ''}`, opts.type ?? 'info')
  const [pagoDialog, setPagoDialog] = useState<{ open: boolean; factura: FacturaPendiente | null }>({ open: false, factura: null })
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [loading, setLoading] = useState(false)

  const abrirPago = (factura: FacturaPendiente) => {
    setPagoDialog({ open: true, factura })
    setMonto(factura.saldo_pendiente.toString())
    setMetodoPago('efectivo')
  }

  const procesarPago = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pagoDialog.factura) return

    const facturaId = pagoDialog.factura.id
    if (!monto || parseFloat(monto) <= 0) return

    setLoading(true)
    try {
      router.post(route('cash.recaudos.pagar', facturaId), {
        monto: parseFloat(monto),
        metodo_pago: metodoPago,
      }, {
        onSuccess: () => {
          setPagoDialog({ open: false, factura: null })
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
      <Head title={`Pendientes — ${cliente.nombre_completo}`} />

      <PageHeader
        title={`Facturas pendientes — ${cliente.nombre_completo}`}
        description={`${cliente.tipo_documento} ${cliente.numero_documento}`}
        icon={DollarSign}
      >
        <Link
          href={route('cash.recaudos.index')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a cartera
        </Link>
      </PageHeader>

      {facturas.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="Sin deudas pendientes"
          description="Este cliente no tiene facturas pendientes de pago."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Facturas a crédito</CardTitle>
            <CardDescription>
              {facturas.length} factura{facturas.length !== 1 ? 's' : ''} pendiente{facturas.length !== 1 ? 's' : ''} de pago
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                {
                  header: 'Factura',
                  accessorKey: 'numero',
                  cell: ({ row }) => (
                    <div>
                      <div className="font-medium">{row.original.numero}</div>
                      <div className="text-xs text-muted-foreground">{row.original.fecha}</div>
                    </div>
                  ),
                },
                {
                  header: 'Total',
                  accessorKey: 'total',
                  alignEnd: true,
                  cell: ({ row }) => (
                    <span className="text-muted-foreground">
                      ${Number(row.original.total).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: 'Saldo',
                  accessorKey: 'saldo_pendiente',
                  alignEnd: true,
                  cell: ({ row }) => (
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      ${Number(row.original.saldo_pendiente).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: 'Estado',
                  accessorKey: 'estado',
                  cell: ({ row }) => (
                    <Badge variant={row.original.estado === 'pendiente' ? 'warning' : 'success'}>
                      {row.original.estado === 'pendiente' ? 'Pendiente' : 'Pagada'}
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
                      Cobrar
                    </Button>
                  ),
                },
              ]}
              data={facturas}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialog de pago */}
      <Dialog open={pagoDialog.open} onOpenChange={(open) => { if (!loading) setPagoDialog({ open, factura: open ? pagoDialog.factura : null }) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              Factura {pagoDialog.factura?.numero} — Saldo pendiente:{' '}
              <span className="font-semibold">
                ${Number(pagoDialog.factura?.saldo_pendiente || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={procesarPago} className="space-y-5">
            {/* Monto */}
            <div>
              <Label htmlFor="monto">Monto a cobrar *</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={pagoDialog.factura?.saldo_pendiente || 0}
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="pl-8"
                  required
                />
              </div>
              {pagoDialog.factura && parseFloat(monto || '0') > pagoDialog.factura.saldo_pendiente && (
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
                onClick={() => setPagoDialog({ open: false, factura: null })}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || !monto || parseFloat(monto) <= 0 || (pagoDialog.factura ? parseFloat(monto) > pagoDialog.factura.saldo_pendiente : false)}
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
