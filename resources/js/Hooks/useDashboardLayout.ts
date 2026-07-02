import { useState, useCallback, useEffect, useRef } from 'react'

// ── Helpers ────────────────────────────────────────────────────────────

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  const [removed] = result.splice(from, 1)
  result.splice(to, 0, removed)
  return result
}

// ── Vistas predefinidas ────────────────────────────────────────────────
// Definen qué widgets se muestran por defecto en cada vista

export const PREDEFINED_VIEWS: Record<string, string[]> = {
  default:     ['quick-actions', 'kpi', 'alerts-dashboard', 'service-desk-queue', 'recent-invoices', 'activity-chart', 'revenue-chart', 'recent-activity', 'inventory-alerts', 'cash-status', 'module-summary'],
  financiero:  ['kpi', 'revenue-chart', 'recent-invoices', 'activity-chart', 'recent-activity'],
  operativo:   ['quick-actions', 'kpi', 'alerts-dashboard', 'service-desk-queue', 'activity-chart', 'recent-activity', 'inventory-alerts', 'cash-status'],
  rrhh:        ['kpi', 'recent-activity', 'module-summary'],
}

export const VIEW_LABELS: Record<string, string> = {
  default:    'General',
  financiero: 'Financiero',
  operativo:  'Operativo',
  rrhh:       'RRHH',
}

// ── Tipos ──────────────────────────────────────────────────────────────

export interface WidgetState {
  widgetId: string
  visible: boolean
  pinned: boolean
  size: 'full' | 'half' | 'third' | 'quarter'
}

interface UseDashboardLayoutOptions {
  initialWidgets: string[]
  userRole?: string
  activeModules?: string[]
}

// ── Serialización para el backend ──────────────────────────────────────

function buildLayoutPayload(
  order: string[],
  states: Record<string, WidgetState>,
): object[] {
  return order.map((id) => ({
    widgetId: id,
    visible:  states[id]?.visible ?? true,
    pinned:   states[id]?.pinned  ?? false,
    size:     states[id]?.size    ?? 'half',
  }))
}

// ── Hook ───────────────────────────────────────────────────────────────

