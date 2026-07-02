import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { DataTable, type DataTableColumn } from '@/Components/ui/data-table'
import { Filter, Users } from 'lucide-react'
import { Link } from '@inertiajs/react'

export default function TercerosIndex({ filters, saldos }) {
  const { data, setData, get, processing } = useForm({
    desde: filters.desde || '',
    hasta: filters.hasta || '',
  })

  const submit = (e) => {
    e.preventDefault()
    get(route('accounting.reportes.terceros'))
  }

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val)

  const columns: DataTableColumn<typeof saldos[0]>[] = [
    {
      key: 'cuenta_codigo',
      header: 'Cuenta Contable',
      cell: (row) => <span className="font-medium text-xs">{row.cuenta_codigo} - {row.cuenta_nombre}</span>,
    },
    {
      key: 'tercero_documento',
      header: 'Tercero (Documento)',
      cell: (row) => <span className="text-xs">{row.tercero_documento}</span>,
    },
    {
      key: 'tercero_nombre',
      header: 'Nombre',
      cell: (row) => <span className="text-xs truncate max-w-[200px]" title={row.tercero_nombre}>{row.tercero_nombre}</span>,
      hideOnMobile: true,
    },
    {
      key: 'debito',
      header: 'Débitos',
      className: 'text-right',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatCurrency(row.debito)}</span>,
      alignEnd: true,
    },
    {
      key: 'credito',
      header: 'Créditos',
      className: 'text-right',
      cell: (row) => <span className="text-xs text-muted-foreground">{formatCurrency(row.credito)}</span>,
      alignEnd: true,
    },
    {
      key: 'saldo',
      header: 'Saldo Neto',
      className: 'text-right border-l',
      cell: (row) => <span className="font-semibold text-xs">{formatCurrency(row.saldo)}</span>,
      alignEnd: true,
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Balance por Terceros" />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Balance por Terceros</h2>
          <p className="text-muted-foreground text-sm mt-1">Saldos agrupados por cuenta contable y tercero.</p>
        </div>
        <div className="space-x-2">
            <Link href={route('accounting.reportes.index')} className="text-sm text-primary hover:underline">Ir a Balance General</Link>
            <span className="text-muted-foreground">|</span>
            <Link href={route('accounting.reportes.auxiliar')} className="text-sm text-primary hover:underline">Ir a Libro Auxiliar</Link>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4"/> Saldos Acumulados</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={saldos}
            rowKey={(_, idx) => idx}
          />
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
