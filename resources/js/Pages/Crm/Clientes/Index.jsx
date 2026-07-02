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
import {
  Users, Plus, Eye, Pencil, Trash2, Building2, User as UserIcon,
  Phone, Mail, Briefcase, SearchX,
} from 'lucide-react'

export default function ClientesIndex({ clientes }) {
  const loading = clientes == null
  const { can } = usePermissions()

  const data = (clientes || []).map((c) => ({
    ...c,
    tipoLabel: c.tipo === 'juridico' ? 'Empresa' : 'Persona',
    estado: c.activo ? 'activo' : 'inactivo',
  }))

  const table = useDataTable(data, {
    searchAccessor: (c) => `${c.nombre} ${c.documento} ${c.email} ${c.telefono} ${c.ciudad}`,
    pageSize: 10,
  })

  const columns = [
    {
      key: 'nombre',
      header: 'Cliente',
      className: 'font-medium',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-semibold">
              {(c.nombre?.[0] || '?').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{c.nombre || 'Sin nombre'}</p>
            <p className="truncate text-xs text-muted-foreground">{c.documento || 'Sin documento'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      hideOnMobile: true,
      cell: (c) => (
        <div className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-1.5 text-foreground">
            <Phone className="h-3.5 w-3.5 text-emerald-500" />
            {c.telefono || '—'}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="truncate max-w-[180px]">{c.email || '—'}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'tipoLabel',
      header: 'Tipo',
      cell: (c) =>
        c.tipo === 'juridico' ? (
          <Badge variant="secondary" className="gap-1">
            <Building2 className="h-3 w-3" /> Empresa
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <UserIcon className="h-3 w-3" /> Persona
          </Badge>
        ),
    },
    {
      key: 'oportunidades_count',
      header: 'Oportunidades',
      alignEnd: true,
      hideOnMobile: true,
      cell: (c) => (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground">
          <Briefcase className="h-3 w-3 text-muted-foreground" />
          {c.oportunidades_count ?? 0}
        </span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (c) => (
        <Badge variant={c.activo ? 'default' : 'outline'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            href={route('crm.clientes.show', c.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-500/10"
            title="Ver perfil"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {can('crm:edit') && (
            <Link
              href={route('crm.clientes.edit', c.id)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-500/10"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          {can('crm:delete') && (
            <ConfirmDialog
              deleteUrl={route('crm.clientes.destroy', c.id)}
              title={`¿Archivar a ${c.nombre}?`}
              description="El cliente dejará de aparecer en los listados. Si tiene oportunidades asociadas no podrá archivarse."
              confirmLabel="Archivar"
              trigger={
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-all hover:-translate-y-0.5 hover:bg-destructive/10 hover:text-destructive"
                  title="Archivar"
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
      <Head title="Clientes" />
      <PageHeader
        title="Directorio de clientes"
        description="Administra la información de contacto y los perfiles de tus clientes."
        icon={Users}
        actions={
          can('crm:create') && (
            <Link
              href={route('crm.clientes.create')}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Link>
          )
        }
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="p-4">
          <ListToolbar
            search={table.search}
            onSearch={table.setSearch}
            placeholder="Buscar por nombre, documento, email o teléfono…"
            total={table.totalResults}
            filters={
              <>
                <FilterSelect
                  value={table.filters.tipo ?? 'all'}
                  onChange={(v) => table.setFilter('tipo', v)}
                  placeholder="Todos los tipos"
                  options={[
                    { value: 'juridico', label: 'Empresas' },
                    { value: 'natural', label: 'Personas' },
                  ]}
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
            }
          />
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aún no tienes clientes"
            description="Registra tus clientes (personas o empresas) para gestionar su información y operaciones."
            action={can('crm:create') ? { label: 'Crear primer cliente', href: route('crm.clientes.create') } : undefined}
          />
        ) : table.totalResults === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Sin coincidencias"
            description="Ningún cliente coincide con la búsqueda o los filtros aplicados."
          />
        ) : (
          <>
            <div className="border-t border-border">
              <DataTable columns={columns} data={table.rows} rowKey={(c) => c.id} />
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} />
          </>
        )}
      </div>
    </AuthenticatedLayout>
  )
}
