import { Link } from '@inertiajs/react'
import { Receipt, ArrowRight, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WidgetShell } from '../WidgetShell'
import { WidgetSkeleton } from '../WidgetSkeleton'
import { EmptyState } from '@/Components/ui/empty-state'
import { useWidgetData } from '@/Hooks/useWidgetData'

// ── Tipos ─────────────────────────────────────────────────────────────

interface FacturaItem {
  id: number
  numero: string
  total: number
  estado: string
  cliente: string
  fecha: string
}

interface SalesData {
  facturas_recientes: FacturaItem[]
  pendientes_cobrar: number
}

// ── Config de estados ─────────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; class: string }> = {
  pagada:   { label: 'Pagada',   class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  pendiente:{ label: 'Pendiente',class: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  anulada:  { label: 'Anulada',  class: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 line-through' },
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return '$ ' + (n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'M'
  if (n >= 1_000)     return '$ ' + (n / 1_000).toLocaleString('es-CO', { maximumFractionDigits: 0 }) + 'k'
  return '$ ' + n.toLocaleString('es-CO')
}

// ── Componente ────────────────────────────────────────────────────────

export function RecentInvoicesWidget() {
  const { data, loading, error } = useWidgetData<SalesData>({
    module: 'sales',
    refreshInterval: 120_000,
  })

  if (loading && !data) {
    return <WidgetSkeleton title="Últimas facturas" icon={Receipt} accent="emerald" />
  }

  const indexRoute = route().has('sales.facturas.index') ? route('sales.facturas.index') : null

  return (
    <WidgetShell
      widgetId="recent-invoices"
      title="Últimas facturas"
      description="Ventas recientes"
      icon={Receipt}
      accent="emerald"
      size="half"
      headerActions={
        indexRoute ? (
          <Link
            href={indexRoute}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        ) : undefined
      }
    >
      {/* Aviso de cuentas por cobrar */}
      {data && data.pendientes_cobrar > 0 && (
        <Link
          href={indexRoute ?? '#'}
          className={cn(
            'mb-4 flex items-center gap-2 rounded-lg border px-3 py-2',
            'bg-amber-50 border-amber-200 text-amber-700',
            'dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400',
            'text-sm font-medium transition-opacity hover:opacity-80',
          )}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {data.pendientes_cobrar} {data.pendientes_cobrar === 1 ? 'factura pendiente de cobro' : 'facturas pendientes de cobro'}
        </Link>
      )}

      {error || !data ? (
        <EmptyState icon={Receipt} title="No disponible" description="No se pudieron cargar las facturas recientes." />
      ) : data.facturas_recientes.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin facturas" description="Aún no hay facturas registradas." />
      ) : (
        <ul className="divide-y divide-border -mx-1">
          {data.facturas_recientes.map((factura) => {
            const cfg = ESTADO_CONFIG[factura.estado]
            return (
              <li key={factura.id} className="flex items-center gap-3 px-1 py-3 transition-colors hover:bg-muted/30">
                {/* Monto */}
                <div className="min-w-[4.5rem] shrink-0 text-right">
                  <span className={cn('text-sm font-bold tabular-nums text-foreground', factura.estado === 'anulada' && 'line-through opacity-50')}>
                    {formatCurrency(factura.total)}
                  </span>
                </div>

                {/* Detalle */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{factura.numero}</p>
                  <p className="truncate text-xs text-muted-foreground">{factura.cliente}</p>
                </div>

                {/* Estado + fecha */}
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {cfg && (
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.class)}>
                      {cfg.label}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{factura.fecha}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </WidgetShell>
  )
}
