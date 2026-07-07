import { useState, useEffect, useCallback } from 'react'
import { processQueue, getPendingCount } from '@/lib/sync-queue'

export interface NetworkStatus {
  isOnline: boolean
  wasOffline: boolean
  pendingCount: number
  isSyncing: boolean
}

export function useNetworkStatus(): NetworkStatus & { syncNow: () => Promise<void> } {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [wasOffline, setWasOffline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch {
      // IndexedDB no disponible
    }
  }, [])

  const syncNow = useCallback(async () => {
    if (isSyncing) return
    setIsSyncing(true)
    try {
      await processQueue()
      await updatePendingCount()
    } catch {
      // Error en sync
    } finally {
      setIsSyncing(false)
    }
  }, [isSyncing, updatePendingCount])

  useEffect(() => {
    let offlineTimer: ReturnType<typeof setTimeout> | null = null

    const handleOnline = () => {
      setIsOnline(true)
      setWasOffline(true)
      syncNow()
      offlineTimer = setTimeout(() => setWasOffline(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    updatePendingCount()
    const interval = setInterval(updatePendingCount, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
      if (offlineTimer) clearTimeout(offlineTimer)
    }
  }, [syncNow, updatePendingCount])

  return { isOnline, wasOffline, pendingCount, isSyncing, syncNow }
}
