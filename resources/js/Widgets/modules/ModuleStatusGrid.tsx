/**
 * ModuleStatusGrid — Grilla de módulos con contexto.
 * Diseño: icono coloreado + nombre + estado/count + chevron derecho.
 * Exactamente como el mockup: mod-item con mod-icon colored box.
 */
import { Link } from '@inertiajs/react'
import {
  ShoppingCart, Package, Users2, Wrench, Calculator,
  Wallet, UserCheck, FileText, Bell, DollarSign,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '../types'

// ── Rol visual → colores Tailwind ─────────────────────────────────────

type Role = 'accent' | 'success' | 'warning' | 'danger' | 'pro' | 'muted'

const ICON_BG: Record<Role, string> = {
  accent:  'bg-blue-50 dark:bg-blue-950/60',
  success: 'bg-emerald-50 dark:bg-emerald-950/60',
  warning: 'bg-amber-50 dark:bg-amber-950/60',
  danger:  'bg-red-50 dark:bg-red-950/60',
  pro:     'bg-violet-50 dark:bg-violet-950/60',
  muted:   'bg-muted',
}
const ICON_COLOR: Record<Role, string> = {
  accent:  'text-blue-600 dark:text-blue-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger:  'text-red-600 dark:text-red-400',
  pro:     'text-violet-600 dark:text-violet-400',
  muted:   'text-muted-foreground',
}

// ── Definición de módulo ──────────────────────────────────────────────

interface ModCard {
  code: string
  name: string
  shortName: string
  Icon: LucideIcon
  role: Role
  getStatus: (stats: DashboardStats) => string
  href?: string
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return '$ ' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return '$ ' + (n / 1_000).toFixed(0) + 'k'
  return '$ ' + n.toLocaleString('es-CO')
}

const MODULE_DEFS: Omit<ModCard, 'href'>[] = [
  {
    code: 'sales', name: 'Ventas', shortName: 'Ventas',
    Icon: DollarSign, role: 'success',
    getStatus: (s) => s.ventas_mes != null && s.ventas_mes > 0
      ? fmtMoney(s.ventas_mes)
      : s.facturas_pendientes != null && s.facturas_pendientes > 0
        ? `${s.facturas_pendientes} pendientes`
        : 'Sin ventas este mes',
  },
  {
    code: 'service-desk', name: 'Serv. técnico', shortName: 'Técnico',
    Icon: Wrench, role: 'accent',
    getStatus: (s) => s.ordenes_en_proceso != null
      ? `${s.ordenes_en_proceso} órdenes`
      : 'Sin órdenes',
  },
  {
    code: 'inventory', name: 'Inventario', shortName: 'Inventario',
    Icon: Package, role: 'warning',
    getStatus: (s) => s.productos_bajo_stock != null && s.productos_bajo_stock > 0
      ? `${s.productos_bajo_stock} alertas`
      : s.productos != null ? `${s.productos} productos` : 'Activo',
  },
  {
    code: 'crm', name: 'CRM', shortName: 'CRM',
    Icon: Users2, role: 'pro',
    getStatus: (s) => s.clientes != null
      ? `${s.clientes} clientes`
      : 'Activo',
  },
  {
    code: 'purchasing', name: 'Compras', shortName: 'Compras',
    Icon: ShoppingCart, role: 'danger',
    getStatus: (s) => s.compras_pendientes != null && s.compras_pendientes > 0
      ? `${s.compras_pendientes} órdenes`
      : s.proveedores != null ? `${s.proveedores} proveedores` : 'Activo',
  },
  {
    code: 'accounting', name: 'Contabilidad', shortName: 'Contabilidad',
    Icon: Calculator, role: 'accent',
    getStatus: () => 'Módulo activo',
  },
  {
    code: 'cash', name: 'Tesorería', shortName: 'Tesorería',
    Icon: Wallet, role: 'success',
    getStatus: () => 'Ver estado',
  },
  {
    code: 'hr', name: 'Talento Humano', shortName: 'RRHH',
    Icon: UserCheck, role: 'pro',
    getStatus: () => 'Módulo activo',
  },
  {
    code: 'payroll', name: 'Nómina', shortName: 'Nómina',
    Icon: FileText, role: 'warning',
    getStatus: () => 'Módulo activo',
  },
  {
    code: 'notifications', name: 'Notificaciones', shortName: 'Notif.',
    Icon: Bell, role: 'warning',
    getStatus: () => 'Módulo activo',
  },
]

// ── Elemento de módulo ────────────────────────────────────────────────

function ModItem({
  def,
  stats,
}: {
  def: Omit<ModCard, 'href'>
  stats: DashboardStats
}) {
  const status = def.getStatus(stats)

  let href: string | undefined
  try {
    const routeMap: Record<string, string> = {
      sales:         'sales.facturas.index',
      'service-desk':'service-desk.tickets.index',
      inventory:     'inventory.productos.index',
      crm:           'crm.clientes.index',
      purchasing:    'purchasing.ordenes.index',
      accounting:    'accounting.cuentas.index',
      cash:          'cash.arqueo.index',
    }
    const r = routeMap[def.code]
    if (r && route().has(r)) href = route(r)
  } catch { /* */ }

  const inner = (
    <div className={cn(
      'flex items-center gap-2.5 rounded-lg border border-border p-3 transition-all duration-150',
      'hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm',
      href && 'cursor-pointer',
    )}>
      {/* Icono con fondo semántico */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        ICON_BG[def.role],
      )}>
        <def.Icon className={cn('h-4 w-4', ICON_COLOR[def.role])} />
      </div>

      {/* Nombre + estado */}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground leading-none mb-0.5 truncate">
          {def.shortName}
        </p>
        <p className="text-[11px] text-muted-foreground truncate">{status}</p>
      </div>

      {/* Chevron */}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : inner
}

// ── Componente principal ──────────────────────────────────────────────

export function ModuleStatusGrid({
  stats,
  activeModules,
}: {
  stats: DashboardStats
  activeModules: string[]
}) {
  const active = MODULE_DEFS.filter((d) => activeModules.includes(d.code))
  if (active.length === 0) return null

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Módulos activos</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {active.map((def) => (
          <ModItem key={def.code} def={def} stats={stats} />
        ))}
      </div>
    </div>
  )
}
