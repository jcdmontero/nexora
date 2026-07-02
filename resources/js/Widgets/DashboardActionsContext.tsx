import { createContext, useContext } from 'react'

interface DashboardActionsContextValue {
  toggleWidget: (widgetId: string) => void
  pinWidget: (widgetId: string) => void
  unpinWidget: (widgetId: string) => void
  isWidgetPinned: (widgetId: string) => boolean
}

const DashboardActionsContext = createContext<DashboardActionsContextValue | null>(null)

export const DashboardActionsProvider = DashboardActionsContext.Provider

export function useDashboardActions(): DashboardActionsContextValue {
  return useContext(DashboardActionsContext) ?? {
    toggleWidget: () => {},
    pinWidget: () => {},
    unpinWidget: () => {},
    isWidgetPinned: () => false,
  }
}
