import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { FileText, Search, AlertTriangle, ArrowRight } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

export default function KardexIndex({ productos, filters }) {
  const { can } = usePermissions()
  const [search, setSearch] = useState(filters.search || '')

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('inventory.kardex.index'), { search }, { preserveState: true })
  }

  const formatNumber = (val) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val)

  const columns = [
    {
      header: 'SKU',
      accessorKey: 'codigo',
      cell: (row) => <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{row.codigo}</span>,
    },
    {
      header: 'Producto',
      accessorKey: 'nombre',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.nombre}</span>
          <span className="text-xs text-muted-foreground">{row.categoria?.nombre || 'Sin categoría'}</span>
        </div>
      ),
    },
    {
      header: 'Stock Actual',
      accessorKey: 'stock_actual',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{formatNumber(row.stock_actual)} {row.unidad_medida}</span>
          {parseFloat(row.stock_actual) <= parseFloat(row.stock_minimo) && (
            <AlertTriangle className="h-4 w-4 text-amber-500" title="Stock por debajo del mínimo" />
          )}
        </div>
      ),
    },
    {
      header: 'Acciones',
      accessorKey: 'acciones',
      cell: (row) => (
        <Link href={route('inventory.kardex.show', row.id)}>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
            Ver Kardex <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      ),
      alignEnd: true
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Kardex de Inventario" />

      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Kardex de Productos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecciona un producto para ver su libro mayor e historial de movimientos.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por código o nombre..."
                className="w-full bg-card pl-9 shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
          </div>
        </div>

        <Card className="border-border shadow-sm overflow-hidden bg-card">
          {productos.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={productos.data}
              rowKey={(row) => row.id}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title={search ? 'No se encontraron productos' : 'Catálogo vacío'}
              description="Aún no hay productos registrados para auditar."
              className="py-20"
            />
          )}
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
