import { useNetworkStatus } from '@/Hooks/useNetworkStatus'
import { cn } from '@/lib/utils'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'

export function NetworkStatusBar() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useNetworkStatus()

  const showOffline = !isOnline
  const showSyncing = isOnline && isSyncing && pendingCount > 0
  const showPending = isOnline && !isSyncing && pendingCount > 0

  if (!showOffline && !showSyncing && !showPending) return null

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium transition-colors',
        showOffline && 'bg-amber-500/90 text-white',
        showSyncing && 'bg-blue-500/90 text-white',
        showPending && 'bg-amber-500/90 text-white',
      )}
    >
      {showOffline && (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Sin conexión — las operaciones se enviarán cuando vuelva internet</span>
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
              {pendingCount} en cola
            </span>
          )}
        </>
      )}

      {showSyncing && (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Sincronizando {pendingCount} operación{pendingCount === 1 ? '' : 'es'} pendiente{pendingCount === 1 ? '' : 'es'}...</span>
        </>
      )}

      {showPending && (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{pendingCount} operación{pendingCount === 1 ? '' : 'es'} pendiente{pendingCount === 1 ? '' : 'es'}</span>
          <button
            onClick={syncNow}
            className="ml-1 underline hover:no-underline"
          >
            Sincronizar ahora
          </button>
        </>
      )}
    </div>
  )
}
