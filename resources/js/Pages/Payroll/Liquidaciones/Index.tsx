import { useState } from 'react'
import { Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card'
import { Input } from '@/Components/ui/input'
import { Badge } from '@/Components/ui/badge'
import { Button } from '@/Components/ui/button'
import { DataTable, type DataTableColumn } from '@/Components/ui/data-table'
import { EmptyState } from '@/Components/ui/empty-state'
import { Banknote, FileCheck2, CalendarClock } from 'lucide-react'

export default function LiquidacionesIndex({ periodos }) {
  const [showForm, setShowForm] = useState(false)
  const { data, setData, post, processing } = useForm({
    codigo: '',
    mes_contable: new Date().toISOString().substring(0, 7),
    fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10),
    fecha_fin: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().substring(0, 10),
    observaciones: '',
  })

  const generarNomina = (e) => {
    e.preventDefault()
    if (confirm('¿Estás seguro de generar la nómina para este mes? Se calcularán todos los empleados activos.')) {
        post(route('payroll.liquidaciones.store'), {
          onSuccess: () => setShowForm(false),
        })
    }
  }

  const columns: DataTableColumn<typeof periodos.data[0]>[] = [
    {
        key: 'codigo',
        header: 'Código',
        cell: (p) => <span className="font-semibold text-primary">{p.codigo}</span>,
    },
    {
        key: 'mes_contable',
        header: 'Mes Contable',
        cell: (p) => <span className="text-muted-foreground">{p.mes_contable}</span>,
    },
    {
        key: 'fechas',
        header: 'Rango de Fechas',
        cell: (p) => <span className="text-muted-foreground">{p.fecha_inicio} al {p.fecha_fin}</span>,
        hideOnMobile: true,
    },
    {
        key: 'empleados',
        header: 'Empleados',
        cell: (p) => <Badge variant="outline">{p.nominas_count}</Badge>,
    },
    {
        key: 'neto_pagar',
        header: 'Neto a Pagar',
        className: 'text-right',
        cell: (p) => <span className="font-medium">${Number(p.neto_pagar).toLocaleString()}</span>,
        alignEnd: true,
    },
    {
        key: 'estado',
        header: 'Estado',
        cell: (p) => (
            <Badge variant={p.estado === 'LIQUIDADA' ? 'secondary' : 'outline'} className={
                p.estado === 'LIQUIDADA' ? 'bg-indigo-100 text-indigo-700'
                : p.estado === 'BORRADOR' ? 'bg-amber-100 text-amber-700'
                : p.estado === 'CONTABILIZADA' ? 'bg-green-100 text-green-700'
                : ''
            }>
                {p.estado}
            </Badge>
        )
    },
    {
        key: 'acciones',
        header: '',
        alignEnd: true,
        cell: (p) => (
            <Link href={route('payroll.liquidaciones.show', p.id)}>
                <Button variant="ghost" size="sm">Ver Detalles</Button>
            </Link>
        )
    }
  ]

  return (
    <AuthenticatedLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Banknote className="h-6 w-6 text-primary" /> Liquidaciones de Nómina</h2>
          <p className="text-muted-foreground">Períodos de nómina calculados y su estado.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <CalendarClock className="h-4 w-4" /> Generar Nómina
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-indigo-200 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="text-base">Nuevo Período de Nómina</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={generarNomina} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Código del Período</label>
                <Input
                  placeholder="Ej. NOM-2026-06"
                  value={data.codigo}
                  onChange={e => setData('codigo', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Mes Contable</label>
                <Input
                  type="month"
                  value={data.mes_contable}
                  onChange={e => setData('mes_contable', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Fecha Inicio</label>
                <Input
                  type="date"
                  value={data.fecha_inicio}
                  onChange={e => setData('fecha_inicio', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Fecha Fin</label>
                <Input
                  type="date"
                  value={data.fecha_fin}
                  onChange={e => setData('fecha_fin', e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700">
                    {processing ? 'Liquidando...' : 'Generar y Liquidar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {periodos.data.length > 0 ? (
            <DataTable columns={columns} data={periodos.data} rowKey={(p) => p.id} />
          ) : (
            <div className="py-12">
              <EmptyState
                icon={FileCheck2}
                title="Sin Liquidaciones"
                description="Aún no has generado ningún período de nómina. Haz clic en 'Generar Nómina' para calcular el periodo actual."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </AuthenticatedLayout>
  )
}
