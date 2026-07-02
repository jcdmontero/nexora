import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAccent, type AccentColor } from '@/lib/accent'

interface KPICardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: number
  hint?: string
  accent?: AccentColor
  sparkline?: number[]
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

function Sparkline({ data, color, className }: { data: number[]; color: string; className?: string }) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const height = 24
  const padding = 2

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((val - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#spark-fill-${color.replace('#', '')})`}
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.6}
      />
      <circle
        cx={padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2)}
        r={2.5}
        fill={color}
      />
    </svg>
  )
}

export function KPICard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  accent = 'indigo',
  sparkline,
  index = 0,
}: KPICardProps) {
  const hasTrend = typeof trend === 'number'
  const positive = (trend ?? 0) >= 0
  const tokens = getAccent(accent)

  const isNumeric = typeof value === 'number'
  const animatedValue = useCountUp(isNumeric ? value : 0, index * 80)
  const displayValue = isNumeric ? animatedValue : value

  const sparkColor = {
    indigo: '#6366f1',
    emerald: '#10b981',
    amber: '#f59e0b',
    sky: '#0ea5e9',
    rose: '#f43f5e',
    violet: '#8b5cf6',
  }[accent] || '#6366f1'

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5 p-5',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:ring-foreground/10 hover:-translate-y-0.5',
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
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">{label}</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums lg:text-3xl">
              {displayValue}
            </p>
            {sparkline && (
              <Sparkline data={sparkline} color={sparkColor} className="mb-1" />
            )}
          </div>
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
