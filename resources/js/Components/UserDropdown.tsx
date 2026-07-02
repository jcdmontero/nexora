import { router } from '@inertiajs/react'
import { useState } from 'react'
import {
  User,
  LogOut,
  MoreVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/Components/ui/dropdown-menu'

interface SidebarUserProps {
  user: {
    id: number
    name: string
    email: string
    is_superadmin: boolean
    roles: string[]
  }
}

/** Verifica si una ruta existe en Ziggy sin lanzar error */
function routeExists(name: string): boolean {
  try {
    return route().has(name)
  } catch {
    return false
  }
}

export function UserDropdown({ user }: SidebarUserProps) {
  const [open, setOpen] = useState(false)

  const logout = () => {
    // Check if it's superadmin or normal user to use correct route if needed
    // Assuming normal user for now based on context, or fallback to core.logout
    const routeName = user.is_superadmin && route().has('superadmin.logout') ? 'superadmin.logout' : 'core.logout'
    router.post(route(routeName))
  }

  const goToProfile = () => {
    if (routeExists('core.profile.index')) {
      router.get(route('core.profile.index'))
    }
  }

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const hasProfile = routeExists('core.profile.index')

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 pr-3 rounded-full transition-colors border border-transparent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
          {initials}
        </div>
        <div className="hidden lg:flex flex-col text-left">
          <span className="text-sm font-semibold leading-tight text-foreground">{user.name}</span>
          <span className="text-xs text-muted-foreground leading-tight hidden">{user.email}</span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-56"
      >
        {/* Cabecera del dropdown */}
        <div className="px-2.5 py-2.5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {hasProfile && (
          <>
            <DropdownMenuItem onClick={goToProfile} className="cursor-pointer mt-1">
              <User className="w-4 h-4 mr-2" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={logout} variant="destructive" className="cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
