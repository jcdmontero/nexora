import { Building2 } from 'lucide-react'

interface SidebarHeaderProps {
  tenant?: {
    id: number
    name: string
    slug: string
  } | null
  collapsed?: boolean
}

export function SidebarHeader({ tenant, collapsed }: SidebarHeaderProps) {
  return (
    <div className={collapsed ? 'px-4 py-6 flex justify-center' : 'px-6 py-6 flex items-center gap-3'}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground flex-shrink-0 shadow-sm">
        <span className="font-bold text-lg leading-none">N</span>
      </div>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground tracking-tight leading-none">
            NEXORA
          </h2>
          {tenant && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {tenant.name}
            </p>
          )}
          {!tenant && (
            <p className="text-xs text-muted-foreground mt-1">SuperAdmin</p>
          )}
        </div>
      )}
    </div>
  )
}
