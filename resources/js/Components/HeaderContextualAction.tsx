import { Link, router, usePage } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { cn, routeExistsSafe } from '@/lib/utils'
import { usePermissions } from '@/Hooks/usePermissions'
import { resolveIcon, COLOR_TO_ROLE, ROLE_ICON_STYLES } from '@/lib/sidebar-icons'
import { Button } from '@/Components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/Components/ui/dropdown-menu'

interface ContextualAction {
  label: string
  route: string
  permission: string
}

const SECTION_ACTIONS: Record<string, ContextualAction> = {
  'crm': { label: 'Nuevo Cliente', route: 'crm.clientes.create', permission: 'crm:create' },
  'sales': { label: 'Nueva Venta', route: 'sales.pos.index', permission: 'sales:create' },
  'inventory': { label: 'Nuevo Producto', route: 'inventory.productos.create', permission: 'inventory:create' },
  'service-desk': { label: 'Nuevo Ticket', route: 'service-desk.tickets.create', permission: 'service-desk:edit' },
  'purchasing': { label: 'Nueva Compra', route: 'purchasing.ordenes.create', permission: 'purchasing:edit' },
  'accounting': { label: 'Nuevo Asiento', route: 'accounting.asientos.create', permission: 'accounting:create' },
  'hr': { label: 'Nuevo Empleado', route: 'hr.empleados.create', permission: 'hr:create' },
  'cash': { label: 'Abrir Caja', route: 'cash.arqueo.index', permission: 'cash:create' },
}

interface QuickAccessItem {
  label: string
  description?: string
  route: string
  icon: string
  color: string
}

function detectSection(url: string): string | null {
  const path = url.split('?')[0]
  const segments = path.split('/').filter(Boolean)

  const sectionMap: Record<string, string> = {
    'crm': 'crm',
    'clientes': 'crm',
    'ventas': 'sales',
    'pos': 'sales',
    'facturas': 'sales',
    'inventario': 'inventory',
    'productos': 'inventory',
    'service-desk': 'service-desk',
    'tickets': 'service-desk',
    'ordenes-servicio': 'service-desk',
    'compras': 'purchasing',
    'ordenes-compra': 'purchasing',
    'contabilidad': 'accounting',
    'asientos': 'accounting',
    'talento-humano': 'hr',
    'empleados': 'hr',
    'caja': 'cash',
    'arqueo': 'cash',
  }

  for (const segment of segments) {
    if (sectionMap[segment]) return sectionMap[segment]
  }
  return null
}

export function HeaderContextualAction() {
  const page = usePage()
  const url = page.url
  const { can } = usePermissions()
  const { quickAccess } = page.props as { quickAccess?: QuickAccessItem[] }

  const section = detectSection(url)

  // Acción contextual según la sección activa
  if (section && SECTION_ACTIONS[section]) {
    const action = SECTION_ACTIONS[section]

    if (!can(action.permission)) return null
    if (!routeExistsSafe(action.route)) return null

    return (
      <Button size="sm" className="shrink-0" asChild>
        <Link href={route(action.route)}>
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">{action.label}</span>
        </Link>
      </Button>
    )
  }

  // En Dashboard u otras secciones: dropdown con todas las acciones disponibles
  const createItems = (Array.isArray(quickAccess) ? quickAccess : []).filter((a) => {
    try {
      return route().has(a.route) && (a.route.includes('create') || a.route.includes('pos') || a.route.includes('arqueo'))
    } catch {
      return false
    }
  })

  if (createItems.length === 0) return null

  if (createItems.length === 1) {
    const item = createItems[0]
    return (
      <Button size="sm" className="shrink-0" asChild>
        <Link href={route(item.route)}>
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">{item.label}</span>
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-1" />
          <span className="hidden sm:inline">Crear</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="min-w-[200px]">
        <DropdownMenuLabel>Crear nuevo</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {createItems.map((item) => {
          const Icon = resolveIcon(item.icon)
          const role = COLOR_TO_ROLE[item.color] ?? 'default'
          const iconStyle = ROLE_ICON_STYLES[role]

          return (
            <DropdownMenuItem
              key={item.route}
              onClick={() => router.visit(route(item.route))}
              className="gap-2 cursor-pointer"
            >
              <Icon className={cn('w-4 h-4 shrink-0', iconStyle)} />
              <span>{item.label}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
