import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { ListToolbar, FilterSelect } from '@/Components/ui/list-toolbar'
import { Pagination } from '@/Components/ui/pagination'
import { ConfirmDialog } from '@/Components/ui/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/Components/ui/dialog'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { useDataTable } from '@/Hooks/useDataTable'
import { usePermissions } from '@/Hooks/usePermissions'
import { useCaja } from '@/Hooks/useCaja'
import { useToast } from '@/Components/toasts/ToastProvider'
import { Wrench, Plus, Eye, Pencil, Trash2, SearchX, Smartphone, FileText, FileSpreadsheet, PiggyBank } from 'lucide-react'

const estadoClass = {
  slate: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
  indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  green: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
}

const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO')
const fecha = (iso) => (iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default function OrdenesIndex({ ordenes = [], estados = [], soloPropias = false }) {
  const { can } = usePermissions()
  const { verificarCaja, abrirCaja, cajasDisponibles } = useCaja()
  const { toast } = useToast()
  const [showCajaModal, setShowCajaModal] = useState(false)
  const [saldoInicial, setSaldoInicial] = useState(50000)
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null)
  const [abriendoCaja, setAbriendoCaja] = useState(false)

  const table = useDataTable(ordenes, {
    searchAccessor: (o) => `${o.numero_orden} ${o.cliente} ${o.equipo} ${o.tecnico ?? ''}`,
    pageSize: 12,
  })

  async function handleNuevaOrden() {
    const abierta = await verificarCaja()
    if (abierta) {
      router.visit(route('service-desk.ordenes.create'))
    } else {
      if (cajasDisponibles.length === 1) {
        setCajaSeleccionada(cajasDisponibles[0].id)
      }
      setShowCajaModal(true)
    }
  }

  async function handleAbrirCaja(e) {
    e.preventDefault()
    if (saldoInicial <= 0) return
    setAbriendoCaja(true)
    const ok = await abrirCaja(saldoInicial, cajaSeleccionada ?? undefined)
    setAbriendoCaja(false)
    if (ok) {
      setShowCajaModal(false)
      setSaldoInicial(50000)
      router.visit(route('service-desk.ordenes.create'))
    }
  }

  const columns = [
    {
      key: 'numero_orden', header: 'Orden', className: 'font-medium',
      cell: (o) => (
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-foreground">{o.numero_orden}</p>
          <p className="text-xs text-muted-foreground">{fecha(o.fecha_recibido)}</p>
        </div>
      ),
    },
    {
      key: 'cliente', header: 'Cliente',
      cell: (o) => <span className="text-foreground">{o.cliente || '—'}</span>,
    },
    {
      key: 'equipo', header: 'Equipo', hideOnMobile: true,
      cell: (o) => (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Smartphone className="h-3.5 w-3.5" /> {o.equipo}
        </span>
      ),
    },
    {
      key: 'estado', header: 'Estado',
      cell: (o) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoClass[o.estado_color] || estadoClass.slate}`}>
          {o.estado_label}
        </span>
      ),
    },
    {
      key: 'tecnico', header: 'Técnico', hideOnMobile: true,
      cell: (o) => <span className="text-sm text-muted-foreground">{o.tecnico || 'Sin asignar'}</span>,
    },
    {
      key: 'acciones', header: '', alignEnd: true,
      cell: (o) => (
        <div className="flex items-center gap-1">
          <Link
            href={route('service-desk.ordenes.show', o.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {can('service-desk:edit') && (
            <Link
              href={route('service-desk.ordenes.edit', o.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          {can('service-desk:delete') && (
            <ConfirmDialog
              trigger={
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              }
              deleteUrl={route('service-desk.ordenes.destroy', o.id)}
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Órdenes de reparación" />
      <PageHeader
        title="Órdenes de reparación"
        description={soloPropias
          ? 'Estas son las órdenes que tienes asignadas. Avanza cada fase del trabajo desde el detalle de la orden.'
          : 'Gestiona las órdenes de servicio del taller, desde la recepción hasta la entrega.'}
        icon={Wrench}
        actions={
          can('service-desk:create') && (
            <button
              onClick={handleNuevaOrden}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Nueva orden
            </button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar por número, cliente, equipo o técnico…"
            total={table.totalResults}
            filters={
              <FilterSelect
                value={table.filters.estado ?? 'all'}
                onChange={(v) => table.setFilter('estado', v)}
                placeholder="Todos los estados"
                options={estados.map((e) => ({ value: e.value, label: e.label }))}
              />
            }
          />
        </div>
        {ordenes.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="Sin órdenes de reparación"
            description="Crea la primera orden para registrar el ingreso de un equipo al taller."
            action={can('service-desk:create') ? { label: 'Crear primera orden', href: route('service-desk.ordenes.create') } : undefined}
          />
        ) : table.totalResults === 0 ? (
          <EmptyState icon={SearchX} title="Sin coincidencias" description="Ninguna orden coincide con la búsqueda o el filtro." />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(o) => o.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>

      {/* Modal de apertura de caja */}
      <Dialog open={showCajaModal} onOpenChange={setShowCajaModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-amber-600" />
              Abrir Turno de Caja
            </DialogTitle>
            <DialogDescription>
              Para crear una orden necesitas tener un turno de caja abierto. Ingresa el saldo inicial en efectivo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAbrirCaja} className="space-y-4">
            {cajasDisponibles.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Caja</Label>
                <select
                  value={cajaSeleccionada ?? ''}
                  onChange={(e) => setCajaSeleccionada(Number(e.target.value))}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {cajasDisponibles.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Saldo Inicial en Efectivo</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">$</span>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(Number(e.target.value))}
                  className="pl-7 font-medium"
                  placeholder="50000"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCajaModal(false)}
                disabled={abriendoCaja}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={abriendoCaja || saldoInicial <= 0}>
                {abriendoCaja ? 'Abriendo…' : 'Abrir Caja'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
