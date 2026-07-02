import { useState } from 'react'
import { router, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { LifeBuoy, Plus, Search } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

export default function TicketsIndex({ tickets, filters }) {
  const { can } = usePermissions()
  const [search, setSearch] = useState(filters.search || '')
  const [estado, setEstado] = useState(filters.estado || 'all')

  const applyFilters = (s = search, e = estado) => {
    router.get(route('service-desk.tickets.index'), {
        search: s,
        estado: e === 'all' ? '' : e
    }, { preserveState: true })
  }

  const columns = [
    { key: 'id', header: 'ID', cell: (t) => <Link href={route('service-desk.tickets.show', t.id)} className="text-primary hover:underline font-mono">#{t.id}</Link> },
    { key: 'asunto', header: 'Asunto', className: 'max-w-[200px] truncate' },
    { key: 'solicitante.name', header: 'Solicitante' },
    { 
        key: 'prioridad', 
        header: 'Prioridad', 
        cell: (t) => {
            const colors = { baja: 'bg-slate-100 text-slate-800', media: 'bg-blue-100 text-blue-800', alta: 'bg-amber-100 text-amber-800', critica: 'bg-rose-100 text-rose-800' }
            return <Badge className={colors[t.prioridad]}>{t.prioridad}</Badge>
        } 
    },
    { 
        key: 'estado', 
        header: 'Estado', 
        cell: (t) => {
            const colors = { abierto: 'default', en_progreso: 'secondary', resuelto: 'outline', cerrado: 'outline' }
            return <Badge variant={colors[t.estado]} className="capitalize">{t.estado.replace('_', ' ')}</Badge>
        } 
    },
    { key: 'created_at', header: 'Creado', cell: (t) => new Date(t.created_at).toLocaleDateString() },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><LifeBuoy className="h-6 w-6 text-primary" /> Mesa de Ayuda</h2>
          <p className="text-muted-foreground">Gestión de tickets de soporte técnico e incidencias</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar ticket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="bg-background max-w-[200px]"
          />
          <Select value={estado} onValueChange={(val) => { setEstado(val); applyFilters(search, val); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="abierto">Abiertos</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="resuelto">Resueltos</SelectItem>
              </SelectContent>
          </Select>
          {can('service-desk:create') && (
              <Link href={route('service-desk.tickets.create')}>
                  <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Ticket</Button>
              </Link>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {tickets.data.length > 0 ? (
            <DataTable columns={columns} data={tickets.data} />
          ) : (
            <div className="py-12">
              <EmptyState
                icon={LifeBuoy}
                title="Sin Tickets"
                description="No hay tickets de soporte que coincidan con los filtros."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
