import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { ListToolbar } from '@/Components/ui/list-toolbar'
import { Pagination } from '@/Components/ui/pagination'
import { ConfirmDialog } from '@/Components/ui/confirm-dialog'
import { Modal } from '@/Components/ui/modal'
import { Field } from '@/Components/ui/form-section'
import { useDataTable } from '@/Hooks/useDataTable'
import { usePermissions } from '@/Hooks/usePermissions'
import { Smartphone, Plus, Pencil, Trash2, Layers, SearchX } from 'lucide-react'

export default function TiposEquipoIndex({ tipos = [] }) {
  const { can } = usePermissions()
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    nombre: '',
    familia: '',
    descripcion: '',
    activo: true,
  })

  const rows = tipos.map((t) => ({ ...t, estado: t.activo ? 'activo' : 'inactivo' }))
  const table = useDataTable(rows, { searchAccessor: (t) => `${t.nombre} ${t.familia}`, pageSize: 10 })

  const abrirCrear = () => { reset(); clearErrors(); setEditing(null); setOpen(true) }
  const abrirEditar = (t) => {
    clearErrors()
    setData({ nombre: t.nombre, familia: t.familia || '', descripcion: t.descripcion || '', activo: t.activo })
    setEditing(t); setOpen(true)
  }
  const cerrar = () => { setOpen(false); setEditing(null); reset() }

  const submit = (e) => {
    e.preventDefault()
    const opts = { preserveScroll: true, onSuccess: cerrar }
    if (editing) put(route('service-desk.tipos-equipo.update', editing.id), opts)
    else post(route('service-desk.tipos-equipo.store'), opts)
  }

  const columns = [
    {
      key: 'nombre',
      header: 'Tipo de equipo',
      className: 'font-medium',
      cell: (t) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{t.nombre}</p>
          {t.descripcion && <p className="truncate text-xs text-muted-foreground max-w-[260px]">{t.descripcion}</p>}
        </div>
      ),
    },
    {
      key: 'familia',
      header: 'Familia',
      hideOnMobile: true,
      cell: (t) => (t.familia ? <Badge variant="secondary">{t.familia}</Badge> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: 'modelos_count',
      header: 'Modelos',
      alignEnd: true,
      hideOnMobile: true,
      cell: (t) => (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-semibold tabular-nums">
          <Layers className="h-3 w-3 text-muted-foreground" />
          {t.modelos_count ?? 0}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (t) => <Badge variant={t.activo ? 'default' : 'outline'}>{t.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (t) => (
        <div className="flex items-center justify-end gap-1">
          {can('service-desk:edit') && (
            <button
              onClick={() => abrirEditar(t)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {can('service-desk:delete') && (
            <ConfirmDialog
              deleteUrl={route('service-desk.tipos-equipo.destroy', t.id)}
              title={`¿Eliminar ${t.nombre}?`}
              description="No podrá eliminarse si tiene modelos asociados."
              trigger={
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-destructive/10 hover:text-destructive"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              }
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Tipos de equipo" />
      <PageHeader
        title="Tipos de equipo"
        description="Define qué tipos de equipos repara tu taller (la raíz de tus catálogos)."
        icon={Smartphone}
        actions={
          can('service-desk:create') && (
            <button
              onClick={abrirCrear}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Nuevo tipo
            </button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar tipo o familia…"
            total={table.totalResults}
          />
        </div>
        {tipos.length === 0 ? (
          <EmptyState
            icon={Smartphone}
            title="Sin tipos de equipo"
            description="Crea los tipos de equipo que atiende tu taller (Celular, Computador, Impresora…)."
            action={can('service-desk:create') ? { label: 'Crear primer tipo', onClick: abrirCrear } : undefined}
          />
        ) : table.totalResults === 0 ? (
          <EmptyState icon={SearchX} title="Sin coincidencias" description="Ningún tipo coincide con la búsqueda." />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(t) => t.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={cerrar}
        title={editing ? 'Editar tipo de equipo' : 'Nuevo tipo de equipo'}
        description="Es la base de tus catálogos: de aquí cuelgan modelos y fallas."
        icon={Smartphone}
        footer={
          <>
            <button type="button" onClick={cerrar} className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" form="tipo-form" disabled={processing} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {processing ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="tipo-form" onSubmit={submit} className="space-y-4">
          <Field label="Nombre" htmlFor="nombre" required error={errors.nombre}>
            <Input id="nombre" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} placeholder="Ej. Celular" autoFocus required />
          </Field>
          <Field label="Familia" htmlFor="familia" error={errors.familia} hint="Agrupa tipos relacionados (ej. Electrónica, Cómputo).">
            <Input id="familia" value={data.familia} onChange={(e) => setData('familia', e.target.value)} placeholder="Ej. Electrónica" />
          </Field>
          <Field label="Descripción" htmlFor="descripcion" error={errors.descripcion}>
            <textarea
              id="descripcion"
              value={data.descripcion}
              onChange={(e) => setData('descripcion', e.target.value)}
              rows={3}
              placeholder="Notas sobre este tipo de equipo…"
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
            <input type="checkbox" checked={data.activo} onChange={(e) => setData('activo', e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm">
              <span className="font-medium text-foreground">Tipo activo</span>
              <span className="block text-xs text-muted-foreground">Los tipos inactivos no aparecen al crear modelos.</span>
            </span>
          </label>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
