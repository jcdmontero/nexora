import { usePage } from '@inertiajs/react'
import { router } from '@inertiajs/react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveIcon, COLOR_TO_ROLE, ROLE_ICON_STYLES } from '@/lib/sidebar-icons'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/Components/ui/dropdown-menu'

interface QuickAccessItem {
  label: string
  description?: string
  route: string
  icon: string
  color: string
  permission?: string
}

export function SidebarQuickCreate({ collapsed }: { collapsed?: boolean }) {
  const { quickAccess } = usePage().props as { quickAccess?: QuickAccessItem[] }

  const items = (Array.isArray(quickAccess) ? quickAccess : []).filter((a) => {
    try { return route().has(a.route) } catch { return false }
  })

  const createItems = items.filter((a) =>
    a.route.includes('create') || a.route.includes('pos') || a.route.includes('arqueo')
  )

  if (createItems.length === 0) return null

  return (
    <div className={cn('shrink-0', collapsed ? 'px-2 py-2' : 'px-4 py-2')}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'flex items-center justify-center gap-2 font-medium text-sm rounded-lg transition-all duration-200',
            'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]',
            collapsed
              ? 'w-10 h-10 mx-auto'
              : 'w-full px-3 py-2.5'
          )}
        >
          <Plus className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
          {!collapsed && <span>Crear nuevo</span>}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side={collapsed ? 'right' : 'bottom'}
          align="start"
          sideOffset={collapsed ? 12 : 4}
          className="min-w-[220px]"
        >
          <DropdownMenuLabel>Crear...</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {createItems.map((item) => {
            const Icon = resolveIcon(item.icon)
            const role = COLOR_TO_ROLE[item.color] ?? 'default'
            const iconStyle = ROLE_ICON_STYLES[role]

            return (
              <DropdownMenuItem
                key={item.route}
                onClick={() => router.visit(route(item.route))}
                className="gap-3 cursor-pointer"
              >
                <Icon className={cn('w-4 h-4 shrink-0', iconStyle)} />
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  )}
                </div>
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
