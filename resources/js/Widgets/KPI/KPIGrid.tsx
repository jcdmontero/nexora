import {
  Users, Boxes, ShieldCheck, Building2, Users2, Package, Truck,
  Wrench, CheckCircle2, DollarSign, TrendingUp, ShoppingCart, Target, Calculator,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardStats, AccentColor } from '../types'
import { KPICard } from './KPICard'

interface KPIItem {
  label: string
  value: number | string
  icon: LucideIcon
  accent: AccentColor
  hint?: string
  sparkline?: number[]
  trend?: number
}

interface KPIGroup {
  title: string
  items: KPIItem[]
}

interface KPIGridProps {
  stats: DashboardStats
  activeModules: string[]
}

function formatCurrency(value: number): string {
  return '$ ' + value.toLocaleString('es-CO')
}

export function KPIGrid({ stats, activeModules }: KPIGridProps) {
  // Cuando hay un período seleccionado, usamos ventas_periodo en lugar de ventas_hoy/semana
  const hasPeriodo = stats.ventas_periodo !== undefined && stats.ventas_periodo !== null
  const periodLabel = stats.periodo_label ?? 'Ventas período'

  const groups: KPIGroup[] = [
    {
      title: 'Negocio',
      items: [
        ...(hasPeriodo ? [{
          label: periodLabel,
          value: formatCurrency(stats.ventas_periodo as number),
          icon: DollarSign,
          accent: 'emerald' as AccentColor,
          hint: 'Total facturado',
          trend: stats.ventas_trend ?? undefined,
        }] : [
          ...(stats.ventas_hoy !== null ? [{
            label: 'Ventas hoy',
            value: formatCurrency(stats.ventas_hoy as number),
            icon: DollarSign,
            accent: 'emerald' as AccentColor,
            hint: 'Total facturado',
          }] : []),
          ...(stats.ventas_semana !== null ? [{
            label: 'Ventas semana',
            value: formatCurrency(stats.ventas_semana as number),
            icon: TrendingUp,
            accent: 'indigo' as AccentColor,
            hint: 'Últimos 7 días',
          }] : []),
        ]),
        ...(stats.clientes !== null ? [{
          label: 'Clientes',
          value: stats.clientes,
          icon: Users2,
          accent: 'indigo' as AccentColor,
          hint: 'Registrados',
        }] : []),
        ...(stats.productos !== null ? [{
          label: 'Productos',
          value: stats.productos,
          icon: Package,
          accent: 'emerald' as AccentColor,
          hint: 'En catálogo',
        }] : []),
      ],
    },
  ]

  if (activeModules.includes('service-desk')) {
    groups.push({
      title: 'Operaciones',
      items: [
        ...(stats.ordenes_pendientes !== null ? [{
          label: 'Órdenes pendientes',
          value: stats.ordenes_pendientes,
          icon: Wrench,
          accent: 'amber' as AccentColor,
          hint: 'En proceso',
        }] : []),
        ...(stats.ordenes_terminadas !== null ? [{
          label: 'Órdenes terminadas',
          value: stats.ordenes_terminadas,
          icon: CheckCircle2,
          accent: 'emerald' as AccentColor,
          hint: 'Completadas',
        }] : []),
      ],
    })
  }

  if (activeModules.includes('purchasing')) {
    groups.push({
      title: 'Compras',
      items: [
        ...(stats.proveedores !== null ? [{
          label: 'Proveedores',
          value: stats.proveedores,
          icon: Truck,
          accent: 'sky' as AccentColor,
          hint: 'Registrados',
        }] : []),
        ...(stats.compras_pendientes !== null ? [{
          label: 'Compras pendientes',
          value: stats.compras_pendientes,
          icon: ShoppingCart,
          accent: 'amber' as AccentColor,
          hint: 'Por recibir',
        }] : []),
      ],
    })
  }

  return (
    <div className="space-y-6">
      {groups.filter((g) => g.items.length > 0).map((group) => (
        <section key={group.title}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {group.items.map((k, ki) => (
              <KPICard key={k.label} {...k} index={ki} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
