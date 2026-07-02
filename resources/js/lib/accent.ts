/**
 * Paleta de acentos unificada para todo el sistema.
 *
 * Reemplaza los 3 mapeos de color paralelos que existían antes:
 *   - accentMap (StatCard)
 *   - taskAccentMap (Dashboard — tareas pendientes)
 *   - qaColorMap  (Dashboard — accesos rápidos)
 *
 * Todos los componentes deben consumir de aquí. No crear nuevos mapeos.
 */

import type { LucideIcon } from 'lucide-react'

// ── Acentos disponibles ──

export type AccentColor = 'indigo' | 'emerald' | 'amber' | 'sky' | 'rose' | 'violet'

export interface AccentTokens {
  /** Fondo suave (icono, badge, badge pill) */
  50: string
  /** Fondo medio (badge count, botón hover) */
  100: string
  /** Color de texto principal */
  text: string
  /** Border color */
  border: string
  /** Border hover */
  hover: string
  /** Gradiente CSS (from-{color} to-{color-400}) */
  gradient: string
  /** Dot/indicator color (sólido) */
  dot: string
  /** Shadow glow en hover */
  glow: string
  /** Ring color sutil */
  ring: string
  /** Hover background sobre card/link */
  hoverBg: string
}

export const accentPalette: Record<AccentColor, AccentTokens> = {
  indigo: {
    50: 'bg-indigo-50 dark:bg-indigo-500/10',
    100: 'bg-indigo-100 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-500/20',
    hover: 'hover:border-indigo-300 dark:hover:border-indigo-500/30',
    gradient: 'from-indigo-500 to-indigo-400',
    dot: 'bg-indigo-500',
    glow: 'group-hover:shadow-indigo-500/10',
    ring: 'ring-indigo-500/20',
    hoverBg: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5',
  },
  emerald: {
    50: 'bg-emerald-50 dark:bg-emerald-500/10',
    100: 'bg-emerald-100 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    hover: 'hover:border-emerald-300 dark:hover:border-emerald-500/30',
    gradient: 'from-emerald-500 to-emerald-400',
    dot: 'bg-emerald-500',
    glow: 'group-hover:shadow-emerald-500/10',
    ring: 'ring-emerald-500/20',
    hoverBg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5',
  },
  amber: {
    50: 'bg-amber-50 dark:bg-amber-500/10',
    100: 'bg-amber-100 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/20',
    hover: 'hover:border-amber-300 dark:hover:border-amber-500/30',
    gradient: 'from-amber-500 to-amber-400',
    dot: 'bg-amber-500',
    glow: 'group-hover:shadow-amber-500/10',
    ring: 'ring-amber-500/20',
    hoverBg: 'hover:bg-amber-50/50 dark:hover:bg-amber-500/5',
  },
  sky: {
    50: 'bg-sky-50 dark:bg-sky-500/10',
    100: 'bg-sky-100 dark:bg-sky-500/20',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-500/20',
    hover: 'hover:border-sky-300 dark:hover:border-sky-500/30',
    gradient: 'from-sky-500 to-sky-400',
    dot: 'bg-sky-500',
    glow: 'group-hover:shadow-sky-500/10',
    ring: 'ring-sky-500/20',
    hoverBg: 'hover:bg-sky-50/50 dark:hover:bg-sky-500/5',
  },
  rose: {
    50: 'bg-rose-50 dark:bg-rose-500/10',
    100: 'bg-rose-100 dark:bg-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-500/20',
    hover: 'hover:border-rose-300 dark:hover:border-rose-500/30',
    gradient: 'from-rose-500 to-rose-400',
    dot: 'bg-rose-500',
    glow: 'group-hover:shadow-rose-500/10',
    ring: 'ring-rose-500/20',
    hoverBg: 'hover:bg-rose-50/50 dark:hover:bg-rose-500/5',
  },
  violet: {
    50: 'bg-violet-50 dark:bg-violet-500/10',
    100: 'bg-violet-100 dark:bg-violet-500/20',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-500/20',
    hover: 'hover:border-violet-300 dark:hover:border-violet-500/30',
    gradient: 'from-violet-500 to-violet-400',
    dot: 'bg-violet-500',
    glow: 'group-hover:shadow-violet-500/10',
    ring: 'ring-violet-500/20',
    hoverBg: 'hover:bg-violet-50/50 dark:hover:bg-violet-500/5',
  },
}

// ── Helpers ──

/** Devuelve los tokens de acento, con fallback a indigo */
export function getAccent(color?: AccentColor | null): AccentTokens {
  return accentPalette[color ?? 'indigo']
}

/** Construye las clases de un icono con fondo de acento */
export function accentIconClasses(color?: AccentColor | null): string {
  const a = getAccent(color)
  return `${a[50]} ${a.text}`
}

/** Construye las clases de un badge con fondo de acento */
export function accentBadgeClasses(color?: AccentColor | null): string {
  const a = getAccent(color)
  return `${a[100]} ${a.text}`
}

/** Construye las clases de un link/card con hover de acento */
export function accentLinkClasses(color?: AccentColor | null): string {
  const a = getAccent(color)
  return `${a.border} ${a.hover} ${a.hoverBg}`
}

// ── Colores hex para gráficos recharts ──
// Sincronizados con --chart-N de app.css

export const chartColors: Record<AccentColor, string> = {
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  sky: '#0ea5e9',
  rose: '#f43f5e',
  violet: '#8b5cf6',
}

// ── Mapeo de eventos de auditoría (unificado) ──

import { PlusCircle, PencilLine, Trash2 } from 'lucide-react'

export interface EventMeta {
  label: string
  icon: LucideIcon
  color: string // clases de icono
  dotColor: string // clase de dot
}

export const eventMeta: Record<string, EventMeta> = {
  created: {
    label: 'creó',
    icon: PlusCircle,
    color: accentIconClasses('emerald'),
    dotColor: getAccent('emerald').dot,
  },
  updated: {
    label: 'actualizó',
    icon: PencilLine,
    color: accentIconClasses('sky'),
    dotColor: getAccent('sky').dot,
  },
  deleted: {
    label: 'eliminó',
    icon: Trash2,
    color: accentIconClasses('rose'),
    dotColor: getAccent('rose').dot,
  },
}

/** Fallback para eventos no reconocidos */
export const defaultEventMeta: EventMeta = eventMeta.updated
