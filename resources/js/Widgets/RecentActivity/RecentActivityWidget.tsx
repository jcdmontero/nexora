/**
 * RecentActivityWidget — Actividad con estado visible.
 * Diseño del mockup: dot coloreado + texto preciso + pastilla de tipo inline.
 */
import { Link } from '@inertiajs/react'
import { ArrowRight, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityLog } from '../types'
import { WidgetShell } from '../WidgetShell'

// ── Metadatos por tipo de evento ──────────────────────────────────────

interface EventMeta { label: string; dot: string }

const EVENT: Record<string, EventMeta> = {
  created:  { label: 'creó',      dot: 'bg-emerald-500' },
  updated:  { label: 'actualizó', dot: 'bg-blue-500'    },
  deleted:  { label: 'eliminó',   dot: 'bg-red-500'     },
  restored: { label: 'restauró',  dot: 'bg-amber-500'   },
}
const DEFAULT_EVENT: EventMeta = { label: 'modificó', dot: 'bg-muted-foreground' }

// ── Pill badge ────────────────────────────────────────────────────────

type PillRole = 'success' | 'warning' | 'info' | 'danger' | 'pro' | 'muted'

const PILL_STYLE: Record<PillRole, string> = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  info:    'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  danger:  'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  pro:     'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  muted:   'bg-muted text-muted-foreground',
}

const ENTITY_ROLE: Record<string, PillRole> = {
  Factura:       'success',
  OrdenReparacion:'info',
  Cliente:       'pro',
  Producto:      'warning',
  Proveedor:     'muted',
  OrdenCompra:   'info',
  Empleado:      'pro',
  Asiento:       'muted',
  CajaSesion:    'success',
  Ticket:        'danger',
  User:          'muted',
}

function entityLabel(raw: string): string {
  const map: Record<string, string> = {
    OrdenReparacion: 'Orden',
    Factura:         'Factura',
    Cliente:         'Cliente',
    Producto:        'Producto',
    User:            'Usuario',
    Sede:            'Sede',
    Proveedor:       'Proveedor',
    OrdenCompra:     'Compra',
    Empleado:        'Empleado',
    Contrato:        'Contrato',
    Asiento:         'Asiento',
    CajaSesion:      'Caja',
    Ticket:          'Ticket',
  }
  const clean = raw.replace(/.*[\\\/]/, '')
  return map[clean] ?? clean
}

// ── Componente ────────────────────────────────────────────────────────

export function RecentActivityWidget({ data }: { data: ActivityLog[] }) {
  const auditLink = route().has('core.audit.index') ? route('core.audit.index') : null

  return (
    <WidgetShell
      widgetId="recent-activity"
      title="Actividad reciente"
      icon={Activity}
      accent="sky"
      size="half"
      showMenu={false}
      headerActions={
        auditLink ? (
          <Link href={auditLink}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            Ver todo <ArrowRight className="h-3 w-3" />
          </Link>
        ) : undefined
      }
    >
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Sin actividad registrada aún.
        </p>
      ) : (
        <ul>
          {data.map((log, i) => {
            const meta    = EVENT[log.event] ?? DEFAULT_EVENT
            const entity  = entityLabel(log.auditable_type ?? '')
            const role    = ENTITY_ROLE[log.auditable_type?.replace(/.*[\\\/]/, '') ?? ''] ?? 'muted'
            const isLast  = i === data.length - 1

            return (
              <li
                key={log.id}
                className={cn('flex items-start gap-3 py-2.5', !isLast && 'border-b border-border/60')}
              >
                {/* Dot coloreado */}
                <span className={cn('mt-[5px] h-2 w-2 shrink-0 rounded-full', meta.dot)} />

                {/* Cuerpo */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground leading-snug">
                    <strong className="font-medium">{log.user}</strong>
                    {' '}
                    <span className="text-muted-foreground">{meta.label}</span>
                    {entity && <> <strong className="font-medium">{entity}</strong></>}
                    {log.description && (
                      <span className="text-muted-foreground"> — {log.description}</span>
                    )}
                    {/* Pastilla de tipo inline */}
                    {entity && (
                      <>
                        {' '}
                        <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold', PILL_STYLE[role])}>
                          {entity}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{log.created_human}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </WidgetShell>
  )
}
