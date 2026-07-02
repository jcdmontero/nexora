import { useState } from 'react'
import { router, useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/Components/ui/dialog'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { Pagination } from '@/Components/ui/pagination'
import { ArrowLeftRight, Plus, ArrowDownRight, ArrowUpRight, Coins, Wallet, CreditCard, Printer } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

export default function MovimientosIndex({ movimientos }) {
  const { can } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data, setData, post, processing, errors, reset } = useForm({
    tipo: 'egreso',
    monto: '',
    metodo_pago: 'efectivo',
    concepto: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('cash.movimientos.store'), {
      onSuccess: () => {
        setIsModalOpen(false)
        reset()
      },
      preserveScroll: true
    })
  }

  const handlePageChange = (page) => {
    router.get(route('cash.movimientos.index'), { page }, { preserveState: true, preserveScroll: true })
  }

  const columns = [
    { 
      key: 'created_at', 
      header: 'Fecha', 
      cell: (m) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{new Date(m.created_at).toLocaleDateString()}</p>
          <p className="text-muted-foreground">{new Date(m.created_at).toLocaleTimeString()}</p>
        </div>
      ) 
    },
    { 
      key: 'tipo', 
      header: 'Tipo', 
      cell: (m) => m.tipo === 'ingreso' ? (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50 gap-1">
          <ArrowUpRight className="h-3 w-3" /> Ingreso
        </Badge>
      ) : (
        <Badge variant="outline" className="text-rose-600 border-rose-200 dark:border-rose-900/50 dark:text-rose-400 gap-1 bg-rose-50/20">
          <ArrowDownRight className="h-3 w-3" /> Egreso
        </Badge>
      )
    },
    { 
      key: 'concepto', 
      header: 'Concepto', 
      cell: (m) => <span className="font-medium text-foreground">{m.concepto}</span>
    },
    { 
      key: 'metodo_pago', 
      header: 'Medio de Pago', 
      cell: (m) => (
        <div className="flex items-center gap-1.5 capitalize text-xs">
          {m.metodo_pago === 'efectivo' ? (
            <Coins className="h-3.5 w-3.5 text-amber-600" />
          ) : m.metodo_pago === 'tarjeta' ? (
            <CreditCard className="h-3.5 w-3.5 text-blue-600" />
          ) : (
            <Wallet className="h-3.5 w-3.5 text-purple-600" />
          )}
          <span>{m.metodo_pago}</span>
        </div>
      )
    },
    { 
      key: 'monto', 
      header: 'Monto ($)', 
      cell: (m) => (
        <span className={`font-mono font-semibold ${m.tipo === 'ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {m.tipo === 'ingreso' ? '+' : '-'}${Number(m.monto).toLocaleString()}
        </span>
      ) 
    },
    { 
      key: 'sesion.usuario.name', 
      header: 'Caja / Cajero', 
      cell: (m) => (
        <div className="text-xs">
          <p className="font-medium text-foreground">{m.sesion?.caja?.nombre || '—'}</p>
          <p className="text-muted-foreground">{m.sesion?.usuario?.name || '—'}</p>
        </div>
      )
    },
    {
      key: 'acciones',
      header: 'Acciones',
      alignEnd: true,
      cell: (m) => {
        if (m.recibo_id) {
          return (
            <a
              href={route('cash.recibos.pdf', m.recibo_id)}
              target="_blank"
              title="Imprimir ticket de abono"
              className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <Printer className="h-3.5 w-3.5" />
              Ticket
            </a>
          )
        }
        return null
      }
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Movimientos de Caja" />
      
      <PageHeader
        title="Movimientos de Caja"
        description="Historial detallado de todas las entradas y salidas de dinero en efectivo u otros medios de pago."
        icon={ArrowLeftRight}
        actions={
          can('cash:create') && (
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Plus className="h-4 w-4" /> Registrar Movimiento
            </Button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-sm flex flex-col">
        {movimientos.data.length > 0 ? (
          <>
            <div className="border-t border-border/60 first:border-t-0">
              <DataTable columns={columns} data={movimientos.data} />
            </div>
            <Pagination 
              page={movimientos.current_page} 
              totalPages={movimientos.last_page} 
              onPage={handlePageChange} 
            />
          </>
        ) : (
          <div className="py-12">
            <EmptyState 
              icon={ArrowLeftRight}
              title="Sin movimientos"
              description="No se han registrado transacciones o movimientos manuales aún."
              action={can('cash:create') ? { label: 'Registrar movimiento', onClick: () => setIsModalOpen(true) } : undefined}
            />
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Registrar Movimiento en Caja</DialogTitle>
              <DialogDescription>
                Agrega un ingreso o egreso manual a tu turno de caja activo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Tipo de Movimiento</Label>
                  <Select value={data.tipo} onValueChange={v => setData('tipo', v)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">Ingreso (+)</SelectItem>
                      <SelectItem value="egreso">Egreso (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Monto ($) <span className="text-destructive">*</span></Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0.01" 
                    value={data.monto} 
                    onChange={e => setData('monto', e.target.value)} 
                    placeholder="0.00"
                    className="font-medium"
                  />
                  {errors.monto && <p className="text-xs text-destructive">{errors.monto}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Método de Pago</Label>
                <Select value={data.metodo_pago} onValueChange={v => setData('metodo_pago', v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Concepto / Detalle <span className="text-destructive">*</span></Label>
                <Input 
                  value={data.concepto} 
                  onChange={e => setData('concepto', e.target.value)} 
                  placeholder="Ej. Pago a proveedor de agua, recaudo..." 
                />
                {errors.concepto && <p className="text-xs text-destructive">{errors.concepto}</p>}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={processing}>Guardar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
