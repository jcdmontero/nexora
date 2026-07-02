import { Link } from '@inertiajs/react'
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WidgetShell } from '../WidgetShell'
import { WidgetSkeleton } from '../WidgetSkeleton'
import { useWidgetData } from '@/Hooks/useWidgetData'

// ── Tipos ─────────────────────────────────────────────────────────────

interface CashData {
  sesion_activa: boolean
  caja_nombre?: string
  saldo_inicial?: number
  ingresos?: number
  egresos?: number
  saldo_actual?: number
  apertura?: string
  apertura_humano?: string
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return '$ ' + (n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 2 }) + 'M'
  if (n >= 1_000)     return '$ ' + (n / 1_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'k'
  return '$ ' + n.toLocaleString('es-CO')
}

// ── Componente ────────────────────────────────────────────────────────

export function CashStatusWidget() {
  const { data, loading, error } = useWidgetData<CashData>({
    module: 'cash',
    refreshInterval: 60_000, // refresca cada minuto
  })

  if (loading && !data) {
    return <WidgetSkeleton title="Estado de caja" icon={Wallet} accent="emerald" />
  }

  const cajaRoute = route().has('cash.arqueo.index') ? route('cash.arqueo.index') : null

  return (
    <WidgetShell
      widgetId="cash-status"
      title="Estado de caja"
      description={data?.sesion_activa ? `Abierta desde ${data.apertura}` : 'Sin sesión activa'}
      icon={Wallet}
      accent="emerald"
      size="quarter"
      headerActions={
        cajaRoute ? (
          <Link
            href={cajaRoute}
            aria-label="Ir a caja"
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : undefined
      }
    >
      {error || !data ? (
        <p className="py-4 text-center text-sm text-muted-foreground">No disponible</p>
      ) : !data.sesion_activa ? (
        /* Caja cerrada */
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Caja cerrada</p>
            <p className="mt-0.5 text-xs text-muted-foreground">No hay sesión activa</p>
          </div>
          {cajaRoute && (
            <Link
              href={cajaRoute}
              className={cn(
                'mt-1 inline-flex items-center gap-1.5 rounded-lg px-4 py-2',
                'text-sm font-medium text-emerald-700 dark:text-emerald-400',
                'bg-emerald-50 dark:bg-emerald-500/10',
                'transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-500/20',
              )}
            >
              <Wallet className="h-3.5 w-3.5" />
              Abrir caja
            </Link>
          )}
        </div>
      ) : (
        /* Caja abierta */
        <div className="space-y-4">
          {/* Nombre de caja + tiempo abierto */}
          {data.caja_nombre && (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-sm font-medium text-foreground truncate">{data.caja_nombre}</span>
            </div>
          )}
          {data.apertura_humano && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Abierta {data.apertura_humano}
            </div>
          )}

          {/* Saldo actual — protagonista */}
          <div className="rounded-xl bg-muted/40 px-4 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Saldo actual</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
              {formatMoney(data.saldo_actual ?? 0)}
            </p>
          </div>

          {/* Ingresos / Egresos */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                <ArrowUpRight className="h-3 w-3" />
                Ingresos
              </div>
              <p className="mt-1 text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatMoney(data.ingresos ?? 0)}
              </p>
            </div>
            <div className="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-3 py-2">
              <div className="flex items-center gap-1 text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-400">
                <ArrowDownRight className="h-3 w-3" />
                Egresos
              </div>
              <p className="mt-1 text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {formatMoney(data.egresos ?? 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </WidgetShell>
  )
}
