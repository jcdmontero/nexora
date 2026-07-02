import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Loader2, SearchIcon, AlertCircle } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/Components/ui/command'
import { Skeleton } from '@/Components/ui/skeleton'
import { usePermissions } from '@/Hooks/usePermissions'

// ─── Tipos del contrato con el backend (core.search) ─────────────────────────
interface SearchResult {
  id: string
  group: string
  title: string
  description: string
  url: string
}

// ─── Tipos del menú compartido vía usePage().props.moduleMenus ───────────────
interface ModuleMenuItem {
  label: string
  route: string
  permission?: string
  type?: string
}
interface ModuleMenuSection {
  section: string
  icon?: string
  items: ModuleMenuItem[]
}

const MIN_QUERY = 2
const DEBOUNCE_MS = 250

/**
 * Buscador global (Cmd+K / Ctrl+K).
 *
 * Experiencia híbrida:
 *  - Al abrir sin escribir: muestra NAVEGACIÓN instantánea (ítems del menú del
 *    tenant filtrados por permiso). No hay fetch.
 *  - Al escribir (>=2 chars): muestra RESULTADOS de datos reales del backend
 *    (core.search), con skeletons durante la carga y agrupación por entidad.
 *
 * Corrige los bugs de la versión anterior:
 *  - Race condition: AbortController por cada petición; respuestas viejas se ignoran.
 *  - Memory leak: el timer de debounce se cancela en cleanup.
 *  - TS estricto (sin any), accesibilidad (aria-*), ⌘ arreglado, route() de Ziggy.
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { can } = usePermissions()
  const { moduleMenus } = usePage().props as { moduleMenus?: ModuleMenuSection[] }

  // Items de navegación filtrados por permiso y que apunten a rutas existentes.
  const navItems = useMemo(() => {
    const sections = Array.isArray(moduleMenus) ? moduleMenus : []
    const acc: { section: string; label: string; url: string }[] = []
    for (const sec of sections) {
      for (const item of sec.items ?? []) {
        if (item.type === 'separator') continue
        if (item.permission && !can(item.permission)) continue
        // route() lanza si la ruta no existe (módulo no instalado). Lo filtramos.
        try {
          if (!route().has(item.route)) continue
          acc.push({ section: sec.section, label: item.label, url: route(item.route) })
        } catch {
          continue
        }
      }
    }
    return acc
  }, [moduleMenus, can])

  // Atajo Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setLoading(false)
      setError(false)
      abortRef.current?.abort()
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [open])

  // Búsqueda con debounce + AbortController (cancela peticiones en vuelo)
  useEffect(() => {
    // Limpia timer anterior (manejo manual de debounce, evita libs y leaks)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < MIN_QUERY) {
      setResults([])
      setLoading(false)
      setError(false)
      abortRef.current?.abort()
      return
    }

    setLoading(true)
    setError(false)

    debounceRef.current = setTimeout(async () => {
      // Cancela petición anterior en vuelo
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      try {
        const url = route('core.search') + '?q=' + encodeURIComponent(query.trim())
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const data = (await res.json()) as SearchResult[]
        // Sólo aplica si esta petición sigue siendo la "actual"
        if (abortRef.current === controller) {
          setResults(data)
          setLoading(false)
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        if (abortRef.current === controller) {
          setError(true)
          setLoading(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const handleSelect = useCallback((url: string) => {
    setOpen(false)
    router.visit(url)
  }, [])

  // Agrupar resultados por entidad (preserva el "group" que envía el backend)
  const groupedResults = useMemo(() => {
    const map = new Map<string, SearchResult[]>()
    for (const r of results) {
      if (!map.has(r.group)) map.set(r.group, [])
      map.get(r.group)!.push(r)
    }
    return Array.from(map.entries())
  }, [results])

  const isSearching = query.trim().length >= MIN_QUERY

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar o ir a…"
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+k"
        className="inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden lg:inline-flex">Buscar en Nexora…</span>
        <span className="inline-flex lg:hidden">Buscar…</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar en Nexora"
        description="Busca clientes, productos, facturas o navega a una sección."
      >
        <CommandInput
          placeholder="Escribe para buscar o navega a una sección…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {/* Estado de error */}
          {error && (
            <div className="flex flex-col items-center gap-2 py-8 text-center px-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm font-medium">No se pudo completar la búsqueda</p>
              <button
                type="button"
                onClick={() => setQuery((q) => q + ' ') /* re-dispara el effect */}
                className="text-xs text-primary hover:underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Sin query → navegación instantánea */}
          {!isSearching && !error && (
            <>
              {navItems.length === 0 ? (
                <CommandEmpty>No hay secciones disponibles.</CommandEmpty>
              ) : (
                <CommandGroup heading="Navegación">
                  {navItems.map((item) => (
                    <CommandItem
                      key={item.section + '::' + item.label}
                      value={`${item.label} ${item.section}`}
                      onSelect={() => handleSelect(item.url)}
                    >
                      <SearchIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{item.section}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}

          {/* Buscando → resultados del backend */}
          {isSearching && !error && (
            <>
              {loading && (
                <CommandGroup heading="Buscando…">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  ))}
                </CommandGroup>
              )}

              {!loading && results.length === 0 && (
                <CommandEmpty>No se encontraron resultados para “{query.trim()}”.</CommandEmpty>
              )}

              {!loading &&
                groupedResults.map(([group, items]) => (
                  <CommandGroup key={group} heading={group}>
                    {items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`${item.title} ${item.description}`}
                        onSelect={() => handleSelect(item.url)}
                        className="flex flex-col items-start gap-0.5 py-2"
                      >
                        <span className="font-medium leading-tight">{item.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">{item.description}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
            </>
          )}
        </CommandList>

        {/* Footer con hint */}
        {isSearching && !loading && results.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            <span>
              <Loader2 className="hidden" />
              {results.length} resultado{results.length === 1 ? '' : 's'}
            </span>
            <span>
              <kbd className="rounded border bg-muted px-1 font-mono">↵</kbd> abrir
              <span className="ml-2">
                <kbd className="rounded border bg-muted px-1 font-mono">esc</kbd> cerrar
              </span>
            </span>
          </div>
        )}
      </CommandDialog>
    </>
  )
}
