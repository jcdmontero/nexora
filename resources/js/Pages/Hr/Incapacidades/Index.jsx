import { useState, useMemo } from 'react'
import { router, useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Textarea } from '@/Components/ui/textarea'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Pagination } from '@/Components/ui/pagination'
import { PageHeader } from '@/Components/ui/page-header'
import {
  Stethoscope,
  Plus,
  Search,
  Pencil,
  Trash2,
  CalendarDays,
} from 'lucide-react'

// Select nativo con misma apariencia que Input
const selectClass =
  'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

// Catálogo de tipos de incapacidad
const TIPOS_INCAPACIDAD = [
  { value: 'Enfermedad General', label: 'Enfermedad General' },
  { value: 'Accidente Laboral', label: 'Accidente Laboral' },
  { value: 'Enfermedad Laboral', label: 'Enfermedad Laboral' },
  { value: 'Licencia Maternidad', label: 'Licencia Maternidad' },
  { value: 'Licencia Paternidad', label: 'Licencia Paternidad' },
  { value: 'Otro', label: 'Otro' },
]

// Variantes de Badge por tipo
const tipoBadgeClass = {
  'Enfermedad General':
    'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  'Accidente Laboral':
    'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  'Enfermedad Laboral':
    'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  'Licencia Maternidad':
    'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  'Licencia Paternidad':
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
}

/**
 * Página de gestión de incapacidades y licencias.
 * @param {{ incapacidades: { data: Array, current_page: number, last_page: number, total: number }, empleados?: Array<{ id: number, nombres: string, apellidos: string, documento: string }>, filters: { search?: string, tipo?: string } }} props
 */
