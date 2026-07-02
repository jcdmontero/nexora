import { Head, router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { DataTable } from '@/Components/ui/data-table'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { BarChart3, TrendingUp, PieChart, Activity, Scale } from 'lucide-react'

export default function ReportesIndex({ filters, metricas, saldos }) {
  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val || 0)

  const handleSubmit = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    router.get(route('accounting.reportes.index'), {
      desde: form.get('desde'),
      hasta: form.get('hasta'),
    }, { preserveState: true })
  }

  const columns = [
    { key: 'codigo', header: 'Cuenta', className: 'w-[120px] font-mono' },
    { key: 'nombre', header: 'Nombre', className: 'font-medium' },
    { key: 'tipo', header: 'Tipo', hideOnMobile: true },
    {
      key: 'debito',
      header: 'Debito',
      className: 'text-right',
      alignEnd: true,
      cell: (row) => <span className="font-mono">{formatCurrency(row.debito)}</span>,
    },
    {
      key: 'credito',
      header: 'Credito',
      className: 'text-right',
      alignEnd: true,
      cell: (row) => <span className="font-mono">{formatCurrency(row.credito)}</span>,
    },
    {
      key: 'saldo',
      header: 'Saldo',
      className: 'text-right',
      alignEnd: true,
      cell: (row) => <span className="font-mono font-medium">{formatCurrency(row.saldo)}</span>,
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Reportes Contables" />

      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Reportes Contables</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Balance de prueba, utilidad del periodo y posicion financiera por cuenta.
            </p>
          </div>
          <div className="space-x-2 text-right hidden lg:block">
            <Link href={route('accounting.reportes.auxiliar')} className="text-sm text-primary hover:underline">Ir a Libro Auxiliar</Link>
            <span className="text-muted-foreground">|</span>
            <Link href={route('accounting.reportes.terceros')} className="text-sm text-primary hover:underline">Ir a Balance por Terceros</Link>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
            <Input type="date" name="desde" defaultValue={filters.desde} />
            <Input type="date" name="hasta" defaultValue={filters.hasta} />
            <Button type="submit">Actualizar</Button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Ingresos" value={formatCurrency(metricas.ingresos)} icon={TrendingUp} />
          <MetricCard title="Gastos y costos" value={formatCurrency(metricas.gastos)} icon={Activity} />
          <MetricCard title="Utilidad" value={formatCurrency(metricas.utilidad)} icon={PieChart} />
          <MetricCard title="Activos" value={formatCurrency(metricas.activos)} icon={BarChart3} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <MetricCard title="Pasivos" value={formatCurrency(metricas.pasivos)} icon={Scale} />
          <MetricCard title="Patrimonio" value={formatCurrency(metricas.patrimonio)} icon={Scale} />
          <MetricCard title="Ecuacion contable" value={formatCurrency(metricas.activos - metricas.pasivos - metricas.patrimonio)} icon={Scale} />
        </div>

        <Card className="border-border shadow-sm overflow-hidden bg-card">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold">Balance de prueba por cuenta</h3>
          </div>
          <DataTable columns={columns} data={saldos || []} rowKey={(row) => row.codigo} />
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}

function MetricCard({ title, value, icon: Icon }) {
  return (
    <Card className="p-5 border-border shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground break-words">{value}</p>
        </div>
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  )
}
