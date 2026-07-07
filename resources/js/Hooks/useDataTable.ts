import { useMemo, useState } from 'react'

interface DataTableOptions<T> {
  searchAccessor?: (row: T) => string
  filters?: Record<string, string | null>
  initialFilters?: Record<string, string | null>
  pageSize?: number
}

interface SortState {
  key: string | null
  dir: 'asc' | 'desc'
}

interface DataTableResult<T> {
  search: string
  setSearch: (v: string) => void
  filters: Record<string, string | null>
  setFilter: (key: string, value: string | null) => void
  sort: SortState
  toggleSort: (key: string) => void
  page: number
  setPage: (p: number) => void
  totalPages: number
  totalResults: number
  rows: T[]
}

/**
 * Hook reutilizable para listados: búsqueda, filtros, ordenamiento y paginación
 * del lado del cliente. Pensado para datasets por tenant (tamaño moderado).
 */
export function useDataTable<T>(rows: T[] = [], options: DataTableOptions<T> = {}): DataTableResult<T> {
  const { searchAccessor, pageSize = 10 } = options
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, string | null>>(options.initialFilters || {})
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)

  const setFilter = (key: string, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const toggleSort = (key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )
  }

  const filtered = useMemo(() => {
    let data = Array.isArray(rows) ? [...rows] : []

    const q = search.trim().toLowerCase()
    if (q && searchAccessor) {
      data = data.filter((r) => searchAccessor(r).toLowerCase().includes(q))
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value === '' || value == null || value === 'all') return
      data = data.filter((r) => String((r as Record<string, unknown>)[key]) === String(value))
    })

    if (sort.key) {
      data.sort((a, b) => {
        const av = (a as Record<string, unknown>)[sort.key!]
        const bv = (b as Record<string, unknown>)[sort.key!]
        if (av == null) return 1
        if (bv == null) return -1
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), 'es', { numeric: true })
        return sort.dir === 'asc' ? cmp : -cmp
      })
    }

    return data
  }, [rows, search, filters, sort, searchAccessor])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  )

  return {
    search,
    setSearch: (v) => { setSearch(v); setPage(1) },
    filters,
    setFilter,
    sort,
    toggleSort,
    page: safePage,
    setPage,
    totalPages,
    totalResults: filtered.length,
    rows: paginated,
  }
}
