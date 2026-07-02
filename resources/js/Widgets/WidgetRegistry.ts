/**
 * WidgetRegistry — Catálogo central de widgets del Dashboard.
 *
 * Responsabilidades:
 * - Registrar todos los widgets disponibles con su componente + metadata
 * - Filtrar widgets visibles según módulos activos y permisos
 * - Ordenar widgets por posición por defecto
 *
 * En Fase 3 se integrará con user_widget_layouts para personalización.
 */

import type { WidgetDefinition, DashboardContext } from './types'

// ── Mapa: widgetId → { component, definition } ──

interface RegisteredWidget {
  component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>
  definition: WidgetDefinition
}

const widgetRegistry = new Map<string, RegisteredWidget>()

/** Registra un widget en el catálogo global */
export function registerWidget(widget: RegisteredWidget) {
  widgetRegistry.set(widget.definition.id, widget)
}

/** Obtiene un widget registrado por ID */
export function getWidget(id: string): RegisteredWidget | undefined {
  return widgetRegistry.get(id)
}

/** Obtiene TODOS los widgets del catálogo */
export function getAllWidgets(): RegisteredWidget[] {
  return Array.from(widgetRegistry.values()).sort((a, b) => {
    // Ordenar por posición por defecto (no usada todavía, pero prepara para layout)
    return 0
  })
}

/**
 * Filtra widgets visibles según el contexto del dashboard actual
 * (módulos activos + permisos del usuario + rol)
 */
export function getVisibleWidgets(context: DashboardContext): RegisteredWidget[] {
  const { activeModules, permissions, role } = context

  return getAllWidgets().filter(({ definition }) => {
    // 1. Verificar módulos requeridos
    if (definition.requiredModules.length > 0) {
      const hasRequiredModule = definition.requiredModules.some((mod) =>
        activeModules.includes(mod)
      )
      if (!hasRequiredModule) return false
    }

    // 2. Verificar permisos requeridos
    if (definition.requiredPermissions.length > 0) {
      const hasRequiredPermission = definition.requiredPermissions.some((perm) =>
        permissions.includes(perm)
      )
      if (!hasRequiredPermission) return false
    }

    // 3. Verificar rol mínimo (si se define)
    if (definition.minRole && role) {
      // Por ahora comparación simple. Futuro: jerarquía de roles.
      if (definition.minRole !== role) return false
    }

    return true
  })
}

/** Helpers para acceso rápido */
export function getWidgetComponent(id: string) {
  return getWidget(id)?.component
}

export function getWidgetDefinition(id: string) {
  return getWidget(id)?.definition
}