/**
 * WidgetShell — Wrapper universal para todos los widgets del Dashboard.
 *
 * Provee: header con icono + título + descripción, menú contextual ⋮,
 * línea de acento superior, animación de entrada, y padding consistente.
 *
 * Inspirado en Linear/Notion/Stripe — minimalista, sin bordes pesados.
 */

import { type ReactNode, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getAccent, type AccentColor } from '@/lib/accent'
import { MoreVertical, Pin, PinOff, X } from 'lucide-react'
import type { WidgetShellProps } from './types'
import { useDashboardActions } from './DashboardActionsContext'

// ── Hook: animación de entrada fade-in + slide-up ──

function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return visible
}

// ── Componente ──

export function WidgetShell({
  widgetId,
  title,
  description,
  icon: Icon,
  accent = 'indigo',
  size,
  className,
  noPadding = false,
  hideHeader = false,
  showMenu = true,
  headerActions,
  children,
}: WidgetShellProps) {
  const tokens = getAccent(accent)
  const visible = useFadeIn()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { toggleWidget, pinWidget, unpinWidget, isWidgetPinned } = useDashboardActions()
  const pinned = isWidgetPinned(widgetId)

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div
      data-widget={widgetId}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5',
        'transition-all duration-300 ease-out',
        'hover:shadow-md hover:ring-foreground/10',
        tokens.glow,
        // Animación de entrada
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-2 opacity-0',
        'transition-all duration-500',
        className,
      )}
    >
      {/* Línea de acento superior (aparece en hover) */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          tokens.gradient,
        )}
      />

      {/* Header del widget */}
      {!hideHeader && title && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 min-w-0">
            {Icon && (
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
                  tokens[50],
                  tokens.text,
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {title}
              </h3>
              {description && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {headerActions}

            {/* Menú contextual */}
            {showMenu && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Opciones del widget"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                      onClick={() => {
                        pinned ? unpinWidget(widgetId) : pinWidget(widgetId)
                        setMenuOpen(false)
                      }}
                    >
                      {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      {pinned ? 'Desanclar' : 'Anclar al inicio'}
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      onClick={() => {
                        toggleWidget(widgetId)
                        setMenuOpen(false)
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                      Ocultar widget
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenido del widget */}
      <div className={cn(noPadding ? '' : 'p-5', hideHeader || !title ? '' : 'pt-3')}>
        {children}
      </div>
    </div>
  )
}

export default WidgetShell
