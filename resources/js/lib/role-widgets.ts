import type { AccentColor } from '@/lib/accent'

interface RoleWidgetConfig {
  hideWidgets: string[]
  showWidgets: string[]
  kpiFilter?: string[]
  prioritizeModules: string[]
}

const ROLE_CONFIGS: Record<string, RoleWidgetConfig> = {
  admin: {
    hideWidgets: [],
    showWidgets: [],
    prioritizeModules: ['crm', 'sales', 'inventory', 'accounting', 'hr'],
  },
  gerente: {
    hideWidgets: [],
    showWidgets: [],
    prioritizeModules: ['sales', 'crm', 'accounting', 'inventory'],
  },
  cajero: {
    hideWidgets: ['activity-chart', 'module-summary', 'revenue-chart'],
    showWidgets: ['cash-status'],
    kpiFilter: ['ventas_hoy', 'cajas'],
    prioritizeModules: ['cash', 'sales'],
  },
  contador: {
    hideWidgets: ['quick-actions', 'revenue-chart', 'module-summary'],
    showWidgets: ['accounting-summary'],
    kpiFilter: ['ventas_semana', 'clientes'],
    prioritizeModules: ['accounting'],
  },
  rrhh: {
    hideWidgets: ['activity-chart', 'revenue-chart', 'module-summary'],
    showWidgets: ['hr-alerts'],
    kpiFilter: ['usuarios', 'sedes'],
    prioritizeModules: ['hr', 'payroll'],
  },
  vendedor: {
    hideWidgets: ['activity-chart', 'module-summary'],
    showWidgets: [],
    kpiFilter: ['ventas_hoy', 'ventas_semana', 'clientes'],
    prioritizeModules: ['crm', 'sales'],
  },
  tecnico: {
    hideWidgets: ['revenue-chart', 'module-summary'],
    showWidgets: ['servicedesk-alerts'],
    kpiFilter: ['ordenes_pendientes', 'ordenes_terminadas'],
    prioritizeModules: ['service-desk'],
  },
}

export function getRoleConfig(role?: string): RoleWidgetConfig {
  if (!role) return ROLE_CONFIGS.admin
  return ROLE_CONFIGS[role.toLowerCase()] ?? ROLE_CONFIGS.admin
}

export function filterWidgetsByRole(widgetIds: string[], role?: string): string[] {
  const config = getRoleConfig(role)
  return widgetIds.filter((id) => !config.hideWidgets.includes(id))
}

export function sortWidgetsByPriority(widgetIds: string[], role?: string): string[] {
  const config = getRoleConfig(role)
  const prioritized = config.showWidgets.filter((id) => widgetIds.includes(id))
  const rest = widgetIds.filter((id) => !config.showWidgets.includes(id))
  return [...prioritized, ...rest]
}

export function getModulePriorityColor(moduleCode: string): AccentColor {
  const colors: Record<string, AccentColor> = {
    sales: 'emerald',
    inventory: 'sky',
    crm: 'indigo',
    purchasing: 'amber',
    accounting: 'violet',
    cash: 'emerald',
    hr: 'sky',
    payroll: 'sky',
    'service-desk': 'rose',
    notifications: 'rose',
  }
  return colors[moduleCode] ?? 'indigo'
}
