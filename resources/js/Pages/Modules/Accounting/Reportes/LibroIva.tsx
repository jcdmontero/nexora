import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { DataTable, type DataTableColumn } from '@/Components/ui/data-table'
import { Filter, Receipt } from 'lucide-react'
import { Link } from '@inertiajs/react'

interface RetencionRow {
  comprobante: string
  fecha: string
  cuenta_codigo: string
  cuenta_nombre: string
  descripcion: string
  base_gravable: number
  impuesto_tipo: string
  impuesto_tarifa: number
  debito: number
  credito: number
}

export default function LibroIva({ filters, iva_generado, iva_descontable, saldo_pagar, retenciones }) {
  const { data, setData, get, processing } = useForm({
    desde: filters.desde || '',
    hasta: filters.hasta || '',
  })

  const submit = (e) => {
    e.preventDefault()
    get(route('accounting.reportes.libro-iva'))
  }

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val)

  const columns: DataTableColumn<RetencionRow>[] = [
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (row) => <span className="whitespace-nowrap">{row.fecha}</span>,
    },
    {
      key: 'comprobante',
      header: 'Comprobante',
      cell: (row) => <span className="font-medium text-xs">{row.comprobante}</span>,
    },
    {
      key: 'cuenta_codigo',
      header: 'Cuenta',
      cell: (row) => <span className="text-xs">{row.cuenta_codigo} - {row.cuenta_nombre}</span>,
      hideOnMobile: true,
    },
    {
      key: 'descripcion',
      header: 'Detalle',
      cell: (row) => <span className="text-xs truncate max-w-[200px]" title={row.descripcion}>{row.descripcion}</span>,
      hideOnMobile: true,
    },
    {
      key: 'impuesto_tipo',
      header: 'Tipo',
      cell: (row) => <span className="text-xs">{row.impuesto_tipo}</span>,
    },
    {
      key: 'base_gravable',
      header: 'Base Gravable',
      className: 'text-right',
      cell: (row) => <span className="text-xs">{formatCurrency(row.base_gravable)}</span>,
      alignEnd: true,
    },
    {
      key: 'debito',
      header: 'Débito',
      className: 'text-right',
      cell: (row) => <span className="text-xs">{formatCurrency(row.debito)}</span>,
      alignEnd: true,
    },
    {
      key: 'credito',
      header: 'Crédito',
      className: 'text-right',
      cell: (row) => <span className="text-xs">{formatCurrency(row.credito)}</span>,
      alignEnd: true,
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Libro de IVA" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Libro de IVA</h2>
          <p className="text-muted-foreground text-sm mt-1">IVA Generado (ventas) vs IVA Descontable (compras).</p>
        </div>
        <div className="space-x-2">
          <Link href={route('accounting.reportes.index')} className="text-sm text-primary hover:underline">Ir a Balance General</Link>
          <span className="text-muted-foreground">|</span>
          <Link href={route('accounting.reportes.terceros')} className="text-sm text-primary hover:underline">Ir a Balance por Terceros</Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={submit} className="flex gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium">Desde</label>
              <Input type="date" value={data.desde} onChange={e => setData('desde', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Hasta</label>
              <Input type="date" value={data.hasta} onChange={e => setData('hasta', e.target.value)} required />
            </div>
            <Button type="submit" disabled={processing}><Filter className="w-4 h-4 mr-2"/> Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">IVA Generado (Ventas)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(iva_generado.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">Base: {formatCurrency(iva_generado.base_gravable)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">IVA Descontable (Compras)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(iva_descontable.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">Base: {formatCurrency(iva_descontable.base_gravable)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo a Pagar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${saldo_pagar >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(saldo_pagar)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{saldo_pagar >= 0 ? 'A favor de la DIAN' : 'A favor del contribuyente'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detalle de Retenciones */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Receipt className="w-4 h-4"/> Detalle de Retenciones</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={retenciones}
            rowKey={(r, idx) => `${r.comprobante}-${idx}`}
          />
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
