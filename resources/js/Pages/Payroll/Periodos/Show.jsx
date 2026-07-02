import { useState } from 'react'
import { Link, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { Separator } from '@/Components/ui/separator'
import { usePermissions } from '@/Hooks/usePermissions'
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  DollarSign,
  Percent,
  PiggyBank,
  Building2,
  Users,
  Ban,
} from 'lucide-react'

/**
 * Mapa de estilos de Badge por estado del período.
 */
const estadoEstilos = {
  BORRADOR: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/30 dark:text-slate-400',
  LIQUIDADA: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  CONTABILIZADA: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400',
  PAGADA: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  ANULADA: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400',
}

/**
 * Props recibidas del controlador PeriodoController@show.
 */
export default function PeriodosShow({ periodo, nominas, resumen }) {
  const { can } = usePermissions()

  const { post: liquidarPost, processing: liquidando } = useForm()
  const { post: aprobarPost, processing: aprobando } = useForm()
  const { post: anularPost, processing: anulando } = useForm()

  const handleLiquidar = () => {
    if (!confirm('¿Estás seguro de liquidar este período? Se calcularán las nóminas de todos los empleados activos.')) return
    liquidarPost(route('payroll.periodos.liquidar', periodo.id))
  }

  const handleAprobar = () => {
    if (!confirm('Al aprobar el período, se marcará como CONTABILIZADA. ¿Proceder?')) return
    aprobarPost(route('payroll.periodos.aprobar', periodo.id))
  }

  const handleAnular = () => {
    if (!confirm('¿Anular este período? Se eliminarán todas las nóminas asociadas. Esta acción no se puede deshacer.')) return
    anularPost(route('payroll.periodos.anular', periodo.id))
  }

  const esBorrador = periodo.estado === 'BORRADOR'
  const esLiquidada = periodo.estado === 'LIQUIDADA'
  const esContabilizada = periodo.estado === 'CONTABILIZADA'
  const esPagada = periodo.estado === 'PAGADA'
  const esAnulada = periodo.estado === 'ANULADA'
  const puedeLiquidar = esBorrador && can('payroll:liquidate')
  const puedeAprobar = esLiquidada && can('payroll:manage')
  const puedeAnular = (esBorrador || esLiquidada) && can('payroll:manage')
  const edicionPermitida = esBorrador || esLiquidada

  const columnsNomina = [
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
            {n.empleado_documento && (
              <p className="text-xs text-muted-foreground">
                {n.empleado_documento}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'dias',
      header: 'Días',
      cell: (n) => (
        <span className="tabular-nums font-medium">{n.dias_laborados}</span>
      ),
      className: 'text-center',
    },
    {
      key: 'salario',
      header: 'IBC SS',
      cell: (n) => (
        <span className="tabular-nums">
          ${Number(n.ibc_seguridad_social).toLocaleString('es-CO')}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'devengado',
      header: 'Devengado',
      cell: (n) => (
        <span className="tabular-nums">
          ${Number(n.total_devengado).toLocaleString('es-CO')}
        </span>
      ),
    },
    {
      key: 'deducciones',
      header: 'Deducciones',
      cell: (n) => (
        <span className="tabular-nums text-rose-600 dark:text-rose-400">
          -${Number(n.total_deducciones).toLocaleString('es-CO')}
        </span>
      ),
    },
    {
      key: 'neto',
      header: 'Neto a Pagar',
      alignEnd: true,
      cell: (n) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          ${Number(n.neto_pagar).toLocaleString('es-CO')}
        </span>
      ),
    },
  ]

  /** Tarjeta resumen con icono y color. */
  const StatsCard = ({ label, value, icon: Icon, accent, isCurrency }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
              {isCurrency ? `$${Number(value).toLocaleString('es-CO')}` : value}
            </p>
          </div>
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              accent === 'emerald'
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                : accent === 'rose'
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                : accent === 'violet'
                ? 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400'
                : accent === 'sky'
                ? 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400'
                : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <AuthenticatedLayout>
      {/* Header con navegación */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4 min-w-0">
          <Link href={route('payroll.periodos.index')}>
            <Button variant="outline" size="icon" className="mt-1 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold truncate">{periodo.codigo}</h2>
              <Badge
                variant="outline"
                className={`capitalize border-0 ${
                  estadoEstilos[periodo.estado] ?? ''
                }`}
              >
                {periodo.estado.toLowerCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {periodo.fecha_inicio} al {periodo.fecha_fin}
              {periodo.mes_contable && (
                <span className="ml-2 font-mono text-xs">
                  · {periodo.mes_contable}
                </span>
              )}
            </p>
            {periodo.creado_por && (
              <p className="text-xs text-muted-foreground mt-1">
                Creado por {periodo.creado_por} el {periodo.created_at}
              </p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2 shrink-0">
          {puedeLiquidar && (
            <Button
              onClick={handleLiquidar}
              disabled={liquidando}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Calculator className="h-4 w-4" />
              {liquidando ? 'Liquidando...' : 'Liquidar'}
            </Button>
          )}
          {puedeAprobar && (
            <Button
              onClick={handleAprobar}
              disabled={aprobando}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <CheckCircle2 className="h-4 w-4" />
              {aprobando ? 'Aprobando...' : 'Aprobar / Contabilizar'}
            </Button>
          )}
          {puedeAnular && (
            <Button
              onClick={handleAnular}
              disabled={anulando}
              variant="destructive"
              className="gap-2"
            >
              <Ban className="h-4 w-4" />
              {anulando ? 'Anulando...' : 'Anular'}
            </Button>
          )}
          {esContabilizada && (
            <Button variant="outline" disabled className="gap-2 cursor-not-allowed">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Contabilizada
            </Button>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatsCard
          label="Empleados"
          value={resumen.total_empleados}
          icon={Users}
          accent="indigo"
        />
        <StatsCard
          label="Total Devengado"
          value={resumen.total_devengado}
          icon={DollarSign}
          accent="emerald"
          isCurrency
        />
        <StatsCard
          label="Total Deducciones"
          value={resumen.total_deducciones}
          icon={Percent}
          accent="rose"
          isCurrency
        />
        <StatsCard
          label="Provisiones"
          value={resumen.total_provisiones}
          icon={PiggyBank}
          accent="sky"
          isCurrency
        />
        <StatsCard
          label="Aportes Patronales"
          value={resumen.total_aportes}
          icon={Building2}
          accent="violet"
          isCurrency
        />
        <Card className="bg-primary text-primary-foreground ring-primary/20">
          <CardContent className="pt-6">
            <p className="text-sm text-primary-foreground/80 truncate">Neto a Pagar</p>
            <p className="mt-2 text-2xl font-bold tracking-tight tabular-nums">
              ${Number(resumen.neto_pagar).toLocaleString('es-CO')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sábana de nómina */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Sábana de Nómina
            {nominas.length > 0 && (
              <Badge variant="outline" className="ml-2 font-mono">
                {nominas.length} empleados
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {nominas.length > 0 ? (
            <DataTable
              columns={columnsNomina}
              data={nominas}
              rowKey={(n) => n.id}
            />
          ) : (
            <div className="py-16 px-6 text-center">
              <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/50 ring-1 ring-border mx-auto">
                <FileSpreadsheet className="w-7 h-7 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sin Nóminas Calculadas
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
                {esBorrador
                  ? 'Este período aún no ha sido liquidado. Haz clic en "Liquidar" para calcular las nóminas de todos los empleados activos.'
                  : esAnulada
                  ? 'Este período fue anulado y no contiene nóminas.'
                  : 'No hay nóminas registradas para este período.'}
              </p>
              {puedeLiquidar && (
                <Button
                  onClick={handleLiquidar}
                  disabled={liquidando}
                  className="gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  {liquidando ? 'Liquidando...' : 'Liquidar Período'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observaciones */}
      {periodo.observaciones && (
        <Card className="mt-4">
          <CardContent className="py-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Observaciones
            </p>
            <p className="text-sm">{periodo.observaciones}</p>
          </CardContent>
        </Card>
      )}
    </AuthenticatedLayout>
  )
}
