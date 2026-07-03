import { Link, usePage } from '@inertiajs/react'
import {
  Activity, CheckCircle2, AlertTriangle, Package, FileText,
  ShoppingCart, Wrench, Wallet, HelpCircle, HeadphonesIcon,
} from 'lucide-react'
import { cn, routeExistsSafe } from '@/lib/utils'
import { Skeleton } from '@/Components/ui/skeleton'
import type { OperationalPulse } from '@/Widgets/types'

interface PulseIndicator {
  key: string
  label: string
  count: number
  route: string
  icon: typeof Activity
  severity: 'ok' | 'attention' | 'critical'
}

function getSeverityColor(severity: 'ok' | 'attention' | 'critical'): string {
  return {
    ok: 'bg-emerald-500',
    attention: 'bg-amber-500',
    critical: 'bg-rose-500',
  }[severity]
}

function getOverallSeverity(pulse: OperationalPulse): 'ok' | 'attention' | 'critical' {
  const stock = pulse.stock_bajo ?? 0
  const ordenes = pulse.ordenes_activas ?? 0
  if (stock > 5 || ordenes > 20) return 'critical'
  if (stock > 0 || (pulse.facturas_pendientes ?? 0) > 3) return 'attention'
  return 'ok'
}

function buildIndicators(pulse: OperationalPulse): PulseIndicator[] {
  const indicators: PulseIndicator[] = []

  if (pulse.ordenes_activas !== undefined && pulse.ordenes_activas > 0) {
    indicators.push({
      key: 'ordenes',
      label: `${pulse.ordenes_activas} ${pulse.ordenes_activas === 1 ? 'orden activa' : 'órdenes activas'}`,
      count: pulse.ordenes_activas,
      route: 'service-desk.tickets.index',
      icon: Wrench,
      severity: pulse.ordenes_activas > 20 ? 'critical' : pulse.ordenes_activas > 10 ? 'attention' : 'ok',
    })
  }

  if (pulse.facturas_pendientes !== undefined && pulse.facturas_pendientes > 0) {
    indicators.push({
      key: 'facturas',
      label: `${pulse.facturas_pendientes} ${pulse.facturas_pendientes === 1 ? 'factura pendiente' : 'facturas pendientes'}`,
      count: pulse.facturas_pendientes,
      route: 'sales.facturas.index',
      icon: ShoppingCart,
      severity: pulse.facturas_pendientes > 5 ? 'attention' : 'ok',
    })
  }

  if (pulse.stock_bajo !== undefined && pulse.stock_bajo > 0) {
    indicators.push({
      key: 'stock',
      label: `${pulse.stock_bajo} ${pulse.stock_bajo === 1 ? 'producto bajo stock' : 'productos bajo stock'}`,
      count: pulse.stock_bajo,
      route: 'inventory.productos.index',
      icon: Package,
      severity: pulse.stock_bajo > 5 ? 'critical' : 'attention',
    })
  }

  if (pulse.compras_pendientes !== undefined && pulse.compras_pendientes > 0) {
    indicators.push({
      key: 'compras',
      label: `${pulse.compras_pendientes} ${pulse.compras_pendientes === 1 ? 'compra pendiente' : 'compras pendientes'}`,
      count: pulse.compras_pendientes,
      route: 'purchasing.ordenes.index',
      icon: FileText,
      severity: 'ok',
    })
  }

  if (pulse.cajas_abiertas !== undefined && pulse.cajas_abiertas > 0) {
    indicators.push({
      key: 'cajas',
      label: `${pulse.cajas_abiertas} ${pulse.cajas_abiertas === 1 ? 'caja abierta' : 'cajas abiertas'}`,
      count: pulse.cajas_abiertas,
      route: 'cash.arqueo.index',
      icon: Wallet,
      severity: 'ok',
    })
  }

  return indicators
}

export function SidebarOperationalStatus({ collapsed }: { collapsed?: boolean }) {
  const { operationalPulse } = usePage().props as { operationalPulse?: OperationalPulse | null }

  if (collapsed) {
    const severity = operationalPulse ? getOverallSeverity(operationalPulse) : 'ok'
    const indicators = operationalPulse ? buildIndicators(operationalPulse) : []
    const tooltipText = indicators.length > 0
      ? indicators.map((i) => i.label).join(', ')
      : 'Todo en orden'

    return (
      <div className="px-2 py-2 space-y-0.5 mb-1">
        <div
          title={tooltipText}
          className="relative flex justify-center p-2.5 text-muted-foreground rounded-lg"
        >
          <Activity className="w-[18px] h-[18px]" />
          <span className={cn(
            'absolute top-1.5 right-2.5 w-2 h-2 rounded-full ring-2 ring-card',
            getSeverityColor(severity),
          )} />
        </div>
        <button type="button" title="Ayuda" className="flex justify-center p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
          <HelpCircle className="w-[18px] h-[18px]" />
        </button>
        <button type="button" title="Documentación" className="flex justify-center p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
          <FileText className="w-[18px] h-[18px]" />
        </button>
        <button type="button" title="Soporte" className="flex justify-center p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
          <HeadphonesIcon className="w-[18px] h-[18px]" />
        </button>
      </div>
    )
  }

  const isLoading = operationalPulse === undefined
  const indicators = operationalPulse ? buildIndicators(operationalPulse) : []

  return (
    <div className="px-4 py-2 space-y-2 mb-2">
      {/* Estado operativo */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Estado operativo
          </span>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {!isLoading && indicators.length === 0 && (
          <div className="flex items-center gap-2 py-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Todo en orden</span>
          </div>
        )}

        {!isLoading && indicators.length > 0 && (
          <div className="space-y-1">
            {indicators.map((ind) => {
              const canNavigate = routeExistsSafe(ind.route)
              const content = (
                <div className="flex items-center gap-2 py-1 group">
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', getSeverityColor(ind.severity))} />
                  <ind.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate">
                    {ind.label}
                  </span>
                </div>
              )

              return canNavigate ? (
                <Link key={ind.key} href={route(ind.route)} className="block rounded-md hover:bg-accent/30 px-1 -mx-1 transition-colors">
                  {content}
                </Link>
              ) : (
                <div key={ind.key} className="px-1 -mx-1">{content}</div>
              )
            })}
          </div>
        )}

        {!isLoading && indicators.some((i) => i.severity !== 'ok') && (
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-border/50">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-[10px] text-muted-foreground">
              Requiere atención
            </span>
          </div>
        )}
      </div>

      {/* Links de soporte */}
      <div className="flex items-center gap-1 px-1">
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50">
          Ayuda
        </button>
        <span className="text-border text-xs">·</span>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50 inline-flex items-center gap-1">
          Docs
        </button>
        <span className="text-border text-xs">·</span>
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-accent/50">
          Soporte
        </button>
      </div>
    </div>
  )
}
