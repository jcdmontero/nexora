import { Activity } from 'lucide-react'
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, type TooltipProps,
} from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import type { ActivityPoint } from '../types'
import { WidgetShell } from '../WidgetShell'

interface ActivityChartWidgetProps {
  data: ActivityPoint[]
}

function ActivityTooltip({ active, payload }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload as ActivityPoint
  return (
    <div className="rounded-xl border border-border bg-popover/95 backdrop-blur-sm px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-foreground">{data.dia}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{data.fecha}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-indigo-500" />
        <span className="text-sm font-medium text-foreground">{data.eventos}</span>
        <span className="text-xs text-muted-foreground">eventos</span>
      </div>
    </div>
  )
}

export function ActivityChartWidget({ data }: ActivityChartWidgetProps) {
  if (data.length === 0) return null

  const totalEventos = data.reduce((sum, d) => sum + d.eventos, 0)

  return (
    <WidgetShell
      widgetId="activity-chart"
      title="Actividad de la semana"
      icon={Activity}
      accent="indigo"
      size="half"
      showMenu={false}
    >
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{totalEventos}</span> eventos en 7 días
      </p>
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="actividadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1, #6366f1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--chart-1, #6366f1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis
              dataKey="dia"
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
              content={<ActivityTooltip />}
              cursor={{ stroke: 'var(--chart-1, #6366f1)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="eventos"
              stroke="var(--chart-1, #6366f1)"
              strokeWidth={2.5}
              fill="url(#actividadGrad)"
              dot={{ r: 3, fill: 'var(--chart-1, #6366f1)', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'var(--chart-1, #6366f1)', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </WidgetShell>
  )
}
