import { useState, useEffect, useCallback } from 'react'
import { usePage } from '@inertiajs/react'

interface OrdenUpdate {
  orden_id: number
  numero_orden: string
  estado_anterior: string
  estado_nuevo: string
}

interface PageProps {
  tenant?: { id: number }
}

/**
 * Hook de live updates para órdenes de servicio.
 * Escucha el canal del tenant y filtra eventos de órdenes.
 */
export function useOrdenRealtime(callback?: (update: OrdenUpdate) => void) {
  const { tenant } = usePage().props as PageProps
  const [lastUpdate, setLastUpdate] = useState<OrdenUpdate | null>(null)

  const handleUpdate = useCallback(
    (event: OrdenUpdate) => {
      setLastUpdate(event)
      callback?.(event)
    },
    [callback],
  )

  useEffect(() => {
    if (!window.Echo || !tenant?.id) return

    const channel = window.Echo.private(`tenant.${tenant.id}`)

    channel.listen('.orden.estado.actualizado', (event: OrdenUpdate) => {
      handleUpdate(event)
    })

    return () => {
      channel.stopListening('.orden.estado.actualizado')
    }
  }, [tenant?.id, handleUpdate])

  return { lastUpdate }
}
