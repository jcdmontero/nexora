import { Settings, RotateCcw, Pin, PinOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Switch } from '@/Components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetBody,
  SheetFooter,
} from '@/Components/ui/sheet'
import { useDashboardActions } from '../DashboardActionsContext'
import { VIEW_LABELS } from '@/Hooks/useDashboardLayout'

// ── Tipos ─────────────────────────────────────────────────────────────

export interface WidgetConfigItem {
  id: string
  label: string
  description?: string
  visible: boolean
  pinned?: boolean
  requiredModules?: string[]
}

interface WidgetConfigDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widgets: WidgetConfigItem[]
  activeModules: string[]
  currentView?: string
  viewLoading?: boolean
  onSwitchView?: (viewName: string) => void
  onReset?: () => void
}

// ── Selector de vistas ────────────────────────────────────────────────

const ALL_VIEWS = Object.keys(VIEW_LABELS)

interface ViewSelectorProps {
  currentView: string
  viewLoading: boolean
  onSwitch: (v: string) => void
}

function ViewSelector({ currentView, viewLoading, onSwitch }: ViewSelectorProps) {
  return (
    <div className="border-b border-border px-5 py-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Vista activa
        </p>
        {viewLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ALL_VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => onSwitch(v)}
            disabled={viewLoading}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150',
              v === currentView
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
              viewLoading && 'pointer-events-none opacity-60',
            )}
          >
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Grupos de widgets ─────────────────────────────────────────────────

const WIDGET_GROUPS: { title: string; ids: string[] }[] = [
  {
    title: 'Resumen',
    ids: ['quick-actions', 'kpi'],
  },
  {
    title: 'Análisis',
    ids: ['activity-chart', 'revenue-chart'],
  },
  {
    title: 'Datos',
    ids: ['recent-activity', 'inventory-alerts', 'module-summary', 'notifications'],
  },
]

const WIDGET_META: Record<string, { description: string; requiredModules?: string[] }> = {
  'quick-actions':    { description: 'Accesos directos según módulos activos' },
  'kpi':              { description: 'Indicadores adicionales por módulo' },
  'activity-chart':   { description: 'Eventos de auditoría por día (últimos 7 días)' },
  'revenue-chart':    { description: 'Tendencia de ingresos mensual', requiredModules: ['sales'] },
  'recent-activity':  { description: 'Últimas acciones registradas en el sistema' },
  'inventory-alerts': { description: 'Productos bajo stock mínimo', requiredModules: ['inventory'] },
  'module-summary':   { description: 'Listado de módulos activos en la empresa' },
  'notifications':    { description: 'Últimas notificaciones enviadas', requiredModules: ['notifications'] },
}

// ── Colores de badge por módulo ───────────────────────────────────────

const MODULE_BADGE: Record<string, string> = {
  sales:         'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  inventory:     'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  crm:           'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400',
  purchasing:    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  'service-desk':'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  notifications: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
}

// ── Fila de widget individual ─────────────────────────────────────────

