import { useMemo, useState } from 'react'

/**
 * Hook reutilizable para listados: búsqueda, filtros, ordenamiento y paginación
 * del lado del cliente. Pensado para datasets por tenant (tamaño moderado).
 *
 * @param {Array} rows               Datos completos.
 * @param {Object} options
 * @param {(row:any)=>string} options.searchAccessor  Texto donde busca el search.
 * @param {Object} options.filters   { campo: valor } filtros de igualdad activos.
 * @param {number} options.pageSize  Filas por página (default 10).
 */
export function useDataTable(rows = [], options = {}) {
  const { searchAccessor, pageSize = 10 } = options
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState(options.initialFilters || {})
  const [sort, setSort] = useState({ key: null, dir: 'asc' })
  const [page, setPage] = useState(1)

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )
  }

  const filtered = useMemo(() => {
    let data = Array.isArray(rows) ? [...rows] : []

    // Búsqueda
    const q = search.trim().toLowerCase()
    if (q && searchAccessor) {
      data = data.filter((r) => searchAccessor(r).toLowerCase().includes(q))
    }

    // Filtros de igualdad
    Object.entries(filters).forEach(([key, value]) => {
      if (value === '' || value == null || value === 'all') return
      data = data.filter((r) => String(r[key]) === String(value))
    })

    // Ordenamiento
    if (sort.key) {
      data.sort((a, b) => {
        const av = a[sort.key]
        const bv = b[sort.key]
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
