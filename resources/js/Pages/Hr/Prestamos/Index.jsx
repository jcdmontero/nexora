import { useState } from 'react'
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
import { StatCard } from '@/Components/ui/stat-card'
import { PageHeader } from '@/Components/ui/page-header'
import {
  DollarSign,
  Plus,
  CreditCard,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from 'lucide-react'

// Select nativo con misma apariencia que Input
const selectClass =
  'flex h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30'

/**
 * Página de gestión de préstamos a empleados.
 * @param {{ prestamos: { data: Array, current_page: number, last_page: number, total: number }, empleados?: Array<{ id: number, nombres: string, apellidos: string, documento: string }>, filters: { search?: string } }} props
 */
export default function PrestamosIndex({ prestamos, empleados = [], filters }) {
  // ─── Búsqueda ───
  const [search, setSearch] = useState(filters?.search || '')
  const [expandedRow, setExpandedRow] = useState(null)

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('hr.prestamos.index'), { search }, { preserveState: true })
  }

  // ─── Formulario de creación ───
  const { data, setData, post, processing, errors, reset } = useForm({
    empleado_id: '',
    monto_total: '',
    numero_cuotas: '',
    fecha_prestamo: '',
    descripcion: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    post(route('hr.prestamos.store'), {
      onSuccess: () => reset(),
    })
  }

  // ─── Pagar cuota ───
  const handlePagarCuota = (cuotaId) => {
    router.post(route('hr.prestamos.cuotas.pagar', cuotaId), {}, { preserveScroll: true })
  }

  // ─── Formato moneda ───
  const fmt = (val) => {
    if (val == null) return '$0'
    const n = typeof val === 'string' ? Number.parseFloat(val) : val
    return '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  }

  // ─── Indicadores ───
  const totalActivos = prestamos?.data?.filter((p) => p.estado === 'ACTIVO').length ?? 0
  const totalPrestamos = prestamos?.total ?? 0

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
      key: 'monto_total',
      header: 'Monto Total',
      cell: (row) => (
        <span className="font-semibold tabular-nums">{fmt(row.monto_total)}</span>
      ),
    },
    {
      key: 'cuotas_pactadas',
      header: 'Cuotas',
      cell: (row) => (
        <span className="tabular-nums">{row.cuotas_pactadas}</span>
      ),
    },
    {
      key: 'saldo_pendiente',
      header: 'Saldo Pendiente',
      cell: (row) => (
        <span className="font-medium tabular-nums">{fmt(row.saldo_pendiente)}</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (row) => {
        const isPaid = row.estado === 'PAGADO'
        return (
          <Badge
            variant={isPaid ? 'secondary' : 'default'}
            className={
              isPaid
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : ''
            }
          >
            {isPaid ? 'Pagado' : 'Activo'}
          </Badge>
        )
      },
    },
    {
      key: 'acciones',
      header: '',
      alignEnd: true,
      className: 'w-20',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
          className="gap-1 text-xs"
        >
          {expandedRow === row.id ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Ocultar
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Ver cuotas
            </>
          )}
        </Button>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Préstamos" />

      <PageHeader
        title="Préstamos a Empleados"
        description="Administra los préstamos y sus cuotas"
        icon={CreditCard}
      />

      {/* KPIs rápidos */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total préstamos"
          value={totalPrestamos}
          icon={DollarSign}
          accent="indigo"
          hint="Registrados en el sistema"
        />
        <StatCard
          label="Préstamos activos"
          value={totalActivos}
          icon={CreditCard}
          accent="amber"
          hint="Con saldo pendiente"
        />
        <StatCard
          label="Empleados disponibles"
          value={empleados.length}
          icon={Search}
          accent="emerald"
          hint="Para nuevos préstamos"
        />
      </div>

      {/* Grid: Formulario + Tabla */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Formulario de creación */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Plus className="h-4 w-4 text-indigo-500" />
                  Nuevo Préstamo
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

                  {/* Monto total */}
                  <div className="space-y-1.5">
                    <Label htmlFor="monto_total">
                      Monto Total <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="monto_total"
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={data.monto_total}
                      onChange={(e) => setData('monto_total', e.target.value)}
                      required
                    />
                    {errors.monto_total && (
                      <p className="text-xs text-destructive">{errors.monto_total}</p>
                    )}
                  </div>

                  {/* Número de cuotas */}
                  <div className="space-y-1.5">
                    <Label htmlFor="numero_cuotas">
                      Número de Cuotas <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="numero_cuotas"
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Ej: 12"
                      value={data.numero_cuotas}
                      onChange={(e) => setData('numero_cuotas', e.target.value)}
                      required
                    />
                    {errors.numero_cuotas && (
                      <p className="text-xs text-destructive">{errors.numero_cuotas}</p>
                    )}
                  </div>

                  {/* Fecha */}
                  <div className="space-y-1.5">
                    <Label htmlFor="fecha_prestamo">
                      Fecha del Préstamo <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="fecha_prestamo"
                      type="date"
                      value={data.fecha_prestamo}
                      onChange={(e) => setData('fecha_prestamo', e.target.value)}
                      required
                    />
                    {errors.fecha_prestamo && (
                      <p className="text-xs text-destructive">{errors.fecha_prestamo}</p>
                    )}
                  </div>

                  {/* Observaciones */}
                  <div className="space-y-1.5">
                    <Label htmlFor="descripcion">Observaciones</Label>
                    <Textarea
                      id="descripcion"
                      placeholder="Motivo del préstamo, condiciones, etc."
                      value={data.descripcion}
                      onChange={(e) => setData('descripcion', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button type="submit" disabled={processing} className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    {processing ? 'Registrando…' : 'Registrar Préstamo'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Tabla de préstamos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">Listado de Préstamos</CardTitle>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Buscar empleado…"
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
              {prestamos?.data?.length > 0 ? (
                <div>
                  <DataTable columns={columns} data={prestamos.data} rowKey={(r) => r.id} />

                  {/* Filas expandibles: cuotas */}
                  {prestamos.data.map(
                    (row) =>
                      expandedRow === row.id && (
                        <div
                          key={`cuotas-${row.id}`}
                          className="border-t border-border bg-muted/30 px-6 py-4"
                        >
                          <h4 className="mb-3 text-sm font-semibold text-foreground">
                            Cuotas del Préstamo
                          </h4>
                          {row.cuotas && row.cuotas.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                    <th className="pb-2 pr-4 font-medium">#</th>
                                    <th className="pb-2 pr-4 font-medium">Monto</th>
                                    <th className="pb-2 pr-4 font-medium">Vencimiento</th>
                                    <th className="pb-2 pr-4 font-medium">Estado</th>
                                    <th className="pb-2 font-medium">Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.cuotas.map((cuota) => {
                                    const pagada =
                                      cuota.estado === 'PAGADA' || cuota.pagada === true
                                    const vencida =
                                      !pagada &&
                                      new Date(cuota.fecha_vencimiento) < new Date()
                                    return (
                                      <tr
                                        key={cuota.id}
                                        className="border-b border-border/50 last:border-0"
                                      >
                                        <td className="py-2 pr-4 tabular-nums">
                                          {cuota.numero_cuota}
                                        </td>
                                        <td className="py-2 pr-4 tabular-nums font-medium">
                                          {fmt(cuota.monto)}
                                        </td>
                                        <td className="py-2 pr-4 tabular-nums">
                                          {new Date(
                                            cuota.fecha_vencimiento + 'T00:00:00',
                                          ).toLocaleDateString('es-CO', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                          })}
                                        </td>
                                        <td className="py-2 pr-4">
                                          {pagada ? (
                                            <Badge
                                              variant="secondary"
                                              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                                            >
                                              <CheckCircle2 className="mr-1 h-3 w-3" />
                                              Pagada
                                            </Badge>
                                          ) : vencida ? (
                                            <Badge variant="destructive">Vencida</Badge>
                                          ) : (
                                            <Badge variant="outline">
                                              <Clock className="mr-1 h-3 w-3" />
                                              Pendiente
                                            </Badge>
                                          )}
                                        </td>
                                        <td className="py-2">
                                          {!pagada && (
                                            <Button
                                              variant="outline"
                                              size="xs"
                                              onClick={() => handlePagarCuota(cuota.id)}
                                              className="text-xs"
                                            >
                                              Pagar
                                            </Button>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No hay información de cuotas disponible.
                            </p>
                          )}
                        </div>
                      ),
                  )}

                  {/* Paginación */}
                  <Pagination
                    page={prestamos.current_page}
                    totalPages={prestamos.last_page}
                    onPage={(p) =>
                      router.get(route('hr.prestamos.index'), { page: p }, { preserveState: true })
                    }
                  />
                </div>
              ) : (
                <EmptyState
                  icon={CreditCard}
                  title="No hay préstamos registrados"
                  description="Aún no se han registrado préstamos. Completa el formulario para crear el primero."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
