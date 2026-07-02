/**
 * DashboardGrid — Grid responsivo para componer widgets.
 *
 * Desktop: 4 columnas
 * Tablet:  2 columnas
 * Móvil:   1 columna
 *
 * Preparado para integrar @dnd-kit/core en Fase 3.
 * Por ahora es un grid CSS estático con soporte para WidgetShell.
 */

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { DashboardGridProps } from './types'

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default DashboardGrid
