import { Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { DataTable } from '@/Components/ui/data-table'
import { Badge } from '@/Components/ui/badge'
import { EmptyState } from '@/Components/ui/empty-state'
import { FileSearch } from 'lucide-react'

const eventLabels = {
  created: 'Creado',
  updated: 'Actualizado',
  deleted: 'Eliminado',
  restored: 'Restaurado',
  login: 'Inicio sesión',
  logout: 'Cierre sesión',
}

const eventVariants = {
  created: 'default',
  updated: 'secondary',
  deleted: 'destructive',
  restored: 'outline',
}

export default function AuditIndex({ logs, filters, eventOptions, typeOptions }) {
  const applyFilter = (key, value) => {
    router.get(route('core.audit.index'), { ...filters, [key]: value || undefined }, {
      preserveState: true,
      replace: true,
    })
  }

  const columns = [
    {
      key: 'created_at',
      header: 'Fecha',
      className: 'text-xs text-muted-foreground whitespace-nowrap',
      cell: (log) => new Date(log.created_at).toLocaleString('es-CO'),
    },
    {
      key: 'user_name',
      header: 'Usuario',
      className: 'text-sm',
      cell: (log) => log.user_name || '—',
    },
    {
      key: 'event',
      header: 'Evento',
      cell: (log) => (
        <Badge variant={eventVariants[log.event] || 'outline'}>
          {eventLabels[log.event] || log.event}
        </Badge>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      className: 'text-sm',
      cell: (log) => log.description || '—',
    },
    {
      key: 'resource',
      header: 'Recurso',
      className: 'text-xs text-muted-foreground',
      cell: (log) => `${log.auditable_type} #${log.auditable_id}`,
    },
    {
      key: 'ip_address',
      header: 'IP',
      className: 'text-xs text-muted-foreground font-mono',
      hideOnMobile: true,
      cell: (log) => log.ip_address || '—',
    },
  ]

  return (
    <AuthenticatedLayout>
      <h2 className="text-2xl font-bold mb-6">Auditoría</h2>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <select
            value={filters.event || ''}
            onChange={(e) => applyFilter('event', e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-full sm:w-auto"
          >
            <option value="">Todos los eventos</option>
            {eventOptions.map((e) => (
              <option key={e} value={e}>{eventLabels[e] || e}</option>
            ))}
          </select>
          <select
            value={filters.auditable_type || ''}
            onChange={(e) => applyFilter('auditable_type', e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-full sm:w-auto"
          >
            <option value="">Todos los tipos</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => applyFilter('from', e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-full sm:w-auto"
          />
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => applyFilter('to', e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-full sm:w-auto"
          />
          {Object.values(filters).some(Boolean) && (
            <button
              onClick={() => router.get(route('core.audit.index'), {}, { preserveState: true, replace: true })}
              className="h-9 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de actividad</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.data.length === 0 ? (
            <EmptyState
              icon={FileSearch}
              title="No hay registros de auditoría"
              description="Los cambios realizados en el sistema aparecerán aquí automáticamente."
            />
          ) : (
            <DataTable columns={columns} data={logs.data} rowKey={(log) => log.id} />
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {logs.links && logs.links.length > 3 && (
        <div className="flex flex-wrap justify-center gap-1 mt-6">
          {logs.links.map((link, i) => (
            <Link
              key={i}
              href={link.url || '#'}
              className={`inline-flex h-8 min-w-8 px-2 items-center justify-center rounded-lg text-sm ${
                link.active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              } ${!link.url ? 'opacity-40 pointer-events-none' : ''}`}
              preserveState
              dangerouslySetInnerHTML={{ __html: link.label }}
            />
          ))}
        </div>
      )}
    </AuthenticatedLayout>
  )
}
