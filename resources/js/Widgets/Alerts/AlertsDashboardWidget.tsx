import { useState } from 'react'
import { Link } from '@inertiajs/react'
import {
  Bell, Package, Receipt, CreditCard, Wrench,
  AlertTriangle, Clock, ArrowRight, Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WidgetShell } from '../WidgetShell'
import { EmptyState } from '@/Components/ui/empty-state'
import type {
  AlertsSummary,
  StockBajoItem,
  FacturaPorVencerItem,
  CuentaPorPagarItem,
  ServicioPendienteItem,
  CajaAbiertaItem,
} from '../types'

// ── Tab definitions ───────────────────────────────────────────────────

interface TabDef {
  id: string
  label: string
  icon: typeof Package
  countKey: keyof AlertsSummary
  accentDot: string
  accentBadge: string
  emptyIcon: typeof Package
  emptyTitle: string
  emptyDesc: string
}

const TABS: TabDef[] = [
  {
    id: 'stock',
    label: 'Stock bajo',
    icon: Package,
    countKey: 'stock_bajo',
    accentDot: 'bg-amber-500',
    accentBadge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    emptyIcon: Package,
    emptyTitle: 'Inventario OK',
    emptyDesc: 'Todos los productos tienen stock suficiente.',
  },
  {
    id: 'facturas',
    label: 'Facturas por vencer',
    icon: Receipt,
    countKey: 'facturas_por_vencer',
    accentDot: 'bg-rose-500',
    accentBadge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    emptyIcon: Receipt,
    emptyTitle: 'Sin facturas por vencer',
    emptyDesc: 'No hay facturas pendientes próximas a vencer.',
  },
  {
    id: 'cuentas',
    label: 'Cuentas por pagar',
    icon: CreditCard,
    countKey: 'cuentas_por_pagar',
    accentDot: 'bg-violet-500',
    accentBadge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    emptyIcon: CreditCard,
    emptyTitle: 'Sin cuentas pendientes',
    emptyDesc: 'No hay órdenes de compra pendientes de pago.',
  },
  {
    id: 'servicios',
    label: 'Servicios',
    icon: Wrench,
    countKey: 'servicios_pendientes',
    accentDot: 'bg-sky-500',
    accentBadge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    emptyIcon: Wrench,
    emptyTitle: 'Sin servicios pendientes',
    emptyDesc: 'No hay órdenes de servicio en proceso.',
  },
  {
    id: 'cajas',
    label: 'Cajas abiertas',
    icon: CreditCard, // Wallet if imported, but we have CreditCard
    countKey: 'cajas_abiertas',
    accentDot: 'bg-emerald-500',
    accentBadge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    emptyIcon: CreditCard,
    emptyTitle: 'Sin cajas abiertas',
    emptyDesc: 'Todas las sesiones de caja están cerradas.',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return '$ ' + (n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'M'
  if (n >= 1_000)     return '$ ' + (n / 1_000).toLocaleString('es-CO', { maximumFractionDigits: 0 }) + 'k'
  return '$ ' + n.toLocaleString('es-CO')
}

function severityDot(nivel: string): string {
  return nivel === 'critico' ? 'bg-rose-500' : 'bg-amber-500'
}

function diasLabel(dias: number): string {
  if (dias < 0) return `Vencida hace ${Math.abs(dias)}d`
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence mañana'
  return `${dias} días`
}

// ── Estado labels ─────────────────────────────────────────────────────

const ESTADO_SERVICIO: Record<string, { label: string; class: string }> = {
  recibido:      { label: 'Recibido',    class: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
  diagnosticado: { label: 'Diagnóstico', class: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  en_proceso:    { label: 'En proceso',  class: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' },
}

const ESTADO_COMPRA: Record<string, { label: string; class: string }> = {
  pendiente: { label: 'Pendiente', class: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  enviada:   { label: 'Enviada',   class: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
  parcial:   { label: 'Parcial',   class: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' },
  aprobada:  { label: 'Aprobada',  class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
}

// ── Loading skeleton ──────────────────────────────────────────────────

function AlertsSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-28 rounded-lg bg-muted" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="h-2 w-2 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Sub-renderers ─────────────────────────────────────────────────────

function StockBajoList({ items }: { items: StockBajoItem[] }) {
  const hasRoute = (() => { try { return route().has('inventory.productos.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', severityDot(item.nivel))} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{item.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {item.sku ? `SKU: ${item.sku} · ` : ''}Stock: {item.stock_actual} / mín. {item.stock_minimo}
            </p>
          </div>
          <span className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            item.nivel === 'critico'
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
          )}>
            {item.nivel === 'critico' ? 'Crítico' : 'Bajo'}
          </span>
        </li>
      ))}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('inventory.productos.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todo el inventario <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

function FacturasPorVencerList({ items }: { items: FacturaPorVencerItem[] }) {
  const hasRoute = (() => { try { return route().has('sales.facturas.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', item.dias_restantes <= 0 ? 'bg-rose-500' : item.dias_restantes <= 3 ? 'bg-amber-500' : 'bg-sky-500')} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{item.numero}</p>
            <p className="truncate text-xs text-muted-foreground">{item.cliente}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(item.total)}</span>
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold',
              item.dias_restantes <= 0
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                : item.dias_restantes <= 3
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                : 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
            )}>
              {diasLabel(item.dias_restantes)}
            </span>
          </div>
        </li>
      ))}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('sales.facturas.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todas las facturas <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

function CuentasPorPagarList({ items }: { items: CuentaPorPagarItem[] }) {
  const hasRoute = (() => { try { return route().has('purchasing.ordenes.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const cfg = ESTADO_COMPRA[item.estado]
        return (
          <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', item.dias_desde_creacion > 30 ? 'bg-rose-500' : item.dias_desde_creacion > 15 ? 'bg-amber-500' : 'bg-sky-500')} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.numero}</p>
              <p className="truncate text-xs text-muted-foreground">{item.proveedor}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(item.total)}</span>
              <div className="flex items-center gap-1.5">
                {cfg && (
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.class)}>
                    {cfg.label}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">{item.dias_desde_creacion}d</span>
              </div>
            </div>
          </li>
        )
      })}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('purchasing.ordenes.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todas las compras <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

function ServiciosPendientesList({ items }: { items: ServicioPendienteItem[] }) {
  const hasRoute = (() => { try { return route().has('service-desk.tickets.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        const cfg = ESTADO_SERVICIO[item.estado]
        return (
          <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', cfg?.class.includes('sky') ? 'bg-sky-500' : cfg?.class.includes('amber') ? 'bg-amber-500' : 'bg-indigo-500')} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.numero_orden}</p>
              <p className="truncate text-xs text-muted-foreground">{item.cliente}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {cfg && (
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.class)}>
                  {cfg.label}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">{item.fecha}</span>
            </div>
          </li>
        )
      })}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('service-desk.tickets.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todos los tickets <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

function CajasAbiertasList({ items }: { items: CajaAbiertaItem[] }) {
  const hasRoute = (() => { try { return route().has('cash.arqueo.index') } catch { return false } })()
  return (
    <ul className="divide-y divide-border">
      {items.map((item) => {
        return (
          <li key={item.id} className="group flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 px-1 -mx-1 rounded-lg">
            <span className={cn('h-2 w-2 shrink-0 rounded-full', item.nivel === 'critico' ? 'bg-rose-500' : 'bg-emerald-500')} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{item.caja}</p>
              <p className="truncate text-xs text-muted-foreground">{item.cajero}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(item.saldo_actual)}</span>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', item.nivel === 'critico' ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400')}>
                {item.horas_abierta}h abierta
              </span>
            </div>
          </li>
        )
      })}
      {hasRoute && items.length > 0 && (
        <li className="pt-3">
          <Link
            href={route('cash.arqueo.index')}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ir a caja <ArrowRight className="h-3 w-3" />
          </Link>
        </li>
      )}
    </ul>
  )
}

// ── Main Widget ───────────────────────────────────────────────────────

interface AlertsDashboardWidgetProps {
  data?: AlertsSummary
}

export function AlertsDashboardWidget({ data }: AlertsDashboardWidgetProps) {
  const [activeTab, setActiveTab] = useState(TABS[0].id)

  const stock = data ? (Array.isArray(data.stock_bajo) ? data.stock_bajo : Object.values(data.stock_bajo || {})) : []
  const facturas = data ? (Array.isArray(data.facturas_por_vencer) ? data.facturas_por_vencer : Object.values(data.facturas_por_vencer || {})) : []
  const cuentas = data ? (Array.isArray(data.cuentas_por_pagar) ? data.cuentas_por_pagar : Object.values(data.cuentas_por_pagar || {})) : []
  const servicios = data ? (Array.isArray(data.servicios_pendientes) ? data.servicios_pendientes : Object.values(data.servicios_pendientes || {})) : []
  const cajas = data ? (Array.isArray(data.cajas_abiertas) ? data.cajas_abiertas : Object.values(data.cajas_abiertas || {})) : []

  // Count total alerts
  const totalAlerts = data
    ? stock.length + facturas.length + cuentas.length + servicios.length + cajas.length
    : 0

  // Don't render if loaded and no alerts
  if (data && totalAlerts === 0) return null

  const activeTabDef = TABS.find((t) => t.id === activeTab) ?? TABS[0]

  const getList = (id: string) => {
    switch(id) {
      case 'stock': return stock
      case 'facturas': return facturas
      case 'cuentas': return cuentas
      case 'servicios': return servicios
      case 'cajas': return cajas
      default: return []
    }
  }

  return (
    <WidgetShell
      widgetId="alerts-dashboard"
      title="Centro de alertas"
      description={data ? `${totalAlerts} ${totalAlerts === 1 ? 'alerta activa' : 'alertas activas'}` : undefined}
      icon={Bell}
      accent="amber"
      size="full"
      headerActions={
        data && totalAlerts > 0 ? (
          <span className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5',
            'text-[10px] font-bold tabular-nums',
            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
          )}>
            {totalAlerts}
          </span>
        ) : undefined
      }
    >
      {/* Loading state */}
      {!data ? (
        <AlertsSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {TABS.map((tab) => {
              const count = getList(tab.id).length
              const isActive = activeTab === tab.id
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-foreground/[0.06] text-foreground shadow-sm ring-1 ring-foreground/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    count === 0 && !isActive && 'opacity-50',
                  )}
                >
                  <TabIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold tabular-nums',
                      isActive ? tab.accentBadge : 'bg-muted text-muted-foreground',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="min-h-[120px]">
            {activeTab === 'stock' && (
              stock.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <StockBajoList items={stock} />
            )}
            {activeTab === 'facturas' && (
              facturas.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <FacturasPorVencerList items={facturas} />
            )}
            {activeTab === 'cuentas' && (
              cuentas.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <CuentasPorPagarList items={cuentas} />
            )}
            {activeTab === 'servicios' && (
              servicios.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <ServiciosPendientesList items={servicios} />
            )}
            {activeTab === 'cajas' && (
              cajas.length === 0
                ? <EmptyState icon={activeTabDef.emptyIcon} title={activeTabDef.emptyTitle} description={activeTabDef.emptyDesc} />
                : <CajasAbiertasList items={cajas} />
            )}
          </div>
        </div>
      )}
    </WidgetShell>
  )
}
