import { Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { DataTable, type DataTableColumn } from '@/Components/ui/data-table'
import { ArrowLeft, Lock, Download } from 'lucide-react'

export default function LiquidacionesShow({ periodo, nominas, resumen }) {
  const { post, processing } = useForm()

  const liquidarNomina = () => {
      if(confirm('Al liquidar la nómina, esta se bloqueará y no se le podrán agregar más novedades. ¿Proceder?')) {
          post(route('payroll.periodos.liquidar', periodo.id))
      }
  }

  const columns: DataTableColumn<typeof nominas[0]>[] = [
    {
      key: 'empleado_nombre',
      header: 'Empleado',
      cell: (n) => (
        <div>
          <div className="font-medium text-slate-900">{n.empleado_nombre}</div>
          <div className="text-xs text-muted-foreground">{n.empleado_documento}</div>
        </div>
      ),
    },
    {
      key: 'dias_laborados',
      header: 'Días',
      cell: (n) => n.dias_laborados,
    },
    {
      key: 'total_devengado',
      header: 'Total Devengado',
      className: 'text-right',
      cell: (n) => <span className="text-slate-700">${Number(n.total_devengado).toLocaleString()}</span>,
      alignEnd: true,
    },
    {
      key: 'total_deducciones',
      header: 'Total Deducciones',
      className: 'text-right',
      cell: (n) => <span className="text-rose-600">-${Number(n.total_deducciones).toLocaleString()}</span>,
      alignEnd: true,
    },
    {
      key: 'neto_pagar',
      header: 'Neto a Pagar',
      className: 'text-right',
      cell: (n) => <span className="font-bold text-emerald-700">${Number(n.neto_pagar).toLocaleString()}</span>,
      alignEnd: true,
    },
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <Link href={route('payroll.liquidaciones.index')}>
                <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                    Período: {periodo.codigo}
                    <Badge variant={periodo.estado === 'LIQUIDADA' ? 'secondary' : 'outline'} className={
                        periodo.estado === 'LIQUIDADA' ? 'bg-indigo-100 text-indigo-700'
                        : periodo.estado === 'BORRADOR' ? 'bg-amber-100 text-amber-700'
                        : periodo.estado === 'CONTABILIZADA' ? 'bg-green-100 text-green-700'
                        : ''
                    }>
                        {periodo.estado}
                    </Badge>
                </h2>
                <p className="text-muted-foreground text-sm">
                    Mes contable: {periodo.mes_contable} | {periodo.fecha_inicio} al {periodo.fecha_fin}
                </p>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="gap-2"><Download className="h-4 w-4" /> Exportar a Excel</Button>
            {periodo.estado === 'BORRADOR' && (
                <Button onClick={liquidarNomina} disabled={processing} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Lock className="h-4 w-4" /> Cerrar y Liquidar
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
              <CardContent className="pt-6">
                  <p className="text-sm text-slate-500 mb-1">Empleados Procesados</p>
                  <h3 className="text-3xl font-bold text-slate-800">{resumen.total_empleados}</h3>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                  <p className="text-sm text-slate-500 mb-1">Total Devengado</p>
                  <h3 className="text-2xl font-bold text-slate-700">${Number(resumen.total_devengado).toLocaleString()}</h3>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                  <p className="text-sm text-slate-500 mb-1">Total Deducciones</p>
                  <h3 className="text-2xl font-bold text-rose-600">-${Number(resumen.total_deducciones).toLocaleString()}</h3>
              </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                  <p className="text-sm text-slate-500 mb-1">Neto a Pagar</p>
                  <h3 className="text-2xl font-bold text-emerald-700">${Number(resumen.neto_pagar).toLocaleString()}</h3>
              </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg">Sábana de Nómina — Empleados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <DataTable columns={columns} data={nominas} rowKey={(n) => n.id} />
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
