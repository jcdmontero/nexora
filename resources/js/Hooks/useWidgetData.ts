import { useState, useEffect, useCallback, useRef } from 'react'

interface UseWidgetDataOptions {
  module: string
  /** Si false, no se hace fetch (módulo inactivo) */
  enabled?: boolean
  /** Intervalo de refresco automático en ms. 0 = desactivado */
  refreshInterval?: number
}

interface WidgetDataState<T> {
  data: T | null
  loading: boolean
  error: boolean
  refresh: () => void
}

export function useWidgetData<T>(options: UseWidgetDataOptions): WidgetDataState<T> {
  const { module, enabled = true, refreshInterval = 0 } = options

  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    setError(false)

    try {
      const url = route('core.dashboard.widget-data', { module })
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
        signal: abortRef.current.signal,
      })
      if (res.ok) {
        setData(await res.json())
      } else {
        setError(true)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(true)
    } finally {
      setLoading(false)
    }
  }, [module, enabled])

  useEffect(() => {
    fetchData()

    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => {
        clearInterval(interval)
        abortRef.current?.abort()
      }
    }

    return () => { abortRef.current?.abort() }
  }, [fetchData, refreshInterval])

  return { data, loading, error, refresh: fetchData }
}
