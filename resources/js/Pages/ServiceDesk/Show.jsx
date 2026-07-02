import { useState } from 'react'
import { Link, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Textarea } from '@/Components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { Checkbox } from '@/Components/ui/checkbox'
import { ArrowLeft, MessageSquare, Wrench, Clock, User, ClipboardList, PenLine } from 'lucide-react'

export default function ServiceDeskShow({ ticket, agentes }) {
  const isOrden = ticket.tipo === 'orden_trabajo'
  const routeBack = isOrden ? route('service-desk.ordenes.index') : route('service-desk.garantias.index')

  const { data: msgData, setData: setMsgData, post: postMsg, processing: msgLoading, reset: resetMsg } = useForm({
      mensaje: '',
      es_interno: false
  })

  const handleStatusChange = (newStatus) => {
      router.put(route('service-desk.tickets.updateStatus', ticket.id), { estado: newStatus })
  }

  const handleAgentChange = (newAgentId) => {
      router.put(route('service-desk.tickets.updateAgent', ticket.id), { agente_id: newAgentId })
  }

  const submitMessage = (e) => {
      e.preventDefault()
      postMsg(route('service-desk.tickets.mensajes.store', ticket.id), {
          preserveScroll: true,
          onSuccess: () => resetMsg()
      })
  }

  const states = [
      { id: 'recibido', label: 'Recibido' },
      { id: 'diagnosticando', label: 'Diagnosticando' },
      { id: 'esperando_repuestos', label: 'Esperando Repuestos' },
      { id: 'reparando', label: 'Reparando' },
      { id: 'finalizado', label: 'Finalizado' },
      { id: 'entregado', label: 'Entregado' },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href={routeBack}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    {isOrden ? 'Orden de Trabajo' : 'Garantía'} #{ticket.id.toString().padStart(5, '0')}
                    <Badge variant="secondary" className="capitalize">{ticket.estado.replace('_', ' ')}</Badge>
                </h2>
                <p className="text-muted-foreground">{ticket.equipo_descripcion || ticket.asunto}</p>
            </div>
            
            <div className="flex gap-2 items-center">
                <span className="text-sm font-medium">Estado:</span>
                <Select value={ticket.estado} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="Cambiar estado" />
                    </SelectTrigger>
                    <SelectContent>
                        {states.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Info */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-md flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Detalles del Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <p className="text-muted-foreground mb-1">Cliente</p>
                        <p className="font-medium">
                            {ticket.cliente ? (
                                <Link href={route('crm.clientes.show', ticket.cliente_id)} className="text-primary hover:underline">
                                    {ticket.cliente.nombres} {ticket.cliente.apellidos} {ticket.cliente.razon_social}
                                </Link>
                            ) : 'No asignado'}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Descripción del Problema</p>
                        <p className="whitespace-pre-wrap p-3 bg-slate-50 rounded-md border text-slate-700">{ticket.descripcion}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-muted-foreground mb-1">Costo Estimado</p>
                            <p className="font-medium">{ticket.costo_estimado ? `$${Number(ticket.costo_estimado).toLocaleString()}` : 'No definido'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground mb-1">Prioridad</p>
                            <Badge variant="outline" className="capitalize">{ticket.prioridad}</Badge>
                        </div>
                    </div>
                    <hr />
                    <div>
                        <p className="text-muted-foreground mb-2">Agente Asignado</p>
                        <Select value={ticket.agente_id?.toString() || ''} onValueChange={handleAgentChange}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Asignar técnico..." />
                            </SelectTrigger>
                            <SelectContent>
                                {agentes.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Panel Derecho: Timeline / Chat */}
        <div className="lg:col-span-2 space-y-6 flex flex-col h-[calc(100vh-12rem)] min-h-[500px]">
            <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="bg-slate-50 border-b py-3">
                    <CardTitle className="text-md flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Bitácora y Mensajes</CardTitle>
                </CardHeader>
                
                {/* Scrollable Messages Area */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    {ticket.mensajes.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground text-sm">No hay mensajes ni bitácoras en este ticket.</div>
                    ) : (
                        ticket.mensajes.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.es_interno ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 shadow-sm border ${msg.es_interno ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-white border-slate-200'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <User className="h-3 w-3 opacity-70" />
                                        <span className="text-xs font-semibold">{msg.user?.name || 'Sistema'}</span>
                                        <span className="text-[10px] text-muted-foreground ml-2">{new Date(msg.created_at).toLocaleString()}</span>
                                        {msg.es_interno && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-amber-200/50">Nota Interna</Badge>}
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{msg.mensaje}</p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    <form onSubmit={submitMessage} className="space-y-3">
                        <Textarea 
                            placeholder="Escribe una actualización, respuesta o diagnóstico..."
                            className="resize-none h-20"
                            value={msgData.mensaje}
                            onChange={e => setMsgData('mensaje', e.target.value)}
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                <Checkbox 
                                    checked={msgData.es_interno} 
                                    onCheckedChange={c => setMsgData('es_interno', c)} 
                                />
                                <span className="flex items-center gap-1"><PenLine className="h-3 w-3"/> Nota Interna (Privado)</span>
                            </label>
                            <Button type="submit" disabled={msgLoading || !msgData.mensaje.trim()} className="gap-2">
                                <MessageSquare className="h-4 w-4" /> Enviar
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
