import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { PageHeader } from '@/Components/ui/page-header'
import { ListToolbar, FilterSelect } from '@/Components/ui/list-toolbar'
import { Pagination } from '@/Components/ui/pagination'
import { ConfirmDialog } from '@/Components/ui/confirm-dialog'
import { Modal } from '@/Components/ui/modal'
import { Field } from '@/Components/ui/form-section'
import { useDataTable } from '@/Hooks/useDataTable'
import { usePermissions } from '@/Hooks/usePermissions'
import { ListChecks, Plus, Pencil, Trash2, SearchX, TriangleAlert, Package } from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export default function ChecklistIndex({ items = [], tipos = [] }) {
  const { can } = usePermissions()
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    nombre: '', categoria: 'fallas', subtipo: '', icono: '', descripcion: '',
    tipo_equipo_id: '', orden: 0, activo: true,
  })

  const rows = items.map((i) => ({ ...i, estado: i.activo ? 'activo' : 'inactivo' }))
  const table = useDataTable(rows, { searchAccessor: (i) => `${i.nombre} ${i.tipo_equipo}`, pageSize: 12 })

  const abrirCrear = () => { reset(); clearErrors(); setEditing(null); setOpen(true) }
  const abrirEditar = (i) => {
    clearErrors()
    setData({
      nombre: i.nombre, categoria: i.categoria, subtipo: i.subtipo || '', icono: i.icono || '',
      descripcion: i.descripcion || '', tipo_equipo_id: i.tipo_equipo_id ?? '', orden: i.orden ?? 0, activo: i.activo,
    })
    setEditing(i); setOpen(true)
  }
  const cerrar = () => { setOpen(false); setEditing(null); reset() }

  const submit = (e) => {
    e.preventDefault()
    const opts = { preserveScroll: true, onSuccess: cerrar }
    if (editing) put(route('service-desk.checklist.update', editing.id), opts)
    else post(route('service-desk.checklist.store'), opts)
  }

  const columns = [
    {
      key: 'nombre', header: 'Ítem', className: 'font-medium',
      cell: (i) => (
        <div className="flex items-center gap-2">
          {i.categoria === 'fallas'
            ? <TriangleAlert className="h-4 w-4 text-amber-500" />
            : <Package className="h-4 w-4 text-sky-500" />}
          <span className="font-medium text-foreground">{i.nombre}</span>
        </div>
      ),
    },
    {
      key: 'categoria', header: 'Categoría',
      cell: (i) => <Badge variant={i.categoria === 'fallas' ? 'secondary' : 'outline'}>{i.categoria === 'fallas' ? 'Falla' : 'Accesorio'}</Badge>,
    },
    {
      key: 'tipo_equipo', header: 'Tipo de equipo', hideOnMobile: true,
      cell: (i) => (i.tipo_equipo ? <Badge variant="outline">{i.tipo_equipo}</Badge> : <span className="text-muted-foreground">General</span>),
    },
    { key: 'orden', header: 'Orden', alignEnd: true, hideOnMobile: true, cell: (i) => <span className="tabular-nums text-muted-foreground">{i.orden}</span> },
    { key: 'estado', header: 'Estado', cell: (i) => <Badge variant={i.activo ? 'default' : 'outline'}>{i.activo ? 'Activo' : 'Inactivo'}</Badge> },
    {
      key: 'actions', header: 'Acciones', alignEnd: true,
      cell: (i) => (
        <div className="flex items-center justify-end gap-1">
          {can('service-desk:edit') && (
            <button onClick={() => abrirEditar(i)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10" title="Editar">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {can('service-desk:delete') && (
            <ConfirmDialog
              deleteUrl={route('service-desk.checklist.destroy', i.id)}
              title={`¿Eliminar el ítem ${i.nombre}?`}
              trigger={
                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-destructive/10 hover:text-destructive" title="Eliminar">
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
      <Head title="Checklist de recepción" />
      <PageHeader
        title="Checklist de recepción"
        description="Ítems de fallas y accesorios que se activan automáticamente al recibir un equipo según su tipo."
        icon={ListChecks}
        actions={
          can('service-desk:create') && (
            <button onClick={abrirCrear} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Nuevo ítem
            </button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar ítem…"
            total={table.totalResults}
            filters={
              <>
                <FilterSelect
                  value={table.filters.categoria ?? 'all'}
                  onChange={(v) => table.setFilter('categoria', v)}
                  placeholder="Todas las categorías"
                  options={[
                    { value: 'fallas', label: 'Fallas' },
                    { value: 'accesorios', label: 'Accesorios' },
                  ]}
                />
                {tipos.length > 0 && (
                  <FilterSelect
                    value={table.filters.tipo_equipo_id ?? 'all'}
                    onChange={(v) => table.setFilter('tipo_equipo_id', v)}
                    placeholder="Todos los tipos"
                    options={tipos.map((t) => ({ value: String(t.id), label: t.nombre }))}
                  />
                )}
              </>
            }
          />
        </div>
        {items.length === 0 ? (
          <EmptyState icon={ListChecks} title="Sin ítems de checklist" description="Crea los ítems (fallas y accesorios) que se mostrarán al recibir un equipo de cada tipo." action={can('service-desk:create') ? { label: 'Crear primer ítem', onClick: abrirCrear } : undefined} />
        ) : table.totalResults === 0 ? (
          <EmptyState icon={SearchX} title="Sin coincidencias" description="Ningún ítem coincide con los filtros." />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(i) => i.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={cerrar}
        title={editing ? 'Editar ítem de checklist' : 'Nuevo ítem de checklist'}
        description="Aparecerá al recibir equipos del tipo seleccionado."
        icon={ListChecks}
        footer={
          <>
            <button type="button" onClick={cerrar} className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">Cancelar</button>
            <button type="submit" form="checklist-form" disabled={processing} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {processing ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="checklist-form" onSubmit={submit} className="space-y-4">
          <Field label="Nombre" htmlFor="nombre" required error={errors.nombre}>
            <Input id="nombre" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} placeholder="Ej. Cargador / No enciende" autoFocus required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoría" htmlFor="categoria" required error={errors.categoria}>
              <select id="categoria" value={data.categoria} onChange={(e) => setData('categoria', e.target.value)} className={selectClass} required>
                <option value="fallas">Falla</option>
                <option value="accesorios">Accesorio</option>
              </select>
            </Field>
            <Field label="Orden" htmlFor="orden" error={errors.orden}>
              <Input id="orden" type="number" min="0" value={data.orden} onChange={(e) => setData('orden', e.target.value)} />
            </Field>
          </div>
          <Field label="Tipo de equipo" htmlFor="tipo_equipo_id" error={errors.tipo_equipo_id} hint="Define en qué tipo de equipo se mostrará este ítem.">
            <select id="tipo_equipo_id" value={data.tipo_equipo_id} onChange={(e) => setData('tipo_equipo_id', e.target.value)} className={selectClass}>
              <option value="">General (todos)</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </Field>
          <Field label="Descripción" htmlFor="descripcion" error={errors.descripcion}>
            <textarea id="descripcion" value={data.descripcion} onChange={(e) => setData('descripcion', e.target.value)} rows={2} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
            <input type="checkbox" checked={data.activo} onChange={(e) => setData('activo', e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-foreground">Ítem activo</span>
          </label>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
