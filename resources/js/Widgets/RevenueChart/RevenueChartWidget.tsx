import { TrendingUp } from 'lucide-react'
import {
  Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, type TooltipProps,
} from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import type { RevenuePoint } from '../types'
import { WidgetShell } from '../WidgetShell'

interface RevenueChartWidgetProps {
  data: RevenuePoint[]
}

function formatCurrency(value: number): string {
  return '$ ' + value.toLocaleString('es-CO')
}

function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return value.toLocaleString('es-CO')
}

function RevenueTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as RevenuePoint
  return (
    <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-sm px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-foreground">{data.mes}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-medium text-foreground">
          {formatCurrency(data.ingresos)}
        </span>
      </div>
    </div>
  )
}

export function RevenueChartWidget({ data }: RevenueChartWidgetProps) {
  if (data.length === 0) return null

  const totalRevenue = data.reduce((sum, d) => sum + d.ingresos, 0)

  return (
    <WidgetShell
      widgetId="revenue-chart"
      title="Tendencia de ingresos"
      icon={TrendingUp}
      accent="emerald"
      size="half"
      showMenu={false}
    >
      <p className="text-sm text-muted-foreground">
        Total: <span className="font-semibold text-foreground">{formatCurrency(totalRevenue)}</span>
      </p>
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-2, #10b981)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--chart-2, #10b981)" stopOpacity={0.4} />
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
              tickFormatter={formatCompact}
            />
            <Tooltip
              content={<RevenueTooltip />}
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
            />
            <Bar
              dataKey="ingresos"
              fill="url(#revenueGrad)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  )
}
