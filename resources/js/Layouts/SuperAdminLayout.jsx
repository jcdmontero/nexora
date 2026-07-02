import { useState } from 'react'
import { Link, usePage, router } from '@inertiajs/react'
import { cn } from '@/lib/utils'
import { Button } from '@/Components/ui/button'
import { useTheme } from '@/Hooks/useTheme'
import { UserDropdown } from '@/Components/UserDropdown'
import {
  LayoutDashboard, Building2, Boxes, ShieldCheck,
  LogOut, Menu, X, Sun, Moon,
} from 'lucide-react'

const nav = [
  { label: 'Dashboard', route: 'superadmin.dashboard', icon: LayoutDashboard, iconName: 'LayoutDashboard', prefix: '/superadmin', exact: true },
  { label: 'Empresas', route: 'superadmin.tenants.index', icon: Building2, iconName: 'Building2', prefix: '/superadmin/empresas' },
  { label: 'Centro de Módulos', route: 'superadmin.modules.index', icon: Boxes, iconName: 'Package', prefix: '/superadmin/modulos' },
]

/** Mapa de colores premium para iconos del SuperAdmin */
const iconStyles = {
  LayoutDashboard: {
    container: 'bg-blue-50 dark:bg-blue-950/40 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  Building2: {
    container: 'bg-amber-50 dark:bg-amber-950/40 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  Package: {
    container: 'bg-rose-50 dark:bg-rose-950/40 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50',
    icon: 'text-rose-600 dark:text-rose-400',
  },
}

const defaultIconStyle = {
  container: 'bg-slate-50 dark:bg-slate-800/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-700/50',
  icon: 'text-slate-500 dark:text-slate-400',
}

function getIconStyle(iconName) {
  return iconStyles[iconName] || defaultIconStyle
}

function NavIcon({ icon: Icon, iconName, active }) {
  const style = getIconStyle(iconName)

  return (
    <div
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200',
        'group-hover:scale-110 group-hover:shadow-sm',
        style.container,
        active && 'scale-110 shadow-sm',
      )}
    >
      <Icon className={cn('w-[18px] h-[18px] transition-colors duration-200', style.icon)} strokeWidth={1.8} />
    </div>
  )
}

export default function SuperAdminLayout({ children }) {
  const { auth } = usePage().props
  const { url: currentUrl } = usePage()
  const { theme, toggleTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (item) => {
    const path = currentUrl.split('?')[0]
    return item.exact ? path === item.prefix : path.startsWith(item.prefix)
  }

  const logout = () => router.post(route('superadmin.logout'))

  const initials = (auth?.user?.name || 'SA').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen flex bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-50 lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      <aside className={cn(
        'fixed lg:relative inset-y-0 left-0 z-40 w-72 bg-card border-r border-border flex flex-col transition-transform duration-300 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">NEXORA</h2>
              <p className="text-xs text-muted-foreground">Plataforma · SuperAdmin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((item) => {
            const active = isActive(item)
            return (
              <Link
                key={item.route}
                href={route(item.route)}
                className={cn(
                  'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  'hover:bg-accent hover:text-accent-foreground',
                  active ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />}
                <NavIcon icon={item.icon} iconName={item.iconName} active={active} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border flex justify-center">
          <Button variant="ghost" size="icon-sm" onClick={toggleTheme} title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}>
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 lg:h-14 bg-card border-b border-border flex items-center px-6 lg:px-8 justify-between">
          <h1 className="text-lg font-semibold text-foreground ml-12 lg:ml-0">Plataforma NEXORA</h1>
          <div className="flex items-center gap-4">
             <UserDropdown user={auth?.user} />
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">{children}</div>
      </main>
    </div>
  )
}
