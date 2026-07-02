import { Link } from '@inertiajs/react'
import { Wrench, ArrowRight, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WidgetShell } from '../WidgetShell'
import { WidgetSkeleton } from '../WidgetSkeleton'
import { EmptyState } from '@/Components/ui/empty-state'
import { useWidgetData } from '@/Hooks/useWidgetData'

// ── Tipos ─────────────────────────────────────────────────────────────

interface EstadoCounts {
  recibido: number
  diagnosticado: number
  en_proceso: number
  completado: number
}

interface OrdenItem {
  id: number
  numero: string
  estado: string
  cliente: string
  fecha: string
}

interface ServiceDeskData {
  por_estado: EstadoCounts
  total_activas: number
  cola: OrdenItem[]
}

// ── Mapa visual de estados ────────────────────────────────────────────

const ESTADO_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  recibido:      { label: 'Recibido',      dot: 'bg-sky-500',    badge: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400' },
  diagnosticado: { label: 'Diagnóstico',   dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  en_proceso:    { label: 'En proceso',    dot: 'bg-indigo-500', badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' },
  completado:    { label: 'Para entregar', dot: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
}

// ── Componente ────────────────────────────────────────────────────────

export function ServiceDeskQueueWidget() {
  const { data, loading, error } = useWidgetData<ServiceDeskData>({
    module: 'service-desk',
    refreshInterval: 120_000, // refresca cada 2 min
  })

  if (loading && !data) {
    return <WidgetSkeleton title="Cola de servicio" icon={Wrench} accent="rose" />
  }

  const verTodoLink = route().has('service-desk.tickets.index')
    ? route('service-desk.tickets.index')
    : null

  return (
    <WidgetShell
      widgetId="service-desk-queue"
      title="Cola de servicio"
      description={data ? `${data.total_activas} órdenes activas` : undefined}
      icon={Wrench}
      accent="rose"
      size="half"
      headerActions={
        verTodoLink ? (
          <Link
            href={verTodoLink}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        ) : undefined
      }
    >
      {error || !data ? (
        <EmptyState icon={Wrench} title="No disponible" description="No se pudo cargar la cola de servicio." />
      ) : (
        <div className="space-y-4">
          {/* Chips de conteo por estado */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.entries(ESTADO_CONFIG) as [string, typeof ESTADO_CONFIG[string]][]).map(([key, cfg]) => {
              const count = data.por_estado[key as keyof EstadoCounts] ?? 0
              return (
                <div
                  key={key}
                  className="flex flex-col items-center gap-1 rounded-xl border border-border bg-muted/30 px-2 py-3"
                >
                  <span className="text-2xl font-bold tabular-nums text-foreground">{count}</span>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                    <Circle className={cn('h-1.5 w-1.5 fill-current', cfg.dot.replace('bg-', 'text-'))} />
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Lista de cola activa */}
          {data.cola.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin órdenes pendientes</p>
          ) : (
            <ul className="divide-y divide-border -mx-1">
              {data.cola.map((orden) => {
                const cfg = ESTADO_CONFIG[orden.estado]
                const detailRoute = route().has('service-desk.tickets.index')
                  ? route('service-desk.tickets.index')
                  : null

                const content = (
                  <li className="group flex items-center gap-3 px-1 py-2.5 transition-colors hover:bg-muted/30">
                    <span className={cn('h-2 w-2 shrink-0 rounded-full', cfg?.dot ?? 'bg-muted')} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{orden.numero}</p>
                      <p className="truncate text-xs text-muted-foreground">{orden.cliente}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {cfg && (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.badge)}>
                          {cfg.label}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{orden.fecha}</span>
                    </div>
                  </li>
                )

                return detailRoute ? (
                  <Link key={orden.id} href={detailRoute}>{content}</Link>
                ) : (
                  <div key={orden.id}>{content}</div>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </WidgetShell>
  )
}