function WidgetRow({
  item,
  activeModules,
}: {
  item: WidgetConfigItem
  activeModules: string[]
}) {
  const { toggleWidget, pinWidget, unpinWidget, isWidgetPinned } = useDashboardActions()
  const meta = WIDGET_META[item.id]
  const pinned = isWidgetPinned(item.id)

  // Determinar si el módulo requerido está activo
  const missingModule = meta?.requiredModules?.find((m) => !activeModules.includes(m))

  return (
    <div className={cn(
      'flex items-start gap-3 rounded-lg px-3 py-3',
      'transition-colors',
      missingModule ? 'opacity-50' : 'hover:bg-muted/40',
    )}>
      {/* Textos */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn(
            'text-sm font-medium',
            item.visible ? 'text-foreground' : 'text-muted-foreground',
          )}>
            {item.label}
          </span>
          {/* Badge de módulo requerido */}
          {meta?.requiredModules?.map((mod) => (
            <span
              key={mod}
              className={cn(
                'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                MODULE_BADGE[mod] ?? 'bg-muted text-muted-foreground',
              )}
            >
              {mod}
            </span>
          ))}
          {/* Badge de anclado */}
          {pinned && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Pin className="h-2.5 w-2.5" />
              anclado
            </span>
          )}
        </div>
        {meta?.description && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
            {meta.description}
          </p>
        )}
        {missingModule && (
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
            Requiere el módulo <strong>{missingModule}</strong>
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex shrink-0 items-center gap-2 mt-0.5">
        {/* Pin / Unpin */}
        <button
          onClick={() => pinned ? unpinWidget(item.id) : pinWidget(item.id)}
          disabled={!!missingModule || !item.visible}
          aria-label={pinned ? 'Desanclar widget' : 'Anclar al inicio'}
          title={pinned ? 'Desanclar' : 'Anclar al inicio'}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
            pinned
              ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
              : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted',
            (!!missingModule || !item.visible) && 'pointer-events-none',
          )}
        >
          {pinned
            ? <PinOff className="h-3.5 w-3.5" />
            : <Pin className="h-3.5 w-3.5" />}
        </button>

        {/* Toggle de visibilidad */}
        <Switch
          checked={item.visible}
          disabled={!!missingModule}
          onCheckedChange={() => toggleWidget(item.id)}
          size="sm"
          aria-label={`${item.visible ? 'Ocultar' : 'Mostrar'} widget ${item.label}`}
        />
      </div>
    </div>
  )
}

// ── Trigger button ────────────────────────────────────────────────────

interface WidgetConfigTriggerProps {
  onClick: () => void
}

export function WidgetConfigTrigger({ onClick }: WidgetConfigTriggerProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Configurar widgets del dashboard"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
        'border border-border bg-card text-muted-foreground',
        'transition-all duration-200 hover:bg-accent hover:text-foreground hover:border-border/60',
      )}
    >
      <Settings className="h-4 w-4" />
      <span className="hidden sm:inline">Widgets</span>
    </button>
  )
}

// ── Drawer principal ──────────────────────────────────────────────────

export function WidgetConfigDrawer({
  open,
  onOpenChange,
  widgets,
  activeModules,
  currentView = 'default',
  viewLoading = false,
  onSwitchView,
  onReset,
}: WidgetConfigDrawerProps) {
  const widgetMap = Object.fromEntries(widgets.map((w) => [w.id, w]))

  const visibleCount = widgets.filter((w) => w.visible).length
  const totalCount   = widgets.length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {/* Header */}
        <SheetHeader>
          <div className="flex-1 min-w-0">
            <SheetTitle>Personalizar Dashboard</SheetTitle>
            <SheetDescription className="mt-0.5">
              {visibleCount} de {totalCount} widgets visibles
            </SheetDescription>
          </div>
          <SheetClose />
        </SheetHeader>

        {/* Selector de vistas */}
        {onSwitchView && (
          <ViewSelector
            currentView={currentView}
            viewLoading={viewLoading}
            onSwitch={onSwitchView}
          />
        )}

        {/* Cuerpo: grupos de widgets */}
        <SheetBody className="space-y-1">
          {WIDGET_GROUPS.map((group) => {
            const groupWidgets = group.ids
              .map((id) => widgetMap[id])
              .filter(Boolean)

            if (groupWidgets.length === 0) return null

            return (
              <div key={group.title}>
                {/* Separador de grupo */}
                <p className="mb-1 mt-4 first:mt-0 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group.title}
                </p>

                <div className="rounded-xl border border-border bg-muted/20 overflow-hidden divide-y divide-border/60">
                  {groupWidgets.map((item) => (
                    <WidgetRow
                      key={item.id}
                      item={item}
                      activeModules={activeModules}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </SheetBody>

        {/* Footer: restaurar */}
        {onReset && (
          <SheetFooter>
            <button
              onClick={onReset}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5',
                'text-sm font-medium text-muted-foreground',
                'border border-border bg-muted/30',
                'transition-colors hover:bg-muted hover:text-foreground',
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar configuración por defecto
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
