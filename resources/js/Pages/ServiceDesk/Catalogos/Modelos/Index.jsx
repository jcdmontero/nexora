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
import { Boxes, Plus, Pencil, Trash2, Tag, Smartphone, SearchX } from 'lucide-react'

const selectClass =
  'flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export default function ModelosIndex({ modelos = [], marcas = [], tipos = [] }) {
  const { can } = usePermissions()
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
    nombre: '',
    marca_id: '',
    tipo_equipo_id: '',
    activo: true,
  })

  const rows = modelos.map((m) => ({ ...m, estado: m.activo ? 'activo' : 'inactivo' }))
  const table = useDataTable(rows, {
    searchAccessor: (m) => `${m.nombre} ${m.marca} ${m.tipo_equipo}`,
    pageSize: 10,
  })

  const abrirCrear = () => { reset(); clearErrors(); setEditing(null); setOpen(true) }
  const abrirEditar = (m) => {
    clearErrors()
    setData({
      nombre: m.nombre,
      marca_id: m.marca_id ?? '',
      tipo_equipo_id: m.tipo_equipo_id ?? '',
      activo: m.activo,
    })
    setEditing(m); setOpen(true)
  }
  const cerrar = () => { setOpen(false); setEditing(null); reset() }

  const submit = (e) => {
    e.preventDefault()
    const opts = { preserveScroll: true, onSuccess: cerrar }
    if (editing) put(route('service-desk.modelos.update', editing.id), opts)
    else post(route('service-desk.modelos.store'), opts)
  }

  const sinCatalogos = marcas.length === 0 && tipos.length === 0

  const columns = [
    { key: 'nombre', header: 'Modelo', className: 'font-medium' },
    {
      key: 'marca',
      header: 'Marca',
      cell: (m) => (m.marca ? <Badge variant="secondary" className="gap-1"><Tag className="h-3 w-3" />{m.marca}</Badge> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: 'tipo_equipo',
      header: 'Tipo de equipo',
      hideOnMobile: true,
      cell: (m) => (m.tipo_equipo ? <Badge variant="outline" className="gap-1"><Smartphone className="h-3 w-3" />{m.tipo_equipo}</Badge> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (m) => <Badge variant={m.activo ? 'default' : 'outline'}>{m.activo ? 'Activo' : 'Inactivo'}</Badge>,
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
              deleteUrl={route('service-desk.modelos.destroy', m.id)}
              title={`¿Eliminar el modelo ${m.nombre}?`}
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
      <Head title="Modelos" />
      <PageHeader
        title="Modelos"
        description="Modelos de equipos, asociados a una marca y un tipo de equipo."
        icon={Boxes}
        actions={
          can('service-desk:create') && !sinCatalogos && (
            <button
              onClick={abrirCrear}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Nuevo modelo
            </button>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar modelo…"
            total={table.totalResults}
            filters={
              <>
                {marcas.length > 0 && (
                  <FilterSelect
                    value={table.filters.marca_id ?? 'all'}
                    onChange={(v) => table.setFilter('marca_id', v)}
                    placeholder="Todas las marcas"
                    options={marcas.map((m) => ({ value: String(m.id), label: m.nombre }))}
                  />
                )}
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
        {sinCatalogos ? (
          <EmptyState
            icon={Boxes}
            title="Primero crea marcas y tipos"
            description="Para registrar modelos necesitas al menos una marca o un tipo de equipo en sus respectivos catálogos."
          />
        ) : modelos.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="Sin modelos registrados"
            description="Crea los modelos de equipos que atiende tu taller (iPhone 13, Galaxy A52…)."
            action={can('service-desk:create') ? { label: 'Crear primer modelo', onClick: abrirCrear } : undefined}
          />
        ) : table.totalResults === 0 ? (
          <EmptyState icon={SearchX} title="Sin coincidencias" description="Ningún modelo coincide con los filtros." />
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
        title={editing ? 'Editar modelo' : 'Nuevo modelo'}
        description="Asócialo a una marca y un tipo de equipo."
        icon={Boxes}
        footer={
          <>
            <button type="button" onClick={cerrar} className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
              Cancelar
            </button>
            <button type="submit" form="modelo-form" disabled={processing} className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
              {processing ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}
            </button>
          </>
        }
      >
        <form id="modelo-form" onSubmit={submit} className="space-y-4">
          <Field label="Nombre" htmlFor="nombre" required error={errors.nombre}>
            <Input id="nombre" value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} placeholder="Ej. Galaxy A52" autoFocus required />
          </Field>
          <Field label="Marca" htmlFor="marca_id" error={errors.marca_id}>
            <select id="marca_id" value={data.marca_id} onChange={(e) => setData('marca_id', e.target.value)} className={selectClass}>
              <option value="">Sin marca</option>
              {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </Field>
          <Field label="Tipo de equipo" htmlFor="tipo_equipo_id" error={errors.tipo_equipo_id}>
            <select id="tipo_equipo_id" value={data.tipo_equipo_id} onChange={(e) => setData('tipo_equipo_id', e.target.value)} className={selectClass}>
              <option value="">Sin tipo</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </Field>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
            <input type="checkbox" checked={data.activo} onChange={(e) => setData('activo', e.target.checked)} className="h-4 w-4 rounded border-input text-primary focus:ring-primary" />
            <span className="text-sm">
              <span className="font-medium text-foreground">Modelo activo</span>
            </span>
          </label>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
