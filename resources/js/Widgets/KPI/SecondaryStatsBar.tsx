/**
 * SecondaryStatsBar — Fila compacta de métricas secundarias.
 * Reemplaza el KPIGrid que mostraba datos de admin (usuarios/módulos).
 * Muestra: clientes, productos, stock bajo, compras pendientes, facturas pendientes.
 */
import { Link } from '@inertiajs/react'
import {
  Users2, Package, AlertTriangle, ShoppingCart,
  ReceiptText, Truck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '../types'

interface Stat {
  label: string
  value: number
  icon: React.ElementType
  href?: string
  variant: 'default' | 'warning' | 'danger'
}

interface SecondaryStatsBarProps {
  stats: DashboardStats
  activeModules: string[]
}

export function SecondaryStatsBar({ stats, activeModules }: SecondaryStatsBarProps) {
  const items: Stat[] = []

  if (activeModules.includes('crm') && stats.clientes !== null) {
    items.push({ label: 'Clientes', value: stats.clientes ?? 0, icon: Users2, variant: 'default',
      href: route().has('crm.clientes.index') ? route('crm.clientes.index') : undefined })
  }

  if (activeModules.includes('inventory') && stats.productos !== null) {
    items.push({ label: 'Productos', value: stats.productos ?? 0, icon: Package, variant: 'default',
      href: route().has('inventory.productos.index') ? route('inventory.productos.index') : undefined })
  }

  if (activeModules.includes('inventory') && (stats.productos_bajo_stock ?? 0) > 0) {
    items.push({ label: 'Bajo stock', value: stats.productos_bajo_stock ?? 0, icon: AlertTriangle,
      variant: (stats.productos_bajo_stock ?? 0) > 5 ? 'danger' : 'warning',
      href: route().has('inventory.productos.index') ? route('inventory.productos.index') : undefined })
  }

  if (activeModules.includes('sales') && (stats.facturas_pendientes ?? 0) > 0) {
    items.push({ label: 'Fact. pendientes', value: stats.facturas_pendientes ?? 0, icon: ReceiptText,
      variant: 'warning',
      href: route().has('sales.facturas.index') ? route('sales.facturas.index') : undefined })
  }

  if (activeModules.includes('purchasing') && stats.compras_pendientes !== null) {
    items.push({ label: 'Compras pend.', value: stats.compras_pendientes ?? 0, icon: ShoppingCart,
      variant: 'default',
      href: route().has('purchasing.ordenes.index') ? route('purchasing.ordenes.index') : undefined })
  }

  if (activeModules.includes('purchasing') && stats.proveedores !== null) {
    items.push({ label: 'Proveedores', value: stats.proveedores ?? 0, icon: Truck, variant: 'default' })
  }

  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const content = (
          <div className={cn(
            'inline-flex items-center gap-2 rounded-xl px-4 py-2.5',
            'ring-1 text-sm font-medium transition-all duration-150',
            item.variant === 'default' && 'bg-card ring-foreground/8 text-foreground hover:ring-foreground/15 hover:shadow-sm',
            item.variant === 'warning' && 'bg-amber-50 ring-amber-200 text-amber-800 hover:bg-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/20 dark:text-amber-300',
            item.variant === 'danger'  && 'bg-rose-50 ring-rose-200 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:ring-rose-500/20 dark:text-rose-300',
            item.href && 'cursor-pointer',
          )}>
            <item.icon className={cn('h-3.5 w-3.5 shrink-0',
              item.variant === 'default' && 'text-muted-foreground',
              item.variant === 'warning' && 'text-amber-600 dark:text-amber-400',
              item.variant === 'danger'  && 'text-rose-500',
            )} />
            <span className="tabular-nums font-bold">{item.value.toLocaleString('es-CO')}</span>
            <span className={cn('text-xs', item.variant === 'default' && 'text-muted-foreground')}>{item.label}</span>
          </div>
        )

        return item.href ? (
          <Link key={item.label} href={item.href}>{content}</Link>
        ) : (
          <div key={item.label}>{content}</div>
        )
      })}
    </div>
  )
}
