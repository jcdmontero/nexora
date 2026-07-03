import { useState, useEffect, useCallback } from 'react'
import { usePage } from '@inertiajs/react'

interface ChatMensaje {
  id: number
  user_id: number
  user_name: string
  mensaje: string
  tipo: string
  created_at: string
}

interface PageProps {
  tenant?: { id: number }
}

/**
 * Hook de chat: se suscribe al canal de una conversación
 * y maneja envío/recepción de mensajes en tiempo real.
 */
export function useChat(conversacionId: number | null) {
  const { tenant } = usePage().props as PageProps
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([])
  const [loading, setLoading] = useState(false)

  // Listen for new messages via Echo
  useEffect(() => {
    if (!window.Echo || !conversacionId || !tenant?.id) return

    const channel = window.Echo.private(`chat.${conversacionId}`)

    channel.listen('.chat.mensaje.enviado', (event: ChatMensaje) => {
      setMensajes((prev) => {
        if (prev.some((m) => m.id === event.id)) return prev
        return [...prev, event]
      })
    })

    return () => {
      channel.stopListening('.chat.mensaje.enviado')
    }
  }, [conversacionId, tenant?.id])

  const enviarMensaje = useCallback(
    async (mensaje: string) => {
      if (!conversacionId || !mensaje.trim()) return null

      setLoading(true)
      try {
        const res = await fetch(route('chat.enviar', conversacionId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
          },
          body: JSON.stringify({ mensaje: mensaje.trim() }),
        })

        if (res.ok) {
          const data = await res.json()
          setMensajes((prev) => [...prev, data.mensaje])
          return data.mensaje
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
      return null
    },
    [conversacionId],
  )

  return { mensajes, setMensajes, enviarMensaje, loading }
}
