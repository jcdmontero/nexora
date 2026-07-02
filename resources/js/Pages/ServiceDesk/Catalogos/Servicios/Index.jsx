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
import { MediaUploader } from '@/Components/ui/media-uploader'
import { useDataTable } from '@/Hooks/useDataTable'
import { usePermissions } from '@/Hooks/usePermissions'
import { Wrench, Plus, Pencil, Trash2, SearchX } from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const money = (n) => '$' + Number(n || 0).toLocaleString('es-CO')

export default function ServiciosIndex({ servicios = [], tipos = [] }) {
  const { can } = usePermissions()
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    nombre: '', codigo: '', descripcion: '', tipo_equipo_id: '',
    precio_base: 0, costo_tecnico_base: 0, tipo_comision_tecnico: 'fijo',
    tiempo_estimado: '', requiere_repuestos: false, activo: true,
  })

  const rows = servicios.map((s) => ({ ...s, estado: s.activo ? 'activo' : 'inactivo' }))
  const table = useDataTable(rows, { searchAccessor: (s) => `${s.nombre} ${s.codigo} ${s.tipo_equipo}`, pageSize: 10 })

  const abrirCrear = () => { reset(); clearErrors(); setEditing(null); setOpen(true) }
  const abrirEditar = (s) => {
    clearErrors()
    setData({
      nombre: s.nombre, codigo: s.codigo || '', descripcion: s.descripcion || '',
      tipo_equipo_id: s.tipo_equipo_id ?? '', precio_base: s.precio_base ?? 0,
      costo_tecnico_base: s.costo_tecnico_base ?? 0, tipo_comision_tecnico: s.tipo_comision_tecnico ?? 'fijo',
      tiempo_estimado: s.tiempo_estimado ?? '', requiere_repuestos: s.requiere_repuestos, activo: s.activo,
    })
    setEditing(s); setOpen(true)
  }
  const cerrar = () => { setOpen(false); setEditing(null); reset() }

  const submit = (e) => {
    e.preventDefault()
    const opts = { preserveScroll: true, onSuccess: cerrar }
    if (editing) put(route('service-desk.servicios.update', editing.id), opts)
    else post(route('service-desk.servicios.store'), opts)
  }

  const columns = [
    {
      key: 'nombre', header: 'Servicio', className: 'font-medium',
      cell: (s) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{s.nombre}</p>
          {s.codigo && <p className="text-xs text-muted-foreground font-mono">{s.codigo}</p>}
        </div>
      ),
    },
    {
      key: 'tipo_equipo', header: 'Tipo de equipo', hideOnMobile: true,
      cell: (s) => (s.tipo_equipo ? <Badge variant="outline">{s.tipo_equipo}</Badge> : <span className="text-muted-foreground">General</span>),
    },
    { key: 'precio_base', header: 'Precio', alignEnd: true, cell: (s) => <span className="tabular-nums font-medium">{money(s.precio_base)}</span> },
    { key: 'costo_tecnico_base', header: 'Costo téc.', alignEnd: true, hideOnMobile: true, cell: (s) => <span className="tabular-nums text-muted-foreground">{money(s.costo_tecnico_base)}</span> },
    {
      key: 'estado', header: 'Estado',
      cell: (s) => <Badge variant={s.activo ? 'default' : 'outline'}>{s.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions', header: 'Acciones', alignEnd: true,
      cell: (s) => (
        <div className="flex items-center justify-end gap-1">
          {can('service-desk:edit') && (
            <button onClick={() => abrirEditar(s)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10" title="Editar">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {can('service-desk:delete') && (
            <ConfirmDialog
              deleteUrl={route('service-desk.servicios.destroy', s.id)}
              title={`¿Eliminar el servicio ${s.nombre}?`}
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
      <Head title="Servicios" />
      <PageHeader
        title="Servicios"
        description="Catálogo de servicios (mano de obra) que ofrece tu taller."
        icon={Wrench}
        actions={
          can('service-desk:create') && (
            <button onClick={abrirCrear} className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Nuevo servicio
            </button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar servicio…"
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
        {servicios.length === 0 ? (
          <EmptyState icon={Wrench} title="Sin servicios" description="Crea los servicios de mano de obra de tu taller (ej. Cambio de pantalla, Limpieza interna)." action={can('service-desk:create') ? { label: 'Crear primer servicio', onClick: abrirCrear } : undefined} />
        ) : table.totalResults === 0 ? (
          <EmptyState icon={SearchX} title="Sin coincidencias" description="Ningún servicio coincide con la búsqueda." />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(s) => s.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={cerrar}
        title={editing ? 'Editar servicio' : 'Nuevo servicio'}
        icon={Wrench}
        className="max-w-2xl"
        footer={
          <>
            <button type="button" onClick={cerrar} className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">Cancelar</button>
            <button type="submit" form="servicio-form" disabled={processing} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {processing ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="servicio-form" onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="nombre" required error={errors.nombre} full>
            <Input id="nombre" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} placeholder="Ej. Cambio de pantalla" autoFocus required />
          </Field>
          <Field label="Código" htmlFor="codigo" error={errors.codigo}>
            <Input id="codigo" value={data.codigo} onChange={(e) => setData('codigo', e.target.value)} placeholder="Ej. SRV-001" />
          </Field>
          <Field label="Tipo de equipo" htmlFor="tipo_equipo_id" error={errors.tipo_equipo_id} hint="Opcional: limita el servicio a un tipo.">
            <select id="tipo_equipo_id" value={data.tipo_equipo_id} onChange={(e) => setData('tipo_equipo_id', e.target.value)} className={selectClass}>
              <option value="">General (todos)</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </Field>
          <Field label="Precio al cliente" htmlFor="precio_base" required error={errors.precio_base}>
            <Input id="precio_base" type="number" min="0" step="0.01" value={data.precio_base} onChange={(e) => setData('precio_base', e.target.value)} required />
          </Field>
          <Field label="Costo técnico (comisión)" htmlFor="costo_tecnico_base" required error={errors.costo_tecnico_base}>
            <Input id="costo_tecnico_base" type="number" min="0" step="0.01" value={data.costo_tecnico_base} onChange={(e) => setData('costo_tecnico_base', e.target.value)} required />
          </Field>
          <Field label="Tipo de comisión" htmlFor="tipo_comision_tecnico" error={errors.tipo_comision_tecnico}>
            <select id="tipo_comision_tecnico" value={data.tipo_comision_tecnico} onChange={(e) => setData('tipo_comision_tecnico', e.target.value)} className={selectClass}>
              <option value="fijo">Valor fijo</option>
              <option value="porcentaje">Porcentaje</option>
            </select>
          </Field>
          <Field label="Tiempo estimado (min)" htmlFor="tiempo_estimado" error={errors.tiempo_estimado}>
            <Input id="tiempo_estimado" type="number" min="0" value={data.tiempo_estimado} onChange={(e) => setData('tiempo_estimado', e.target.value)} placeholder="Ej. 60" />
          </Field>
          <Field label="Descripción" htmlFor="descripcion" error={errors.descripcion} full>
            <textarea id="descripcion" value={data.descripcion} onChange={(e) => setData('descripcion', e.target.value)} rows={2} className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3 sm:col-span-2">
            <input type="checkbox" checked={data.requiere_repuestos} onChange={(e) => setData('requiere_repuestos', e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-foreground">Requiere repuestos</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3 sm:col-span-2">
            <input type="checkbox" checked={data.activo} onChange={(e) => setData('activo', e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-foreground">Servicio activo</span>
          </label>
          {editing && (
            <div className="sm:col-span-2 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Imagen del servicio</p>
              <MediaUploader
                uploadUrl={route('service-desk.servicios.imagen.upload', editing.id)}
                deleteUrl={route('service-desk.servicios.imagen.destroy', editing.id)}
                items={editing.imagen_url ? [{ id: 0, ruta: editing.imagen_url, tipo: 'imagen' }] : []}
                maxMb={10}
                accept="image/*"
              />
            </div>
          )}
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
