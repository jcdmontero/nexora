import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPage: (page: number) => void
  className?: string
}

/**
 * Paginación premium reutilizable (cliente). Oculta cuando solo hay 1 página.
 */
export function Pagination({ page, totalPages, onPage, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  const push = (p: number | '…') => pages.push(p)
  const window = 1
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) {
      push(i)
    } else if (pages[pages.length - 1] !== '…') {
      push('…')
    }
  }

  return (
    <div className={cn('flex items-center justify-between gap-2 border-t border-border px-4 py-3', className)}>
      <p className="text-sm text-muted-foreground">
        Página <span className="font-medium text-foreground">{page}</span> de{' '}
        <span className="font-medium text-foreground">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-2 text-sm text-muted-foreground">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPage(p)}
                className={cn(
                  'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background hover:bg-muted',
                )}
              >
                {p}
              </button>
            ),
          )}
        </div>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Pagination
