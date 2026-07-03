import { Link, usePage } from '@inertiajs/react'
import { cn, routeExistsSafe } from '@/lib/utils'
import { usePermissions } from '@/Hooks/usePermissions'
import { resolveIcon } from '@/lib/sidebar-icons'
import type { FavoriteItem } from '@/Hooks/useSidebarFavorites'
import {
  LayoutDashboard,
  Users,
  Package,
  FileSearch,
  ShoppingCart,
  Wrench,
  UserCog,
  DollarSign,
  ClipboardList,
  Calculator,
  Building2,
  Wallet,
  Shield,
  Settings,
  ChevronRight,
  ChevronDown,
  IdCard,
  Banknote,
  Truck,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/Components/ui/collapsible'
import { useState } from 'react'

interface NavItem {
  label: string
  route: string
  icon: LucideIcon
  iconColor?: string
  pattern: string
  permission?: string
}

interface NavSection {
  title?: string
  icon?: LucideIcon
  iconColor?: string
  items: (NavItem | MenuSeparator | MenuLabel)[]
}

const MODULE_PRIORITY: Record<string, number> = {
  'CONTABILIDAD': 1,
  'INVENTARIOS': 2,
  'CRM': 3,
  'VENTAS': 4,
  'CAJA': 5,
  'COMPRAS': 6,
  'SERVICE DESK': 7,
  'RECURSOS HUMANOS': 8,
  'NÓMINA': 9,
}

const getPriority = (sectionName?: string) => {
  if (!sectionName) return 99
  const normalized = sectionName.toUpperCase()
  return MODULE_PRIORITY[normalized] || 100
}

interface MenuSeparator {
  type: 'separator'
}

interface MenuLabel {
  type: 'label'
  label: string
}

type MenuEntry = NavItem | MenuSeparator | MenuLabel

function MenuItem({
  item,
  active,
  collapsed,
  isFavorite,
  onToggleFavorite,
}: {
  item: NavItem
  active: boolean
  collapsed?: boolean
  isFavorite?: boolean
  onToggleFavorite?: (fav: FavoriteItem) => void
}) {
  const Icon = item.icon

  return (
    <div className="group/fav relative flex items-center">
      <Link
        href={route(item.route)}
        title={collapsed ? item.label : undefined}
        className={cn(
          'group relative flex items-center rounded-lg text-sm font-medium transition-colors duration-200 flex-1',
          collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
          active
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full animate-in fade-in slide-in-from-left-1 duration-300" />
        )}

        <Icon
          className={cn(
            'w-[18px] h-[18px] shrink-0 transition-colors duration-200',
            active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          )}
          strokeWidth={2}
        />

        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}

        {!collapsed && !onToggleFavorite && (
          <ChevronRight
            className={cn(
              'w-4 h-4 opacity-0 -translate-x-2 transition-all duration-200',
              'group-hover:opacity-100 group-hover:translate-x-0',
              active && 'opacity-100 translate-x-0'
            )}
          />
        )}

        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-3 z-50 hidden whitespace-nowrap rounded-md bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-border group-hover:block">
            {item.label}
          </span>
        )}
      </Link>

      {/* Estrella de favoritos (solo expandido y con handler) */}
      {!collapsed && onToggleFavorite && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite({
              route: item.route,
              label: item.label,
              icon: item.iconColor || 'Package',
              section: undefined,
            })
          }}
          className={cn(
            'absolute right-1 p-1 rounded-md transition-all',
            isFavorite
              ? 'text-amber-500 opacity-100'
              : 'text-muted-foreground opacity-0 group-hover/fav:opacity-100 hover:text-amber-500'
          )}
          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Star
            className="w-3.5 h-3.5"
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      )}
    </div>
  )
}

function MenuSeparatorLine() {
  return <div className="my-2 mx-3 h-px bg-border" />
}

function MenuGroupLabel({ label }: { label: string }) {
  return (
    <div className="px-3 py-1.5 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
      {label}
    </div>
  )
}

function RenderNavItem({
  entry,
  isActivePath,
  collapsed,
  isFavorite,
  onToggleFavorite,
}: {
  entry: MenuEntry
  isActivePath: (p: string) => boolean
  collapsed?: boolean
  isFavorite?: (route: string) => boolean
  onToggleFavorite?: (fav: FavoriteItem) => void
}) {
  if ('type' in entry && entry.type === 'separator') {
    return <MenuSeparatorLine />
  }

  if ('type' in entry && entry.type === 'label') {
    return collapsed ? null : <MenuGroupLabel label={entry.label} />
  }

  const navItem = entry as NavItem
  return (
    <MenuItem
      item={navItem}
      active={isActivePath(navItem.pattern)}
      collapsed={collapsed}
      isFavorite={isFavorite?.(navItem.route)}
      onToggleFavorite={onToggleFavorite}
    />
  )
}

