import { useState } from 'react'
import { useForm, Link, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Textarea } from '@/Components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { ArrowLeft, Send, Lock, User as UserIcon } from 'lucide-react'

export default function TicketShow({ ticket }) {
  const { auth } = usePage().props
  const [isInternalNote, setIsInternalNote] = useState(false)

  const { data: msgData, setData: setMsgData, post: postMsg, processing: msgProcessing, reset: msgReset } = useForm({
    mensaje: '',
    es_interno: false
  })

  const { data: statusData, setData: setStatusData, put: putStatus, processing: statusProcessing } = useForm({
    estado: ticket.estado
  })

  const handleMsgSubmit = (e) => {
      e.preventDefault()
      postMsg(route('service-desk.tickets.mensajes.store', ticket.id), {
          preserveScroll: true,
          onSuccess: () => {
              msgReset()
              setIsInternalNote(false)
          }
      })
  }

  const handleStatusChange = (val) => {
      setStatusData('estado', val)
      putStatus(route('service-desk.tickets.estado', ticket.id), { preserveScroll: true })
  }

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href={route('service-desk.tickets.index')}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Ticket #{ticket.id}: {ticket.asunto}</h2>
              <p className="text-muted-foreground flex gap-2 items-center mt-1">
                  Abierto por {ticket.solicitante?.name ?? 'Sin solicitante'} el {new Date(ticket.created_at).toLocaleString()}
                  <Badge variant="outline" className="capitalize">{ticket.prioridad}</Badge>
              </p>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Estado:</span>
                <Select value={statusData.estado} onValueChange={handleStatusChange} disabled={statusProcessing}>
                    <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="abierto">Abierto</SelectItem>
                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                        <SelectItem value="resuelto">Resuelto</SelectItem>
                        <SelectItem value="cerrado">Cerrado</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chat / Hilo de mensajes */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-[calc(100vh-180px)]">
            <Card className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950/50">
                    
                    {/* Mensaje original / Descripción */}
                    <div className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-900 border rounded-2xl p-4 rounded-tl-sm shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-sm">{ticket.solicitante?.name || 'Sin solicitante'}</span>
                                <span className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{ticket.descripcion}</p>
                        </div>
                    </div>

                    {/* Hilo de Respuestas */}
                    {ticket.mensajes.map(msg => {
                        const isMe = msg.user_id === auth.user.id
                        return (
                            <div key={msg.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${msg.es_interno ? 'bg-amber-100' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                    {msg.es_interno ? <Lock className="h-4 w-4 text-amber-600" /> : <UserIcon className="h-5 w-5 text-slate-500" />}
                                </div>
                                <div className={`flex-1 max-w-[80%] border p-4 shadow-sm ${msg.es_interno ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30' : (isMe ? 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-900')} ${isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-sm">{msg.user?.name || 'Sistema'} {msg.es_interno && <span className="text-amber-600 text-xs">(Nota Interna)</span>}</span>
                                        <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.mensaje}</p>
                                </div>
                            </div>
                        )
                    })}

                </div>

                {/* Input de Mensaje */}
                {ticket.estado !== 'cerrado' && (
                    <div className="p-4 border-t bg-white dark:bg-slate-950">
                        <form onSubmit={handleMsgSubmit} className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-medium text-muted-foreground">Responder como {auth.user?.name ?? 'Usuario'}</span>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                                        <input type="checkbox" checked={isInternalNote} onChange={e => {
                                            setIsInternalNote(e.target.checked)
                                            setMsgData('es_interno', e.target.checked)
                                        }} className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50" />
                                        Nota Interna Privada
                                    </label>
                                </div>
                                <Textarea 
                                    value={msgData.mensaje}
                                    onChange={e => setMsgData('mensaje', e.target.value)}
                                    placeholder={isInternalNote ? "Escribe una nota visible solo para agentes técnicos..." : "Escribe tu respuesta..."}
                                    className={isInternalNote ? 'bg-amber-50/50 border-amber-200 focus-visible:ring-amber-400' : ''}
                                />
                            </div>
                            <Button type="submit" disabled={msgProcessing || !msgData.mensaje.trim()} className="h-auto py-5"><Send className="h-4 w-4" /></Button>
                        </form>
                    </div>
                )}
            </Card>
        </div>

        {/* Panel Lateral de Detalles */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Información del Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <span className="text-muted-foreground block mb-1">Cliente Asociado</span>
                        <span className="font-medium">{ticket.cliente ? `${ticket.cliente.nombres} ${ticket.cliente.apellidos}` : 'N/A (Interno)'}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block mb-1">Agente Asignado</span>
                        <span className="font-medium">{ticket.agente ? ticket.agente.name : 'Sin Asignar'}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block mb-1">Prioridad</span>
                        <Badge variant="outline" className="capitalize">{ticket.prioridad}</Badge>
                    </div>
                    {ticket.fecha_resolucion && (
                        <div>
                            <span className="text-muted-foreground block mb-1">Resuelto en</span>
                            <span className="font-medium text-emerald-600">{new Date(ticket.fecha_resolucion).toLocaleString()}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>
    </AuthenticatedLayout>
  )
}
