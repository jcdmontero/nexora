/**
 * Tipos TypeScript del sistema de widgets de Dashboard.
 *
 * Este archivo es la fuente de verdad para todas las interfaces
 * que componen la arquitectura de widgets dinámicos.
 */

import type { LucideIcon } from 'lucide-react'
import type { AccentColor } from '@/lib/accent'

// ── Tamaño de widget en el grid ──

export type WidgetSize = 'full' | 'half' | 'third' | 'quarter'

// ── Definición de un widget del catálogo ──

export interface WidgetDefinition {
  /** Identificador único del widget */
  id: string
  /** Título visible en el header del widget */
  title: string
  /** Descripción corta (visible en header) */
  description?: string
  /** Icono del widget */
  icon: LucideIcon
  /** Color de acento del widget */
  accent: AccentColor
  /** Tamaño por defecto en el grid */
  defaultSize: WidgetSize
  /** Código de módulos requeridos para mostrar este widget (vacío = siempre visible) */
  requiredModules: string[]
  /** Permisos requeridos para mostrar este widget (vacío = siempre visible) */
  requiredPermissions: string[]
  /** Rol mínimo requerido (null = cualquier rol) */
  minRole?: string
  /** Si es true, el widget muestra su header (algunos widgets como el greeting no lo necesitan) */
  showHeader?: boolean
  /** Si es true, el widget no tiene padding interno */
  noPadding?: boolean
}

// ── Estado de un widget en el layout del usuario ──

export interface UserWidgetItem {
  widgetId: string
  visible: boolean
  pinned: boolean
  size: WidgetSize
}

export interface UserWidgetLayout {
  userId: number
  tenantId: number
  viewName: string
  widgets: UserWidgetItem[]
}

// ── Metadata del contexto del dashboard ──

export interface DashboardContext {
  /** Módulos activos del tenant actual */
  activeModules: string[]
  /** Permisos del usuario actual */
  permissions: string[]
  /** Rol principal del usuario */
  role?: string
}

// ── Props del WidgetShell ──

export interface WidgetShellProps {
  /** Identificador del widget */
  widgetId: string
  /** Título del widget */
  title?: string
  /** Descripción corta */
  description?: string
  /** Icono del widget */
  icon?: LucideIcon
  /** Color de acento */
  accent?: AccentColor
  /** Tamaño del widget en el grid */
  size?: WidgetSize
  /** Clases adicionales */
  className?: string
  /** Si true, no aplica padding al contenido */
  noPadding?: boolean
  /** Si true, oculta el header del widget */
  hideHeader?: boolean
  /** Si true, muestra el menú ⋮ */
  showMenu?: boolean
  /** Acciones adicionales en el header (a la derecha del título) */
  headerActions?: React.ReactNode
  /** Contenido del widget */
  children: React.ReactNode
}

// ── Props del DashboardGrid ──

export interface DashboardGridProps {
  /** Widgets hijos a renderizar */
  children: React.ReactNode
  /** Clases adicionales */
  className?: string
}

// ── Datos del dashboard (respuesta del controlador) ──

export interface OperationalPulse {
  ordenes_activas?: number
  facturas_pendientes?: number
  stock_bajo?: number
  compras_pendientes?: number
  cajas_abiertas?: number
}

export interface DashboardStats {
  // Sistema
  usuarios: number
  // Service Desk
  ordenes_hoy: number | null
  ordenes_semana: number | null
  ordenes_en_proceso: number | null
  ordenes_para_entregar: number | null
  ordenes_pendientes: number | null
  ordenes_terminadas: number | null
  // Ventas
  ventas_hoy: number | null
  ventas_semana: number | null
  ventas_mes: number | null
  ventas_mes_anterior: number | null
  facturas_pendientes: number | null
  facturas_hoy: number | null
  // CRM
  clientes: number | null
  // Inventario
  productos: number | null
  productos_bajo_stock: number | null
  // Compras
  proveedores: number | null
  compras_pendientes: number | null
  // Período dinámico (se actualiza al cambiar PeriodSelector)
  ventas_periodo?: number | null
  ventas_periodo_anterior?: number | null
  ventas_trend?: number | null
  periodo_label?: string | null
}

export interface StockBajoItem {
  id: number
  nombre: string
  sku: string | null
  stock_actual: number
  stock_minimo: number
  nivel: 'critico' | 'bajo'
}

export interface FacturaPorVencerItem {
  id: number
  numero: string
  total: number
  cliente: string
  fecha_vencimiento: string | null
  dias_restantes: number
}

export interface CuentaPorPagarItem {
  id: number
  numero: string
  total: number
  proveedor: string
  estado: string
  dias_desde_creacion: number
}

export interface ServicioPendienteItem {
  id: number
  numero_orden: string
  estado: string
  cliente: string
  fecha: string
  dias: number
}

export interface CajaAbiertaItem {
  id: number
  caja: string
  cajero: string
  saldo_actual: number
  horas_abierta: number
  nivel: string
}

export interface AlertsSummary {
  stock_bajo: StockBajoItem[]
  facturas_por_vencer: FacturaPorVencerItem[]
  cuentas_por_pagar: CuentaPorPagarItem[]
  servicios_pendientes: ServicioPendienteItem[]
  cajas_abiertas?: CajaAbiertaItem[]
}

export interface ActivityLog {
  id: number
  event: string
  description: string | null
  auditable_type: string
  user: string
  created_at: string
  created_human: string
}

export interface ActivityPoint {
  dia: string
  fecha: string
  eventos: number
}

export interface RevenuePoint {
  mes: string
  ingresos: number
}

export interface PendingTask {
  label: string
  count: number
  route: string
  accent: AccentColor
}

export interface QuickAccessItem {
  label: string
  description: string
  route: string
  icon: string
  color: AccentColor
  permission: string
}

export interface ModuleMenuItem {
  label: string
  route: string
  icon?: string
}

export interface ModuleMenuSection {
  section: string
  items: ModuleMenuItem[]
}

export interface DashboardProps {
  stats: DashboardStats
  tenantName: string | null
  recentActivity: ActivityLog[]
  activitySeries: ActivityPoint[]
  revenueTrend: RevenuePoint[]
  pendingTasks: PendingTask[]
  quickAccess: QuickAccessItem[]
  alertsSummary?: AlertsSummary
}

// ── Mapeo de tamaño → clases CSS del grid ──

export const widgetSizeClasses: Record<WidgetSize, string> = {
  full: 'col-span-1 sm:col-span-2 lg:col-span-4',
  half: 'col-span-1 sm:col-span-2 lg:col-span-2',
  third: 'col-span-1 sm:col-span-2 lg:col-span-1',
  quarter: 'col-span-1 sm:col-span-1 lg:col-span-1',
}
