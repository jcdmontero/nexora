export * from './types'
export { DashboardActionsProvider, useDashboardActions } from './DashboardActionsContext'
export { AlertStrip } from './hero/AlertStrip'
export { HeroKPIStrip } from './hero/HeroKPIStrip'
export { BentoCell, BentoGridDnD, getWidgetSpan } from './layout/BentoGrid'
export { WidgetConfigDrawer, WidgetConfigTrigger } from './layout/WidgetConfigDrawer'
export type { WidgetConfigItem } from './layout/WidgetConfigDrawer'
export { ServiceDeskQueueWidget } from './modules/ServiceDeskQueueWidget'
export { RecentInvoicesWidget }   from './modules/RecentInvoicesWidget'
export { CashStatusWidget }       from './modules/CashStatusWidget'
export { ModuleStatusGrid }       from './modules/ModuleStatusGrid'
export { TaskPanelWidget }        from './modules/TaskPanelWidget'

export { DashboardGrid } from './DashboardGrid'
export { WidgetShell } from './WidgetShell'
export { WidgetSkeleton, KPISkeleton, ChartSkeleton } from './WidgetSkeleton'
export { PeriodSelector } from './PeriodSelector'
export { WidgetConfigMenu } from './WidgetConfigMenu'

export {
  registerWidget,
  getWidget,
  getAllWidgets,
  getVisibleWidgets,
  getWidgetComponent,
  getWidgetDefinition,
} from './WidgetRegistry'

export {
  allWidgetDefinitions,
  allWidgetDefinitionsFlat,
  coreWidgets,
  salesWidgets,
  inventoryWidgets,
  crmWidgets,
  purchasingWidgets,
  accountingWidgets,
  cashWidgets,
  hrWidgets,
  payrollWidgets,
  serviceDeskWidgets,
  notificationsWidgets,
} from './widget-definitions'

export { GreetingWidget } from './Greeting/GreetingWidget'
export { AlertsWidget } from './Alerts/AlertsWidget'
export { InventoryAlertsWidget } from './Alerts/InventoryAlertsWidget'
export { AlertsDashboardWidget } from './Alerts/AlertsDashboardWidget'
export { KPICard } from './KPI/KPICard'
export { KPIGrid } from './KPI/KPIGrid'
export { SecondaryStatsBar } from './KPI/SecondaryStatsBar'
export { ActivityChartWidget } from './ActivityChart/ActivityChartWidget'
export { RevenueChartWidget } from './RevenueChart/RevenueChartWidget'
export { RecentActivityWidget } from './RecentActivity/RecentActivityWidget'
export { QuickActionsWidget } from './QuickActions/QuickActionsWidget'
export { ModuleSummaryWidget } from './ModuleSummary/ModuleSummaryWidget'
export { NotificationsWidget } from './Notifications/NotificationsWidget'
