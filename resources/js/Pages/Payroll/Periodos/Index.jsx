import { useState } from 'react'
import { Link, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Skeleton, StatsCardSkeleton } from '@/Components/ui/skeleton'
import { usePermissions } from '@/Hooks/usePermissions'
import {
  CalendarRange,
  Plus,
  Search,
  FileSpreadsheet,
  SlidersHorizontal,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Mapa de variantes de Badge por estado del período.
 */
const estadoEstilos = {
  BORRADOR: { variant: 'outline', className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400' },
  LIQUIDADA: { variant: 'secondary', className: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' },
  CONTABILIZADA: { variant: 'default', className: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400' },
  PAGADA: { variant: 'default', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ANULADA: { variant: 'destructive', className: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400' },
}

/**
 * Propiedades recibidas del controlador PeriodoController@index.
 */
export default function PeriodosIndex({ periodos, filters }) {
  const { can } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(filters?.search ?? '')

  const { data, setData, post, processing, errors, reset } = useForm({
    codigo: '',
    mes_contable: format(new Date(), 'yyyy-MM'),
    fecha_inicio: '',
    fecha_fin: '',
    observaciones: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('payroll.periodos.store'), {
      onSuccess: () => {
        setIsModalOpen(false)
        reset()
      },
    })
  }

  const handleSearch = (value) => {
    setSearchValue(value)
    router.get(
      route('payroll.periodos.index'),
      { search: value || undefined },
      { preserveState: true, replace: true }
    )
  }

  const columns = [
    {
      key: 'codigo',
      header: 'Código',
      cell: (p) => (
        <Link
          href={route('payroll.periodos.show', p.id)}
          className="font-semibold text-primary hover:underline"
        >
          {p.codigo}
        </Link>
      ),
    },
    {
      key: 'periodo',
      header: 'Período',
      cell: (p) => (
        <span className="text-sm text-muted-foreground">
          {p.fecha_inicio} al {p.fecha_fin}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'mes_contable',
      header: 'Mes Contable',
      cell: (p) => (
        <span className="font-mono text-xs text-muted-foreground">
          {p.mes_contable}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (p) => {
        const est = estadoEstilos[p.estado] ?? estadoEstilos.BORRADOR
        return (
          <Badge variant={est.variant} className={est.className}>
            {p.estado.charAt(0) + p.estado.slice(1).toLowerCase()}
          </Badge>
        )
      },
    },
    {
      key: 'empleados',
      header: 'Empleados',
      cell: (p) => (
        <span className="font-medium tabular-nums">
          {p.nominas_count}
        </span>
      ),
      className: 'text-center',
    },
    {
      key: 'total_devengado',
      header: 'Total Devengado',
      cell: (p) => (
        <span className="font-medium tabular-nums">
          ${Number(p.total_devengado).toLocaleString('es-CO')}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'neto_pagar',
      header: 'Neto a Pagar',
      alignEnd: true,
      cell: (p) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          ${Number(p.neto_pagar).toLocaleString('es-CO')}
        </span>
      ),
    },
  ]

  const formatearMes = (mesContable) => {
    if (!mesContable) return ''
    const [year, month] = mesContable.split('-')
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1)
    return format(date, 'MMMM yyyy', { locale: es })
  }

  return (
    <AuthenticatedLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarRange className="h-6 w-6 text-primary" />
            Períodos de Nómina
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestión de ciclos de liquidación de nómina.
          </p>
        </div>
        {can('payroll:liquidate') && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Nuevo Período
          </Button>
        )}
      </div>

      {/* Filtro de búsqueda */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por código o mes contable..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Button variant="outline" size="icon" className="shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabla de períodos */}
      <Card>
        <CardContent className="p-0">
          {periodos.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={periodos.data}
              rowKey={(p) => p.id}
            />
          ) : (
            <EmptyState
              icon={FileSpreadsheet}
              title="Sin Períodos Creados"
              description="Aún no has creado ningún período de nómina. Comienza creando uno nuevo para gestionar las liquidaciones."
              action={
                can('payroll:liquidate')
                  ? { label: 'Crear Primer Período', onClick: () => setIsModalOpen(true) }
                  : null
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog de nuevo período */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary" />
                Nuevo Período de Nómina
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-5 py-4">
              {/* Código */}
              <div className="space-y-2">
                <Label htmlFor="codigo">Código del Período</Label>
                <Input
                  id="codigo"
                  placeholder="Ej: NOM-06-2026, QUINCENA-1-JUN"
                  value={data.codigo}
                  onChange={(e) => setData('codigo', e.target.value)}
                  required
                />
                {errors.codigo && (
                  <p className="text-sm text-destructive">{errors.codigo}</p>
                )}
              </div>

              {/* Mes contable */}
              <div className="space-y-2">
                <Label htmlFor="mes_contable">Mes Contable</Label>
                <Input
                  id="mes_contable"
                  type="month"
                  value={data.mes_contable}
                  onChange={(e) => setData('mes_contable', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {data.mes_contable && formatearMes(data.mes_contable)}
                </p>
                {errors.mes_contable && (
                  <p className="text-sm text-destructive">{errors.mes_contable}</p>
                )}
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={data.fecha_inicio}
                    onChange={(e) => setData('fecha_inicio', e.target.value)}
                    required
                  />
                  {errors.fecha_inicio && (
                    <p className="text-sm text-destructive">{errors.fecha_inicio}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha Fin</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={data.fecha_fin}
                    onChange={(e) => setData('fecha_fin', e.target.value)}
                    required
                  />
                  {errors.fecha_fin && (
                    <p className="text-sm text-destructive">{errors.fecha_fin}</p>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones (opcional)</Label>
                <Input
                  id="observaciones"
                  placeholder="Notas sobre el período..."
                  value={data.observaciones}
                  onChange={(e) => setData('observaciones', e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? 'Creando...' : 'Crear Período'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
