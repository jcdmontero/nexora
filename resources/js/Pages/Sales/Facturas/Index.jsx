import { useState } from 'react'
import { router, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { Input } from '@/Components/ui/input'
import { DataTable } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { useToast } from '@/Components/toasts/ToastProvider'
import { usePermissions } from '@/Hooks/usePermissions'
import { Search, FileText, Ban, Eye } from 'lucide-react'

export default function FacturasIndex({ facturas, filters }) {
  const [search, setSearch] = useState(filters.search || '')
  const { can } = usePermissions()
  const { toast: toastFn } = useToast()
  const addToast = (opts) => toastFn(`${opts.title}${opts.description ? ': ' + opts.description : ''}`, opts.type ?? 'info')
  const [anulandoId, setAnulandoId] = useState(null)

  const anularFactura = (factura) => {
    const motivo = window.prompt(`Motivo de anulación para factura ${factura.numero}:`)
    if (!motivo || motivo.trim().length < 5) {
      addToast({ title: 'Motivo requerido', description: 'Debes escribir al menos 5 caracteres.', type: 'error' })
      return
    }
    setAnulandoId(factura.id)
    router.post(route('sales.facturas.anular', factura.id), {
      motivo: motivo.trim(),
    }, {
      preserveState: true,
      onSuccess: () => {
        setAnulandoId(null)
        addToast({ title: 'Factura anulada', description: `Factura ${factura.numero} anulada correctamente.`, type: 'success' })
      },
      onError: (errors) => {
        setAnulandoId(null)
        const msg = Object.values(errors).flat().join(', ')
        addToast({ title: 'Error', description: msg || 'Ocurrió un error al anular.', type: 'error' })
      },
    })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    router.get(route('sales.facturas.index'), { search }, { preserveState: true })
  }

  const columns = [
    { 
        key: 'numero', 
        header: 'Nº Factura', 
        className: 'font-mono font-medium',
        cell: (f) => (
            <Link href={route('sales.facturas.show', f.id)} className="text-primary hover:underline">
                {f.numero}
            </Link>
        )
    },
    { 
        key: 'cliente', 
        header: 'Cliente', 
        cell: (f) => f.cliente ? `${f.cliente.nombres} ${f.cliente.apellidos}` : <span className="text-muted-foreground italic">Consumidor Final</span>
    },
    { key: 'created_at', header: 'Fecha', cell: (f) => new Date(f.created_at).toLocaleDateString() },
    { key: 'total', header: 'Total', cell: (f) => <span className="font-semibold">${Number(f.total).toLocaleString()}</span> },
    { key: 'metodo_pago', header: 'Medio', className: 'capitalize' },
    { 
        key: 'estado', 
        header: 'Estado', 
        cell: (f) => {
            if (f.estado === 'pagada') return <Badge className="bg-emerald-500">Pagada</Badge>
            if (f.estado === 'pendiente') return <Badge variant="outline" className="text-amber-600 border-amber-300">Pendiente (CxC)</Badge>
            return <Badge variant="destructive">Anulada</Badge>
        } 
    },
    {
        key: 'dian_estado',
        header: 'DIAN',
        cell: (f) => {
            if (f.dian_estado === 'aceptado') return <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">Aceptado DIAN</Badge>
            if (f.dian_estado === 'enviado') return <Badge variant="outline" className="text-amber-600">Enviando...</Badge>
            if (f.dian_estado === 'rechazado' || f.dian_estado === 'error') return <Badge variant="destructive">Rechazado</Badge>
            return <Badge variant="secondary">Borrador</Badge>
        }
    },
    { key: 'vendedor.name', header: 'Vendedor', cell: (f) => f.vendedor?.name || '—' },
    {
        key: 'acciones',
        header: 'Acciones',
        hideOnMobile: false,
        className: 'text-right',
        cell: (f) => {
            const esAnulada = f.anulada === true || f.estado === 'anulada'
            return (
                <div className="flex items-center justify-end gap-1">
                    <Link href={route('sales.facturas.show', f.id)}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    {!esAnulada && can('sales:anular') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => anularFactura(f)}
                            disabled={anulandoId === f.id}
                            title="Anular factura"
                        >
                            <Ban className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )
        }
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Historial de Facturas</h2>
          <p className="text-muted-foreground">Consulta las ventas realizadas</p>
        </div>
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
          <Input
            placeholder="Buscar por Nº o Cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-background max-w-[250px]"
          />
          <Button type="submit" variant="secondary" size="icon"><Search className="h-4 w-4" /></Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          {facturas.data.length > 0 ? (
            <DataTable columns={columns} data={facturas.data} />
          ) : (
            <div className="py-12">
              <EmptyState
                icon={FileText}
                title="No se encontraron facturas"
                description="Las facturas generadas en el Punto de Venta aparecerán aquí."
                action={{ label: 'Ir al Punto de Venta', href: route('sales.pos.index') }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
