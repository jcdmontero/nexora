import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAccent } from '@/lib/accent'
import type { DashboardStats } from '../types'
import { WidgetShell } from '../WidgetShell'

interface InventoryAlertsWidgetProps {
  stats: DashboardStats
}

export function InventoryAlertsWidget({ stats }: InventoryAlertsWidgetProps) {
  const hasAlerts = (stats.productos_bajo_stock ?? 0) > 0 || (stats.compras_pendientes ?? 0) > 0
  if (!hasAlerts) return null

  const tokens = getAccent('amber')

  return (
    <WidgetShell
      widgetId="inventory-alerts"
      title="Alertas de inventario"
      icon={AlertTriangle}
      accent="amber"
      size="quarter"
      showMenu={false}
    >
      <div className="space-y-2">
        {stats.productos_bajo_stock != null && stats.productos_bajo_stock > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Productos bajo stock</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold',
                tokens[100],
                tokens.text,
              )}
            >
              {stats.productos_bajo_stock}
            </span>
          </div>
        )}
        {stats.compras_pendientes != null && stats.compras_pendientes > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Compras pendientes</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-bold',
                tokens[100],
                tokens.text,
              )}
            >
              {stats.compras_pendientes}
            </span>
          </div>
        )}
      </div>
    </WidgetShell>
  )
}
