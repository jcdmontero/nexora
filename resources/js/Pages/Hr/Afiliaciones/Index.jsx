import { useState } from 'react'
import { router, useForm, Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Pagination } from '@/Components/ui/pagination'
import { PageHeader } from '@/Components/ui/page-header'
import {
  ShieldCheck,
  Plus,
  Search,
  CheckCircle2,
} from 'lucide-react'

// Select nativo con misma apariencia que Input
const selectClass =
  'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

// Colores para tipo de entidad
const tipoEntidadColor = {
  EPS: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  AFP: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  ARL: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  CCF: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Salud: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  Pensión: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  'Caja de Compensación': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  Parafiscal: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  Cesantías: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
}

/**
 * Página de afiliaciones de empleados a entidades de seguridad social.
 * @param {{ afiliaciones: { data: Array, current_page: number, last_page: number, total: number }, entidades?: Array<{ id: number, nombre: string, tipo_entidad: string }>, empleados?: Array<{ id: number, nombres: string, apellidos: string, documento: string }>, filters: { search?: string } }} props
 */
export default function AfiliacionesIndex({ afiliaciones, entidades = [], empleados = [], filters }) {
  const [search, setSearch] = useState(filters?.search || '')

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('hr.afiliaciones.index'), { search }, { preserveState: true })
  }

  // ─── Formulario de creación ───
  const { data, setData, post, processing, errors, reset } = useForm({
    empleado_id: '',
    entidad_id: '',
    fecha_afiliacion: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('hr.afiliaciones.store'), {
      onSuccess: () => reset(),
    })
  }

  // ─── Agrupar entidades por tipo para optgroup ───
  const entidadesPorTipo = entidades.reduce((acc, e) => {
    const tipo = e.tipo_entidad || 'Otro'
    if (!acc[tipo]) acc[tipo] = []
    acc[tipo].push(e)
    return acc
  }, {})

  // ─── Columnas DataTable ───
  const columns = [
    {
      key: 'empleado',
      header: 'Empleado',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-sm font-bold dark:bg-indigo-500/10 dark:text-indigo-400">
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
      key: 'entidad',
      header: 'Entidad',
      cell: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">
            {row.entidad?.nombre ?? '—'}
          </span>
          {row.entidad?.tipo_entidad && (
            <Badge
              variant="secondary"
              className={`w-fit text-[10px] ${
                tipoEntidadColor[row.entidad.tipo_entidad] ?? ''
              }`}
            >
              {row.entidad.tipo_entidad}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'fecha_afiliacion',
      header: 'Fecha Afiliación',
      cell: (row) => {
        const d = new Date(row.fecha_afiliacion + 'T00:00:00')
        return (
          <span className="tabular-nums text-sm">
            {d.toLocaleDateString('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        )
      },
    },
    {
      key: 'activo',
      header: 'Estado',
      className: 'w-24',
      cell: (row) =>
        row.activo ? (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Activo
          </Badge>
        ) : (
          <Badge variant="outline">Inactivo</Badge>
        ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Afiliaciones" />

      <PageHeader
        title="Afiliaciones"
        description="Administra las afiliaciones de empleados a entidades de seguridad social (EPS, AFP, ARL, CCF)"
        icon={ShieldCheck}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario de creación */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  Nueva Afiliación
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

                  {/* Entidad agrupada por tipo */}
                  <div className="space-y-1.5">
                    <Label htmlFor="entidad_id">
                      Entidad <span className="text-rose-500">*</span>
                    </Label>
                    <select
                      id="entidad_id"
                      value={data.entidad_id}
                      onChange={(e) => setData('entidad_id', e.target.value)}
                      className={selectClass}
                      required
                    >
                      <option value="">Seleccionar entidad…</option>
                      {Object.entries(entidadesPorTipo).map(([tipo, list]) => (
                        <optgroup key={tipo} label={tipo}>
                          {list.map((ent) => (
                            <option key={ent.id} value={ent.id}>
                              {ent.nombre}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {errors.entidad_id && (
                      <p className="text-xs text-destructive">{errors.entidad_id}</p>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fecha_afiliacion">
                      Fecha de Afiliación <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="fecha_afiliacion"
                      type="date"
                      value={data.fecha_afiliacion}
                      onChange={(e) => setData('fecha_afiliacion', e.target.value)}
                      required
                    />
                    {errors.fecha_afiliacion && (
                      <p className="text-xs text-destructive">{errors.fecha_afiliacion}</p>
                    )}
                  </div>

                  <Button type="submit" disabled={processing} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    {processing ? 'Registrando…' : 'Registrar Afiliación'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Tabla de afiliaciones */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Listado de Afiliaciones</CardTitle>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Buscar empleado o entidad…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-56"
                  />
                  <Button type="submit" variant="secondary" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {afiliaciones?.data?.length > 0 ? (
                <div>
                  <DataTable
                    columns={columns}
                    data={afiliaciones.data}
                    rowKey={(r) => r.id}
                  />
                  <Pagination
                    page={afiliaciones.current_page}
                    totalPages={afiliaciones.last_page}
                    onPage={(p) =>
                      router.get(
                        route('hr.afiliaciones.index'),
                        { page: p, search },
                        { preserveState: true },
                      )
                    }
                  />
                </div>
              ) : (
                <EmptyState
                  icon={ShieldCheck}
                  title="No hay afiliaciones registradas"
                  description="Aún no se han registrado afiliaciones a entidades de seguridad social. Usa el formulario para crear la primera."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
