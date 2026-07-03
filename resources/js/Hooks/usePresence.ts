import { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'

interface PresenceUser {
  id: number
  name: string
  email: string
}

interface PageProps {
  auth: { user: { id: number } }
  tenant?: { id: number }
}

/**
 * Hook de presencia: se suscribe al canal presence.online
 * y rastrea qué usuarios están en línea en tiempo real.
 */
export function usePresence() {
  const { auth, tenant } = usePage().props as PageProps
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!window.Echo || !tenant?.id || !auth?.user?.id) return

    const channel = window.Echo.join('presence.online')

    channel.here((users: PresenceUser[]) => {
      setOnlineUsers(users)
      setIsConnected(true)
    })

    channel.joining((user: PresenceUser) => {
      setOnlineUsers((prev) => {
        if (prev.some((u) => u.id === user.id)) return prev
        return [...prev, user]
      })
    })

    channel.leaving((user: PresenceUser) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== user.id))
    })

    channel.error(() => {
      setIsConnected(false)
    })

    return () => {
      window.Echo?.leave('presence.online')
    }
  }, [tenant?.id, auth?.user?.id])

  return { onlineUsers, isConnected }
}
