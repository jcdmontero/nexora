import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Badge } from '@/Components/ui/badge'
import { ArrowLeft, ArrowUpRight, ArrowDownRight, RefreshCcw, FileText, ArrowRightLeft } from 'lucide-react'

export default function KardexShow({ producto, movimientos }) {
  const formatNumber = (val) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val)
  const formatDate = (dateString) => new Intl.DateTimeFormat('es-CO', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  }).format(new Date(dateString))

  const columns = [
    {
      header: 'Fecha',
      accessorKey: 'created_at',
      cell: (row) => <span className="text-sm">{formatDate(row.created_at)}</span>,
    },
    {
      header: 'Movimiento',
      accessorKey: 'tipo',
      cell: (row) => {
        if (row.tipo === 'entrada' || row.tipo === 'inicial') {
          return (
            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200">
              <ArrowDownRight className="h-3 w-3 mr-1" /> Entrada
            </Badge>
          )
        }
        if (row.tipo === 'salida') {
          return (
            <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-200">
              <ArrowUpRight className="h-3 w-3 mr-1" /> Salida
            </Badge>
          )
        }
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200">
            <RefreshCcw className="h-3 w-3 mr-1" /> Ajuste
          </Badge>
        )
      },
    },
    {
      header: 'Ingreso Físico (Empaque)',
      accessorKey: 'cantidad',
      cell: (row) => (
        <span className="text-sm">
          {formatNumber(row.cantidad)} {row.pack?.nombre || producto.unidad_medida}
        </span>
      ),
    },
    {
      header: `Afectación Base (${producto.unidad_medida})`,
      accessorKey: 'cantidad_base',
      cell: (row) => {
        const isPositive = row.tipo === 'entrada' || row.tipo === 'inicial' || (row.tipo === 'ajuste' && row.cantidad_base > 0);
        return (
          <span className={`font-mono font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? '+' : '-'}{formatNumber(row.cantidad_base)}
          </span>
        )
      },
    },
    {
      header: 'Usuario',
      accessorKey: 'user',
      cell: (row) => <span className="text-sm text-muted-foreground">{row.user?.name || 'Sistema'}</span>,
    },
    {
      header: 'Observaciones',
      accessorKey: 'observaciones',
      cell: (row) => <span className="text-xs text-muted-foreground truncate max-w-[200px] inline-block" title={row.observaciones}>{row.observaciones || '-'}</span>,
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title={`Kardex: ${producto.nombre}`} />

      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href={route('inventory.kardex.index')}>
            <Button variant="outline" size="icon" type="button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Kardex: {producto.nombre}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">{producto.codigo}</span>
              <span className="text-sm text-muted-foreground">{producto.categoria?.nombre}</span>
            </div>
          </div>
        </div>

        {/* Resumen Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 border-border shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-sm text-muted-foreground font-medium mb-1">Stock Actual</p>
            <h3 className="text-4xl font-bold text-primary">{formatNumber(producto.stock_actual)}</h3>
            <p className="text-sm text-muted-foreground mt-1">{producto.unidad_medida}</p>
          </Card>
          <Card className="p-6 border-border shadow-sm flex flex-col justify-center items-center text-center">
            <p className="text-sm text-muted-foreground font-medium mb-1">Stock Mínimo</p>
            <h3 className="text-3xl font-semibold text-foreground">{formatNumber(producto.stock_minimo)}</h3>
            <p className="text-sm text-muted-foreground mt-1">{producto.unidad_medida}</p>
          </Card>
          <Card className="p-6 border-border shadow-sm flex flex-col justify-center items-center text-center bg-primary/5 border-primary/20">
            <ArrowRightLeft className="h-8 w-8 text-primary mb-2 opacity-80" />
            <Link href={route('inventory.ajustes.create')} className="w-full">
              <Button className="w-full" variant="outline">
                Registrar Movimiento
              </Button>
            </Link>
          </Card>
        </div>

        {/* Ledger Table */}
        <Card className="border-border shadow-sm overflow-hidden bg-card">
          <div className="p-4 border-b bg-muted/20">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> 
              Historial de Movimientos
            </h3>
          </div>
          {movimientos.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={movimientos.data}
              rowKey={(row) => row.id}
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="Sin movimientos"
              description="Este producto aún no tiene entradas ni salidas registradas en el kardex."
              className="py-16"
            />
          )}
        </Card>
      </div>
    </AuthenticatedLayout>
  )
}