function NavGroup({
  section,
  isActivePath,
  collapsed,
  isFavorite,
  onToggleFavorite,
}: {
  section: NavSection
  isActivePath: (p: string) => boolean
  collapsed?: boolean
  isFavorite?: (route: string) => boolean
  onToggleFavorite?: (fav: FavoriteItem) => void
}) {
  const isSectionActive = section.items.some((item) => {
    if ('type' in item) return false
    return isActivePath((item as NavItem).pattern)
  })
  const [isOpen, setIsOpen] = useState(isSectionActive)

  if (collapsed) {
    return (
      <div className="space-y-0.5">
        {section.items.map((entry, idx) => (
          <RenderNavItem key={idx} entry={entry} isActivePath={isActivePath} collapsed />
        ))}
      </div>
    )
  }

  if (!section.title) {
    return (
      <div className="space-y-0.5">
        {section.items.map((entry, idx) => (
          <RenderNavItem
            key={idx}
            entry={entry}
            isActivePath={isActivePath}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    )
  }

  const SectionIcon = section.icon

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
      <CollapsibleTrigger className={cn(
        'flex w-full items-center gap-2 px-3 py-2 rounded-md text-xs font-bold tracking-wider uppercase transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSectionActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
      )}>
        {SectionIcon && (
          <SectionIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
        )}
        <span className="flex-1 text-left">{section.title}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground", isOpen ? "rotate-180" : "")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {section.items.map((entry, idx) => (
          <RenderNavItem
            key={idx}
            entry={entry}
            isActivePath={isActivePath}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

interface SidebarNavProps {
  collapsed?: boolean
  onToggleFavorite?: (item: FavoriteItem) => void
  isFavorite?: (route: string) => boolean
}

export function SidebarNav({ collapsed, onToggleFavorite, isFavorite }: SidebarNavProps) {
  const page = usePage()
  const url = page.url
  const moduleMenus = (page.props.moduleMenus || []) as {
    section?: string
    icon?: string
    items: (
      | { label: string; route: string; permission?: string }
      | { type: 'separator' }
      | { type: 'label'; label: string }
    )[]
  }[]

  const getPathname = (name: string) => {
    try {
      const urlStr = route(name).split('?')[0]
      if (urlStr.startsWith('http://') || urlStr.startsWith('https://')) {
        return new URL(urlStr).pathname
      }
      return urlStr
    } catch {
      return ''
    }
  }

  const isActive = (pattern: string) => {
    if (pattern === 'core.dashboard') {
      const target = getPathname('core.dashboard')
      return url.split('?')[0] === target
    }
    try {
      const targetPath = getPathname(pattern)
      const currentPath = url.split('?')[0]
      return currentPath === targetPath || currentPath.startsWith(targetPath + '/')
    } catch {
      return false
    }
  }

  const dashboardItem: NavItem = {
    label: 'Dashboard',
    route: 'core.dashboard',
    icon: LayoutDashboard,
    iconColor: 'LayoutDashboard',
    pattern: 'core.dashboard',
  }

  const { can } = usePermissions()

  const adminSection: NavSection = {
    title: 'CONFIGURACIÓN',
    icon: Settings,
    iconColor: 'Settings',
    items: [
      {
        label: 'Mi Empresa',
        route: 'core.tenant.edit',
        icon: Building2,
        iconColor: 'Building2',
        pattern: 'core.tenant.edit',
        permission: 'tenant:edit',
      },
      {
        label: 'Sedes / Sucursales',
        route: 'core.sedes.index',
        icon: Building2,
        iconColor: 'Building2',
        pattern: 'core.sedes.index',
        permission: 'tenant:edit',
      },
      {
        label: 'Usuarios',
        route: 'core.users.index',
        icon: Users,
        iconColor: 'Users',
        pattern: 'core.users.index',
        permission: 'users:view',
      },
      {
        label: 'Roles',
        route: 'core.roles.index',
        icon: Shield,
        iconColor: 'Shield',
        pattern: 'core.roles.index',
        permission: 'roles:view',
      },
      {
        label: 'Auditoría',
        route: 'core.audit.index',
        icon: FileSearch,
        iconColor: 'FileSearch',
        pattern: 'core.audit.index',
        permission: 'audit:view',
      },
    ].filter((item) => !item.permission || can(item.permission)),
  }

  const moduleSections: NavSection[] = [...moduleMenus]
    .sort((a, b) => getPriority(a.section) - getPriority(b.section))
    .map((menu) => ({
      title: menu.section,
      icon: resolveIcon(menu.icon),
      iconColor: menu.icon || 'Package',
      items: (menu.items || []).filter((item) => {
        if ('type' in item) return true
        if (!routeExistsSafe(item.route)) return false
        if (item.permission && !can(item.permission)) return false
        return true
      }).map((item) => {
        if ('type' in item) return item
        const rawItem = item as Record<string, unknown>
        return {
          label: item.label,
          route: item.route,
          icon: resolveIcon(menu.icon, rawItem.icon as string | undefined),
          iconColor: (rawItem.iconColor as string) || menu.icon || 'Package',
          pattern: item.route,
        } as NavItem
      }),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <nav className={cn('flex-1 py-4 overflow-y-auto', collapsed ? 'px-2 space-y-2' : 'px-3 space-y-6')}>
      {/* Dashboard como primer item directo */}
      <div className="space-y-0.5">
        <MenuItem
          item={dashboardItem}
          active={isActive('core.dashboard')}
          collapsed={collapsed}
        />
      </div>

      {collapsed && <MenuSeparatorLine />}

      {/* Zona: Operaciones (módulos dinámicos) */}
      {moduleSections.length > 0 && (
        <div className={collapsed ? 'space-y-0.5' : 'space-y-4'}>
          {!collapsed && <MenuGroupLabel label="Operaciones" />}
          {moduleSections.map((section, idx) => (
            <NavGroup
              key={`mod-${idx}`}
              section={section}
              isActivePath={isActive}
              collapsed={collapsed}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}

      {collapsed && <MenuSeparatorLine />}

      {/* Zona: Sistema */}
      <div className={collapsed ? 'space-y-0.5' : 'space-y-4'}>
        {!collapsed && <MenuGroupLabel label="Sistema" />}
        <NavGroup
          section={adminSection}
          isActivePath={isActive}
          collapsed={collapsed}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
        />
      </div>
    </nav>
  )
}
