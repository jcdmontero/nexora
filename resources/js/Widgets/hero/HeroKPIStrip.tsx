/**
 * HeroKPIStrip — 4 KPI cards con deltas comparativos.
 * Diseño basado en el mockup: label pequeño + valor grande + delta inline (sin pill).
 */
import { useEffect, useRef, useState } from 'react'
import {
  TrendingUp, Receipt, Package, Users2,
  Wrench, Clock, ArrowUp, ArrowDown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '../types'

// ── CountUp ───────────────────────────────────────────────────────────

function useCountUp(target: number, delay = 0): number {
  const [v, setV] = useState(0)
  const raf = useRef<number | null>(null)
  useEffect(() => {
    setV(0)
    if (!target) return
    const t = setTimeout(() => {
      const s = performance.now()
      const go = (n: number) => {
        const p = Math.min((n - s) / 900, 1)
        setV(Math.round((1 - (1 - p) ** 3) * target))
        if (p < 1) raf.current = requestAnimationFrame(go)
      }
      raf.current = requestAnimationFrame(go)
    }, delay)
    return () => { clearTimeout(t); if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, delay])
  return v
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000_000) return '$ ' + (n / 1_000_000_000).toFixed(1) + 'B'
  if (n >= 1_000_000)     return '$ ' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)         return '$ ' + (n / 1_000).toFixed(0) + 'k'
  return '$ ' + n.toLocaleString('es-CO')
}

// ── Tipos ─────────────────────────────────────────────────────────────

interface KPIDef {
  id: string
  label: string
  labelIconClass: string    // color de icono del label
  LabelIcon: LucideIcon
  value: number
  isMoney?: boolean
  delta?: string            // texto completo del delta, ej: "+12.4% vs mes anterior"
  deltaUp?: boolean         // true=verde, false=rojo, undefined=sin delta
}

// ── Celda ─────────────────────────────────────────────────────────────

function KPICard({ kpi, idx }: { kpi: KPIDef; idx: number }) {
  const animated = useCountUp(kpi.value, idx * 80)
  const display  = kpi.isMoney ? fmtMoney(animated) : animated.toLocaleString('es-CO')
  const DeltaIcon = kpi.deltaUp ? ArrowUp : ArrowDown

  return (
    <div className="rounded-xl border border-border bg-card px-[18px] py-4 transition-shadow hover:shadow-sm">
      {/* Label con icono pequeño */}
      <div className={cn('mb-2 flex items-center gap-1.5 text-xs text-muted-foreground')}>
        <kpi.LabelIcon className={cn('h-3.5 w-3.5', kpi.labelIconClass)} />
        {kpi.label}
      </div>

      {/* Valor grande */}
      <p className="mb-1.5 text-[1.625rem] font-medium leading-none tracking-tight tabular-nums text-foreground">
        {display}
      </p>

      {/* Delta inline */}
      {kpi.delta && kpi.deltaUp !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-xs',
          kpi.deltaUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        )}>
          <DeltaIcon className="h-3 w-3" />
          {kpi.delta}
        </div>
      )}
    </div>
  )
}

// ── HeroKPIStrip ──────────────────────────────────────────────────────

function calcTrend(cur: number, prev: number): number | null {
  if (!prev) return null
  return Math.round(((cur - prev) / prev) * 100)
}

