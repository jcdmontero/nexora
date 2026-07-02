/**
 * QuickActionsWidget — Barra horizontal de accesos rápidos.
 * Estilo: "Acceso rápido | [Btn accent] [Btn success] [Btn pro] … | Más"
 */
import { Link } from '@inertiajs/react'
import {
  UserPlus, ShoppingCart, Package, Wrench, Plus, ChevronRight,
  Users, Truck, Calculator, Wallet, DollarSign, ClipboardList,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuickAccessItem } from '../types'

type Role = 'accent' | 'success' | 'warning' | 'danger' | 'pro' | 'default'

const ROLE_STYLES: Record<Role, string> = {
  accent:  'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300',
  warning: 'bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-300 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300',
  danger:  'bg-red-50 border-red-200 text-red-700 hover:border-red-300 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300',
  pro:     'bg-violet-50 border-violet-200 text-violet-700 hover:border-violet-300 dark:bg-violet-950/50 dark:border-violet-800 dark:text-violet-300',
  default: 'bg-muted/50 border-border text-foreground hover:border-foreground/30 hover:bg-muted',
}

const ICON_STYLES: Record<Role, string> = {
  accent:  'text-blue-600 dark:text-blue-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger:  'text-red-600 dark:text-red-400',
  pro:     'text-violet-600 dark:text-violet-400',
  default: 'text-muted-foreground',
}

// Mapea colores del backend a roles visuales
const COLOR_TO_ROLE: Record<string, Role> = {
  indigo:  'accent',
  emerald: 'success',
  amber:   'warning',
  rose:    'danger',
  violet:  'pro',
  sky:     'accent',
}

const ICON_MAP: Record<string, LucideIcon> = {
  UserPlus, Users, ShoppingCart, Package, Wrench,
  ClipboardList, Truck, Calculator, Wallet, DollarSign,
}

const MAX_VISIBLE = 5

export function QuickActionsWidget({ items }: { items: QuickAccessItem[] }) {
  const valid = items.filter((a) => {
    try { return route().has(a.route) } catch { return false }
  })

  if (valid.length === 0) return null

  const visible = valid.slice(0, MAX_VISIBLE)
  const extra   = valid.length - MAX_VISIBLE

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      {/* Label */}
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        Acceso rápido
      </span>

      {/* Divisor */}
      <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

      {/* Botones */}
      {visible.map((action) => {
        const Icon = ICON_MAP[action.icon] ?? Plus
        const role: Role = COLOR_TO_ROLE[action.color] ?? 'default'

        return (
          <Link
            key={action.route}
            href={route(action.route)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5',
              'text-sm font-medium whitespace-nowrap',
              'transition-all duration-150',
              ROLE_STYLES[role],
            )}
          >
            <Icon className={cn('h-4 w-4 shrink-0', ICON_STYLES[role])} />
            {action.label}
          </Link>
        )
      })}

      {/* Más (overflow) */}
      {extra > 0 && (
        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          +{extra} más <ChevronRight className="h-3 w-3" />
        </span>
      )}
    </div>
  )
}
