import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { TableSkeleton } from '@/Components/ui/skeleton'
import { PageHeader } from '@/Components/ui/page-header'
import { ListToolbar, FilterSelect } from '@/Components/ui/list-toolbar'
import { Pagination } from '@/Components/ui/pagination'
import { useDataTable } from '@/Hooks/useDataTable'
import { usePermissions } from '@/Hooks/usePermissions'
import { Bell, Mail, MessageCircle, Send, RefreshCw, SearchX } from 'lucide-react'

const eventoLabel = {
  orden_recibida: 'Equipo recibido',
  orden_diagnostico: 'En diagnóstico',
  orden_reparacion: 'En reparación',
  orden_pruebas: 'En pruebas',
  orden_listo: 'Listo para entrega',
  orden_entregado: 'Entregado',
}
const estadoBadge = {
  enviada: { label: 'Enviada', variant: 'default' },
  parcial: { label: 'Parcial', variant: 'secondary' },
  error: { label: 'Error', variant: 'destructive' },
  pendiente: { label: 'Pendiente', variant: 'outline' },
}
const canalIcon = { email: Mail, whatsapp: MessageCircle, telegram: Send }

export default function NotificacionesIndex({ notificaciones }) {
  const loading = notificaciones == null
  const { can } = usePermissions()

  const data = notificaciones || []
  const table = useDataTable(data, {
    searchAccessor: (n) => `${n.destinatario ?? ''} ${n.email ?? ''} ${n.titulo ?? ''} ${eventoLabel[n.evento] ?? n.evento}`,
    pageSize: 12,
  })

  const reenviar = (id) => router.post(route('notifications.reenviar', id), {}, { preserveScroll: true })

  const columns = [
    {
      key: 'destinatario', header: 'Destinatario', className: 'font-medium',
      cell: (n) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{n.destinatario || '—'}</p>
          <p className="truncate text-xs text-muted-foreground">{n.email || n.telefono || '—'}</p>
        </div>
      ),
    },
    {
      key: 'evento', header: 'Evento', hideOnMobile: true,
      cell: (n) => <span className="text-sm text-foreground">{eventoLabel[n.evento] ?? n.evento}</span>,
    },
    {
      key: 'canales', header: 'Canales',
      cell: (n) => (
        <div className="flex items-center gap-1.5">
          {(n.canales || []).map((c) => {
            const Icon = canalIcon[c] || Bell
            const est = n.canal_estados?.[c]
            const color = est === 'enviada' ? 'text-emerald-500' : est === 'error' ? 'text-rose-500' : 'text-muted-foreground'
            return <Icon key={c} className={`h-4 w-4 ${color}`} title={`${c}: ${est ?? 'pendiente'}`} />
          })}
        </div>
      ),
    },
    {
      key: 'estado', header: 'Estado',
      cell: (n) => {
        const b = estadoBadge[n.estado] || estadoBadge.pendiente
        return <Badge variant={b.variant}>{b.label}</Badge>
      },
    },
    { key: 'creado', header: 'Cuándo', alignEnd: true, hideOnMobile: true, cell: (n) => <span className="text-xs text-muted-foreground">{n.creado}</span> },
    {
      key: 'actions', header: 'Acciones', alignEnd: true,
      cell: (n) => (
        can('notifications:send') && n.estado !== 'enviada' ? (
          <button
            type="button"
            onClick={() => reenviar(n.id)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted"
            title="Reenviar"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reenviar
          </button>
        ) : <span className="text-xs text-muted-foreground">—</span>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Notificaciones" />
      <PageHeader
        title="Bandeja de notificaciones"
        description="Historial de avisos enviados a los clientes por correo, WhatsApp y Telegram."
        icon={Bell}
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar por destinatario, correo o asunto…"
            total={table.totalResults}
            filters={
              <FilterSelect
                value={table.filters.estado ?? 'all'}
                onChange={(v) => table.setFilter('estado', v)}
                placeholder="Todos los estados"
                options={[
                  { value: 'enviada', label: 'Enviadas' },
                  { value: 'parcial', label: 'Parciales' },
                  { value: 'error', label: 'Con error' },
                  { value: 'pendiente', label: 'Pendientes' },
                ]}
              />
            }
          />
        </div>
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="Sin notificaciones todavía"
            description="Cuando registres o cambies el estado de una orden, los avisos al cliente aparecerán aquí."
          />
        ) : table.totalResults === 0 ? (
          <EmptyState icon={SearchX} title="Sin coincidencias" description="Ninguna notificación coincide con la búsqueda o el filtro." />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(n) => n.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
