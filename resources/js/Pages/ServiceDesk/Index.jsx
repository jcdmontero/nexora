import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Search, Wrench, ShieldCheck, Plus } from 'lucide-react'

export default function ServiceDeskIndex({ tickets, tipo, filters }) {
  const [search, setSearch] = useState(filters.search || '')

  const isOrden = tipo === 'orden_trabajo'
  const title = isOrden ? 'Órdenes de Trabajo' : 'Garantías'
  const icon = isOrden ? <Wrench className="h-6 w-6 text-primary" /> : <ShieldCheck className="h-6 w-6 text-primary" />
  const routeName = isOrden ? 'service-desk.ordenes.index' : 'service-desk.garantias.index'

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route(routeName), { search }, { preserveState: true })
  }

  const columns = [
    { 
        key: 'id', 
        header: 'ID', 
        className: 'font-mono font-medium',
        cell: (t) => (
            <Link href={route('service-desk.tickets.show', t.id)} className="text-primary hover:underline">
                #{t.id.toString().padStart(5, '0')}
            </Link>
        )
    },
    { key: 'equipo_descripcion', header: 'Equipo/Asunto', cell: (t) => t.equipo_descripcion || t.asunto },
    { 
        key: 'cliente', 
        header: 'Cliente', 
        cell: (t) => t.cliente ? `${t.cliente.nombres} ${t.cliente.apellidos}` : '—'
    },
    { 
        key: 'estado', 
        header: 'Estado', 
        cell: (t) => {
            const states = {
                'recibido': { label: 'Recibido', class: 'bg-slate-100 text-slate-700' },
                'diagnosticando': { label: 'Diagnosticando', class: 'bg-blue-100 text-blue-700' },
                'esperando_repuestos': { label: 'Esperando Repuestos', class: 'bg-amber-100 text-amber-700' },
                'reparando': { label: 'Reparando', class: 'bg-indigo-100 text-indigo-700' },
                'finalizado': { label: 'Finalizado', class: 'bg-emerald-100 text-emerald-700' },
                'entregado': { label: 'Entregado', class: 'bg-teal-100 text-teal-700' },
            }
            const s = states[t.estado] || states['recibido']
            return <Badge variant="secondary" className={s.class}>{s.label}</Badge>
        } 
    },
    { 
        key: 'prioridad', 
        header: 'Prioridad',
        cell: (t) => {
            const colors = { baja: 'bg-slate-100', media: 'bg-blue-100', alta: 'bg-orange-100 text-orange-800', critica: 'bg-red-100 text-red-800' }
            return <Badge variant="outline" className={`capitalize ${colors[t.prioridad]}`}>{t.prioridad}</Badge>
        }
    },
    { key: 'agente.name', header: 'Agente', cell: (t) => t.agente?.name || <span className="text-muted-foreground italic">Sin asignar</span> },
    { key: 'created_at', header: 'Fecha', cell: (t) => new Date(t.created_at).toLocaleDateString() },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">{icon} {title}</h2>
          <p className="text-muted-foreground">Gestiona el estado y seguimiento de {title.toLowerCase()}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="flex gap-2 w-full">
            <Input
              placeholder={`Buscar ${title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-background max-w-[250px]"
            />
            <Button type="submit" variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
          </form>
          <Link href={route('service-desk.tickets.create', { tipo })}>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Crear</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {tickets.data.length > 0 ? (
            <DataTable columns={columns} data={tickets.data} />
          ) : (
            <div className="py-12">
              <EmptyState
                icon={isOrden ? Wrench : ShieldCheck}
                title={`No hay ${title.toLowerCase()}`}
                description={`Aún no se han registrado ${title.toLowerCase()} en el sistema.`}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
