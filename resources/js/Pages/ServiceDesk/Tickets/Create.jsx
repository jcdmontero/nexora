import { useForm, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Label } from '@/Components/ui/label'
import { Textarea } from '@/Components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { ArrowLeft, Wrench, ShieldCheck } from 'lucide-react'

export default function TicketCreate({ tipo = 'orden_trabajo', clientes = [] }) {
  const isOrden = tipo === 'orden_trabajo'
  const indexRoute = isOrden ? 'service-desk.ordenes.index' : 'service-desk.garantias.index'
  const title = isOrden ? 'Nueva Orden de Trabajo' : 'Nueva Garantía'
  const Icon = isOrden ? Wrench : ShieldCheck

  const { data, setData, post, processing, errors } = useForm({
    tipo,
    cliente_id: '',
    equipo_descripcion: '',
    asunto: '',
    descripcion: '',
    prioridad: 'media',
  })

  const submit = (e) => {
    e.preventDefault()
    post(route('service-desk.tickets.store'))
  }

  const clienteLabel = (c) => c.razon_social || `${c.nombres ?? ''} ${c.apellidos ?? ''}`.trim() || `Cliente #${c.id}`

  return (
    <AuthenticatedLayout>
      <div className="flex items-center gap-4 mb-6">
        <Link href={route(indexRoute)}>
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Icon className="h-6 w-6 text-primary" /> {title}</h2>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-6">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select value={data.cliente_id} onValueChange={v => setData('cliente_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecciona un cliente" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{clienteLabel(c)}</SelectItem>)}
                </SelectContent>
              </Select>
              {clientes.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay clientes registrados. Crea uno en el módulo CRM primero.</p>
              )}
              {errors.cliente_id && <p className="text-sm text-destructive">{errors.cliente_id}</p>}
            </div>

            <div className="space-y-2">
              <Label>{isOrden ? 'Equipo / Artículo a revisar' : 'Equipo / Producto en garantía'}</Label>
              <Input
                value={data.equipo_descripcion}
                onChange={e => setData('equipo_descripcion', e.target.value)}
                placeholder="Ej. Laptop HP Pavilion 15, Serie ABC123"
              />
              {errors.equipo_descripcion && <p className="text-sm text-destructive">{errors.equipo_descripcion}</p>}
            </div>

            <div className="space-y-2">
              <Label>Asunto</Label>
              <Input
                value={data.asunto}
                onChange={e => setData('asunto', e.target.value)}
                placeholder={isOrden ? 'Ej. No enciende / pantalla rota' : 'Ej. Falla dentro del periodo de garantía'}
              />
              {errors.asunto && <p className="text-sm text-destructive">{errors.asunto}</p>}
            </div>

            <div className="space-y-2">
              <Label>Descripción Detallada</Label>
              <Textarea
                value={data.descripcion}
                onChange={e => setData('descripcion', e.target.value)}
                placeholder="Describe el problema con el mayor nivel de detalle posible..."
                rows={5}
              />
              {errors.descripcion && <p className="text-sm text-destructive">{errors.descripcion}</p>}
            </div>

            <div className="space-y-2 max-w-xs">
              <Label>Prioridad</Label>
              <Select value={data.prioridad} onValueChange={v => setData('prioridad', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
              {errors.prioridad && <p className="text-sm text-destructive">{errors.prioridad}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Link href={route(indexRoute)}><Button type="button" variant="outline">Cancelar</Button></Link>
              <Button type="submit" disabled={processing}>Crear {isOrden ? 'Orden' : 'Garantía'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
