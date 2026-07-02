import { useState } from 'react'
import { X, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/Components/ui/button'
import { SidebarHeader } from './SidebarHeader'
import { SidebarNav } from './SidebarNav'
import { SidebarFooter } from './SidebarFooter'

const COLLAPSE_KEY = 'sidebar:collapsed'

interface SidebarProps {
  user: {
    id: number
    name: string
    email: string
    is_superadmin: boolean
    roles: string[]
  }
  tenant?: {
    id: number
    name: string
    slug: string
  } | null
}

export function Sidebar({ user, tenant }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(COLLAPSE_KEY) === 'true'
  })

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSE_KEY, String(next))
      return next
    })
  }

  // El colapso solo aplica en desktop. Al abrir el drawer móvil (260px) se
  // muestra siempre expandido para no dejar el panel con iconos sueltos.
  const effectiveCollapsed = collapsed && !mobileOpen

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-40 bg-card border-r border-border flex flex-col transition-all duration-300 lg:translate-x-0 shadow-2xl lg:shadow-none',
          collapsed ? 'w-[260px] lg:w-[72px]' : 'w-[260px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <SidebarHeader tenant={tenant} collapsed={effectiveCollapsed} />

        {/* Navigation */}
        <SidebarNav collapsed={effectiveCollapsed} />

        {/* Footer */}
        <SidebarFooter collapsed={effectiveCollapsed} />

        {/* Toggle colapsar/expandir (solo desktop) */}
        <button
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className={cn(
            'hidden lg:flex items-center gap-2 mx-2 mb-3 px-3 py-2 rounded-lg text-sm font-medium',
            'text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed
            ? <PanelLeftOpen className="w-[18px] h-[18px] shrink-0" />
            : <><PanelLeftClose className="w-[18px] h-[18px] shrink-0" /><span>Colapsar</span></>}
        </button>
      </aside>
    </>
  )
}
