import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ListToolbarProps {
  search: string
  onSearch: (value: string) => void
  placeholder?: string
  /** Controles de filtro adicionales (selects, etc.). */
  filters?: ReactNode
  /** Conteo de resultados a mostrar. */
  total?: number
  className?: string
}

/**
 * Barra de herramientas premium para listados: búsqueda + filtros + conteo.
 */
export function ListToolbar({ search, onSearch, placeholder = 'Buscar…', filters, total, className }: ListToolbarProps) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {filters}
        {typeof total === 'number' && (
          <span className="ml-auto whitespace-nowrap text-sm text-muted-foreground sm:ml-0">
            {total} {total === 1 ? 'resultado' : 'resultados'}
          </span>
        )}
      </div>
    </div>
  )
}

/** Select de filtro compacto y consistente. */
interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

export function FilterSelect({ value, onChange, options, placeholder }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {placeholder && <option value="all">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

export default ListToolbar
