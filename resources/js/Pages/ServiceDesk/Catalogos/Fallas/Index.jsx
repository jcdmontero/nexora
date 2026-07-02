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
import { TriangleAlert, Plus, Pencil, Trash2, SearchX } from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export default function FallasIndex({ fallas = [], tipos = [] }) {
  const { can } = usePermissions()
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    nombre: '', descripcion: '', solucion_sugerida: '', tipo_equipo_id: '', tiempo_estimado: '', activo: true,
  })

  const rows = fallas.map((f) => ({ ...f, estado: f.activo ? 'activo' : 'inactivo' }))
  const table = useDataTable(rows, { searchAccessor: (f) => `${f.nombre} ${f.tipo_equipo}`, pageSize: 10 })

  const abrirCrear = () => { reset(); clearErrors(); setEditing(null); setOpen(true) }
  const abrirEditar = (f) => {
    clearErrors()
    setData({
      nombre: f.nombre, descripcion: f.descripcion || '', solucion_sugerida: f.solucion_sugerida || '',
      tipo_equipo_id: f.tipo_equipo_id ?? '', tiempo_estimado: f.tiempo_estimado ?? '', activo: f.activo,
    })
    setEditing(f); setOpen(true)
  }
  const cerrar = () => { setOpen(false); setEditing(null); reset() }

  const submit = (e) => {
    e.preventDefault()
    const opts = { preserveScroll: true, onSuccess: cerrar }
    if (editing) put(route('service-desk.fallas.update', editing.id), opts)
    else post(route('service-desk.fallas.store'), opts)
  }

  const columns = [
    {
      key: 'nombre', header: 'Falla', className: 'font-medium',
      cell: (f) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{f.nombre}</p>
          {f.descripcion && <p className="truncate text-xs text-muted-foreground max-w-[280px]">{f.descripcion}</p>}
        </div>
      ),
    },
    {
      key: 'tipo_equipo', header: 'Tipo de equipo', hideOnMobile: true,
      cell: (f) => (f.tipo_equipo ? <Badge variant="outline">{f.tipo_equipo}</Badge> : <span className="text-muted-foreground">General</span>),
    },
    { key: 'tiempo_estimado', header: 'Tiempo', alignEnd: true, hideOnMobile: true, cell: (f) => (f.tiempo_estimado ? `${f.tiempo_estimado} min` : '—') },
    { key: 'estado', header: 'Estado', cell: (f) => <Badge variant={f.activo ? 'default' : 'outline'}>{f.activo ? 'Activa' : 'Inactiva'}</Badge> },
    {
      key: 'actions', header: 'Acciones', alignEnd: true,
      cell: (f) => (
        <div className="flex items-center justify-end gap-1">
          {can('service-desk:edit') && (
            <button onClick={() => abrirEditar(f)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10" title="Editar">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {can('service-desk:delete') && (
            <ConfirmDialog
              deleteUrl={route('service-desk.fallas.destroy', f.id)}
              title={`¿Eliminar la falla ${f.nombre}?`}
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
      <Head title="Fallas comunes" />
      <PageHeader
        title="Fallas comunes"
        description="Catálogo de fallas frecuentes por tipo de equipo, con su solución sugerida."
        icon={TriangleAlert}
        actions={
          can('service-desk:create') && (
            <button onClick={abrirCrear} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Nueva falla
            </button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar falla…"
            total={table.totalResults}
            filters={
              tipos.length > 0 && (
                <FilterSelect
                  value={table.filters.tipo_equipo_id ?? 'all'}
                  onChange={(v) => table.setFilter('tipo_equipo_id', v)}
                  placeholder="Todos los tipos"
                  options={tipos.map((t) => ({ value: String(t.id), label: t.nombre }))}
                />
              )
            }
          />
        </div>
        {fallas.length === 0 ? (
          <EmptyState icon={TriangleAlert} title="Sin fallas registradas" description="Crea las fallas comunes por tipo de equipo (ej. No enciende, Pantalla rota)." action={can('service-desk:create') ? { label: 'Crear primera falla', onClick: abrirCrear } : undefined} />
        ) : table.totalResults === 0 ? (
          <EmptyState icon={SearchX} title="Sin coincidencias" description="Ninguna falla coincide con la búsqueda." />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(f) => f.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={cerrar}
        title={editing ? 'Editar falla' : 'Nueva falla'}
        icon={TriangleAlert}
        footer={
          <>
            <button type="button" onClick={cerrar} className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">Cancelar</button>
            <button type="submit" form="falla-form" disabled={processing} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {processing ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="falla-form" onSubmit={submit} className="space-y-4">
          <Field label="Nombre de la falla" htmlFor="nombre" required error={errors.nombre}>
            <Input id="nombre" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} placeholder="Ej. No enciende" autoFocus required />
          </Field>
          <Field label="Tipo de equipo" htmlFor="tipo_equipo_id" error={errors.tipo_equipo_id}>
            <select id="tipo_equipo_id" value={data.tipo_equipo_id} onChange={(e) => setData('tipo_equipo_id', e.target.value)} className={selectClass}>
              <option value="">General (todos)</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </Field>
          <Field label="Descripción" htmlFor="descripcion" error={errors.descripcion}>
            <textarea id="descripcion" value={data.descripcion} onChange={(e) => setData('descripcion', e.target.value)} rows={2} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </Field>
          <Field label="Solución sugerida" htmlFor="solucion_sugerida" error={errors.solucion_sugerida}>
            <textarea id="solucion_sugerida" value={data.solucion_sugerida} onChange={(e) => setData('solucion_sugerida', e.target.value)} rows={2} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </Field>
          <Field label="Tiempo estimado (min)" htmlFor="tiempo_estimado" error={errors.tiempo_estimado}>
            <Input id="tiempo_estimado" type="number" min="0" value={data.tiempo_estimado} onChange={(e) => setData('tiempo_estimado', e.target.value)} placeholder="Ej. 45" />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
            <input type="checkbox" checked={data.activo} onChange={(e) => setData('activo', e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-foreground">Falla activa</span>
          </label>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
