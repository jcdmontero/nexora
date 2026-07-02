import { Link, router } from '@inertiajs/react'
import SuperAdminLayout from '@/Layouts/SuperAdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Building2, Plus } from 'lucide-react'

export default function TenantsIndex({ tenants }) {
  const toggle = (t) => {
    const accion = t.is_active ? 'suspender' : 'reactivar'
    if (confirm(`¿Seguro que deseas ${accion} la empresa "${t.name}"?`)) {
      router.post(route('superadmin.tenants.toggle', t.id))
    }
  }

  const columns = [
    { key: 'name', header: 'Empresa', className: 'font-medium' },
    { key: 'slug', header: 'Slug', className: 'font-mono text-xs text-muted-foreground' },
    { key: 'plan', header: 'Plan', cell: (t) => t.plan || '—' },
    { key: 'users_count', header: 'Usuarios', cell: (t) => <Badge variant="secondary">{t.users_count}</Badge> },
    { key: 'modulos_count', header: 'Módulos', cell: (t) => <Badge variant="secondary">{t.modulos_count}</Badge> },
    {
      key: 'is_active',
      header: 'Estado',
      cell: (t) => (
        <Badge variant={t.is_active ? 'default' : 'outline'}>{t.is_active ? 'Activa' : 'Suspendida'}</Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (t) => (
        <div className="flex gap-3 justify-end">
          <Link href={route('superadmin.tenants.edit', t.id)} className="text-sm text-primary hover:underline">Editar</Link>
          <button onClick={() => toggle(t)} className={`text-sm hover:underline ${t.is_active ? 'text-amber-600' : 'text-emerald-600'}`}>
            {t.is_active ? 'Suspender' : 'Reactivar'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <SuperAdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Empresas</h2>
        <Link href={route('superadmin.tenants.create')}>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Nueva empresa</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {tenants.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Aún no hay empresas"
              description="Crea la primera empresa cliente, asígnale sus módulos y su administrador."
              action={{ label: 'Crear empresa', href: route('superadmin.tenants.create') }}
            />
          ) : (
            <DataTable columns={columns} data={tenants} rowKey={(t) => t.id} />
          )}
        </CardContent>
      </Card>
    </SuperAdminLayout>
  )
}
