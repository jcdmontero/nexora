/**
 * TaskPanelWidget — Lista de tareas pendientes por módulo.
 * Diseño del mockup: checkbox + label + tag coloreado por módulo.
 */
import { useState } from 'react'
import { Link } from '@inertiajs/react'
import { ClipboardList, Check, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WidgetShell } from '../WidgetShell'
import type { PendingTask } from '../types'

// ── Tag por módulo/acento ─────────────────────────────────────────────

type AccentColor = 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet'

const TAG_STYLE: Record<AccentColor, { bg: string; text: string; label: string }> = {
  indigo:  { bg: 'bg-blue-50 dark:bg-blue-950/50',   text: 'text-blue-700 dark:text-blue-300',     label: 'Mesa de Serv.' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', label: 'Ventas'     },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-950/50',  text: 'text-amber-700 dark:text-amber-300',   label: 'Inventario'  },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-950/50',      text: 'text-sky-700 dark:text-sky-300',       label: 'Compras'     },
  rose:    { bg: 'bg-red-50 dark:bg-red-950/50',      text: 'text-red-700 dark:text-red-300',       label: 'Urgente'     },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-950/50',text: 'text-violet-700 dark:text-violet-300', label: 'CRM'         },
}

// ── Checkbox ─────────────────────────────────────────────────────────

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      aria-checked={checked}
      role="checkbox"
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded',
        'border-[1.5px] transition-all duration-150',
        checked
          ? 'border-emerald-500 bg-emerald-500'
          : 'border-border bg-background hover:border-foreground/40',
      )}
    >
      {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
    </button>
  )
}

// ── Componente ────────────────────────────────────────────────────────

export function TaskPanelWidget({ tasks }: { tasks: PendingTask[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const valid = tasks.filter((t) => {
    try { return route().has(t.route) } catch { return false }
  })

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <WidgetShell
      widgetId="task-panel"
      title="Tareas pendientes"
      icon={ClipboardList}
      accent="indigo"
      size="half"
      showMenu={false}
    >
      {valid.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <p className="text-sm font-medium text-foreground">Todo al día</p>
          <p className="text-xs text-muted-foreground">Sin tareas pendientes.</p>
        </div>
      ) : (
        <ul>
          {valid.map((task, i) => {
            const key     = task.route
            const done    = checked[key] ?? false
            const accent  = (task.accent ?? 'indigo') as AccentColor
            const style   = TAG_STYLE[accent] ?? TAG_STYLE.indigo
            const isLast  = i === valid.length - 1

            return (
              <li
                key={key}
                className={cn('flex items-center gap-2.5 py-2.5', !isLast && 'border-b border-border/60')}
              >
                <Checkbox checked={done} onChange={() => toggle(key)} />

                {/* Label — tachado si está marcado */}
                <Link
                  href={route(task.route)}
                  className={cn(
                    'min-w-0 flex-1 text-sm transition-colors hover:text-primary',
                    done ? 'text-muted-foreground line-through' : 'text-foreground',
                  )}
                >
                  {task.count > 0 ? `${task.count} ${(task.label || '').toLowerCase()}` : task.label}
                </Link>

                {/* Tag de módulo */}
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', style.bg, style.text)}>
                  {style.label}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </WidgetShell>
  )
}
