import { usePage } from '@inertiajs/react'

export interface Crumb {
  label: string
  /** Nombre de ruta Ziggy. Si se omite, el crumb no es clickeable. */
  route?: string
}

interface ModuleMenu {
  section?: string
  items: (
    | { label: string; route: string; permission?: string; icon?: string }
    | { type: 'separator' }
    | { type: 'label'; label: string }
  )[]
}

/** Secciones estáticas que no vienen en moduleMenus (core + configuración). */
const STATIC_SECTIONS: ModuleMenu[] = [
  {
    section: undefined,
    items: [{ label: 'Dashboard', route: 'core.dashboard' }],
  },
  {
    section: 'Configuración',
    items: [
      { label: 'Mi Empresa', route: 'core.tenant.edit' },
      { label: 'Sedes / Sucursales', route: 'core.sedes.index' },
      { label: 'Usuarios', route: 'core.users.index' },
      { label: 'Roles', route: 'core.roles.index' },
      { label: 'Auditoría', route: 'core.audit.index' },
    ],
  },
]

/** Devuelve el pathname de una ruta Ziggy, o '' si no existe. */
function pathOf(routeName: string): string {
  try {
    const url = route(routeName).split('?')[0]
    if (url.startsWith('http')) return new URL(url).pathname
    return url
  } catch {
    return ''
  }
}

/**
 * Construye los breadcrumbs a partir de la URL actual, buscando el item del
 * menú (dinámico o estático) cuya ruta coincide. Reemplaza el placeholder
 * estático del header por una ruta real "Sección / Página".
 */
export function useBreadcrumbs(): Crumb[] {
  const page = usePage()
  const currentPath = page.url.split('?')[0]
  const moduleMenus = (page.props.moduleMenus || []) as ModuleMenu[]

  const allSections = [...STATIC_SECTIONS, ...moduleMenus]

  // Coincidencia exacta primero; si no, la más larga por prefijo (item anidado).
  let best: { section?: string; label: string; route: string; len: number } | null = null

  for (const menu of allSections) {
    for (const item of menu.items || []) {
      if ('type' in item) continue
      const target = pathOf(item.route)
      if (!target) continue

      const isMatch = currentPath === target || currentPath.startsWith(target + '/')
      if (!isMatch) continue

      // Preferimos la coincidencia con ruta más específica (más larga).
      if (!best || target.length > best.len) {
        best = { section: menu.section, label: item.label, route: item.route, len: target.length }
      }
    }
  }

  if (!best) return [{ label: 'Inicio', route: 'core.dashboard' }]

  const crumbs: Crumb[] = []
  if (best.section) crumbs.push({ label: best.section })
  crumbs.push({ label: best.label, route: best.route })
  return crumbs
}
