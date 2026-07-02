import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { TrendingUp, TrendingDown, DollarSign, Receipt, Percent } from 'lucide-react'

interface CuentaContable {
  id: number
  codigo: string
  nombre: string
  naturaleza: string
  saldo: number
}

interface PygProps {
  filters: { desde: string | null; hasta: string | null }
  cuentas_ingreso: CuentaContable[]
  cuentas_costo: CuentaContable[]
  cuentas_gasto: CuentaContable[]
  totales: { ingreso: number; costo: number; gasto: number; utilidad: number }
}

export default function Pyg({ filters, cuentas_ingreso, cuentas_costo, cuentas_gasto, totales }: PygProps) {
  const fmt = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget as HTMLFormElement)
    router.get(route('accounting.reportes.pyg'), {
      desde: form.get('desde'),
      hasta: form.get('hasta'),
    }, { preserveState: true })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Estado de Resultados" />

      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Estado de Resultados</h2>
            <p className="text-sm text-muted-foreground mt-1">PyG — Ingresos, Costos y Gastos del período</p>
          </div>
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Desde</label>
              <Input type="date" name="desde" defaultValue={filters.desde} className="w-36" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Hasta</label>
              <Input type="date" name="hasta" defaultValue={filters.hasta} className="w-36" />
            </div>
            <Button type="submit">Actualizar</Button>
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard title="Ingresos" value={fmt(totales.ingresos)} icon={TrendingUp} color="text-green-600 dark:text-green-400" />
          <MetricCard title="Costos" value={fmt(totales.costos)} icon={Receipt} color="text-amber-600 dark:text-amber-400" />
          <MetricCard title="Gastos" value={fmt(totales.gastos)} icon={TrendingDown} color="text-red-600 dark:text-red-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Utilidad Bruta</CardTitle>
              <CardDescription>Ingresos − Costos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fmt(totales.utilidad_bruta)}</p>
            </CardContent>
          </Card>
          <Card className={totales.utilidad_neta >= 0 ? 'border-indigo-200 dark:border-indigo-900' : 'border-red-200 dark:border-red-900'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Utilidad / Pérdida Neta</CardTitle>
              <CardDescription>Utilidad Bruta − Gastos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${totales.utilidad_neta >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-red-600 dark:text-red-400'}`}>
                {fmt(totales.utilidad_neta)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ingresos */}
        <Seccion cuentas={cuentas_ingreso} titulo="Ingresos Operacionales" total={totales.ingresos} color="text-green-600 dark:text-green-400" />

        {/* Costos */}
        <Seccion cuentas={cuentas_costo} titulo="Costos de Ventas" total={totales.costos} color="text-amber-600 dark:text-amber-400" />

        {/* Gastos */}
        <Seccion cuentas={cuentas_gasto} titulo="Gastos Operacionales" total={totales.gastos} color="text-red-600 dark:text-red-400" />
      </div>
    </AuthenticatedLayout>
  )
}

function Seccion({ cuentas, titulo, total, color }: { cuentas: CuentaContable[]; titulo: string; total: number; color: string }) {
  const fmt = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val || 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
              <th className="text-left font-medium px-4 py-2 w-24">Código</th>
              <th className="text-left font-medium px-4 py-2">Cuenta</th>
              <th className="text-right font-medium px-4 py-2">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted-foreground py-6">Sin movimientos en este período</td>
              </tr>
            ) : (
              cuentas.map((c: CuentaContable) => (
                <tr key={c.codigo} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs">{c.codigo}</td>
                  <td className="px-4 py-2">{c.nombre}</td>
                  <td className={`px-4 py-2 text-right font-mono ${color}`}>{fmt(c.saldo)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border font-semibold">
              <td colSpan={2} className="px-4 py-3 text-sm">Total {titulo}</td>
              <td className={`px-4 py-3 text-right font-mono text-base ${color}`}>{fmt(total)}</td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  )
}

function MetricCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <Card className="p-5 border-border shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground break-words">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${color.replace('text-', 'bg-').replace('dark:', 'dark:bg-').replace('green', 'green/10').replace('red', 'red/10').replace('amber', 'amber/10')}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </Card>
  )
}
