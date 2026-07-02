import { useState } from 'react'
import { router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Modal } from '@/Components/ui/modal'
import PrestadorFormModal from './PrestadorFormModal'
import PrestadorEditModal from './PrestadorEditModal'
import { Wrench, Plus, Pencil, Trash2, Users, Briefcase, UserCheck, ExternalLink, Eye, AlertTriangle } from 'lucide-react'

const selectClass = 'h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm'

const VINCULACION_BADGE = {
  CONTRATISTA: { label: 'Contratista', class: 'bg-amber-100 text-amber-700 border-amber-200' },
  EMPLEADO: { label: 'Empleado', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  FREELANCE: { label: 'Freelance', class: 'bg-purple-100 text-purple-700 border-purple-200' },
  COMISIONISTA: { label: 'Comisionista', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

const VINCULACION_ICON = {
  CONTRATISTA: Briefcase,
  EMPLEADO: UserCheck,
  FREELANCE: ExternalLink,
  COMISIONISTA: Users,
}

export default function PrestadoresIndex({ prestadores, filters, tiposVinculacion }) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    const form = new FormData(e.target)
    router.get(route('service-desk.prestadores.index'), { search: form.get('search'), tipo: form.get('tipo') }, { preserveState: true })
  }

  const columns = [
    {
      key: 'prestador', header: 'Prestador',
      cell: (p) => {
        const Icon = VINCULACION_ICON[p.tipo_vinculacion] || Briefcase
        return (
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg"><Icon className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="font-semibold">{p.nombre_completo}</p>
              <p className="text-xs text-muted-foreground">{p.numero_documento ? `${p.tipo_documento} ${p.numero_documento}` : 'Sin documento'}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'vinculacion', header: 'Vinculación',
      cell: (p) => {
        const cfg = VINCULACION_BADGE[p.tipo_vinculacion] || { label: p.tipo_vinculacion, class: 'bg-slate-100 text-slate-700' }
        return <Badge variant="outline" className={cfg.class}>{cfg.label}</Badge>
      },
    },

    {
      key: 'activo', header: 'Estado', hideOnMobile: true,
      cell: (p) => p.activo
        ? <Badge className="bg-emerald-100 text-emerald-700 border-0">Activo</Badge>
        : <Badge variant="outline" className="text-slate-500">Inactivo</Badge>,
    },
    {
      key: 'actions', header: 'Acciones', alignEnd: true,
      cell: (p) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.get(route('service-desk.prestadores.show', p.id))}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTarget(p)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteTarget(p)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Prestadores</h2>
          <p className="text-muted-foreground">Técnicos internos y externos que realizan servicios.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo Prestador
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <Input name="search" placeholder="Buscar por nombre, documento o email…" defaultValue={filters.search || ''} className="max-w-xs" />
        <select name="tipo" defaultValue={filters.tipo || ''} className={selectClass}>
          <option value="">Todos los tipos</option>
          {Object.entries(tiposVinculacion).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <Button type="submit" variant="secondary" size="sm">Filtrar</Button>
      </form>

      {prestadores.data.length > 0 ? (
        <DataTable columns={columns} data={prestadores.data} />
      ) : (
        <div className="py-12"><EmptyState icon={Wrench} title="Sin prestadores" description="Agrega técnicos contratistas o empleados para asignarlos a órdenes." /></div>
      )}

      {/*** Modal de creación ***/}
      <PrestadorFormModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {/*** Modal de edición (inline, sin navegar) ***/}
      <PrestadorEditModal
        key={editTarget?.id ?? 'none'}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        prestador={editTarget}
      />

      {/*** Modal de confirmación de eliminación ***/}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar prestador"
        icon={AlertTriangle}
        className="max-w-sm"
      >
        <p className="text-sm text-muted-foreground">
          ¿Estás seguro de eliminar a <strong>{deleteTarget?.nombre_completo}</strong>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              router.delete(route('service-desk.prestadores.destroy', deleteTarget.id), {
                preserveScroll: true,
                onFinish: () => setDeleteTarget(null),
              })
            }}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </AuthenticatedLayout>
  )
}
