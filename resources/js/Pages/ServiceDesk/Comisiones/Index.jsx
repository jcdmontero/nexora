import { router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { DollarSign, Plus, Eye, Trash2 } from 'lucide-react'

const selectClass = 'h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm'

const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO')

const ESTADO_BADGE = {
  BORRADOR: { label: 'Borrador', class: 'bg-slate-100 text-slate-700' },
  APROBADO: { label: 'Aprobado', class: 'bg-blue-100 text-blue-700' },
  PAGADO: { label: 'Pagado', class: 'bg-emerald-100 text-emerald-700' },
  ANULADO: { label: 'Anulado', class: 'bg-rose-100 text-rose-700' },
}

export default function ComisionesIndex({ liquidaciones, filters, estados }) {
  const handleFilter = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    router.get(route('service-desk.comisiones.index'), { search: form.get('search'), estado: form.get('estado') }, { preserveState: true })
  }

  const columns = [
    { key: 'codigo', header: 'Liquidación', cell: (l) => <span className="font-mono font-semibold">{l.codigo}</span> },
    {
      key: 'prestador', header: 'Prestador',
      cell: (l) => l.prestador?.nombre_completo || <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'periodo', header: 'Período', hideOnMobile: true,
      cell: (l) => `${l.periodo_inicio} al ${l.periodo_fin}`,
    },
    {
      key: 'total', header: 'Total', alignEnd: true,
      cell: (l) => <span className="tabular-nums font-medium">{money(l.total_comisiones)}</span>,
    },
    {
      key: 'estado', header: 'Estado',
      cell: (l) => {
        const cfg = ESTADO_BADGE[l.estado] || { label: l.estado, class: 'bg-slate-100 text-slate-700' }
        return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>
      },
    },
    {
      key: 'pagos', header: 'Pago', hideOnMobile: true,
      cell: (l) => {
        const pagado = l.pagos?.find(p => p.estado === 'PAGADO')
        return pagado ? <span className="text-xs text-muted-foreground">{pagado.fecha_pago ? new Date(pagado.fecha_pago).toLocaleDateString() : '—'}</span> : <span className="text-muted-foreground">—</span>
      },
    },
    {
      key: 'actions', header: 'Acciones', alignEnd: true,
      cell: (l) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.get(route('service-desk.comisiones.show', l.id))}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {l.estado === 'BORRADOR' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
              if (confirm('¿Eliminar esta liquidación?')) router.delete(route('service-desk.comisiones.destroy', l.id))
            }}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="h-6 w-6 text-primary" /> Liquidación de Comisiones</h2>
          <p className="text-muted-foreground">Calcula, aprueba y paga comisiones a técnicos y contratistas.</p>
        </div>
        <Button onClick={() => router.get(route('service-desk.comisiones.create'))} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Liquidación
        </Button>
      </div>

      <form onSubmit={handleFilter} className="flex gap-3 mb-6">
        <Input name="search" placeholder="Buscar por prestador…" defaultValue={filters.search || ''} className="max-w-xs" />
        <select name="estado" defaultValue={filters.estado || ''} className={selectClass}>
          <option value="">Todos los estados</option>
          {estados.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
      </form>

      {liquidaciones.data.length > 0 ? (
        <DataTable columns={columns} data={liquidaciones.data} />
      ) : (
        <div className="py-12"><EmptyState icon={DollarSign} title="Sin liquidaciones" description="Crea una liquidación de comisiones a partir de órdenes completadas." /></div>
      )}
    </AuthenticatedLayout>
  )
}
