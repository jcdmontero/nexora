import { useState } from 'react'
import { Settings, Eye, EyeOff, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WidgetConfigItem {
  id: string
  label: string
  visible: boolean
}

interface WidgetConfigMenuProps {
  widgets: WidgetConfigItem[]
  onToggle: (widgetId: string) => void
}

export function WidgetConfigMenu({ widgets, onToggle }: WidgetConfigMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
          'border border-border bg-card text-muted-foreground',
          'transition-all duration-200 hover:bg-accent hover:text-foreground',
        )}
        title="Configurar widgets"
      >
        <Settings className="h-4 w-4" />
        <span className="hidden sm:inline">Widgets</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 min-w-[220px] rounded-lg border border-border bg-popover p-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mostrar / Ocultar widgets
            </p>
            <div className="mt-1 space-y-0.5">
              {widgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => onToggle(widget.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    widget.visible
                      ? 'text-foreground hover:bg-muted'
                      : 'text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  {widget.visible ? (
                    <Eye className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={cn(!widget.visible && 'line-through opacity-60')}>
                    {widget.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
