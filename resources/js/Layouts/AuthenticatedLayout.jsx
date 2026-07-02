import { Link, usePage } from '@inertiajs/react'
import { Fragment } from 'react'
import { Bell, HelpCircle, Sun, Moon } from 'lucide-react'
import { Sidebar } from '@/Components/Sidebar/Sidebar'
import { GlobalSearch } from '@/Components/GlobalSearch' // .tsx — siempre este casing
import { UserDropdown } from '@/Components/UserDropdown'
import { useTheme } from '@/Hooks/useTheme'
import { useBreadcrumbs } from '@/Hooks/useBreadcrumbs'

export default function AuthenticatedLayout({ children }) {
  const { auth, tenant } = usePage().props
  const { theme, toggleTheme } = useTheme()
  const crumbs = useBreadcrumbs()

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar Premium */}
      <Sidebar user={auth.user} tenant={tenant} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:ml-0 min-w-0">
        {/* Header */}
        <header className="h-16 lg:h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex-1 ml-12 lg:ml-0 flex items-center justify-between gap-4">
            
            {/* Breadcrumbs dinámicos según la ruta actual */}
            <nav aria-label="Breadcrumb" className="hidden lg:flex items-center text-sm text-muted-foreground whitespace-nowrap">
              {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1
                return (
                  <Fragment key={i}>
                    {i > 0 && <span className="mx-2 text-border">/</span>}
                    {crumb.route && !isLast ? (
                      <Link
                        href={route(crumb.route)}
                        className="hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={isLast ? 'text-foreground font-medium' : ''}>
                        {crumb.label}
                      </span>
                    )}
                  </Fragment>
                )
              })}
            </nav>

            {/* Global Search — un solo componente (evita doble listener Cmd+K).
                Visible siempre: en móvil trigger compacto, en desktop ancho completo. */}
            <div className="flex items-center mx-auto md:flex-1 md:max-w-xl">
              <GlobalSearch />
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-1 lg:gap-2 ml-auto shrink-0">
               <button
                  aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                  onClick={toggleTheme}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
               >
                  {theme === 'dark'
                    ? <Sun className="w-5 h-5" />
                    : <Moon className="w-5 h-5" />}
               </button>
               <button aria-label="Notificaciones" className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card"></span>
               </button>
               <button aria-label="Ayuda" className="hidden sm:block p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                  <HelpCircle className="w-5 h-5" />
               </button>

               <div className="h-6 w-px bg-border hidden sm:block mx-1"></div>

               <UserDropdown user={auth.user} />
            </div>

          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto animate-in fade-in duration-500">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
