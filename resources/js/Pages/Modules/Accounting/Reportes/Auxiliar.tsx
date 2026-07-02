import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Head, useForm } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Button } from '@/Components/ui/button'
import { DataTable, type DataTableColumn } from '@/Components/ui/data-table'
import { Filter, FileText } from 'lucide-react'
import { Link } from '@inertiajs/react'

export default function AuxiliarIndex({ filters, cuentas, lineas }) {
  const { data, setData, get, processing } = useForm({
    desde: filters.desde || '',
    hasta: filters.hasta || '',
    cuenta_id: filters.cuenta_id || '',
    tercero_numero: filters.tercero_numero || '',
  })

  const submit = (e) => {
    e.preventDefault()
    get(route('accounting.reportes.auxiliar'))
  }

  const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val)

  // Pre-compute running balance
  let saldoAcumulado = 0
  const lineasConSaldo = lineas.map((linea) => {
    const debito = parseFloat(linea.debito)
    const credito = parseFloat(linea.credito)
    if (linea.naturaleza === 'credito') {
      saldoAcumulado += (credito - debito)
    } else {
      saldoAcumulado += (debito - credito)
    }
    return { ...linea, saldoAcumulado }
  })

  const columns: DataTableColumn<typeof lineasConSaldo[0]>[] = [
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
      key: 'tercero_nombre',
      header: 'Tercero',
      cell: (row) => (
        <span className="text-xs">
          {row.tercero_nombre || 'N/A'}
          <div className="text-muted-foreground">{row.tercero_documento}</div>
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'detalle',
      header: 'Detalle',
      cell: (row) => <span className="text-xs truncate max-w-[200px]" title={row.detalle}>{row.detalle}</span>,
      hideOnMobile: true,
    },
    {
      key: 'debito',
      header: 'Débito',
      className: 'text-right',
      cell: (row) => <span className="text-xs">{formatCurrency(parseFloat(row.debito))}</span>,
      alignEnd: true,
    },
    {
      key: 'credito',
      header: 'Crédito',
      className: 'text-right',
      cell: (row) => <span className="text-xs">{formatCurrency(parseFloat(row.credito))}</span>,
      alignEnd: true,
    },
    {
      key: 'saldoAcumulado',
      header: 'Saldo',
      className: 'text-right border-l',
      cell: (row) => <span className="font-medium text-xs">{formatCurrency(row.saldoAcumulado)}</span>,
      alignEnd: true,
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Libro Auxiliar" />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Libro Auxiliar</h2>
          <p className="text-muted-foreground text-sm mt-1">Detalle transaccional de cuentas y terceros (NIIF).</p>
        </div>
        <div className="space-x-2">
            <Link href={route('accounting.reportes.index')} className="text-sm text-primary hover:underline">Ir a Balance General</Link>
            <span className="text-muted-foreground">|</span>
            <Link href={route('accounting.reportes.terceros')} className="text-sm text-primary hover:underline">Ir a Balance por Terceros</Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={submit} className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium">Desde</label>
              <Input type="date" value={data.desde} onChange={e => setData('desde', e.target.value)} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Hasta</label>
              <Input type="date" value={data.hasta} onChange={e => setData('hasta', e.target.value)} required />
            </div>
            <div className="space-y-1 flex-1 min-w-[200px]">
              <label className="text-xs font-medium">Cuenta Contable</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={data.cuenta_id} 
                onChange={e => setData('cuenta_id', e.target.value)}
              >
                <option value="">Todas las cuentas</option>
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">NIT/CC (Tercero)</label>
              <Input type="text" placeholder="Ej. 900123456" value={data.tercero_numero} onChange={e => setData('tercero_numero', e.target.value)} />
            </div>
            <Button type="submit" disabled={processing}><Filter className="w-4 h-4 mr-2"/> Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4"/> Detalle de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={lineasConSaldo}
            rowKey={(_, idx) => idx}
          />
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
