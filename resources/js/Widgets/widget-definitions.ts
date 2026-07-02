import type { WidgetDefinition } from './types'
import {
  Sun, Activity, Zap, TrendingUp, ScrollText, ShoppingCart, Package, Users as Users2,
  Wallet, Calculator, IdCard, Bell, Target, FileText, Truck, ShieldCheck, Building2,
  Boxes, Wrench, ClipboardList, DollarSign, AlertTriangle,
} from 'lucide-react'

export const coreWidgets: WidgetDefinition[] = [
  {
    id: 'greeting',
    title: '',
    icon: Sun,
    accent: 'indigo',
    defaultSize: 'full',
    requiredModules: [],
    requiredPermissions: [],
    showHeader: false,
  },
  {
    id: 'alerts',
    title: 'Atención requerida',
    description: 'Elementos que requieren acción inmediata',
    icon: Zap,
    accent: 'amber',
    defaultSize: 'full',
    requiredModules: [],
    requiredPermissions: [],
  },
  {
    id: 'quick-actions',
    title: 'Acciones rápidas',
    icon: Zap,
    accent: 'indigo',
    defaultSize: 'full',
    requiredModules: [],
    requiredPermissions: [],
    showHeader: false,
  },
  {
    id: 'kpi',
    title: 'Indicadores principales',
    description: 'KPIs clave del negocio con tendencias',
    icon: Target,
    accent: 'indigo',
    defaultSize: 'full',
    requiredModules: [],
    requiredPermissions: [],
  },
  {
    id: 'activity-chart',
    title: 'Actividad de la semana',
    description: 'Eventos del sistema en los últimos 7 días',
    icon: Activity,
    accent: 'indigo',
    defaultSize: 'half',
    requiredModules: [],
    requiredPermissions: ['audit:view'],
  },
  {
    id: 'revenue-chart',
    title: 'Tendencia de ingresos',
    description: 'Ingresos de los últimos 6 meses',
    icon: TrendingUp,
    accent: 'emerald',
    defaultSize: 'half',
    requiredModules: ['sales'],
    requiredPermissions: ['sales:view'],
  },
  {
    id: 'recent-activity',
    title: 'Actividad reciente',
    description: 'Últimos movimientos en el sistema',
    icon: ScrollText,
    accent: 'sky',
    defaultSize: 'half',
    requiredModules: [],
    requiredPermissions: ['audit:view'],
  },
  {
    id: 'module-summary',
    title: 'Módulos activos',
    description: 'Áreas habilitadas para tu empresa',
    icon: Boxes,
    accent: 'violet',
    defaultSize: 'half',
    requiredModules: [],
    requiredPermissions: [],
  },
]

export const salesWidgets: WidgetDefinition[] = []

export const inventoryWidgets: WidgetDefinition[] = [
  {
    id: 'inventory-alerts',
    title: 'Alertas de inventario',
    description: 'Productos bajo stock mínimo',
    icon: Package,
    accent: 'amber',
    defaultSize: 'quarter',
    requiredModules: ['inventory'],
    requiredPermissions: ['inventory:view'],
  },
]

export const crmWidgets: WidgetDefinition[] = []

export const purchasingWidgets: WidgetDefinition[] = []

export const accountingWidgets: WidgetDefinition[] = []

export const cashWidgets: WidgetDefinition[] = []

export const hrWidgets: WidgetDefinition[] = []

export const payrollWidgets: WidgetDefinition[] = []

export const serviceDeskWidgets: WidgetDefinition[] = []

export const notificationsWidgets: WidgetDefinition[] = [
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Notificaciones recientes',
    icon: Bell,
    accent: 'rose',
    defaultSize: 'half',
    requiredModules: ['notifications'],
    requiredPermissions: ['notifications:view'],
  },
]

export const allWidgetDefinitions: Record<string, WidgetDefinition[]> = {
  core: coreWidgets,
  sales: salesWidgets,
  inventory: inventoryWidgets,
  crm: crmWidgets,
  purchasing: purchasingWidgets,
  accounting: accountingWidgets,
  cash: cashWidgets,
  hr: hrWidgets,
  payroll: payrollWidgets,
  'service-desk': serviceDeskWidgets,
  notifications: notificationsWidgets,
}

export const allWidgetDefinitionsFlat: WidgetDefinition[] = [
  ...coreWidgets,
  ...salesWidgets,
  ...inventoryWidgets,
  ...crmWidgets,
  ...purchasingWidgets,
  ...accountingWidgets,
  ...cashWidgets,
  ...hrWidgets,
  ...payrollWidgets,
  ...serviceDeskWidgets,
  ...notificationsWidgets,
]
