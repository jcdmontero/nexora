import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAccent, type AccentColor } from '@/lib/accent'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: number
  hint?: string
  accent?: AccentColor
  index?: number
}

function useCountUp(target: number, delay: number = 0): number {
  const [current, setCurrent] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) { setCurrent(0); return }

    const timeout = setTimeout(() => {
      const duration = 600
      const start = performance.now()

      const tick = (now: number) => {
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - (1 - progress) * (1 - progress)
        setCurrent(Math.round(eased * target))
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      clearTimeout(timeout)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, delay])

  return current
}

export function StatCard({ label, value, icon: Icon, trend, hint, accent = 'indigo', index = 0 }: StatCardProps) {
  const hasTrend = typeof trend === 'number'
  const positive = (trend ?? 0) >= 0
  const tokens = getAccent(accent)

  const isNumeric = typeof value === 'number'
  const animatedValue = useCountUp(isNumeric ? value : 0, index * 80)
  const displayValue = isNumeric ? animatedValue : value

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-5',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:border-border/60 hover:-translate-y-0.5',
        tokens.glow,
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          tokens.gradient,
        )}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {displayValue}
          </p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            tokens[50],
            tokens.text,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {(hasTrend || hint) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {hasTrend && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                positive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
              )}
            >
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(trend ?? 0)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground truncate">{hint}</span>}
        </div>
      )}
    </div>
  )
}

export default StatCard