export default function IncapacidadesIndex({ incapacidades, empleados = [], filters }) {
  // ─── Búsqueda y filtro ───
  const [search, setSearch] = useState(filters?.search || '')
  const [tipoFilter, setTipoFilter] = useState(filters?.tipo || '')
  const [editing, setEditing] = useState(null)

  const handleFilter = (e) => {
    e.preventDefault()
    router.get(
      route('hr.incapacidades.index'),
      { search, tipo: tipoFilter },
      { preserveState: true },
    )
  }

  // ─── Formulario de creación ───
  const { data, setData, post, processing, errors, reset } = useForm({
    empleado_id: '',
    tipo: 'Enfermedad General',
    fecha_inicio: '',
    fecha_fin: '',
    porcentaje_pago: '',
    observaciones: '',
  })

  // Auto-calcular días en creación
  const diasCalculados = useMemo(() => {
    if (data.fecha_inicio && data.fecha_fin) {
      const inicio = new Date(data.fecha_inicio + 'T00:00:00')
      const fin = new Date(data.fecha_fin + 'T00:00:00')
      if (fin >= inicio) {
        return Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
    }
    return 0
  }, [data.fecha_inicio, data.fecha_fin])

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('hr.incapacidades.store'), {
      onSuccess: () => reset(),
    })
  }

  // ─── Editar ───
  const {
    data: editData,
    setData: setEditData,
    put: editPut,
    processing: editProcessing,
    errors: editErrors,
  } = useForm({
    tipo: '',
    fecha_inicio: '',
    fecha_fin: '',
    porcentaje_pago: '',
    observaciones: '',
  })

  const openEdit = (inc) => {
    setEditing(inc)
    setEditData({
      tipo: inc.tipo,
      fecha_inicio: inc.fecha_inicio,
      fecha_fin: inc.fecha_fin,
      porcentaje_pago: inc.porcentaje_pago != null ? String(inc.porcentaje_pago) : '',
      observaciones: inc.observaciones ?? '',
    })
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (!editing) return
    editPut(route('hr.incapacidades.update', editing.id), {
      onSuccess: () => setEditing(null),
      preserveScroll: true,
    })
  }

  // ─── Eliminar ───
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta incapacidad?')) {
      router.delete(route('hr.incapacidades.destroy', id), { preserveScroll: true })
    }
  }

  // Días edit auto-calc
  const editDias = useMemo(() => {
    if (editData.fecha_inicio && editData.fecha_fin) {
      const inicio = new Date(editData.fecha_inicio + 'T00:00:00')
      const fin = new Date(editData.fecha_fin + 'T00:00:00')
      if (fin >= inicio) {
        return Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
    }
    return 0
  }, [editData.fecha_inicio, editData.fecha_fin])

  // ─── Columnas DataTable ───
  const columns = [
    {
      key: 'empleado',
      header: 'Empleado',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 text-sm font-bold dark:bg-rose-500/10 dark:text-rose-400">
            {row.empleado?.nombres?.charAt(0) ?? '?'}
            {row.empleado?.apellidos?.charAt(0) ?? ''}
          </div>
          <div>
            <p className="font-medium text-foreground text-sm">
              {row.empleado?.nombres ?? ''} {row.empleado?.apellidos ?? ''}
            </p>
            <p className="text-xs text-muted-foreground">{row.empleado?.documento ?? ''}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      cell: (row) => (
        <Badge variant="secondary" className={tipoBadgeClass[row.tipo] ?? ''}>
          {row.tipo}
        </Badge>
      ),
    },
    {
      key: 'fechas',
      header: 'Fechas',
      cell: (row) => {
        const fmt = (d) =>
          new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
          })
        return (
          <span className="text-sm tabular-nums">
            {fmt(row.fecha_inicio)} — {fmt(row.fecha_fin)}
          </span>
        )
      },
    },
    {
      key: 'dias',
      header: 'Días',
      className: 'w-16',
      cell: (row) => (
        <span className="tabular-nums font-medium">{row.dias}</span>
      ),
    },
    {
      key: 'porcentaje_pago',
      header: '% Pago',
      className: 'w-20',
      cell: (row) =>
        row.porcentaje_pago != null ? (
          <span className="tabular-nums">{Number(row.porcentaje_pago).toFixed(0)}%</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'acciones',
      header: '',
      alignEnd: true,
      className: 'w-24',
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => openEdit(row)}
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(row.id)}
            title="Eliminar"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Incapacidades" />

      <PageHeader
        title="Incapacidades y Licencias"
        description="Registra y administra incapacidades, licencias de maternidad, paternidad y más"
        icon={Stethoscope}
      />

      {/* Grid: Formulario + Tabla */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario de creación */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  Nueva Incapacidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Empleado */}
                  <div className="space-y-1.5">
                    <Label htmlFor="empleado_id">
                      Empleado <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="empleado_id"
                      value={data.empleado_id}
                      onChange={(e) => setData('empleado_id', e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="">Seleccionar empleado…</option>
                      {empleados.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombres} {emp.apellidos} — {emp.documento}
                        </option>
                      ))}
                    </select>
                    {errors.empleado_id && (
                      <p className="text-xs text-destructive">{errors.empleado_id}</p>
                    )}
                  </div>

                  {/* Tipo */}
                  <div className="space-y-1.5">
                    <Label htmlFor="tipo">
                      Tipo <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="tipo"
                      value={data.tipo}
                      onChange={(e) => setData('tipo', e.target.value)}
                      className={selectClass}
                      required
                    >
                      {TIPOS_INCAPACIDAD.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipo && <p className="text-xs text-destructive">{errors.tipo}</p>}
                  </div>

                  {/* Fechas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="fecha_inicio">
                        Fecha Inicio <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="fecha_inicio"
                        type="date"
                        value={data.fecha_inicio}
                        onChange={(e) => setData('fecha_inicio', e.target.value)}
                        required
                      />
                      {errors.fecha_inicio && (
                        <p className="text-xs text-destructive">{errors.fecha_inicio}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fecha_fin">
                        Fecha Fin <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        id="fecha_fin"
                        type="date"
                        value={data.fecha_fin}
                        onChange={(e) => setData('fecha_fin', e.target.value)}
                        required
                      />
                      {errors.fecha_fin && (
                        <p className="text-xs text-destructive">{errors.fecha_fin}</p>
                      )}
                    </div>
                  </div>

                  {/* Días calculados */}
                  {diasCalculados > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-indigo-500" />
                      <span className="text-foreground font-medium">{diasCalculados}</span>
                      <span className="text-muted-foreground">
                        {diasCalculados === 1 ? 'día' : 'días'}
                      </span>
                    </div>
                  )}

                  {/* % Pago */}
                  <div className="space-y-1.5">
                    <Label htmlFor="porcentaje_pago">% de Pago</Label>
                    <div className="relative">
                      <Input
                        id="porcentaje_pago"
                        type="number"
                        min="0"
                        max="100"
                        placeholder="100"
                        value={data.porcentaje_pago}
                        onChange={(e) => setData('porcentaje_pago', e.target.value)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        %
                      </span>
                    </div>
                    {errors.porcentaje_pago && (
                      <p className="text-xs text-destructive">{errors.porcentaje_pago}</p>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-1.5">
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      placeholder="Diagnóstico, recomendaciones, etc."
                      value={data.observaciones}
                      onChange={(e) => setData('observaciones', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={processing} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    {processing ? 'Registrando…' : 'Registrar Incapacidad'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Tabla de incapacidades */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Historial de Incapacidades</CardTitle>
                <form onSubmit={handleFilter} className="flex flex-wrap gap-2">
                  <select
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value)}
                    className={selectClass + ' max-w-40'}
                  >
                    <option value="">Todos los tipos</option>
                    {TIPOS_INCAPACIDAD.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Buscar empleado…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-44"
                  />
                  <Button type="submit" variant="secondary" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {incapacidades?.data?.length > 0 ? (
                <div>
                  <DataTable
                    columns={columns}
                    data={incapacidades.data}
                    rowKey={(r) => r.id}
                  />
                  <Pagination
                    page={incapacidades.current_page}
                    totalPages={incapacidades.last_page}
                    onPage={(p) =>
                      router.get(
                        route('hr.incapacidades.index'),
                        { page: p, search, tipo: tipoFilter },
                        { preserveState: true },
                      )
                    }
                  />
                </div>
              ) : (
                <EmptyState
                  icon={Stethoscope}
                  title="No hay incapacidades registradas"
                  description="Aún no se han registrado incapacidades. Usa el formulario para crear la primera."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── Modal de edición ─── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-popover p-6 shadow-lg ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Pencil className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">Editar Incapacidad</h3>
                <p className="text-sm text-muted-foreground">
                  {editing.empleado?.nombres} {editing.empleado?.apellidos}
                </p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-tipo">Tipo</Label>
                <select
                  id="edit-tipo"
                  value={editData.tipo}
                  onChange={(e) => setEditData('tipo', e.target.value)}
                  className={selectClass}
                  required
                >
                  {TIPOS_INCAPACIDAD.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {editErrors.tipo && (
                  <p className="text-xs text-destructive">{editErrors.tipo}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-fecha_inicio">Fecha Inicio</Label>
                  <Input
                    id="edit-fecha_inicio"
                    type="date"
                    value={editData.fecha_inicio}
                    onChange={(e) => setEditData('fecha_inicio', e.target.value)}
                    required
                  />
                  {editErrors.fecha_inicio && (
                    <p className="text-xs text-destructive">{editErrors.fecha_inicio}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-fecha_fin">Fecha Fin</Label>
                  <Input
                    id="edit-fecha_fin"
                    type="date"
                    value={editData.fecha_fin}
                    onChange={(e) => setEditData('fecha_fin', e.target.value)}
                    required
                  />
                  {editErrors.fecha_fin && (
                    <p className="text-xs text-destructive">{editErrors.fecha_fin}</p>
                  )}
                </div>
              </div>

              {editDias > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-indigo-500" />
                  <span className="text-foreground font-medium">{editDias}</span>
                  <span className="text-muted-foreground">
                    {editDias === 1 ? 'día' : 'días'}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="edit-porcentaje_pago">% de Pago</Label>
                <div className="relative">
                  <Input
                    id="edit-porcentaje_pago"
                    type="number"
                    min="0"
                    max="100"
                    value={editData.porcentaje_pago}
                    onChange={(e) => setEditData('porcentaje_pago', e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-observaciones">Observaciones</Label>
                <Textarea
                  id="edit-observaciones"
                  value={editData.observaciones}
                  onChange={(e) => setEditData('observaciones', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editProcessing}>
                  {editProcessing ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AuthenticatedLayout>
  )
}
