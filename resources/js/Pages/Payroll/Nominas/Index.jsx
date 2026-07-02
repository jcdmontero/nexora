import { useState } from 'react'
import { useForm, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { usePermissions } from '@/Hooks/usePermissions'
import {
  Calculator,
  Plus,
  Search,
  SlidersHorizontal,
  Eye,
} from 'lucide-react'

/**
 * Props recibidas del controlador NominaController@index.
 * @param {Object} props
 * @param {Object} props.nominas - Paginación de nóminas (data, meta, links)
 */
export default function NominasIndex({ nominas }) {
  const { can } = usePermissions()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data, setData, post, processing, errors, reset } = useForm({
    periodo: '',
    fecha_inicio: '',
    fecha_fin: '',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('payroll.nominas.store'), {
      onSuccess: () => {
        setIsModalOpen(false)
        reset()
      },
    })
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    router.get(
      route('payroll.nominas.index'),
      { search: value || undefined },
      { preserveState: true, replace: true }
    )
  }

  const columns = [
    {
      key: 'empleado',
      header: 'Empleado',
      cell: (n) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
            {n.empleado_nombre?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <Link
              href={route('payroll.nominas.show', n.id)}
              className="font-semibold text-primary hover:underline block truncate"
            >
              {n.empleado_nombre}
            </Link>
            <p className="text-xs text-muted-foreground">
              {n.documento}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'periodo',
      header: 'Período',
      cell: (n) => (
        <div>
          <span className="font-medium">{n.codigo_periodo}</span>
          <p className="text-xs text-muted-foreground">{n.mes_contable}</p>
        </div>
      ),
    },
    {
      key: 'dias',
      header: 'Días',
      cell: (n) => (
        <span className="tabular-nums">{n.dias_laborados}</span>
      ),
      className: 'text-center',
      hideOnMobile: true,
    },
    {
      key: 'total_devengado',
      header: 'Total Devengos',
      cell: (n) => (
        <span className="tabular-nums">
          ${Number(n.total_devengado).toLocaleString('es-CO')}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'total_deducciones',
      header: 'Total Deducciones',
      cell: (n) => (
        <span className="tabular-nums text-rose-600 dark:text-rose-400">
          -${Number(n.total_deducciones).toLocaleString('es-CO')}
        </span>
      ),
    },
    {
      key: 'neto_pagar',
      header: 'Neto a Pagar',
      alignEnd: true,
      cell: (n) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          ${Number(n.neto_pagar).toLocaleString('es-CO')}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (n) => (
        <Badge
          variant={n.estado_periodo === 'BORRADOR' ? 'outline' : 'default'}
          className={`capitalize ${
            n.estado_periodo === 'BORRADOR'
              ? 'text-slate-600 border-slate-300'
              : n.estado_periodo === 'LIQUIDADA'
              ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
              : n.estado_periodo === 'CONTABILIZADA'
              ? 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400'
              : ''
          }`}
        >
          {n.estado_periodo?.toLowerCase() ?? '—'}
        </Badge>
      ),
      hideOnMobile: true,
    },
    {
      key: 'acciones',
      header: '',
      alignEnd: true,
      hideOnMobile: true,
      cell: (n) => (
        <Link href={route('payroll.nominas.show', n.id)}>
          <Button variant="ghost" size="sm" className="gap-1">
            <Eye className="h-3.5 w-3.5" />
            Ver
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            Nóminas Individuales
          </h2>
          <p className="text-muted-foreground mt-1">
            Liquidación detallada por empleado, devengos y deducciones.
          </p>
        </div>
        <div className="flex gap-2">
          {can('payroll:create') && (
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Generar Nómina
            </Button>
          )}
        </div>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por empleado, período..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {nominas.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={nominas.data}
              rowKey={(n) => n.id}
            />
          ) : (
            <div className="py-12">
              <EmptyState
                icon={Calculator}
                title="Sin Nóminas"
                description="No se ha generado ninguna liquidación de nómina todavía. Las nóminas se crean al liquidar un período desde la sección de Períodos."
                action={
                  can('payroll:create')
                    ? {
                        label: 'Ir a Períodos',
                        href: route('payroll.periodos.index'),
                      }
                    : null
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de nueva nómina */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Parámetros de Liquidación
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="periodo">Nombre del Período</Label>
                <Input
                  id="periodo"
                  value={data.periodo}
                  onChange={(e) => setData('periodo', e.target.value)}
                  placeholder="Ej. Quincena 1 Junio 2026"
                />
                {errors.periodo && (
                  <p className="text-sm text-destructive">{errors.periodo}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={data.fecha_inicio}
                    onChange={(e) => setData('fecha_inicio', e.target.value)}
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
                  />
                  {errors.fecha_fin && (
                    <p className="text-sm text-destructive">{errors.fecha_fin}</p>
                  )}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-sm p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <strong className="block mb-1">Aviso:</strong>
                Se liquidará la nómina de todos los empleados activos utilizando
                el motor de cálculo (Ley Colombia) para devengos y deducciones
                automáticas (Salud/Pensión).
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
                {processing ? 'Calculando...' : 'Calcular Nómina'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  )
}
