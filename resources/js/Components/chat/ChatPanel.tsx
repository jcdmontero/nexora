import { useState, useEffect, useRef, useCallback } from 'react'
import { usePage, router } from '@inertiajs/react'
import { X, Send, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMensaje {
  id: number
  user_id: number
  user_name: string
  mensaje: string
  tipo: string
  created_at: string
}

interface ChatConversacion {
  id: number
  tipo: string
  nombre: string | null
  participantes: number[]
  ultimo_mensaje: {
    mensaje: string
    user_name: string
    created_at: string
  } | null
  updated_at: string
}

interface PageProps {
  auth: { user: { id: number; name: string } }
  tenant?: { id: number }
}

interface ChatPanelProps {
  onClose: () => void
}

export function ChatPanel({ onClose }: ChatPanelProps) {
  const { auth, tenant } = usePage().props as PageProps
  const [conversaciones, setConversaciones] = useState<ChatConversacion[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch conversations
  useEffect(() => {
    fetch(route('chat.index'), {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then((res) => res.json())
      .then((data) => setConversaciones(data.conversaciones || []))
      .catch(() => {})
  }, [])

  // Fetch messages for active conversation
  useEffect(() => {
    if (!activeId) {
      setMensajes([])
      return
    }

    fetch(route('chat.mensajes', activeId), {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then((res) => res.json())
      .then((data) => setMensajes(data.mensajes || []))
      .catch(() => {})
  }, [activeId])

  // Listen for new messages via Echo
  useEffect(() => {
    if (!window.Echo || !activeId) return

    const channel = window.Echo.private(`chat.${activeId}`)

    channel.listen('.chat.mensaje.enviado', (event: ChatMensaje) => {
      setMensajes((prev) => {
        if (prev.some((m) => m.id === event.id)) return prev
        return [...prev, event]
      })
    })

    return () => {
      channel.stopListening('.chat.mensaje.enviado')
    }
  }, [activeId])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  // Focus input when conversation changes
  useEffect(() => {
    if (activeId) {
      inputRef.current?.focus()
    }
  }, [activeId])

  const sendMessage = useCallback(async () => {
    if (!nuevoMensaje.trim() || !activeId || loading) return

    setLoading(true)
    try {
      const res = await fetch(route('chat.enviar', activeId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
        },
        body: JSON.stringify({ mensaje: nuevoMensaje.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setMensajes((prev) => [...prev, data.mensaje])
        setNuevoMensaje('')

        // Update conversation list
        setConversaciones((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? { ...c, ultimo_mensaje: { mensaje: data.mensaje.mensaje, user_name: data.mensaje.user_name, created_at: data.mensaje.created_at }, updated_at: data.mensaje.created_at }
              : c,
          ),
        )
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [nuevoMensaje, activeId, loading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    },
    [sendMessage],
  )

  const activeConversacion = conversaciones.find((c) => c.id === activeId)

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed bottom-20 right-4 z-50 flex h-[500px] w-[360px] flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">
            {activeConversacion ? `Chat` : 'Conversaciones'}
          </h3>
          <div className="flex items-center gap-1">
            {activeId && (
              <button
                onClick={() => setActiveId(null)}
                className="p-1 hover:bg-muted rounded-md text-xs text-muted-foreground"
              >
                Volver
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-md">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!activeId ? (
          /* Conversation list */
          <div className="flex-1 overflow-y-auto">
            {conversaciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Sin conversaciones</p>
                <p className="text-xs text-muted-foreground mt-1">Inicia un chat desde el perfil de un usuario</p>
              </div>
            ) : (
              conversaciones.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">
                      {c.nombre || `Conversación #${c.id}`}
                    </span>
                    {c.ultimo_mensaje && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(c.ultimo_mensaje.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {c.ultimo_mensaje && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      <span className="font-medium">{c.ultimo_mensaje.user_name}:</span> {c.ultimo_mensaje.mensaje}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
            {mensajes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Envía el primer mensaje
              </div>
            ) : (
              mensajes.map((m) => {
                const isOwn = m.user_id === auth.user.id
                return (
                  <div key={m.id} className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
                    {!isOwn && (
                      <span className="text-[10px] text-muted-foreground mb-0.5">{m.user_name}</span>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-xl px-3 py-2 text-sm',
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground',
                      )}
                    >
                      {m.mensaje}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        {activeId && (
          <div className="border-t border-border px-3 py-2">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-background border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!nuevoMensaje.trim() || loading}
                className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