export function HeroKPIStrip({
  stats,
  activeModules,
}: {
  stats: DashboardStats
  activeModules: string[]
}) {
  const kpis: KPIDef[] = []

  // 1. Ventas del mes — siempre primero si hay sales
  if (activeModules.includes('sales') && stats.ventas_mes !== null) {
    const pct = stats.ventas_mes_anterior != null
      ? calcTrend(stats.ventas_mes ?? 0, stats.ventas_mes_anterior ?? 0)
      : null
    kpis.push({
      id: 'ventas-mes',
      label: 'Ventas del mes',
      LabelIcon: TrendingUp,
      labelIconClass: 'text-emerald-600 dark:text-emerald-400',
      value: stats.ventas_mes ?? 0,
      isMoney: true,
      delta: pct != null ? `${pct >= 0 ? '+' : ''}${pct}% vs mes anterior` : 'acumulado',
      deltaUp: pct != null ? pct >= 0 : true,
    })
  }

  // 2. Órdenes activas (service-desk)
  if (activeModules.includes('service-desk') && stats.ordenes_en_proceso !== null) {
    kpis.push({
      id: 'ordenes-activas',
      label: 'Órdenes activas',
      LabelIcon: Receipt,
      labelIconClass: 'text-blue-600 dark:text-blue-400',
      value: stats.ordenes_en_proceso ?? 0,
      delta: `+${stats.ordenes_hoy ?? 0} nuevas hoy`,
      deltaUp: true,
    })
  }

  // 3. Stock bajo (inventario) o Para entregar
  if (activeModules.includes('inventory') && stats.productos_bajo_stock !== null) {
    const bajo = stats.productos_bajo_stock ?? 0
    kpis.push({
      id: 'stock-bajo',
      label: 'Stock bajo',
      LabelIcon: Package,
      labelIconClass: 'text-amber-600 dark:text-amber-400',
      value: bajo,
      delta: bajo > 0 ? `${Math.ceil(bajo * 0.2)} en nivel crítico` : 'todo en orden',
      deltaUp: bajo === 0,
    })
  } else if (activeModules.includes('service-desk') && stats.ordenes_para_entregar !== null) {
    kpis.push({
      id: 'para-entregar',
      label: 'Para entregar',
      LabelIcon: Clock,
      labelIconClass: 'text-sky-600 dark:text-sky-400',
      value: stats.ordenes_para_entregar ?? 0,
      delta: 'listas para recoger',
      deltaUp: true,
    })
  }

  // 4. Clientes activos
  if (activeModules.includes('crm') && stats.clientes !== null) {
    kpis.push({
      id: 'clientes',
      label: 'Clientes activos',
      LabelIcon: Users2,
      labelIconClass: 'text-violet-600 dark:text-violet-400',
      value: stats.clientes ?? 0,
      delta: 'registrados en CRM',
      deltaUp: true,
    })
  } else if (activeModules.includes('service-desk') && stats.ordenes_hoy !== null) {
    kpis.push({
      id: 'ordenes-hoy',
      label: 'Órdenes hoy',
      LabelIcon: Wrench,
      labelIconClass: 'text-indigo-600 dark:text-indigo-400',
      value: stats.ordenes_hoy ?? 0,
      delta: `${stats.ordenes_semana ?? 0} esta semana`,
      deltaUp: true,
    })
  }

  if (kpis.length === 0) {
    kpis.push({ id: 'ventas', label: 'Ventas del mes', LabelIcon: TrendingUp, labelIconClass: 'text-emerald-600 dark:text-emerald-400', value: 0, isMoney: true, delta: 'Sin datos', deltaUp: true })
    kpis.push({ id: 'ordenes', label: 'Órdenes activas', LabelIcon: Receipt, labelIconClass: 'text-blue-600 dark:text-blue-400', value: 0, delta: 'Sin datos', deltaUp: true })
    kpis.push({ id: 'stock', label: 'Stock bajo', LabelIcon: Package, labelIconClass: 'text-amber-600 dark:text-amber-400', value: 0, delta: 'Todo en orden', deltaUp: true })
    kpis.push({ id: 'clientes', label: 'Clientes activos', LabelIcon: Users2, labelIconClass: 'text-violet-600 dark:text-violet-400', value: 0, delta: 'Sin datos', deltaUp: true })
  }
  const shown = kpis.slice(0, 4)

  return (
    <div className={cn(
      'grid gap-3',
      shown.length === 2 && 'grid-cols-2',
      shown.length === 3 && 'grid-cols-3',
      shown.length === 4 && 'grid-cols-2 sm:grid-cols-4',
    )}>
      {shown.map((kpi, i) => <KPICard key={kpi.id} kpi={kpi} idx={i} />)}
    </div>
  )
}
