import { useState } from 'react'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Period = 'hoy' | 'semana' | 'mes' | 'trimestre' | 'año'

interface PeriodOption {
  value: Period
  label: string
}

const periods: PeriodOption[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mes' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'año', label: 'Este año' },
]

interface PeriodSelectorProps {
  value: Period
  onChange: (period: Period) => void
  className?: string
}

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  const [open, setOpen] = useState(false)
  const current = periods.find((p) => p.value === value) ?? periods[1]

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
          'border border-border bg-card text-foreground',
          'transition-all duration-200 hover:bg-accent hover:border-border/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        )}
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {current.label}
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
            {periods.map((period) => (
              <button
                key={period.value}
                onClick={() => { onChange(period.value); setOpen(false) }}
                className={cn(
                  'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors',
                  value === period.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