export function useDashboardLayout({
  initialWidgets,
}: UseDashboardLayoutOptions) {

  // Orden explícito de widgets (respeta drag-and-drop)
  const [widgetOrder, setWidgetOrder] = useState<string[]>(initialWidgets)

  // Estado por widget (visible, pinned, size)
  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetState>>(() => {
    const states: Record<string, WidgetState> = {}
    initialWidgets.forEach((id) => {
      states[id] = { widgetId: id, visible: true, pinned: false, size: 'half' }
    })
    return states
  })

  // Vista activa
  const [currentView, setCurrentView] = useState<string>('default')
  const [viewLoading, setViewLoading] = useState(false)

  // Referencia para debounce del auto-guardado
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasMounted = useRef(false)

  // ── Auto-guardado ──────────────────────────────────────────────────

  useEffect(() => {
    // No guardar en el primer render
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      persistLayout(currentView, widgetOrder, widgetStates)
    }, 800)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [widgetStates, widgetOrder, currentView])

  // ── Persistencia al backend ────────────────────────────────────────

  async function persistLayout(
    viewName: string,
    order: string[],
    states: Record<string, WidgetState>,
  ) {
    try {
      const url = route('core.widgets.layout.update', { viewName })
      const payload = buildLayoutPayload(order, states)
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': decodeURIComponent(
            document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
          ),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ layout: payload }),
      })
    } catch {
      // Silently fail — el estado local ya está actualizado
    }
  }

  // ── Acciones de widgets ────────────────────────────────────────────

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgetStates((prev) => ({
      ...prev,
      [widgetId]: { ...prev[widgetId], visible: !prev[widgetId]?.visible },
    }))
  }, [])

  const pinWidget = useCallback((widgetId: string) => {
    setWidgetStates((prev) => ({
      ...prev,
      [widgetId]: { ...prev[widgetId], pinned: true },
    }))
  }, [])

  const unpinWidget = useCallback((widgetId: string) => {
    setWidgetStates((prev) => ({
      ...prev,
      [widgetId]: { ...prev[widgetId], pinned: false },
    }))
  }, [])

  const setWidgetSize = useCallback((widgetId: string, size: WidgetState['size']) => {
    setWidgetStates((prev) => ({
      ...prev,
      [widgetId]: { ...prev[widgetId], size },
    }))
  }, [])

  // ── Reordenado (drag-and-drop) ─────────────────────────────────────

  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    setWidgetOrder((prev) => {
      const oldIdx = prev.indexOf(activeId)
      const newIdx = prev.indexOf(overId)
      if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return prev
      return arrayMove(prev, oldIdx, newIdx)
    })
  }, [])

  // ── Consultas de estado ────────────────────────────────────────────

  /**
   * Devuelve los IDs visibles respetando:
   * 1. El orden explícito de widgetOrder (drag)
   * 2. Los widgets anclados (pinned) van primero dentro de su posición relativa
   */
  const getVisibleWidgets = useCallback((): string[] => {
    const pinned   = widgetOrder.filter((id) => widgetStates[id]?.visible && widgetStates[id]?.pinned)
    const unpinned = widgetOrder.filter((id) => widgetStates[id]?.visible && !widgetStates[id]?.pinned)
    return [...pinned, ...unpinned]
  }, [widgetOrder, widgetStates])

  const isWidgetVisible = useCallback((id: string) => widgetStates[id]?.visible ?? true, [widgetStates])
  const isWidgetPinned  = useCallback((id: string) => widgetStates[id]?.pinned  ?? false, [widgetStates])

  // ── Gestión de vistas ──────────────────────────────────────────────

  /**
   * Carga una vista del backend. Si no tiene layout guardado,
   * aplica los defaults predefinidos.
   */
  const loadView = useCallback(async (viewName: string) => {
    setCurrentView(viewName)
    setViewLoading(true)
    try {
      const url = route('core.widgets.layout.show', { viewName })
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.layout && data.layout.length > 0) {
          applyLayoutFromBackend(data.layout)
        } else {
          applyPredefinedView(viewName)
        }
      } else {
        applyPredefinedView(viewName)
      }
    } catch {
      applyPredefinedView(viewName)
    } finally {
      setViewLoading(false)
    }
  }, [])

  /** Aplica un array de layout serializado del backend */
  function applyLayoutFromBackend(layout: Array<{ widgetId: string; visible: boolean; pinned: boolean; size: string }>) {
    const newOrder: string[] = layout.map((w) => w.widgetId)
    const newStates: Record<string, WidgetState> = {}
    layout.forEach((w) => {
      newStates[w.widgetId] = {
        widgetId: w.widgetId,
        visible: w.visible,
        pinned:  w.pinned,
        size:    (w.size as WidgetState['size']) ?? 'half',
      }
    })
    // Suspendemos auto-save durante la aplicación del layout externo
    hasMounted.current = false
    setWidgetOrder(newOrder)
    setWidgetStates(newStates)
    // Re-activamos auto-save en el próximo ciclo
    setTimeout(() => { hasMounted.current = true }, 100)
  }

  /** Aplica la vista predefinida para un nombre de vista */
  function applyPredefinedView(viewName: string) {
    const predefined = PREDEFINED_VIEWS[viewName] ?? PREDEFINED_VIEWS.default
    const newStates: Record<string, WidgetState> = {}
    // Preservar el estado de widgets que no están en la vista predefinida
    Object.keys(widgetStates).forEach((id) => {
      newStates[id] = {
        ...widgetStates[id],
        visible: predefined.includes(id),
        pinned: false,
      }
    })
    hasMounted.current = false
    setWidgetOrder(Object.keys(widgetStates))
    setWidgetStates(newStates)
    setTimeout(() => { hasMounted.current = true }, 100)
  }

  // ── Guardado manual ────────────────────────────────────────────────

  const saveLayout = useCallback(async (viewName?: string) => {
    await persistLayout(viewName ?? currentView, widgetOrder, widgetStates)
  }, [currentView, widgetOrder, widgetStates])

  // ── Return ─────────────────────────────────────────────────────────

  return {
    // Estado
    widgetStates,
    widgetOrder,
    currentView,
    viewLoading,
    // Acciones de widgets
    toggleWidget,
    pinWidget,
    unpinWidget,
    setWidgetSize,
    reorderWidgets,
    // Consultas
    getVisibleWidgets,
    isWidgetVisible,
    isWidgetPinned,
    // Vistas
    loadView,
    saveLayout,
  }
}
