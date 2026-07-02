import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { Badge } from '@/Components/ui/badge'
import { BarChart3, Scale, Building2, TrendingUp, AlertCircle } from 'lucide-react'

interface CuentaContable {
  id: number
  codigo: string
  nombre: string
  naturaleza: string
  saldo: number
}

interface BalanceProps {
  filters: { desde: string | null; hasta: string | null }
  cuentas_activo: CuentaContable[]
  cuentas_pasivo: CuentaContable[]
  cuentas_patrimonio: CuentaContable[]
  totales: { activo: number; pasivo: number; patrimonio: number }
}

export default function Balance({ filters, cuentas_activo, cuentas_pasivo, cuentas_patrimonio, totales }: BalanceProps) {
  const fmt = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget as HTMLFormElement)
    router.get(route('accounting.reportes.balance'), {
      desde: form.get('desde'),
      hasta: form.get('hasta'),
    }, { preserveState: true })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Balance General" />

      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Balance General</h2>
            <p className="text-sm text-muted-foreground mt-1">Posición financiera — Activos, Pasivos y Patrimonio</p>
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
          <MetricCard title="Total Activos" value={fmt(totales.activos)} icon={BarChart3} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-950/30" />
          <MetricCard title="Total Pasivos" value={fmt(totales.pasivos)} icon={Scale} color="text-orange-600 dark:text-orange-400" bg="bg-orange-50 dark:bg-orange-950/30" />
          <MetricCard title="Total Patrimonio" value={fmt(totales.patrimonio)} icon={TrendingUp} color="text-green-600 dark:text-green-400" bg="bg-green-50 dark:bg-green-950/30" />
        </div>

        {Math.abs(totales.ecuacion) > 0.01 && (
          <Card className="border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Ecuación contable desbalanceada: {fmt(totales.ecuacion)}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  Activos − Pasivos − Patrimonio debe ser 0. Revisa los asientos del período.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activos */}
          <Seccion
            cuentas={cuentas_activo}
            titulo="Activos"
            total={totales.activos}
            color="text-blue-600 dark:text-blue-400"
            border="border-blue-200 dark:border-blue-900"
          />

          <div className="flex flex-col gap-6">
            {/* Pasivos */}
            <Seccion
              cuentas={cuentas_pasivo}
              titulo="Pasivos"
              total={totales.pasivos}
              color="text-orange-600 dark:text-orange-400"
              border="border-orange-200 dark:border-orange-900"
            />
            {/* Patrimonio */}
            <Seccion
              cuentas={cuentas_patrimonio}
              titulo="Patrimonio"
              total={totales.patrimonio}
              color="text-green-600 dark:text-green-400"
              border="border-green-200 dark:border-green-900"
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

function Seccion({ cuentas, titulo, total, color, border }: { cuentas: CuentaContable[]; titulo: string; total: number; color: string; border: string }) {
  const fmt = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val || 0)

  return (
    <Card className={`border ${border}`}>
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

function MetricCard({ title, value, icon: Icon, color, bg }: { title: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) {
  return (
    <Card className="p-5 border-border shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold text-foreground break-words">{value}</p>
        </div>
        <div className={`h-10 w-10 rounded-md ${bg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </Card>
  )
}
