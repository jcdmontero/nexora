import { useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Card } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { BookOpen, Plus, Search } from 'lucide-react'
import { usePermissions } from '@/Hooks/usePermissions'

// ── Types ──

interface AsientoLinea {
  id: number
  cuenta_contable_id: number
  cuenta?: { codigo: string; nombre: string }
  debito: number
  credito: number
}

interface Asiento {
  id: number
  numero: string | null
  fecha: string
  concepto: string
  modulo_origen: string | null
  tercero_nombre: string | null
  estado: string
  total_debito: number
  total_credito: number
  lineas: AsientoLinea[]
}

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  links: PaginationLink[]
}

interface Filters {
  search?: string
}

interface AsientosIndexProps {
  asientos: PaginatedResponse<Asiento>
  filters: Filters
}

// ── Helpers ──

function formatCurrency(val: number | null | undefined): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val ?? 0)
}

// ── Component ──

export default function AsientosIndex({ asientos, filters }: AsientosIndexProps) {
  const { can } = usePermissions()
  const [search, setSearch] = useState(filters.search ?? '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.get(route('accounting.asientos.index'), { search }, { preserveState: true })
  }

  const columns = [
    {
      key: 'numero',
      header: 'Comprobante',
      className: 'w-[170px] font-mono text-muted-foreground',
      cell: (row: Asiento) => row.numero ?? `#${row.id}`,
      hideOnMobile: false,
      alignEnd: false,
    },
    {
      key: 'fecha',
      header: 'Fecha',
      className: 'w-[120px]',
      cell: (row: Asiento) => new Date(row.fecha).toLocaleDateString('es-CO'),
      hideOnMobile: false,
      alignEnd: false,
    },
    {
      key: 'concepto',
      header: 'Concepto',
      className: 'font-medium',
      cell: (row: Asiento) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{row.concepto}</span>
          {row.modulo_origen && (
            <span className="text-xs text-muted-foreground uppercase mt-0.5">
              Origen: {row.modulo_origen}
            </span>
          )}
          {row.tercero_nombre && (
            <span className="text-xs text-muted-foreground mt-0.5">
              Tercero: {row.tercero_nombre}
            </span>
          )}
        </div>
      ),
      hideOnMobile: false,
      alignEnd: false,
    },
    {
      key: 'total_debito',
      header: 'Total Débito',
      className: 'text-right',
      cell: (row: Asiento) => <span className="font-mono text-sm">{formatCurrency(row.total_debito)}</span>,
      hideOnMobile: false,
      alignEnd: true,
    },
    {
      key: 'total_credito',
      header: 'Total Crédito',
      className: 'text-right',
      cell: (row: Asiento) => <span className="font-mono text-sm">{formatCurrency(row.total_credito)}</span>,
      hideOnMobile: false,
      alignEnd: true,
    },
    {
      key: 'estado',
      header: 'Estado',
      hideOnMobile: true,
      alignEnd: false,
      cell: (row: Asiento) => {
        const descuadrado = Math.abs((row.total_debito ?? 0) - (row.total_credito ?? 0)) > 0.01
        return (
          <Badge variant={descuadrado ? 'destructive' : 'secondary'}>
            {descuadrado ? 'Descuadrado' : (row.estado === 'reversado' ? 'Reversado' : 'Contabilizado')}
          </Badge>
        )
      },
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Libro Diario (Asientos)" />

      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Libro Diario</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Registro cronológico de todos los asientos contables (partida doble).
            </p>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar concepto o módulo..."
                className="pl-9 h-9 w-full rounded-md bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </form>
            {can('accounting:create') && (
              <Link href={route('accounting.asientos.create')}>
                <Button size="sm" className="h-9 shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Asiento
                </Button>
              </Link>
            )}
          </div>
        </div>

        <Card className="border-border shadow-sm overflow-hidden bg-card">
          {asientos.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={asientos.data}
              rowKey={(row: Asiento) => row.id}
            />
          ) : (
            <EmptyState
              icon={BookOpen}
              title={search ? 'No se encontraron asientos' : 'Libro Diario Vacío'}
              description={
                search
                  ? 'No hay asientos contables que coincidan con tu búsqueda.'
                  : 'Aún no hay movimientos contables registrados en esta empresa.'
              }
              action={
                can('accounting:create') && !search
                  ? { label: 'Registrar Asiento Manual', href: route('accounting.asientos.create') }
                  : undefined
              }
              className="py-20"
            />
          )}
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
