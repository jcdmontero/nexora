import { Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Skeleton, TableSkeleton } from '@/Components/ui/skeleton'
import { Truck, Plus } from 'lucide-react'

export default function ProveedoresIndex({ proveedores }) {
  const loading = proveedores == null

  const deleteProveedor = (p) => {
    if (confirm(`¿Eliminar al proveedor "${p.razon_social}"?`)) {
      router.delete(route('purchasing.proveedores.destroy', p.id))
    }
  }

  const columns = [
    { key: 'razon_social', header: 'Razón Social / Nombre', className: 'font-medium' },
    { key: 'documento', header: 'Documento', cell: (p) => p.documento || '—' },
    { key: 'nombre_contacto', header: 'Contacto', cell: (p) => p.nombre_contacto || '—' },
    { key: 'email', header: 'Email', cell: (p) => p.email || '—' },
    { key: 'telefono', header: 'Teléfono', cell: (p) => p.telefono || '—' },
    {
      key: 'activo',
      header: 'Estado',
      cell: (p) => <Badge variant={p.activo ? 'default' : 'outline'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      alignEnd: true,
      cell: (p) => (
        <div className="flex gap-3 justify-end">
          <Link href={route('purchasing.proveedores.edit', p.id)} className="text-sm text-primary hover:underline">Editar</Link>
          <button onClick={() => deleteProveedor(p)} className="text-sm text-destructive hover:underline">Eliminar</button>
        </div>
      ),
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Proveedores</h2>
        <Link href={route('purchasing.proveedores.create')}>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Nuevo proveedor</Button>
        </Link>
      </div>

      {loading ? (
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent className="p-0"><TableSkeleton rows={6} cols={5} /></CardContent>
        </Card>
      ) : proveedores.length === 0 ? (
        <Card>
          <EmptyState
            icon={Truck}
            title="Aún no tienes proveedores"
            description="Registra tus proveedores para gestionar tus compras, órdenes y abastecimiento."
            action={{ label: 'Crear primer proveedor', href: route('purchasing.proveedores.create') }}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Directorio de proveedores</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable columns={columns} data={proveedores} rowKey={(p) => p.id} />
          </CardContent>
        </Card>
      )}
    </AuthenticatedLayout>
  )
}
