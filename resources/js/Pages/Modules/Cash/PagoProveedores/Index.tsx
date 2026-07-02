import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { PageHeader } from '@/Components/ui/page-header'
import { EmptyState } from '@/Components/ui/empty-state'
import { DataTable } from '@/Components/ui/data-table'
import { Building2, Search, ArrowRight, DollarSign } from 'lucide-react'

interface ProveedorCxp {
  id: number
  razon_social: string
  numero_documento: string
  tipo_documento: string
  saldo_pendiente: number
}

export default function PagoProveedoresIndex({ proveedores, filtros }: { proveedores: ProveedorCxp[]; filtros: { busqueda: string | null } }) {
  const [busqueda, setBusqueda] = useState(filtros.busqueda || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.get(route('cash.pagos-proveedores.index'), { busqueda }, { preserveState: true, replace: true })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Pago Proveedores — CxP" />

      <PageHeader
        title="Pago a Proveedores"
        description="Proveedores con cuentas por pagar pendientes. Selecciona uno para realizar el pago."
        icon={DollarSign}
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proveedor por nombre o documento..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">Buscar</Button>
            {filtros.busqueda && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setBusqueda('')
                  router.get(route('cash.pagos-proveedores.index'), {}, { preserveState: true, replace: true })
                }}
              >
                Limpiar
              </Button>
            )}
          </form>
        </div>
      </div>

      {proveedores.data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin cuentas por pagar"
          description="No hay proveedores con cuentas pendientes. Las compras a crédito aparecerán aquí automáticamente."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Proveedores con saldo pendiente</CardTitle>
            <CardDescription>{proveedores.total} proveedor{proveedores.total !== 1 ? 'es' : ''} con deuda</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                {
                  header: 'Proveedor',
                  accessorKey: 'razon_social',
                  cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-orange-50 dark:bg-orange-950/30 p-1.5 text-orange-600 dark:text-orange-400">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{row.original.razon_social}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.original.tipo_documento} {row.original.numero_documento}
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  header: 'Saldo Pendiente',
                  accessorKey: 'saldo_pendiente',
                  alignEnd: true,
                  cell: ({ row }) => (
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                      ${Number(row.original.saldo_pendiente).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: 'Acción',
                  id: 'actions',
                  alignEnd: true,
                  cell: ({ row }) => (
                    <Link
                      href={route('cash.pagos-proveedores.pendientes', row.original.id)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      Ver CxP
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ),
                },
              ]}
              data={proveedores.data}
              pagination={{
                currentPage: proveedores.current_page,
                lastPage: proveedores.last_page,
                perPage: proveedores.per_page,
                total: proveedores.total,
                onPageChange: (page) => router.get(route('cash.pagos-proveedores.index'), { page, busqueda }, { preserveState: true, replace: true }),
              }}
            />
          </CardContent>
        </Card>
      )}
    </AuthenticatedLayout>
  )
}
