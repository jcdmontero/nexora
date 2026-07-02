import { Link } from '@inertiajs/react'
import { Boxes, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAccent } from '@/lib/accent'
import type { ModuleMenuSection } from '../types'
import { WidgetShell } from '../WidgetShell'

interface ModuleSummaryWidgetProps {
  modules: ModuleMenuSection[]
}

export function ModuleSummaryWidget({ modules }: ModuleSummaryWidgetProps) {
  if (modules.length === 0) return null

  return (
    <WidgetShell
      widgetId="module-summary"
      title="Módulos activos"
      icon={Boxes}
      accent="violet"
      size="half"
      showMenu={false}
    >
      <div className="space-y-2">
        {modules.map((menu) => {
          const firstItem = (menu.items || []).find((it) => {
            try { return route().has(it.route) } catch { return false }
          })
          if (!firstItem) return null
          return (
            <Link
              key={menu.section}
              href={route(firstItem.route)}
              className="group flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm dark:hover:bg-indigo-500/5 dark:hover:border-indigo-500/30"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <Boxes className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-foreground">{menu.section}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          )
        })}
      </div>
    </WidgetShell>
  )
}
