import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { PageHeader } from '@/Components/ui/page-header'
import { EmptyState } from '@/Components/ui/empty-state'
import { DataTable } from '@/Components/ui/data-table'
import { DollarSign, Search, User, Filter, ArrowRight } from 'lucide-react'

interface ClienteCxc {
  id: number
  nombre_completo: string
  numero_documento: string
  tipo_documento: string
  saldo_pendiente: number
}

interface PaginatedResponse {
  data: ClienteCxc[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export default function RecaudosIndex({ clientes, filtros }: { clientes: PaginatedResponse; filtros: { busqueda: string | null } }) {
  const [busqueda, setBusqueda] = useState(filtros.busqueda || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.get(route('cash.recaudos.index'), { busqueda }, { preserveState: true, replace: true })
  }

  return (
    <AuthenticatedLayout>
      <Head title="Recaudos — Cartera" />

      <PageHeader
        title="Recaudos"
        description="Clientes con facturas pendientes de pago. Selecciona un cliente para ver sus cuentas por cobrar."
        icon={DollarSign}
      />

      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente por nombre o documento..."
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
                  router.get(route('cash.recaudos.index'), {}, { preserveState: true, replace: true })
                }}
              >
                Limpiar
              </Button>
            )}
          </form>
        </div>
      </div>

      {clientes.data.length === 0 ? (
        <EmptyState
          icon={User}
          title="Sin cuentas por cobrar"
          description="No hay clientes con facturas pendientes de pago. Las ventas a crédito aparecerán aquí automáticamente."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Clientes con saldo pendiente</CardTitle>
            <CardDescription>{clientes.total} cliente{clientes.total !== 1 ? 's' : ''} con deuda</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                {
                  header: 'Cliente',
                  accessorKey: 'nombre_completo',
                  cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-amber-50 dark:bg-amber-950/30 p-1.5 text-amber-600 dark:text-amber-400">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{row.original.nombre_completo}</div>
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
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
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
                      href={route('cash.recaudos.pendientes', row.original.id)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      Ver facturas
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ),
                },
              ]}
              data={clientes.data}
              pagination={{
                currentPage: clientes.current_page,
                lastPage: clientes.last_page,
                perPage: clientes.per_page,
                total: clientes.total,
                onPageChange: (page) => router.get(route('cash.recaudos.index'), { page, busqueda }, { preserveState: true, replace: true }),
              }}
            />
          </CardContent>
        </Card>
      )}
    </AuthenticatedLayout>
  )
}
