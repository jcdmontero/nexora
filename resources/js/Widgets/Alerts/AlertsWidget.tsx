import { Link } from '@inertiajs/react'
import { Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAccent, type AccentColor } from '@/lib/accent'
import type { PendingTask } from '../types'
import { WidgetShell } from '../WidgetShell'

interface AlertsWidgetProps {
  tasks: PendingTask[]
}

export function AlertsWidget({ tasks }: AlertsWidgetProps) {
  if (tasks.length === 0) return null

  const filtered = tasks.filter((t) => {
    try {
      return route().has(t.route)
    } catch {
      return false
    }
  })

  if (filtered.length === 0) return null

  return (
    <WidgetShell
      widgetId="alerts"
      title="Atención requerida"
      icon={Zap}
      accent="amber"
      size="full"
      showMenu={false}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((task) => {
          const tokens = getAccent(task.accent as AccentColor)
          return (
            <Link
              key={task.label}
              href={route(task.route)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl border p-4',
                'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
                tokens.border,
                tokens[50],
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                  tokens[100],
                  tokens.text,
                )}
              >
                {task.count}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-semibold', tokens.text)}>{task.label}</p>
                <p className="text-xs text-muted-foreground">Requiere acción</p>
              </div>
              <ChevronRight
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5',
                  tokens.text,
                )}
              />
            </Link>
          )
        })}
      </div>
    </WidgetShell>
  )
}
