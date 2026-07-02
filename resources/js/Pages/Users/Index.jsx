import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Badge } from '@/Components/ui/badge'
import { Avatar, AvatarFallback } from '@/Components/ui/avatar'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { TableSkeleton } from '@/Components/ui/skeleton'
import { PageHeader } from '@/Components/ui/page-header'
import { ListToolbar, FilterSelect } from '@/Components/ui/list-toolbar'
import { Pagination } from '@/Components/ui/pagination'
import { ConfirmDialog } from '@/Components/ui/confirm-dialog'
import { useDataTable } from '@/Hooks/useDataTable'
import { usePermissions } from '@/Hooks/usePermissions'
import { roleLabel } from '@/lib/permissions'
import { Users, Plus, Pencil, Trash2, UserCog } from 'lucide-react'

function initials(name) {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
}

export default function UsersIndex({ users }) {
  const loading = users == null
  const { can } = usePermissions()

  const data = (users || []).map((u) => ({
    ...u,
    primaryRole: u.roles?.[0] ?? '',
    estado: u.is_active ? 'activo' : 'inactivo',
  }))

  const table = useDataTable(data, {
    searchAccessor: (u) => `${u.name} ${u.email} ${u.roles?.join(' ')}`,
    pageSize: 10,
  })

  const roleOptions = [...new Set(data.map((u) => u.primaryRole).filter(Boolean))]
    .map((r) => ({ value: r, label: roleLabel(r) }))

  const columns = [
    {
      key: 'name',
      header: 'Usuario',
      className: 'font-medium',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-semibold">
              {initials(u.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{u.name}</p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      hideOnMobile: true,
      cell: (u) =>
        (u.roles || []).length
          ? (u.roles || []).map((r) => (
              <Badge key={r} variant="secondary" className="mr-1">{roleLabel(r)}</Badge>
            ))
          : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (u) => (
        <Badge variant={u.is_active ? 'default' : 'outline'}>
          {u.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (u) => (
        <div className="flex items-center justify-end gap-1">
          {can('users:edit') && (
            <Link
              href={route('core.users.edit', u.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          {can('users:delete') && (
            <ConfirmDialog
              deleteUrl={route('core.users.destroy', u.id)}
              title={`¿Eliminar a ${u.name}?`}
              description="El usuario perderá el acceso al sistema. Esta acción no se puede deshacer."
              trigger={
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              }
            />
          )}
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Usuarios" />
      <PageHeader
        title="Usuarios"
        description="Gestiona las personas que acceden al sistema y sus roles."
        icon={Users}
        actions={
          can('users:create') && (
            <Link
              href={route('core.users.create')}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </Link>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar por nombre, email o rol…"
            total={table.totalResults}
            filters={
              roleOptions.length > 0 && (
                <>
                  <FilterSelect
                    value={table.filters.primaryRole ?? 'all'}
                    onChange={(v) => table.setFilter('primaryRole', v)}
                    placeholder="Todos los roles"
                    options={roleOptions}
                  />
                  <FilterSelect
                    value={table.filters.estado ?? 'all'}
                    onChange={(v) => table.setFilter('estado', v)}
                    placeholder="Todos los estados"
                    options={[
                      { value: 'activo', label: 'Activos' },
                      { value: 'inactivo', label: 'Inactivos' },
                    ]}
                  />
                </>
              )
            }
          />
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aún no hay usuarios registrados"
            description="Los usuarios son las personas que accederán al sistema. Crea el primero para empezar."
            action={can('users:create') ? { label: 'Crear primer usuario', href: route('core.users.create') } : undefined}
          />
        ) : table.totalResults === 0 ? (
          <EmptyState
            icon={UserCog}
            title="Sin coincidencias"
            description="Ningún usuario coincide con la búsqueda o los filtros aplicados."
          />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(u) => u.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
