import { useState } from 'react'
import { Link } from '@inertiajs/react'
import { TriangleAlert, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAccent } from '@/lib/accent'
import type { PendingTask, AccentColor } from '../types'

interface AlertStripProps {
  tasks: PendingTask[]
}

const ACCENT_DOT: Record<AccentColor, string> = {
  indigo:  'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  sky:     'bg-sky-500',
  rose:    'bg-rose-500',
  violet:  'bg-violet-500',
}

export function AlertStrip({ tasks }: AlertStripProps) {
  const [dismissed, setDismissed] = useState(false)

  const filtered = tasks.filter((t) => {
    try { return route().has(t.route) } catch { return false }
  })

  if (filtered.length === 0 || dismissed) return null

  // Si todas las alertas son de un solo acento, usamos ese color para el ribbon
  const dominantAccent: AccentColor = filtered[0]?.accent ?? 'amber'
  const tokens = getAccent(dominantAccent)

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-3',
        'border',
        'animate-in fade-in slide-in-from-top-1 duration-300',
        dominantAccent === 'rose'
          ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/40'
          : dominantAccent === 'amber'
          ? 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40'
          : 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/40',
      )}
    >
      {/* Ícono principal */}
      <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />

      {/* Alertas en línea */}
      <div className="flex flex-1 flex-wrap items-center gap-x-1 gap-y-1.5">
        {filtered.map((task, i) => {
          const taskTokens = getAccent(task.accent as AccentColor)
          return (
            <span key={task.route} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-border select-none" aria-hidden="true">·</span>
              )}
              <Link
                href={route(task.route)}
                className={cn(
                  'group inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1',
                  'text-sm font-medium transition-all duration-150',
                  taskTokens[50],
                  taskTokens.text,
                  taskTokens.hover,
                  'hover:shadow-sm',
                )}
              >
                {/* Badge de conteo */}
                <span className={cn(
                  'inline-flex h-5 min-w-[1.25rem] items-center justify-center',
                  'rounded-full px-1 text-xs font-bold tabular-nums',
                  taskTokens[100],
                  taskTokens.text,
                )}>
                  {task.count}
                </span>
                {task.label}
                <ChevronRight className={cn(
                  'h-3.5 w-3.5 opacity-0 -translate-x-1',
                  'transition-all duration-150',
                  'group-hover:opacity-100 group-hover:translate-x-0',
                )} />
              </Link>
            </span>
          )
        })}
      </div>

      {/* Botón de cierre temporal */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Cerrar alertas"
        className={cn(
          'ml-auto shrink-0 rounded-md p-1.5',
          'text-muted-foreground transition-colors',
          'hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground',
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
