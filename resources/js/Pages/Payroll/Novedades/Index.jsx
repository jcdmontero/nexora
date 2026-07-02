import { useState } from 'react'
import { useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { usePermissions } from '@/Hooks/usePermissions'
import {
  CalendarDays,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Trash2,
} from 'lucide-react'

/**
 * Props recibidas del controlador NovedadController@index.
 * @param {Object} props
 * @param {Object} props.novedades - Paginación de novedades (data, meta, links)
 * @param {Array} props.empleados - Lista de empleados activos
 * @param {Array} props.conceptos - Lista de conceptos de nómina
 * @param {Array} props.periodos - Lista de períodos
 * @param {Object} props.filters - Filtros activos
 */
export default function NovedadesIndex({ novedades, empleados, conceptos, periodos, filters }) {
  const { can } = usePermissions()
  const [showFilters, setShowFilters] = useState(false)

  // Formulario de registro
  const { data, setData, post, processing, reset, errors } = useForm({
    empleado_id: '',
    tipo: 'ingreso',
    concepto_id: '',
    descripcion: '',
    codigo: '',
    valor: '',
    fecha_registro: new Date().toISOString().substring(0, 10),
    periodo_id: '',
  })

  // Filtros
  const [filterValues, setFilterValues] = useState({
    periodo_id: filters?.periodo_id ?? '',
    concepto_id: filters?.concepto_id ?? '',
    tipo: filters?.tipo ?? '',
    estado: filters?.estado ?? '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('payroll.novedades.store'), {
      onSuccess: () => {
        reset('concepto_id', 'descripcion', 'codigo', 'valor', 'periodo_id')
      },
    })
  }

  const applyFilters = () => {
    router.get(
      route('payroll.novedades.index'),
      { ...filterValues },
      { preserveState: true, replace: true }
    )
  }

  const clearFilters = () => {
    setFilterValues({ periodo_id: '', concepto_id: '', tipo: '', estado: '' })
    router.get(
      route('payroll.novedades.index'),
      {},
      { preserveState: true, replace: true }
    )
  }

  const handleDelete = (novedadId) => {
    if (!confirm('¿Eliminar esta novedad? Esta acción no se puede deshacer.')) return
    router.delete(route('payroll.novedades.destroy', novedadId))
  }

  const columns = [
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (n) => (
        <span className="text-sm text-muted-foreground">{n.fecha_registro}</span>
      ),
    },
    {
      key: 'empleado',
      header: 'Empleado',
      cell: (n) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
            {n.empleado_nombre?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{n.empleado_nombre}</p>
            {n.empleado_documento && (
              <p className="text-xs text-muted-foreground">{n.empleado_documento}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'concepto',
      header: 'Concepto',
      cell: (n) => (
        <div>
          <p className="text-sm font-medium">{n.concepto_nombre ?? n.descripcion ?? '—'}</p>
          {n.concepto_codigo && (
            <p className="text-xs text-muted-foreground font-mono">{n.concepto_codigo}</p>
          )}
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      cell: (n) =>
        n.tipo === 'ingreso' || n.tipo === 'DEVENGADO' ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 gap-1 dark:bg-emerald-900/30 dark:text-emerald-400">
            <ArrowUpRight className="h-3 w-3" />
            Ingreso
          </Badge>
        ) : (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0 gap-1 dark:bg-rose-900/30 dark:text-rose-400">
            <ArrowDownRight className="h-3 w-3" />
            Descuento
          </Badge>
        ),
    },
    {
      key: 'periodo',
      header: 'Período',
      cell: (n) => (
        <span className="text-xs text-muted-foreground">
          {n.periodo_codigo ?? '—'}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'valor',
      header: 'Valor',
      alignEnd: true,
      cell: (n) => (
        <span
          className={`font-semibold tabular-nums ${
            n.tipo === 'ingreso' || n.tipo === 'DEVENGADO'
              ? 'text-emerald-700 dark:text-emerald-400'
              : 'text-rose-700 dark:text-rose-400'
          }`}
        >
          ${Number(n.valor).toLocaleString('es-CO')}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (n) => (
        <Badge
          variant="outline"
          className={
            n.estado === 'aplicada'
              ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400'
              : n.estado === 'pendiente'
              ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400'
              : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
          }
        >
          {n.estado?.toUpperCase() ?? 'PENDIENTE'}
        </Badge>
      ),
    },
    {
      key: 'acciones',
      header: '',
      alignEnd: true,
      hideOnMobile: true,
      cell: (n) => {
        if (n.estado === 'aplicada' || n.estado === 'Aplicada') return null
        return (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(n.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )
      },
    },
  ]

  const hasActiveFilters =
    filterValues.periodo_id || filterValues.concepto_id || filterValues.tipo || filterValues.estado

  return (
    <AuthenticatedLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-primary" />
            Novedades de Nómina
          </h2>
          <p className="text-muted-foreground mt-1">
            Registra horas extras, bonos, incapacidades, descuentos o prestamos.
          </p>
        </div>
        {can('payroll:delete') && (
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            asChild
          >
            <a href={route('payroll.novedades.index') + '#list'}>
              <CalendarDays className="h-4 w-4" />
              Ver Historial
            </a>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de registro */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-md flex items-center gap-2">
                <PlusCircle className="h-4 w-4 text-primary" />
                Registrar Novedad
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <form onSubmit={submit} className="space-y-4">
                {/* Empleado */}
                <div className="space-y-1.5">
                  <Label htmlFor="empleado_id" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Empleado
                  </Label>
                  <select
                    id="empleado_id"
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={data.empleado_id}
                    onChange={(e) => setData('empleado_id', e.target.value)}
                    required
                  >
                    <option value="">Seleccione un empleado...</option>
                    {empleados.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nombres} {e.apellidos} {e.documento ? `(${e.documento})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.empleado_id && (
                    <p className="text-xs text-destructive">{errors.empleado_id}</p>
                  )}
                </div>

                {/* Tipo toggle */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setData('tipo', 'ingreso')}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                        data.tipo === 'ingreso'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-700'
                          : 'bg-card text-muted-foreground hover:bg-muted border-input'
                      }`}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 inline mr-1" />
                      Ingreso
                    </button>
                    <button
                      type="button"
                      onClick={() => setData('tipo', 'descuento')}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                        data.tipo === 'descuento'
                          ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-700'
                          : 'bg-card text-muted-foreground hover:bg-muted border-input'
                      }`}
                    >
                      <ArrowDownRight className="h-3.5 w-3.5 inline mr-1" />
                      Descuento
                    </button>
                  </div>
                </div>

                {/* Concepto (select) */}
                <div className="space-y-1.5">
                  <Label htmlFor="concepto_id" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Concepto
                  </Label>
                  <select
                    id="concepto_id"
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={data.concepto_id}
                    onChange={(e) => setData('concepto_id', e.target.value)}
                  >
                    <option value="">Seleccione concepto (opcional)...</option>
                    {conceptos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.codigo ? `[${c.codigo}] ` : ''}{c.nombre} ({c.tipo === 'DEVENGADO' ? 'Dev' : 'Ded'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <Label htmlFor="descripcion" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Descripción
                  </Label>
                  <Input
                    id="descripcion"
                    placeholder="Ej: Bono de productividad"
                    value={data.descripcion}
                    onChange={(e) => setData('descripcion', e.target.value)}
                  />
                </div>

                {/* Código opcional */}
                <div className="space-y-1.5">
                  <Label htmlFor="codigo" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Código (opcional)
                  </Label>
                  <Input
                    id="codigo"
                    placeholder="Ej: BONO-PROD-01"
                    value={data.codigo}
                    onChange={(e) => setData('codigo', e.target.value)}
                  />
                </div>

                {/* Valor */}
                <div className="space-y-1.5">
                  <Label htmlFor="valor" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Valor ($)
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    min="1"
                    step="0.01"
                    className="mt-1"
                    placeholder="0.00"
                    required
                    value={data.valor}
                    onChange={(e) => setData('valor', e.target.value)}
                  />
                  {errors.valor && (
                    <p className="text-xs text-destructive">{errors.valor}</p>
                  )}
                </div>

                {/* Fecha */}
                <div className="space-y-1.5">
                  <Label htmlFor="fecha_registro" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Fecha de Registro
                  </Label>
                  <Input
                    id="fecha_registro"
                    type="date"
                    value={data.fecha_registro}
                    onChange={(e) => setData('fecha_registro', e.target.value)}
                    required
                  />
                </div>

                {/* Período opcional */}
                <div className="space-y-1.5">
                  <Label htmlFor="periodo_id" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Período (opcional)
                  </Label>
                  <select
                    id="periodo_id"
                    className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={data.periodo_id}
                    onChange={(e) => setData('periodo_id', e.target.value)}
                  >
                    <option value="">Sin período asignado...</option>
                    {periodos.filter((p) => p.estado === 'BORRADOR' || p.estado === 'LIQUIDADA').map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} ({p.mes_contable})
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={processing}
                  className="w-full gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  {processing ? 'Guardando...' : 'Guardar Novedad'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Listado de novedades */}
        <div className="lg:col-span-2 order-1 lg:order-2" id="list">
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px] font-bold">
                  !
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                Limpiar filtros
              </Button>
            )}
            <div className="text-xs text-muted-foreground ml-auto">
              {novedades.total ?? novedades.data?.length ?? 0} novedades
            </div>
          </div>

          {/* Panel de filtros expandible */}
          {showFilters && (
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Período</Label>
                    <select
                      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2 py-1 text-sm"
                      value={filterValues.periodo_id}
                      onChange={(e) =>
                        setFilterValues({ ...filterValues, periodo_id: e.target.value })
                      }
                    >
                      <option value="">Todos</option>
                      {periodos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Concepto</Label>
                    <select
                      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2 py-1 text-sm"
                      value={filterValues.concepto_id}
                      onChange={(e) =>
                        setFilterValues({ ...filterValues, concepto_id: e.target.value })
                      }
                    >
                      <option value="">Todos</option>
                      {conceptos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Tipo</Label>
                    <select
                      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2 py-1 text-sm"
                      value={filterValues.tipo}
                      onChange={(e) =>
                        setFilterValues({ ...filterValues, tipo: e.target.value })
                      }
                    >
                      <option value="">Todos</option>
                      <option value="ingreso">Ingresos</option>
                      <option value="descuento">Descuentos</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <select
                      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2 py-1 text-sm"
                      value={filterValues.estado}
                      onChange={(e) =>
                        setFilterValues({ ...filterValues, estado: e.target.value })
                      }
                    >
                      <option value="">Todos</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="aplicada">Aplicada</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <Button size="sm" onClick={applyFilters} className="gap-1">
                    <Search className="h-3.5 w-3.5" />
                    Aplicar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabla */}
          <Card>
            <CardContent className="p-0">
              {novedades.data.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={novedades.data}
                  rowKey={(n) => n.id}
                />
              ) : (
                <EmptyState
                  icon={CalendarDays}
                  title="Sin Novedades Registradas"
                  description={
                    hasActiveFilters
                      ? 'No se encontraron novedades con los filtros aplicados. Intenta ajustar los criterios de búsqueda.'
                      : 'No hay bonos, descuentos ni incapacidades registradas en el histórico.'
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
