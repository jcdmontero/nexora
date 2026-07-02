import { Head, usePage } from '@inertiajs/react'
import SuperAdminLayout from '@/Layouts/SuperAdminLayout'
import { WidgetShell, KPICard } from '@/Widgets'
import { Building2, CheckCircle2, PauseCircle, Users, Boxes, TrendingUp } from 'lucide-react'
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts'

export default function SuperDashboard() {
  const { stats = {}, tenantGrowth = [] } = usePage().props

  const kpis = [
    { label: 'Empresas totales', value: stats.empresas, icon: Building2, accent: 'indigo', hint: 'Registradas' },
    { label: 'Activas', value: stats.empresas_activas, icon: CheckCircle2, accent: 'emerald', hint: 'Operando' },
    { label: 'Suspendidas', value: stats.empresas_suspendidas, icon: PauseCircle, accent: 'amber', hint: 'Inactivas' },
    { label: 'Usuarios', value: stats.usuarios, icon: Users, accent: 'sky', hint: 'Clientes' },
    { label: 'Módulos activos', value: stats.modulos_activos, icon: Boxes, accent: 'violet', hint: 'En plataforma' },
  ]

  return (
    <SuperAdminLayout>
      <Head title="SuperAdmin Dashboard" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Resumen de la plataforma
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visión general de Nexora y todos los tenants.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpis.map((k, i) => (
            <KPICard key={k.label} {...k} index={i} />
          ))}
        </div>

        {/* Growth chart */}
        {tenantGrowth.length > 0 && (
          <WidgetShell
            widgetId="super-growth"
            title="Crecimiento de tenants"
            description="Empresas registradas en los últimos 6 meses"
            icon={TrendingUp}
            accent="violet"
            size="full"
            showMenu={false}
          >
            <div className="mt-2 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tenantGrowth} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="superGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis
                    dataKey="mes"
                    tickLine={false}
                    axisLine={false}
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    className="text-xs fill-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--popover) / 0.95)',
                      backdropFilter: 'blur(8px)',
                    }}
                    cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="empresas"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fill="url(#superGrad)"
                    dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </WidgetShell>
        )}
      </div>
    </SuperAdminLayout>
  )
}
