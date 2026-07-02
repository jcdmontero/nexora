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
import { Tag, Plus, Pencil, Trash2, Layers, SearchX } from 'lucide-react'

export default function MarcasIndex({ marcas = [] }) {
  const { can } = usePermissions()
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    nombre: '',
    activo: true,
  })

  const data2 = marcas.map((m) => ({ ...m, estado: m.activo ? 'activo' : 'inactivo' }))
  const table = useDataTable(data2, { searchAccessor: (m) => m.nombre, pageSize: 10 })

  const abrirCrear = () => {
    reset(); clearErrors(); setEditing(null); setOpen(true)
  }
  const abrirEditar = (m) => {
    clearErrors()
    setData({ nombre: m.nombre, activo: m.activo })
    setEditing(m); setOpen(true)
  }
  const cerrar = () => { setOpen(false); setEditing(null); reset() }

  const submit = (e) => {
    e.preventDefault()
    const opts = { preserveScroll: true, onSuccess: cerrar }
    if (editing) put(route('service-desk.marcas.update', editing.id), opts)
    else post(route('service-desk.marcas.store'), opts)
  }

  const columns = [
    { key: 'nombre', header: 'Marca', className: 'font-medium' },
    {
      key: 'modelos_count',
      header: 'Modelos',
      alignEnd: true,
      cell: (m) => (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-semibold tabular-nums">
          <Layers className="h-3 w-3 text-muted-foreground" />
          {m.modelos_count ?? 0}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (m) => <Badge variant={m.activo ? 'default' : 'outline'}>{m.activo ? 'Activa' : 'Inactiva'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (m) => (
        <div className="flex items-center justify-end gap-1">
          {can('service-desk:edit') && (
            <button
              onClick={() => abrirEditar(m)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {can('service-desk:delete') && (
            <ConfirmDialog
              deleteUrl={route('service-desk.marcas.destroy', m.id)}
              title={`¿Eliminar la marca ${m.nombre}?`}
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
      <Head title="Marcas de equipo" />
      <PageHeader
        title="Marcas de equipo"
        description="Catálogo de marcas de los equipos que repara tu taller (distinto de las marcas de producto del inventario)."
        icon={Tag}
        actions={
          can('service-desk:create') && (
            <button
              onClick={abrirCrear}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Nueva marca
            </button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar marca…"
            total={table.totalResults}
          />
        </div>
        {marcas.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Sin marcas registradas"
            description="Crea las marcas de equipos que atiende tu taller (Samsung, Apple, HP…)."
            action={can('service-desk:create') ? { label: 'Crear primera marca', onClick: abrirCrear } : undefined}
          />
        ) : table.totalResults === 0 ? (
          <EmptyState icon={SearchX} title="Sin coincidencias" description="Ninguna marca coincide con la búsqueda." />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(m) => m.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={cerrar}
        title={editing ? 'Editar marca' : 'Nueva marca'}
        description="Las marcas agrupan los modelos de equipos."
        icon={Tag}
        footer={
          <>
            <button type="button" onClick={cerrar} className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" form="marca-form" disabled={processing} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {processing ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="marca-form" onSubmit={submit} className="space-y-4">
          <Field label="Nombre" htmlFor="nombre" required error={errors.nombre}>
            <Input id="nombre" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} placeholder="Ej. Samsung" autoFocus required />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
            <input type="checkbox" checked={data.activo} onChange={(e) => setData('activo', e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm">
              <span className="font-medium text-foreground">Marca activa</span>
              <span className="block text-xs text-muted-foreground">Las marcas inactivas no aparecen al crear modelos.</span>
            </span>
          </label>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
