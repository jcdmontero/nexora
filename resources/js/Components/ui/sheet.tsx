/**
 * Sheet — Panel lateral deslizante (lado derecho por defecto).
 * Construido sin dependencias adicionales sobre @base-ui/react.
 * Accesible: Escape para cerrar, foco automático, aria-modal.
 */

import {
  type ReactNode,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Root ──────────────────────────────────────────────────────────────

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  // Bloquear scroll del body cuando el sheet está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (typeof window === 'undefined') return null

  return createPortal(
    <SheetContext.Provider value={{ open, close }}>
      {children}
    </SheetContext.Provider>,
    document.body,
  )
}

// ── Context ───────────────────────────────────────────────────────────

import { createContext, useContext } from 'react'

interface SheetContextValue { open: boolean; close: () => void }
const SheetContext = createContext<SheetContextValue>({ open: false, close: () => {} })
const useSheet = () => useContext(SheetContext)

// ── Overlay ───────────────────────────────────────────────────────────

function SheetOverlay({ className }: { className?: string }) {
  const { open, close } = useSheet()
  return (
    <div
      aria-hidden="true"
      onClick={close}
      className={cn(
        'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
        'transition-opacity duration-300',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        className,
      )}
    />
  )
}

// ── Content (panel lateral derecho) ──────────────────────────────────

interface SheetContentProps {
  children: ReactNode
  className?: string
}

function SheetContent({ children, className }: SheetContentProps) {
  const { open } = useSheet()
  const panelRef = useRef<HTMLDivElement>(null)

  // Focus automático al primer elemento cuando se abre
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      focusable?.focus()
    }, 50)
    return () => clearTimeout(t)
  }, [open])

  return (
    <>
      <SheetOverlay />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-full max-w-sm',
          'flex flex-col bg-background shadow-2xl',
          'border-l border-border',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
      >
        {children}
      </div>
    </>
  )
}

// ── Header / Title / Description ──────────────────────────────────────

function SheetHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-2 border-b border-border px-5 py-4', className)}>
      {children}
    </div>
  )
}

function SheetTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-sm font-semibold text-foreground', className)}>
      {children}
    </h2>
  )
}

function SheetDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      {children}
    </p>
  )
}

// ── Close button ─────────────────────────────────────────────────────

function SheetClose({ className }: { className?: string }) {
  const { close } = useSheet()
  return (
    <button
      onClick={close}
      aria-label="Cerrar panel"
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
        'text-muted-foreground transition-colors',
        'hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      <X className="h-4 w-4" />
    </button>
  )
}

// ── Body / Footer ─────────────────────────────────────────────────────

function SheetBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-5 py-4', className)}>
      {children}
    </div>
  )
}

function SheetFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('border-t border-border px-5 py-4', className)}>
      {children}
    </div>
  )
}

export {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetBody,
  SheetFooter,
}
